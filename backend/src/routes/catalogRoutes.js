'use strict';

async function catalogRoutes(app) {
  app.get('/api/v1/catalog/products', {
    schema: {
      tags: ['Catalog'],
      summary: 'List products',
      querystring: {
        type: 'object',
        properties: {
          category: { type: 'string' },
          sellerId: { type: 'string' },
          q: { type: 'string' },
          minPrice: { type: 'integer' },
          maxPrice: { type: 'integer' },
          status: { type: 'string' },
        },
      },
    },
  }, async (request) => {
    return app.repositories.listProducts(request.query);
  });

  app.post('/api/v1/catalog/products', {
    schema: {
      tags: ['Catalog'],
      summary: 'Create product',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'sellerId'],
        properties: {
          id: { type: 'string' },
          sku: { type: 'string' },
          name: { type: 'string' },
          slug: { type: 'string' },
          description: { type: 'string' },
          category: { type: 'string' },
          price: { type: 'integer' },
          currency: { type: 'string' },
          sellerId: { type: 'string' },
          tags: {
            type: 'array',
            items: { type: 'string' },
          },
          availableQuantity: { type: 'integer' },
          warehouseCode: { type: 'string' },
          status: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    await app.requireRole(request, ['admin', 'seller']);
    const product = await app.repositories.createProduct(request.body);
    reply.code(201);
    return product;
  });

  app.get('/api/v1/catalog/products/:id', {
    schema: {
      tags: ['Catalog'],
      summary: 'Get product by ID or slug',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
    },
  }, async (request) => {
    return app.repositories.getProductById(request.params.id);
  });

  app.put('/api/v1/catalog/products/:id', {
    schema: {
      tags: ['Catalog'],
      summary: 'Update product',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
      body: {
        type: 'object',
        additionalProperties: false,
        properties: {
          sku: { type: 'string' },
          name: { type: 'string' },
          slug: { type: 'string' },
          description: { type: 'string' },
          category: { type: 'string' },
          price: { type: 'integer' },
          currency: { type: 'string' },
          sellerId: { type: 'string' },
          tags: {
            type: 'array',
            items: { type: 'string' },
          },
          availableQuantity: { type: 'integer' },
          warehouseCode: { type: 'string' },
          status: { type: 'string' },
        },
      },
    },
  }, async (request) => {
    await app.requireRole(request, ['admin', 'seller']);
    return app.repositories.updateProduct(request.params.id, request.body || {});
  });

  app.delete('/api/v1/catalog/products/:id', {
    schema: {
      tags: ['Catalog'],
      summary: 'Soft delete product',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
    },
  }, async (request) => {
    await app.requireRole(request, ['admin', 'seller']);
    return app.repositories.deleteProduct(request.params.id);
  });

  app.get('/api/v1/catalog/products/:id/variants', {
    schema: {
      tags: ['Catalog'],
      summary: 'Get product variants',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
    },
  }, async (request) => {
    return app.repositories.listProductVariants(request.params.id);
  });

  app.post('/api/v1/catalog/products/bulk', {
    schema: {
      tags: ['Catalog'],
      summary: 'Bulk create products',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        additionalProperties: false,
        required: ['products'],
        properties: {
          products: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['name', 'sellerId'],
              properties: {
                id: { type: 'string' },
                sku: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string' },
                category: { type: 'string' },
                price: { type: 'integer' },
                currency: { type: 'string' },
                sellerId: { type: 'string' },
                tags: {
                  type: 'array',
                  items: { type: 'string' },
                },
                availableQuantity: { type: 'integer' },
                warehouseCode: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    await app.requireRole(request, ['admin', 'seller']);
    const created = await app.repositories.bulkCreateProducts(request.body);
    reply.code(201);
    return created;
  });

  app.post('/api/v1/catalog/products/:id/media', {
    schema: {
      tags: ['Catalog'],
      summary: 'Create media upload URLs',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
      body: {
        type: 'object',
        additionalProperties: false,
        required: ['files'],
        properties: {
          files: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['fileName'],
              properties: {
                fileName: { type: 'string' },
                altText: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    await app.requireRole(request, ['admin', 'seller']);
    const uploads = await app.repositories.createProductMediaUpload({
      productId: request.params.id,
      files: request.body.files,
    });
    reply.code(201);
    return uploads;
  });
}

module.exports = { catalogRoutes };
