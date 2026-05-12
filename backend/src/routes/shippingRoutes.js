'use strict';

const { createProviderQuote, createShipment, integrationStatus } = require('../services/shippingGateway');

async function shippingRoutes(app) {
  app.post('/api/v1/shipping/quotes', {
    schema: {
      tags: ['Shipping'],
      summary: 'Create a shipping quote',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        additionalProperties: false,
        required: ['userId', 'destinationPincode', 'mode', 'items'],
        properties: {
          userId: { type: 'string' },
          destinationPincode: { type: 'string', minLength: 6, maxLength: 6 },
          mode: { type: 'string', enum: ['standard', 'express'] },
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
    await app.authorizeUserId(request, request.body.userId, ['admin', 'seller']);
    const quote = await app.repositories.createShippingQuote(request.body);
    const providerQuote = await createProviderQuote(app.runtimeConfig, request.body, quote);
    reply.code(201);
    return providerQuote;
  });

  app.post('/api/v1/shipping/shipments', {
    schema: {
      tags: ['Shipping'],
      summary: 'Create a shipment from an order',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        additionalProperties: false,
        required: ['orderId'],
        properties: {
          orderId: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    await app.requireRole(request, ['admin', 'seller']);
    const order = await app.repositories.getOrderById(request.body.orderId);
    const shipment = await createShipment(app.runtimeConfig, order);
    reply.code(201);
    return shipment;
  });

  app.get('/api/v1/shipping/integrations', {
    schema: {
      tags: ['Shipping'],
      summary: 'Shipping provider integration status',
    },
  }, async () => {
    return integrationStatus(app.runtimeConfig);
  });
}

module.exports = { shippingRoutes };
