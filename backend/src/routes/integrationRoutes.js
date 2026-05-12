'use strict';

const { runtimeStatus } = require('../services/aiRuntimeGateway');
const { integrationStatus: shippingStatus } = require('../services/shippingGateway');
const { notificationIntegrationStatus } = require('../services/notificationGateway');
const { providerConfigured } = require('../services/paymentGateway');

async function integrationRoutes(app) {
  app.get('/api/v1/integrations/status', {
    schema: {
      tags: ['Integrations'],
      summary: 'External integration runtime status',
    },
  }, async () => {
    return {
      ai: runtimeStatus(app.runtimeConfig),
      shipping: shippingStatus(app.runtimeConfig),
      notifications: notificationIntegrationStatus(app.runtimeConfig),
      payments: {
        razorpay: {
          configured: providerConfigured(app.runtimeConfig, 'razorpay'),
          mode: app.runtimeConfig.razorpayKeyId ? 'live' : 'simulated',
        },
        stripe: {
          configured: providerConfigured(app.runtimeConfig, 'stripe'),
          mode: app.runtimeConfig.stripePublishableKey ? 'live' : 'simulated',
        },
      },
      eventBus: app.eventBus ? app.eventBus.stats() : { driver: 'memory', configured: true, pendingEvents: 0 },
    };
  });
}

module.exports = { integrationRoutes };
