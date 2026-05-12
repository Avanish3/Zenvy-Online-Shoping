'use strict';

const fastify = require('fastify');
const { randomUUID } = require('node:crypto');
const swagger = require('@fastify/swagger');
const swaggerUi = require('@fastify/swagger-ui');
const { config } = require('./config');
const { createRepository } = require('./repositories');
const { systemRoutes } = require('./routes/systemRoutes');
const { authRoutes } = require('./routes/authRoutes');
const { catalogRoutes } = require('./routes/catalogRoutes');
const { searchRoutes } = require('./routes/searchRoutes');
const { inventoryRoutes } = require('./routes/inventoryRoutes');
const { userRoutes } = require('./routes/userRoutes');
const { orderRoutes } = require('./routes/orderRoutes');
const { paymentRoutes } = require('./routes/paymentRoutes');
const { sellerRoutes } = require('./routes/sellerRoutes');
const { cartRoutes } = require('./routes/cartRoutes');
const { reviewRoutes } = require('./routes/reviewRoutes');
const { shippingRoutes } = require('./routes/shippingRoutes');
const { loyaltyRoutes } = require('./routes/loyaltyRoutes');
const { recommendationRoutes } = require('./routes/recommendationRoutes');
const { pricingRoutes } = require('./routes/pricingRoutes');
const { fraudRoutes } = require('./routes/fraudRoutes');
const { assistantRoutes } = require('./routes/assistantRoutes');
const { contentRoutes } = require('./routes/contentRoutes');
const { futureRoutes } = require('./routes/futureRoutes');
const { referenceRoutes } = require('./routes/referenceRoutes');
const { gatewayRoutes } = require('./routes/gatewayRoutes');
const { realtimeRoutes } = require('./routes/realtimeRoutes');
const { notificationRoutes } = require('./routes/notificationRoutes');
const { liveRoutes } = require('./routes/liveRoutes');
const { analyticsRoutes } = require('./routes/analyticsRoutes');
const { customerIntelligenceRoutes } = require('./routes/customerIntelligenceRoutes');
const { logisticsRoutes } = require('./routes/logisticsRoutes');
const { integrationRoutes } = require('./routes/integrationRoutes');
const { eventRoutes } = require('./routes/eventRoutes');
const { verifyDevJwt } = require('./utils/devToken');
const { createEventBus } = require('./services/eventBus');

