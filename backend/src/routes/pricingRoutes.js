'use strict';

const { buildPriceHistory, computeDynamicPrice } = require('../services/intelligence');

async function pricingRoutes(app) {
  app.get('/api/v1/pricing/:variantId', {
    schema: {
      tags: ['AI Pricing'],
      summary: 'Get current price and rule breakdown',
      params: {
        type: 'object',
        required: ['variantId'],
        properties: {
          variantId: { type: 'string' },
        },
      },
    },
  }, async (request) => {
    const product = await app.repositories.getProductById(request.params.variantId);
    return computeDynamicPrice(product, {});
  });

  app.post('/api/v1/pricing/preview', {
    schema: {
      tags: ['AI Pricing'],
      summary: 'Preview a simulated dynamic price',
      body: {
        type: 'object',
        required: ['variantId'],
        properties: {
          variantId: { type: 'string' },
          stockRemaining: { type: 'integer' },
          competitorPrice: { type: 'integer' },
          marginFloor: { type: 'integer' },
          festivalSeason: { type: 'boolean' },
        },
      },
    },
  }, async (request) => {
    const product = await app.repositories.getProductById(request.body.variantId);
    return computeDynamicPrice(product, request.body);
  });

  app.get('/api/v1/pricing/:variantId/history', {
    schema: {
      tags: ['AI Pricing'],
      summary: 'Price history',
      params: {
        type: 'object',
        required: ['variantId'],
        properties: {
          variantId: { type: 'string' },
        },
      },
    },
  }, async (request) => {
    const product = await app.repositories.getProductById(request.params.variantId);
    return buildPriceHistory(product, 7);
  });
}

module.exports = { pricingRoutes };
