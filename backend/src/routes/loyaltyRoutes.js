'use strict';

async function loyaltyRoutes(app) {
  app.get('/api/v1/loyalty/:userId', {
    schema: {
      tags: ['Loyalty'],
      summary: 'Get loyalty summary by user ID',
      params: {
        type: 'object',
        required: ['userId'],
        properties: {
          userId: { type: 'string' },
        },
      },
    },
  }, async (request) => {
    return app.repositories.getLoyaltyByUserId(request.params.userId);
  });
}

module.exports = { loyaltyRoutes };
