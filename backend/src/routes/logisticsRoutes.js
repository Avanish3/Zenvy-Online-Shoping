'use strict';

const {
  listWarehouses,
  optimizeDeliveryRoute,
  previewWarehouseAllocation,
} = require('../services/scaleFeatures');

async function logisticsRoutes(app) {
  app.get('/api/v1/logistics/warehouses', {
    schema: {
      tags: ['Logistics'],
      summary: 'List warehouse capacity by location',
    },
  }, async () => {
    const products = await app.repositories.listProducts({});
    return listWarehouses(products);
  });

  app.post('/api/v1/logistics/allocation/preview', {
    schema: {
      tags: ['Logistics'],
      summary: 'Preview warehouse allocation for an order',
      body: {
        type: 'object',
        required: ['items'],
        properties: {
          items: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              required: ['productId', 'quantity'],
              properties: {
                productId: { type: 'string' },
                quantity: { type: 'integer', minimum: 1 },
              },
            },
          },
        },
      },
    },
  }, async (request) => {
    const products = await app.repositories.listProducts({});
    return previewWarehouseAllocation(products, request.body.items || []);
  });

  app.post('/api/v1/logistics/routes/optimize', {
    schema: {
      tags: ['Logistics'],
      summary: 'Optimize a delivery route',
      body: {
        type: 'object',
        required: ['stops'],
        properties: {
          stops: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                label: { type: 'string' },
                city: { type: 'string' },
                pincode: { type: 'string' },
                priority: { type: 'number' },
                lat: { type: 'number' },
                lng: { type: 'number' },
              },
            },
          },
        },
      },
    },
  }, async (request) => {
    return optimizeDeliveryRoute(request.body.stops || []);
  });

  app.get('/api/v1/logistics/shipments/:orderId', {
    schema: {
      tags: ['Logistics'],
      summary: 'Fetch shipment and tracking details for an order',
      params: {
        type: 'object',
        required: ['orderId'],
        properties: {
          orderId: { type: 'string' },
        },
      },
    },
  }, async (request) => {
    if (app.repositories.getOrderTracking) {
      return app.repositories.getOrderTracking(request.params.orderId);
    }

    const order = await app.repositories.getOrderById(request.params.orderId);
    return {
      orderId: order.id,
      status: order.status,
      carrier: order.carrier || null,
      trackingId: order.trackingId || null,
      timeline: order.timeline || [],
    };
  });
}

module.exports = { logisticsRoutes };
