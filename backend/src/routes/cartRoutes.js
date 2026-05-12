'use strict';

async function cartRoutes(app) {
  app.get('/api/v1/carts/:userId', {
    schema: {
      tags: ['Carts'],
      summary: 'Get cart by user ID',
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
    return app.repositories.getCartByUserId(request.params.userId);
  });

  app.put('/api/v1/carts/:userId/items', {
    schema: {
      tags: ['Carts'],
      summary: 'Add or replace a cart item',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['userId'],
        properties: {
          userId: { type: 'string' },
        },
      },
      body: {
        type: 'object',
        additionalProperties: false,
        required: ['productId', 'quantity'],
        properties: {
          productId: { type: 'string' },
          quantity: { type: 'integer', minimum: 1 },
        },
      },
    },
  }, async (request) => {
    await app.authorizeUserId(request, request.params.userId, ['admin', 'seller']);
    return app.repositories.upsertCartItem({
      userId: request.params.userId,
      productId: request.body.productId,
      quantity: request.body.quantity,
    });
  });
}

module.exports = { cartRoutes };
