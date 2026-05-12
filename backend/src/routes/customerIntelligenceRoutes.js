'use strict';

const {
  buildBudgetOptimizer,
  buildPersonalizedRecommendations,
} = require('../services/scaleFeatures');

async function customerIntelligenceRoutes(app) {
  app.post('/api/v1/behavior/events', {
    schema: {
      tags: ['AI Personalization'],
      summary: 'Record user behavior events for recommendations and analytics',
      body: {
        type: 'object',
        required: ['userId', 'eventType'],
        properties: {
          userId: { type: 'string' },
          eventType: { type: 'string', enum: ['view', 'search', 'add_to_cart', 'purchase', 'wishlist'] },
          productId: { type: 'string' },
          categoryHint: { type: 'string' },
          metadata: { type: 'object', additionalProperties: true },
        },
      },
    },
  }, async (request, reply) => {
    const event = app.repositories.recordBehaviorEvent
      ? await app.repositories.recordBehaviorEvent(request.body)
      : {
        id: 'behavior-not-configured',
        ...request.body,
        createdAt: new Date().toISOString(),
      };
    reply.code(201);
    return event;
  });

  app.get('/api/v1/behavior/:userId', {
    schema: {
      tags: ['AI Personalization'],
      summary: 'List behavior events for a user',
      params: {
        type: 'object',
        required: ['userId'],
        properties: {
          userId: { type: 'string' },
        },
      },
    },
  }, async (request) => {
    return app.repositories.listBehaviorEventsByUserId
      ? app.repositories.listBehaviorEventsByUserId(request.params.userId)
      : [];
  });

  app.post('/api/v1/recommend/personalized', {
    schema: {
      tags: ['AI Personalization'],
      summary: 'Behavior-aware personalized recommendations',
      body: {
        type: 'object',
        required: ['userId'],
        properties: {
          userId: { type: 'string' },
          focusCategory: { type: 'string' },
          limit: { type: 'integer', minimum: 1, maximum: 20 },
          excludeProductIds: {
            type: 'array',
            items: { type: 'string' },
          },
        },
      },
    },
  }, async (request) => {
    const products = await app.repositories.listProducts({});
    const behaviorEvents = app.repositories.listBehaviorEventsByUserId
      ? await app.repositories.listBehaviorEventsByUserId(request.body.userId)
      : [];

    return buildPersonalizedRecommendations(products, behaviorEvents, request.body || {});
  });

  app.post('/api/v1/assistant/budget-optimizer', {
    schema: {
      tags: ['AI Personalization'],
      summary: 'Build a budget-constrained smart shopping bundle',
      body: {
        type: 'object',
        required: ['userId', 'budget'],
        properties: {
          userId: { type: 'string' },
          budget: { type: 'number', minimum: 1 },
          focusCategory: { type: 'string' },
          maxItems: { type: 'integer', minimum: 1, maximum: 10 },
        },
      },
    },
  }, async (request) => {
    const products = await app.repositories.listProducts({});
    const behaviorEvents = app.repositories.listBehaviorEventsByUserId
      ? await app.repositories.listBehaviorEventsByUserId(request.body.userId)
      : [];

    return buildBudgetOptimizer(products, behaviorEvents, request.body || {});
  });
}

module.exports = { customerIntelligenceRoutes };
