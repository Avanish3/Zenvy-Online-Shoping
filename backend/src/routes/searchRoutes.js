'use strict';

const {
  buildAutocomplete,
  buildSimilarProducts,
  parseNaturalLanguageQuery,
  runNlqSearch,
  searchCatalog,
} = require('../services/intelligence');
const { createVisualSearchResult } = require('../services/aiRuntimeGateway');

async function searchRoutes(app) {
  app.post('/api/v1/search', {
    schema: {
      tags: ['Search'],
      summary: 'Hybrid search with filters and facets',
      body: {
        type: 'object',
        properties: {
          query: { type: 'string' },
          mode: { type: 'string', enum: ['keyword', 'hybrid', 'semantic', 'visual'] },
          page: { type: 'integer', minimum: 1 },
          pageSize: { type: 'integer', minimum: 1, maximum: 50 },
          sort: { type: 'string', enum: ['relevance', 'price_asc', 'price_desc', 'newest'] },
          filters: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              sellerId: { type: 'string' },
              tag: { type: 'string' },
              inStockOnly: { type: 'boolean' },
              minPrice: { type: 'integer' },
              maxPrice: { type: 'integer' },
            },
          },
        },
      },
    },
  }, async (request) => {
    const products = await app.repositories.listProducts({});
    return searchCatalog(products, request.body || {});
  });

  app.get('/api/v1/search', {
    schema: {
      tags: ['Search'],
      summary: 'Keyword search over the product catalog',
      querystring: {
        type: 'object',
        required: ['q'],
        properties: {
          q: { type: 'string', minLength: 1 },
        },
      },
    },
  }, async (request) => {
    return app.repositories.searchProducts(request.query.q);
  });

  app.get('/api/v1/search/autocomplete', {
    schema: {
      tags: ['Search'],
      summary: 'Autocomplete suggestions',
      querystring: {
        type: 'object',
        required: ['q'],
        properties: {
          q: { type: 'string', minLength: 1 },
        },
      },
    },
  }, async (request) => {
    const products = await app.repositories.listProducts({});
    return buildAutocomplete(products, request.query.q);
  });

  app.get('/api/v1/search/similar/:id', {
    schema: {
      tags: ['Search'],
      summary: 'Similar products',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
    },
  }, async (request) => {
    const products = await app.repositories.listProducts({});
    return buildSimilarProducts(products, request.params.id, 10);
  });

  app.post('/api/v1/search/visual', {
    schema: {
      tags: ['Search'],
      summary: 'Visual or image-hinted search',
      body: {
        type: 'object',
        properties: {
          query: { type: 'string' },
          imageLabel: { type: 'string' },
          colorHint: { type: 'string' },
        },
      },
    },
  }, async (request) => {
    const products = await app.repositories.listProducts({});
    return createVisualSearchResult(app.runtimeConfig, products, request.body || {});
  });

  app.post('/api/v1/search/nlq', {
    schema: {
      tags: ['Search'],
      summary: 'Natural language search query',
      body: {
        type: 'object',
        required: ['query'],
        properties: {
          query: { type: 'string', minLength: 1 },
        },
      },
    },
  }, async (request) => {
    const products = await app.repositories.listProducts({});
    return {
      parsed: parseNaturalLanguageQuery(request.body.query),
      results: runNlqSearch(products, request.body.query),
    };
  });
}

module.exports = { searchRoutes };
