'use strict';

async function inventoryRoutes(app) {
  app.get('/api/v1/inventory/:productId', {
    schema: {
      tags: ['Inventory'],
      summary: 'Get inventory by product ID',
      params: {
        type: 'object',
        required: ['productId'],
        properties: {
          productId: { type: 'string' },
        },
      },
    },
  }, async (request) => {
    return app.repositories.getInventory(request.params.productId);
  });

  app.get('/api/v1/inventory/transactions/:productId', {
    schema: {
      tags: ['Inventory'],
      summary: 'List inventory transactions by product',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['productId'],
        properties: {
          productId: { type: 'string' },
        },
      },
    },
  }, async (request) => {
    await app.requireRole(request, ['admin', 'seller']);
    return app.repositories.listInventoryTransactions(request.params.productId);
  });

  async function handleMutation(request, reply, action) {
    await app.requireRole(request, ['admin', 'seller']);
    const record = await app.repositories[action]({
      productId: request.params.productId,
      quantity: request.body.quantity,
      orderId: request.body.orderId,
      reason: request.body.reason,
    });
    reply.code(200);
    return record;
  }

  const mutationSchema = {
    params: {
      type: 'object',
      required: ['productId'],
      properties: {
        productId: { type: 'string' },
      },
    },
    body: {
      type: 'object',
      additionalProperties: false,
      required: ['quantity'],
      properties: {
        quantity: { type: 'integer', minimum: 1 },
        orderId: { type: 'string' },
        reason: { type: 'string' },
      },
    },
  };

  app.post('/api/v1/inventory/:productId/reserve', {
    schema: {
      tags: ['Inventory'],
      summary: 'Reserve inventory',
      security: [{ bearerAuth: [] }],
      ...mutationSchema,
    },
  }, async (request, reply) => handleMutation(request, reply, 'reserveInventory'));

  app.post('/api/v1/inventory/:productId/release', {
    schema: {
      tags: ['Inventory'],
      summary: 'Release inventory reservation',
      security: [{ bearerAuth: [] }],
      ...mutationSchema,
    },
  }, async (request, reply) => handleMutation(request, reply, 'releaseInventory'));

  app.post('/api/v1/inventory/:productId/deduct', {
    schema: {
      tags: ['Inventory'],
      summary: 'Deduct reserved inventory',
      security: [{ bearerAuth: [] }],
      ...mutationSchema,
    },
  }, async (request, reply) => handleMutation(request, reply, 'deductInventory'));

  app.post('/api/v1/inventory/:productId/restock', {
    schema: {
      tags: ['Inventory'],
      summary: 'Restock inventory',
      security: [{ bearerAuth: [] }],
      ...mutationSchema,
    },
  }, async (request, reply) => handleMutation(request, reply, 'restockInventory'));
}

module.exports = { inventoryRoutes };
