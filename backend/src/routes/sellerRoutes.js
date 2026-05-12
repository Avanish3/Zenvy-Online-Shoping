'use strict';

async function sellerRoutes(app) {
  app.get('/api/v1/sellers', {
    schema: {
      tags: ['Sellers'],
      summary: 'List sellers',
    },
  }, async () => {
    return app.repositories.listSellers();
  });

  app.get('/api/v1/sellers/:id', {
    schema: {
      tags: ['Sellers'],
      summary: 'Get seller by ID',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
    },
  }, async (request) => {
    return app.repositories.getSellerById(request.params.id);
  });
}

module.exports = { sellerRoutes };
