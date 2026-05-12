'use strict';

async function reviewRoutes(app) {
  app.get('/api/v1/reviews/:productId', {
    schema: {
      tags: ['Reviews'],
      summary: 'List product reviews',
      params: {
        type: 'object',
        required: ['productId'],
        properties: {
          productId: { type: 'string' },
        },
      },
    },
  }, async (request) => {
    return app.repositories.listReviews(request.params.productId);
  });

  app.post('/api/v1/reviews', {
    schema: {
      tags: ['Reviews'],
      summary: 'Create a review',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        additionalProperties: false,
        required: ['productId', 'userId', 'rating', 'title', 'comment'],
        properties: {
          productId: { type: 'string' },
          userId: { type: 'string' },
          rating: { type: 'integer', minimum: 1, maximum: 5 },
          title: { type: 'string', minLength: 3 },
          comment: { type: 'string', minLength: 5 },
        },
      },
    },
  }, async (request, reply) => {
    await app.authorizeUserId(request, request.body.userId, ['admin']);
    const review = await app.repositories.createReview(request.body);
    reply.code(201);
    return review;
  });
}

module.exports = { reviewRoutes };