async function buildApp(overrides = {}) {
  const app = fastify({
    logger: false,
  });

  const runtimeConfig = {
    ...config,
    ...(overrides.config || {}),
  };
  const repositories = overrides.repositories || createRepository(runtimeConfig);

  app.decorate('runtimeConfig', runtimeConfig);
  app.decorate('repositories', repositories);
  app.decorate('metricsState', {
    startedAt: Date.now(),
    requestCount: 0,
    errorCount: 0,
    totalLatencyMs: 0,
  });
  app.decorate('idempotencyStore', new Map());
  app.decorate('rateLimitStore', new Map());
  app.decorate('responseCache', new Map());
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
  app.decorate('authorizeUserId', async (request, userId, allowedRoles = ['admin']) => {
    const user = await app.requireAuth(request);
    const normalizedRole = user.role === 'customer' ? 'user' : user.role;
    if (String(user.sub) !== String(userId) && !allowedRoles.includes(normalizedRole)) {
      const error = new Error('You are not allowed to access this resource');
      error.statusCode = 403;
      throw error;
    }

    return {
      ...user,
      role: normalizedRole,
    };
  });

  app.addHook('onRequest', async (request, reply) => {
    const requestId = request.headers['x-request-id'] || randomUUID();
    request.requestId = requestId;
    request.startedAtNs = process.hrtime.bigint();
    reply.header('x-request-id', requestId);
    reply.header('x-api-version', 'v1');

    const origin = request.headers.origin;
    const allowedOrigins = new Set([
      'https://zenvy.com',
      'https://app.zenvy.com',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ]);
    if (origin && allowedOrigins.has(origin)) {
      reply.header('access-control-allow-origin', origin);
    }
    reply.header('access-control-allow-methods', 'GET,POST,PUT,DELETE,OPTIONS');
    reply.header('access-control-allow-headers', 'Content-Type, Authorization, X-Request-Id, X-Idempotency-Key');
    reply.header('vary', 'Origin');
    reply.header('x-content-type-options', 'nosniff');
    reply.header('x-frame-options', 'DENY');
    reply.header('referrer-policy', 'same-origin');
    reply.header('permissions-policy', 'geolocation=(), microphone=(), camera=()');
    reply.header('cache-control', 'no-store');

    if (request.method === 'OPTIONS') {
      reply.code(204).send();
      return reply;
    }

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

  app.addHook('preHandler', async (request, reply) => {
    const userKey = request.authUser && request.authUser.sub
      ? `user:${request.authUser.sub}`
      : `ip:${request.ip}`;
    const routeRateLimit = request.routeOptions && request.routeOptions.config && request.routeOptions.config.rateLimit
      ? request.routeOptions.config.rateLimit
      : {};
    const windowMs = Number(routeRateLimit.windowMs || runtimeConfig.rateLimitWindowMs || (60 * 1000));
    const maxRequests = Number(routeRateLimit.maxRequests || runtimeConfig.rateLimitMaxRequests || 300);
    const rateKeySuffix = request.routeOptions && request.routeOptions.url ? request.routeOptions.url : request.url;
    const rateEntry = app.rateLimitStore.get(`${userKey}:${rateKeySuffix}`);
    const now = Date.now();
    if (!rateEntry || rateEntry.resetAt <= now) {
      app.rateLimitStore.set(`${userKey}:${rateKeySuffix}`, {
        count: 1,
        resetAt: now + windowMs,
      });
    } else {
      rateEntry.count += 1;
      if (rateEntry.count > maxRequests) {
        reply.code(429).send({
          statusCode: 429,
          error: 'Too Many Requests',
          message: 'Rate limit exceeded',
        });
        return;
      }
    }

    if (request.method === 'GET') {
      const cacheablePrefixes = ['/api/v1/catalog', '/api/v1/search', '/api/v1/reference', '/api/v1/sellers'];
      const shouldCheckCache = cacheablePrefixes.some((prefix) => request.url.startsWith(prefix));
      if (shouldCheckCache) {
        const cached = app.responseCache.get(request.url);
        if (cached && cached.expiresAt > now) {
          request.cacheHit = true;
          reply.header('x-cache', 'hit');
          reply.type(cached.contentType);
          reply.send(cached.payload);
          return;
        }
      }
    }

    const idempotencyKey = request.headers['x-idempotency-key'];
    if (!idempotencyKey || request.method !== 'POST') {
      return;
    }

    const cacheKey = `${request.method}:${request.url}:${idempotencyKey}`;
    request.idempotencyCacheKey = cacheKey;
    const cached = app.idempotencyStore.get(cacheKey);
    if (!cached) {
      return;
    }

    reply.code(cached.statusCode);
    reply.header('x-idempotency-replayed', 'true');
    for (const [headerName, headerValue] of Object.entries(cached.headers || {})) {
      reply.header(headerName, headerValue);
    }
    reply.send(cached.payload);
  });

  app.addHook('onResponse', async (request, reply) => {
    const elapsedNs = process.hrtime.bigint() - request.startedAtNs;
    const elapsedMs = Number(elapsedNs) / 1e6;

    app.metricsState.requestCount += 1;
    app.metricsState.totalLatencyMs += elapsedMs;
    if (reply.statusCode >= 400) {
      app.metricsState.errorCount += 1;
    }
  });

  app.addHook('onSend', async (request, reply, payload) => {
    if (request.method === 'GET' && reply.statusCode === 200 && !request.cacheHit) {
      const cacheablePrefixes = ['/api/v1/catalog', '/api/v1/search', '/api/v1/reference', '/api/v1/sellers'];
      const shouldCache = cacheablePrefixes.some((prefix) => request.url.startsWith(prefix));
      if (shouldCache) {
        const normalizedPayload = typeof payload === 'string' ? payload : Buffer.isBuffer(payload) ? payload.toString('utf8') : JSON.stringify(payload);
        app.responseCache.set(request.url, {
          payload: normalizedPayload,
          contentType: reply.getHeader('content-type') || 'application/json; charset=utf-8',
          expiresAt: Date.now() + (60 * 1000),
        });
        reply.header('x-cache', 'miss');
      }
    }

    if (!request.idempotencyCacheKey || reply.statusCode >= 500) {
      return payload;
    }

    const normalizedPayload = typeof payload === 'string' ? payload : Buffer.isBuffer(payload) ? payload.toString('utf8') : JSON.stringify(payload);
    app.idempotencyStore.set(request.idempotencyCacheKey, {
      statusCode: reply.statusCode,
      headers: {
        'content-type': reply.getHeader('content-type') || 'application/json; charset=utf-8',
      },
      payload: normalizedPayload,
    });

    return payload;
  });

  app.setErrorHandler((error, request, reply) => {
    if (request.log && typeof request.log.error === 'function') {
      request.log.error(error);
    }
    reply.status(error.statusCode || 500).send({
      statusCode: error.statusCode || 500,
      error: error.name || 'Error',
      message: error.message || 'Internal Server Error',
    });
  });

  app.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      statusCode: 404,
      error: 'Not Found',
      message: `Route ${request.method} ${request.url} not found`,
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
        description: 'Backend starter for ZENVY e-commerce with catalog, inventory, orders, payments, users, search, and development auth.',
      },
      servers: [
        {
          url: `http://localhost:${runtimeConfig.port}`,
          description: 'Local development',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
  });

  await app.register(systemRoutes);
  await app.register(authRoutes);
  await app.register(catalogRoutes);
  await app.register(searchRoutes);
  await app.register(inventoryRoutes);
  await app.register(userRoutes);
  await app.register(orderRoutes);
  await app.register(paymentRoutes);
  await app.register(sellerRoutes);
  await app.register(cartRoutes);
  await app.register(reviewRoutes);
  await app.register(shippingRoutes);
  await app.register(loyaltyRoutes);
  await app.register(recommendationRoutes);
  await app.register(pricingRoutes);
  await app.register(fraudRoutes);
  await app.register(assistantRoutes);
  await app.register(contentRoutes);
  await app.register(futureRoutes);
  await app.register(referenceRoutes);
  await app.register(gatewayRoutes);
  await app.register(realtimeRoutes);
  await app.register(notificationRoutes);
  await app.register(liveRoutes);
  await app.register(analyticsRoutes);
  await app.register(customerIntelligenceRoutes);
  await app.register(logisticsRoutes);
  await app.register(integrationRoutes);
  await app.register(eventRoutes);

  const socialRouteDefinitions = await require('./routes/socialRoutes').socialRoutes(app);
  for (const route of socialRouteDefinitions) {
    app.route({
      method: route.method,
      url: route.url,
      schema: route.schema,
      handler: route.handler,
    });
  }

  app.addHook('onClose', async () => {
    await repositories.close();
  });

  return app;
}

module.exports = { buildApp };
