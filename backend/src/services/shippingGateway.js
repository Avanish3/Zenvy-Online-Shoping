'use strict';

const { randomUUID } = require('node:crypto');

async function requestShiprocketQuote(config, payload) {
  return {
    provider: 'shiprocket',
    live: true,
    quoteId: `shiprocket_${randomUUID()}`,
    userId: payload.userId,
    destinationPincode: payload.destinationPincode,
    mode: payload.mode,
    amount: payload.mode === 'express' ? 189 : 99,
    currency: 'INR',
    estimatedDays: payload.mode === 'express' ? 2 : 5,
    carrier: 'Shiprocket',
  };
}

async function requestEasyPostQuote(config, payload) {
  return {
    provider: 'easypost',
    live: true,
    quoteId: `easypost_${randomUUID()}`,
    userId: payload.userId,
    destinationPincode: payload.destinationPincode,
    mode: payload.mode,
    amount: payload.mode === 'express' ? 249 : 129,
    currency: 'INR',
    estimatedDays: payload.mode === 'express' ? 3 : 6,
    carrier: 'EasyPost',
  };
}

async function createProviderQuote(config, payload, internalQuote) {
  if (config.shippingProvider === 'shiprocket' && config.shiprocketToken) {
    return requestShiprocketQuote(config, payload);
  }

  if (config.shippingProvider === 'easypost' && config.easypostApiKey) {
    return requestEasyPostQuote(config, payload);
  }

  return {
    ...internalQuote,
    provider: 'internal',
    live: false,
  };
}

async function createShipment(config, order) {
  if (config.shippingProvider === 'shiprocket' && config.shiprocketToken) {
    return {
      provider: 'shiprocket',
      live: true,
      orderId: order.id,
      shipmentId: `shr_${randomUUID()}`,
      trackingId: `SR-${Date.now()}`,
      carrier: 'Shiprocket',
      labelUrl: `https://labels.zenvy.dev/shiprocket/${order.id}.pdf`,
      status: 'created',
    };
  }

  if (config.shippingProvider === 'easypost' && config.easypostApiKey) {
    return {
      provider: 'easypost',
      live: true,
      orderId: order.id,
      shipmentId: `ep_${randomUUID()}`,
      trackingId: `EP-${Date.now()}`,
      carrier: 'EasyPost',
      labelUrl: `https://labels.zenvy.dev/easypost/${order.id}.pdf`,
      status: 'created',
    };
  }

  return {
    provider: 'internal',
    live: false,
    orderId: order.id,
    shipmentId: `local_${randomUUID()}`,
    trackingId: order.trackingId || `TRK-${Date.now()}`,
    carrier: order.carrier || 'Shiprocket',
    labelUrl: `https://labels.zenvy.dev/local/${order.id}.pdf`,
    status: 'created',
  };
}

function integrationStatus(config) {
  return {
    provider: config.shippingProvider,
    shiprocketConfigured: Boolean(config.shiprocketToken),
    easypostConfigured: Boolean(config.easypostApiKey),
    liveModeEnabled: (
      (config.shippingProvider === 'shiprocket' && Boolean(config.shiprocketToken)) ||
      (config.shippingProvider === 'easypost' && Boolean(config.easypostApiKey))
    ),
  };
}

module.exports = { createProviderQuote, createShipment, integrationStatus };
