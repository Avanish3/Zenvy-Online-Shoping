'use strict';

const {
  buildChurnRisk,
  buildCustomerSegments,
  buildDemandForecast,
  summarizeSales,
} = require('../services/scaleFeatures');

async function analyticsRoutes(app) {
  app.get('/api/v1/analytics/overview', {
    schema: {
      tags: ['Analytics'],
      summary: 'Return backend analytics overview',
    },
  }, async () => {
    const products = await app.repositories.listProducts({});
    const sellers = await app.repositories.listSellers();
    const orders = app.repositories.listAllOrders
      ? await app.repositories.listAllOrders()
      : [];
    const revenueInr = orders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
    const confirmedOrders = orders.filter((order) => ['confirmed', 'shipped', 'delivered'].includes(order.status)).length;

    return {
      gmvsnapshotInr: revenueInr,
      catalogValueInr: products.reduce((sum, item) => sum + item.price, 0),
      activeProducts: products.length,
      activeSellers: sellers.length,
      totalOrders: orders.length,
      confirmedOrders,
      pendingOrders: orders.filter((order) => order.status === 'pending_payment').length,
      lowStockProducts: products.filter((product) => (product.availableQuantity || 0) < 20).length,
      generatedAt: new Date().toISOString(),
    };
  });

  app.get('/api/v1/analytics/sales', {
    schema: {
      tags: ['Analytics'],
      summary: 'Sales dashboard snapshot',
    },
  }, async (request) => {
    await app.requireRole(request, ['admin', 'seller']);
    const orders = app.repositories.listAllOrders
      ? await app.repositories.listAllOrders()
      : [];
    return summarizeSales(orders);
  });

  app.get('/api/v1/analytics/customer-segments', {
    schema: {
      tags: ['Analytics'],
      summary: 'Customer segmentation view',
    },
  }, async (request) => {
    await app.requireRole(request, ['admin']);
    const users = app.repositories.listUsers
      ? await app.repositories.listUsers()
      : [];
    const orders = app.repositories.listAllOrders
      ? await app.repositories.listAllOrders()
      : [];
    return buildCustomerSegments(users, orders);
  });

  app.get('/api/v1/analytics/demand-forecast', {
    schema: {
      tags: ['Analytics'],
      summary: 'Demand forecast by product',
    },
  }, async (request) => {
    await app.requireRole(request, ['admin', 'seller']);
    const products = await app.repositories.listProducts({});
    const orders = app.repositories.listAllOrders
      ? await app.repositories.listAllOrders()
      : [];
    return buildDemandForecast(products, orders);
  });

  app.get('/api/v1/analytics/churn-risk', {
    schema: {
      tags: ['Analytics'],
      summary: 'Customer churn risk scoring',
    },
  }, async (request) => {
    await app.requireRole(request, ['admin']);
    const users = app.repositories.listUsers
      ? await app.repositories.listUsers()
      : [];
    const orders = app.repositories.listAllOrders
      ? await app.repositories.listAllOrders()
      : [];
    return buildChurnRisk(users, orders);
  });
}

module.exports = { analyticsRoutes };
