'use strict';

const crypto = require('node:crypto');

function canonicalize(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => canonicalize(entry));
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  return Object.keys(value).sort().reduce((result, key) => {
    result[key] = canonicalize(value[key]);
    return result;
  }, {});
}

function canonicalJson(value) {
  return JSON.stringify(canonicalize(value || {}));
}

function providerConfigured(config, provider) {
  if (provider === 'razorpay') {
    return Boolean(config.razorpayKeyId && config.razorpayKeySecret);
  }

  if (provider === 'stripe') {
    return Boolean(config.stripePublishableKey && config.stripeSecretKey);
  }

  return false;
}

function buildProviderArtifacts(config, order, provider, paymentId) {
  if (provider === 'razorpay') {
    const razorpayOrderId = `order_${crypto.randomUUID()}`;
    return {
      providerReference: razorpayOrderId,
      providerPayload: {
        keyId: config.razorpayKeyId || 'rzp_test_placeholder',
        orderId: razorpayOrderId,
        amount: Math.round(Number(order.totalAmount) * 100),
        currency: order.currency,
        receipt: order.orderNumber,
      },
      clientToken: `rzp_${paymentId}`,
    };
  }

  const paymentIntentId = `pi_${crypto.randomUUID()}`;
  return {
    providerReference: paymentIntentId,
    providerPayload: {
      publishableKey: config.stripePublishableKey || 'pk_test_placeholder',
      clientSecret: `${paymentIntentId}_secret_${crypto.randomUUID().replace(/-/g, '')}`,
      paymentIntentId,
      amount: Math.round(Number(order.totalAmount) * 100),
      currency: String(order.currency || 'INR').toLowerCase(),
    },
    clientToken: `${paymentIntentId}_client`,
  };
}

function buildRazorpayClientSignature(reference, providerPaymentId, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(`${reference}|${providerPaymentId}`)
    .digest('hex');
}

function buildWebhookSignature(provider, payload, secret, timestamp = null) {
  const body = canonicalJson(payload);
  if (provider === 'razorpay') {
    return crypto.createHmac('sha256', secret).update(body).digest('hex');
  }

  const signedTimestamp = String(timestamp || Math.floor(Date.now() / 1000));
  const digest = crypto
    .createHmac('sha256', secret)
    .update(`${signedTimestamp}.${body}`)
    .digest('hex');
  return `t=${signedTimestamp},v1=${digest}`;
}

function verifyRazorpayClientConfirmation(payment, body, config) {
  if (!config.razorpayKeySecret) {
    return { ok: true, mode: 'simulated' };
  }

  const signature = buildRazorpayClientSignature(
    payment.providerReference,
    body.providerPaymentId,
    config.razorpayKeySecret
  );
  return {
    ok: signature === body.signature,
    mode: 'signed',
  };
}

function verifyWebhook(provider, body, headers, config) {
  const normalizedHeaders = Object.fromEntries(Object.entries(headers || {}).map(([key, value]) => [key.toLowerCase(), value]));
  if (provider === 'razorpay') {
    if (!config.razorpayWebhookSecret) {
      return { ok: true, mode: 'simulated' };
    }

    const expected = buildWebhookSignature('razorpay', body, config.razorpayWebhookSecret);
    return {
      ok: expected === normalizedHeaders['x-razorpay-signature'],
      mode: 'signed',
    };
  }

  if (!config.stripeWebhookSecret) {
    return { ok: true, mode: 'simulated' };
  }

  const signatureHeader = String(normalizedHeaders['stripe-signature'] || '');
  const parts = signatureHeader.split(',').reduce((result, segment) => {
    const [key, value] = segment.split('=');
    if (key && value) {
      result[key.trim()] = value.trim();
    }
    return result;
  }, {});
  const expected = buildWebhookSignature('stripe', body, config.stripeWebhookSecret, parts.t);
  return {
    ok: expected === signatureHeader,
    mode: 'signed',
  };
}

function normalizeWebhookUpdate(provider, body) {
  if (provider === 'razorpay') {
    const event = String(body.event || '');
    return {
      providerReference: body.payload && body.payload.payment && body.payload.payment.entity
        ? body.payload.payment.entity.order_id
        : body.orderId,
      providerPaymentId: body.payload && body.payload.payment && body.payload.payment.entity
        ? body.payload.payment.entity.id
        : body.paymentId,
      status: event === 'payment.captured' ? 'succeeded' : event === 'payment.failed' ? 'failed' : 'created',
      reason: body.payload && body.payload.payment && body.payload.payment.entity
        ? body.payload.payment.entity.error_description || null
        : body.reason || null,
      metadata: body,
    };
  }

  const dataObject = body.data && body.data.object ? body.data.object : {};
  return {
    providerReference: dataObject.id || body.paymentIntentId,
    providerPaymentId: dataObject.latest_charge || dataObject.id || body.paymentIntentId,
    status: body.type === 'payment_intent.succeeded'
      ? 'succeeded'
      : body.type === 'payment_intent.payment_failed'
        ? 'failed'
        : body.type === 'charge.refunded'
          ? 'refunded'
          : 'created',
    reason: dataObject.last_payment_error ? dataObject.last_payment_error.message : body.reason || null,
    metadata: body,
  };
}

module.exports = {
  buildProviderArtifacts,
  buildRazorpayClientSignature,
  buildWebhookSignature,
  canonicalJson,
  normalizeWebhookUpdate,
  providerConfigured,
  verifyRazorpayClientConfirmation,
  verifyWebhook,
};
