'use strict';

const fastify = require('fastify');
const swagger = require('@fastify/swagger');
const swaggerUi = require('@fastify/swagger-ui');
const { config } = require('../config');
const { createRepository } = require('../repositories');
const { createEventBus } = require('../services/eventBus');
const { systemRoutes } = require('../routes/systemRoutes');
const { authRoutes } = require('../routes/authRoutes');
const { gatewayRoutes } = require('../routes/gatewayRoutes');
const { orderRoutes } = require('../routes/orderRoutes');
const { paymentRoutes } = require('../routes/paymentRoutes');
const { logisticsRoutes } = require('../routes/logisticsRoutes');
const { integrationRoutes } = require('../routes/integrationRoutes');
const { shippingRoutes } = require('../routes/shippingRoutes');
const { assistantRoutes } = require('../routes/assistantRoutes');
const { verifyDevJwt } = require('../utils/devToken');

const routeRegistry = {
  gateway: [systemRoutes, gatewayRoutes, integrationRoutes],
  auth: [systemRoutes, authRoutes],
  orders: [systemRoutes, orderRoutes, shippingRoutes],
  payments: [systemRoutes, paymentRoutes],
  logistics: [systemRoutes, logisticsRoutes, shippingRoutes],
  ai: [systemRoutes, assistantRoutes, integrationRoutes],
};

async function createServiceApp(serviceName, overrides = {}) {
  const app = fastify({ logger: false });
  const runtimeConfig = {
    ...config,
    appName: `ZENVY ${serviceName[0].toUpperCase()}${serviceName.slice(1)} Service`,
    ...(overrides.config || {}),
  };
  const repositories = createRepository(runtimeConfig);

  app.decorate('runtimeConfig', runtimeConfig);
  app.decorate('repositories', repositories);
  app.decorate('metricsState', {
    startedAt: Date.now(),
    requestCount: 0,
    errorCount: 0,
    totalLatencyMs: 0,
  });
  app.decorate('eventBus', createEventBus(runtimeConfig));
  app.decorate('requireAuth', async (request) => {
    if (request.authUser) {
      return request.authUser;
    }

    const error = new Error('Authentication required');
    error.statusCode = 401;
    throw error;
  });
  app.decorate('requireRole', async (request, allowedRoles) => {
    const user = await app.requireAuth(request);
    const normalizedRole = user.role === 'customer' ? 'user' : user.role;
    if (!allowedRoles.includes(normalizedRole)) {
      const error = new Error(`One of [${allowedRoles.join(', ')}] roles is required`);
      error.statusCode = 403;
      throw error;
    }

    return {
      ...user,
      role: normalizedRole,
    };
  });

  app.addHook('onRequest', async (request) => {
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        request.authUser = verifyDevJwt(authHeader.slice('Bearer '.length), runtimeConfig.jwtDevSecret, {
          issuer: runtimeConfig.jwtIssuer,
          audience: runtimeConfig.jwtAudience,
        });
      } catch {
        request.authUser = null;
      }
    }
  });

  app.setErrorHandler((error, request, reply) => {
    request.log.error(error);
    reply.status(error.statusCode || 500).send({
      statusCode: error.statusCode || 500,
      error: error.name || 'Error',
      message: error.message || 'Internal Server Error',
    });
  });

  if (typeof repositories.initialize === 'function') {
    await repositories.initialize();
  }

  await app.register(swagger, {
    openapi: {
      openapi: '3.0.3',
      info: {
        title: runtimeConfig.appName,
        version: runtimeConfig.appVersion,
      },
    },
  });
  await app.register(swaggerUi, {
    routePrefix: '/docs',
  });

  for (const registerRoutes of routeRegistry[serviceName] || [systemRoutes]) {
    await app.register(registerRoutes);
  }

  app.addHook('onClose', async () => {
    await repositories.close();
  });

  return app;
}

module.exports = { createServiceApp };
