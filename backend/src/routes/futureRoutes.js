'use strict';

const {
  buildAutoReorderPlan,
  buildMultimodalSearch,
  evaluateEmotionState,
} = require('../services/intelligence');

async function futureRoutes(app) {
  app.post('/api/v1/future/auto-reorder/preview', {
    schema: {
      tags: ['Future AI'],
      summary: 'Preview autonomous reorder decision',
      body: {
        type: 'object',
        properties: {
          productName: { type: 'string' },
          avgQuantity: { type: 'number' },
          avgDaysBetweenOrders: { type: 'number' },
          lastQuantity: { type: 'number' },
          reorderLeadDays: { type: 'number' },
          approvalMode: { type: 'string', enum: ['auto', 'confirm', 'manual'] },
        },
      },
    },
  }, async (request) => {
    return buildAutoReorderPlan(request.body || {});
  });

  app.post('/api/v1/future/search/multimodal', {
    schema: {
      tags: ['Future AI'],
      summary: 'Run multimodal search interpretation',
      body: {
        type: 'object',
        properties: {
          text: { type: 'string' },
          voiceTranscript: { type: 'string' },
          imageLabel: { type: 'string' },
          imageQuery: { type: 'string' },
          videoKeyFrameLabel: { type: 'string' },
        },
      },
    },
  }, async (request) => {
    const products = await app.repositories.listProducts({});
    return buildMultimodalSearch(products, request.body || {});
  });

  app.post('/api/v1/future/personalization/emotion', {
    schema: {
      tags: ['Future AI'],
      summary: 'Evaluate engagement state and ethical actions',
      body: {
        type: 'object',
        properties: {
          scrollVelocity: { type: 'number' },
          dwellTimePerProduct: { type: 'number' },
          clickHesitationMs: { type: 'number' },
          cartAddRemoveRatio: { type: 'number' },
          sessionAbandonmentPoints: { type: 'number' },
          checkoutIntent: { type: 'boolean' },
        },
      },
    },
  }, async (request) => {
    return evaluateEmotionState(request.body || {});
  });
}

module.exports = { futureRoutes };
