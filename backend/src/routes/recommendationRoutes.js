'use strict';

const { buildRecommendations } = require('../services/intelligence');
const { createMlRecommendationResult } = require('../services/aiRuntimeGateway');

async function recommendationRoutes(app) {
  async function listProducts() {
    return app.repositories.listProducts({});
  }

  app.post('/api/v1/recommend/homepage', {
    schema: {
      tags: ['AI Recommendations'],
      summary: 'Homepage recommendations',
      body: {
        type: 'object',
        properties: {
          userId: { type: 'string' },
          focusCategory: { type: 'string' },
          limit: { type: 'integer', minimum: 1, maximum: 40 },
        },
      },
    },
  }, async (request) => {
    const body = request.body || {};
    const products = await listProducts();
    return buildRecommendations(products, {
      type: 'homepage',
      focusCategory: body.focusCategory,
      limit: body.limit || 10,
    });
  });

  app.post('/api/v1/recommend/similar', {
    schema: {
      tags: ['AI Recommendations'],
      summary: 'Similar product recommendations',
      body: {
        type: 'object',
        required: ['productId'],
        properties: {
          productId: { type: 'string' },
          limit: { type: 'integer', minimum: 1, maximum: 20 },
        },
      },
    },
  }, async (request) => {
    const body = request.body || {};
    const products = await listProducts();
    return buildRecommendations(products, {
      type: 'similar',
      productId: body.productId,
      limit: body.limit || 10,
    });
  });

  app.post('/api/v1/recommend/cart', {
    schema: {
      tags: ['AI Recommendations'],
      summary: 'Cart cross-sell recommendations',
      body: {
        type: 'object',
        required: ['userId'],
        properties: {
          userId: { type: 'string' },
          limit: { type: 'integer', minimum: 1, maximum: 10 },
        },
      },
    },
  }, async (request) => {
    const body = request.body || {};
    const products = await listProducts();
    const cart = await app.repositories.getCartByUserId(body.userId);
    return buildRecommendations(products, {
      type: 'cart',
      cartProductIds: cart.items.map((item) => item.productId),
      limit: body.limit || 10,
    });
  });

  app.post('/api/v1/recommend/session', {
    schema: {
      tags: ['AI Recommendations'],
      summary: 'Session-based recommendations',
      body: {
        type: 'object',
        properties: {
          focusCategory: { type: 'string' },
          limit: { type: 'integer', minimum: 1, maximum: 20 },
        },
      },
    },
  }, async (request) => {
    const body = request.body || {};
    const products = await listProducts();
    return buildRecommendations(products, {
      type: 'session',
      focusCategory: body.focusCategory,
      limit: body.limit || 10,
    });
  });

  app.post('/api/v1/recommend/email', {
    schema: {
      tags: ['AI Recommendations'],
      summary: 'Email recommendations',
      body: {
        type: 'object',
        properties: {
          userId: { type: 'string' },
          limit: { type: 'integer', minimum: 1, maximum: 20 },
        },
      },
    },
  }, async (request) => {
    const body = request.body || {};
    const products = await listProducts();
    return buildRecommendations(products, {
      type: 'email',
      limit: body.limit || 10,
    });
  });

  app.post('/api/v1/recommend/ml-runtime', {
    schema: {
      tags: ['AI Recommendations'],
      summary: 'Run recommendation request through external ML runtime when configured',
      body: {
        type: 'object',
        properties: {
          userId: { type: 'string' },
          focusCategory: { type: 'string' },
          limit: { type: 'integer', minimum: 1, maximum: 20 },
        },
      },
    },
  }, async (request) => {
    const products = await listProducts();
    return createMlRecommendationResult(app.runtimeConfig, products, {
      type: 'session',
      ...(request.body || {}),
    });
  });
}

module.exports = { recommendationRoutes };
