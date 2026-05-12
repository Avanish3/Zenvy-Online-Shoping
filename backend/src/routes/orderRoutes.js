'use strict';

const { deliverNotification } = require('../services/notificationGateway');

async function orderRoutes(app) {
  app.get('/api/v1/orders', {
    schema: {
      tags: ['Orders'],
      summary: 'List all orders for admin or seller operations',
      security: [{ bearerAuth: [] }],
    },
  }, async (request) => {
    await app.requireRole(request, ['admin', 'seller']);
    return app.repositories.listAllOrders ? app.repositories.listAllOrders() : [];
  });

  app.post('/api/v1/orders', {
    schema: {
      tags: ['Orders'],
      summary: 'Create order',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        additionalProperties: false,
        required: ['userId', 'items'],
        properties: {
          userId: { type: 'string' },
          currency: { type: 'string', default: 'INR' },
          items: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              required: ['productId', 'quantity'],
              properties: {
                productId: { type: 'string' },
                quantity: { type: 'integer', minimum: 1 },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    await app.authorizeUserId(request, request.body.userId, ['admin']);
    const order = await app.repositories.createOrder(request.body);
    if (app.eventBus) {
      app.eventBus.publish('order.created', order, {
        userId: order.userId,
        orderId: order.id,
      });
    }
    reply.code(201);
    return order;
  });

  app.get('/api/v1/orders/:id', {
    schema: {
      tags: ['Orders'],
      summary: 'Get order by ID',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
    },
  }, async (request) => {
    const order = await app.repositories.getOrderById(request.params.id);
    await app.authorizeUserId(request, order.userId, ['admin', 'seller']);
    return order;
  });

  app.get('/api/v1/orders/user/:userId', {
    schema: {
      tags: ['Orders'],
      summary: 'List orders for a user',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['userId'],
        properties: {
          userId: { type: 'string' },
        },
      },
    },
  }, async (request) => {
    await app.authorizeUserId(request, request.params.userId, ['admin', 'seller']);
    return app.repositories.listOrdersByUserId(request.params.userId);
  });

  app.post('/api/v1/orders/:id/cancel', {
    schema: {
      tags: ['Orders'],
      summary: 'Cancel order',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
    },
  }, async (request) => {
    const currentOrder = await app.repositories.getOrderById(request.params.id);
    await app.authorizeUserId(request, currentOrder.userId, ['admin', 'seller']);
    const order = await app.repositories.cancelOrder(request.params.id);
    if (app.eventBus) {
      app.eventBus.publish('order.cancelled', order, {
        orderId: order.id,
      });
    }
    return order;
  });

  app.post('/api/v1/orders/:id/return', {
    schema: {
      tags: ['Orders'],
      summary: 'Initiate return',
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
    const currentOrder = await app.repositories.getOrderById(request.params.id);
    await app.authorizeUserId(request, currentOrder.userId, ['admin', 'seller']);
    const order = await app.repositories.returnOrder(request.params.id, request.body && request.body.reason);
    if (app.eventBus) {
      app.eventBus.publish('order.return_requested', order, {
        orderId: order.id,
      });
    }
    return order;
  });

  app.get('/api/v1/orders/:id/timeline', {
    schema: {
      tags: ['Orders'],
      summary: 'Get order timeline',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
    },
  }, async (request) => {
    const order = await app.repositories.getOrderById(request.params.id);
    await app.authorizeUserId(request, order.userId, ['admin', 'seller']);
    return app.repositories.getOrderTimeline(request.params.id);
  });

  app.post('/api/v1/orders/:id/status', {
    schema: {
      tags: ['Orders'],
      summary: 'Advance order fulfillment lifecycle',
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
          status: { type: 'string', enum: ['confirmed', 'packed', 'shipped', 'delivered'] },
          carrier: { type: 'string' },
          trackingId: { type: 'string' },
          note: { type: 'string' },
        },
      },
    },
  }, async (request) => {
    await app.requireRole(request, ['admin', 'seller']);
    const order = await app.repositories.updateOrderStatus(request.params.id, request.body);

    if (app.repositories.createNotification) {
      const notification = await app.repositories.createNotification({
        userId: order.userId,
        channel: order.status === 'delivered' ? 'email' : 'push',
        title: `Order ${order.orderNumber} ${order.status}`,
        message: order.trackingId
          ? `Tracking ${order.trackingId} is now ${order.status}.`
          : `Your order is now ${order.status}.`,
      });
      const delivery = await deliverNotification(app.runtimeConfig, notification);

      if (app.eventBus) {
        app.eventBus.publish('notification.delivered', delivery, {
          userId: notification.userId,
          notificationId: notification.id,
        });
      }
    }

    if (app.realtimeHub) {
      app.realtimeHub.broadcast('/ws/orders', {
        type: 'event',
        event: 'order.status.updated',
        payload: order,
      }, order.id);
      app.realtimeHub.broadcast('/ws/orders', {
        type: 'event',
        event: 'order.tracking.updated',
        payload: await app.repositories.getOrderTracking(order.id),
      }, order.id);
    }
    if (app.eventBus) {
      app.eventBus.publish('order.status.updated', order, {
        orderId: order.id,
        status: order.status,
      });
    }

    return order;
  });

  app.get('/api/v1/orders/:id/tracking', {
    schema: {
      tags: ['Orders'],
      summary: 'Get order tracking summary',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
    },
  }, async (request) => {
    const order = await app.repositories.getOrderById(request.params.id);
    await app.authorizeUserId(request, order.userId, ['admin', 'seller']);
    if (app.repositories.getOrderTracking) {
      return app.repositories.getOrderTracking(request.params.id);
    }

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      trackingId: order.trackingId || null,
      carrier: order.carrier || null,
      timeline: order.timeline || [],
    };
  });
}

module.exports = { orderRoutes };
