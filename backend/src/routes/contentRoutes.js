'use strict';

const { generateProductDescription } = require('../services/intelligence');

async function contentRoutes(app) {
  app.post('/api/v1/content/product-description', {
    schema: {
      tags: ['AI Content'],
      summary: 'Generate SEO-friendly product copy',
      body: {
        type: 'object',
        required: ['productName', 'category'],
        properties: {
          productName: { type: 'string' },
          brand: { type: 'string' },
          category: { type: 'string' },
          attributes: { type: 'object', additionalProperties: { type: 'string' } },
          keyFeatures: {
            type: 'array',
            items: { type: 'string' },
          },
          targetAudience: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    reply.code(201);
    return generateProductDescription(request.body);
  });
}

module.exports = { contentRoutes };
