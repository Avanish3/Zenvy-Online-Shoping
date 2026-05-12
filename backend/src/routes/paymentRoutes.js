'use strict';

const { deliverNotification } = require('../services/notificationGateway');
const {
  buildProviderArtifacts,
  normalizeWebhookUpdate,
  providerConfigured,
  verifyRazorpayClientConfirmation,
  verifyWebhook,
} = require('../services/paymentGateway');

async function paymentRoutes(app) {
  async function emitPaymentUpdate(eventName, payment) {
    if (app.realtimeHub) {
      app.realtimeHub.broadcast('/ws/orders', {
        type: 'event',
        event: eventName,
        payload: payment,
      }, payment.orderId);
    }

    if (app.eventBus) {
      app.eventBus.publish(eventName, payment, {
        orderId: payment.orderId,
        status: payment.status,
        provider: payment.provider,
      });
    }

    if (app.repositories.getOrderById && app.repositories.createNotification) {
      const order = await app.repositories.getOrderById(payment.orderId);
      const channel = payment.status === 'refunded' ? 'email' : 'push';
      const notification = await app.repositories.createNotification({
        userId: order.userId,
        channel,
        title: `Payment ${payment.status}`,
        message: payment.status === 'succeeded'
          ? `Payment received for order ${order.orderNumber}.`
          : payment.status === 'failed'
            ? `Payment failed for order ${order.orderNumber}.`
            : `Refund processed for order ${order.orderNumber}.`,
      });
      const delivery = await deliverNotification(app.runtimeConfig, notification);

      if (app.eventBus) {
        app.eventBus.publish('notification.delivered', delivery, {
          userId: notification.userId,
          notificationId: notification.id,
        });
      }

      if (app.realtimeHub) {
        app.realtimeHub.broadcast('/ws/notifications', {
          type: 'event',
          event: 'notification.created',
          payload: notification,
        }, order.userId);
      }
    }
  }

  app.post('/api/v1/payments/intents', {
    schema: {
      tags: ['Payments'],
      summary: 'Create payment intent',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        additionalProperties: false,
        required: ['orderId', 'provider'],
        properties: {
          orderId: { type: 'string' },
          provider: { type: 'string', enum: ['razorpay', 'stripe'] },
        },
      },
    },
  }, async (request, reply) => {
    const order = await app.repositories.getOrderById(request.body.orderId);
    await app.authorizeUserId(request, order.userId, ['admin']);
    const providerArtifacts = buildProviderArtifacts(app.runtimeConfig, order, request.body.provider, request.body.orderId);
    const paymentIntent = await app.repositories.createPaymentIntent({
      ...request.body,
      clientToken: providerArtifacts.clientToken,
      providerReference: providerArtifacts.providerReference,
      providerPayload: providerArtifacts.providerPayload,
      metadata: {
        configured: providerConfigured(app.runtimeConfig, request.body.provider),
      },
    });
    if (app.eventBus) {
      app.eventBus.publish('payment.intent.created', paymentIntent, {
        orderId: paymentIntent.orderId,
        provider: paymentIntent.provider,
      });
    }
    reply.code(201);
    return paymentIntent;
  });

  app.post('/api/v1/payments/:id/confirm', {
    schema: {
      tags: ['Payments'],
      summary: 'Confirm a payment from the client callback',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
      body: {
        type: 'object',
        additionalProperties: false,
        required: ['providerPaymentId'],
        properties: {
          providerPaymentId: { type: 'string' },
          signature: { type: 'string' },
          status: { type: 'string', enum: ['succeeded', 'failed'] },
          reason: { type: 'string' },
        },
      },
    },
  }, async (request) => {
    const paymentRecord = await app.repositories.getPaymentById(request.params.id);
    const order = await app.repositories.getOrderById(paymentRecord.orderId);
    await app.authorizeUserId(request, order.userId, ['admin']);

    if (paymentRecord.provider === 'razorpay') {
      const verification = verifyRazorpayClientConfirmation(paymentRecord, request.body, app.runtimeConfig);
      if (!verification.ok) {
        const error = new Error('Razorpay signature verification failed');
        error.statusCode = 400;
        throw error;
      }
    }

    const payment = await app.repositories.updatePaymentStatus(request.params.id, {
      status: request.body.status || 'succeeded',
      reason: request.body.reason,
      providerPaymentId: request.body.providerPaymentId,
      metadata: {
        source: 'client_confirmation',
      },
    });
    await emitPaymentUpdate('payment.updated', payment);
    return payment;
  });

  app.post('/api/v1/payments/:id/status', {
    schema: {
      tags: ['Payments'],
      summary: 'Update payment status and propagate order state',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
      body: {
        type: 'object',
        additionalProperties: false,
        required: ['status'],
        properties: {
          status: { type: 'string', enum: ['succeeded', 'failed', 'refunded'] },
          reason: { type: 'string' },
          providerPaymentId: { type: 'string' },
        },
      },
    },
  }, async (request) => {
    await app.requireRole(request, ['admin', 'seller']);
    const payment = await app.repositories.updatePaymentStatus(request.params.id, request.body);
    await emitPaymentUpdate('payment.updated', payment);
    return payment;
  });

  app.post('/api/v1/payments/:id/refund', {
    schema: {
      tags: ['Payments'],
      summary: 'Create a refund for an existing payment',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
      body: {
        type: 'object',
        additionalProperties: false,
        properties: {
          reason: { type: 'string' },
        },
      },
    },
  }, async (request) => {
    await app.requireRole(request, ['admin']);
    const payment = await app.repositories.updatePaymentStatus(request.params.id, {
      status: 'refunded',
      reason: request.body && request.body.reason,
      metadata: {
        source: 'refund_api',
      },
    });
    await emitPaymentUpdate('payment.refunded', payment);
    return payment;
  });

  app.post('/api/v1/payments/webhooks/razorpay', {
    config: {
      rateLimit: {
        maxRequests: 120,
      },
    },
    schema: {
      tags: ['Payments'],
      summary: 'Handle Razorpay webhook events',
      body: {
        type: 'object',
        additionalProperties: true,
      },
    },
  }, async (request, reply) => {
    const verification = verifyWebhook('razorpay', request.body, request.headers, app.runtimeConfig);
    if (!verification.ok) {
      const error = new Error('Invalid Razorpay webhook signature');
      error.statusCode = 400;
      throw error;
    }

    const update = normalizeWebhookUpdate('razorpay', request.body);
    const paymentRecord = await app.repositories.getPaymentByProviderReference('razorpay', update.providerReference);
    const payment = await app.repositories.updatePaymentStatus(paymentRecord.id, update);
    await emitPaymentUpdate('payment.updated', payment);
    reply.code(202);
    return {
      accepted: true,
      paymentId: payment.id,
      verificationMode: verification.mode,
    };
  });

  app.post('/api/v1/payments/webhooks/stripe', {
    config: {
      rateLimit: {
        maxRequests: 120,
      },
    },
    schema: {
      tags: ['Payments'],
      summary: 'Handle Stripe webhook events',
      body: {
        type: 'object',
        additionalProperties: true,
      },
    },
  }, async (request, reply) => {
    const verification = verifyWebhook('stripe', request.body, request.headers, app.runtimeConfig);
    if (!verification.ok) {
      const error = new Error('Invalid Stripe webhook signature');
      error.statusCode = 400;
      throw error;
    }

    const update = normalizeWebhookUpdate('stripe', request.body);
    const paymentRecord = await app.repositories.getPaymentByProviderReference('stripe', update.providerReference);
    const payment = await app.repositories.updatePaymentStatus(paymentRecord.id, update);
    await emitPaymentUpdate('payment.updated', payment);
    reply.code(202);
    return {
      accepted: true,
      paymentId: payment.id,
      verificationMode: verification.mode,
    };
  });
}

module.exports = { paymentRoutes };
