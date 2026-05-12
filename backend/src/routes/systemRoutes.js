'use strict';

async function systemRoutes(app) {
  app.get('/', {
    schema: {
      tags: ['System'],
      summary: 'Root entrypoint',
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            message: { type: 'string' },
            service: { type: 'string' },
            version: { type: 'string' },
            docsUrl: { type: 'string' },
            healthUrl: { type: 'string' },
            timestamp: { type: 'string' },
          },
        },
      },
    },
  }, async () => {
    return {
      status: 'ok',
      message: 'Server running',
      service: app.runtimeConfig.appName,
      version: app.runtimeConfig.appVersion,
      docsUrl: '/docs',
      healthUrl: '/health',
      timestamp: new Date().toISOString(),
    };
  });

  app.get('/ready', {
    schema: {
      tags: ['System'],
      summary: 'Readiness probe',
    },
  }, async () => {
    const storage = await app.repositories.healthCheck();

    return {
      status: 'ok',
      ready: true,
      service: app.runtimeConfig.appName,
      storage,
      timestamp: new Date().toISOString(),
    };
  });

  app.get('/health', {
    schema: {
      tags: ['System'],
      summary: 'Service health',
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            service: { type: 'string' },
            version: { type: 'string' },
            storage: {
              type: 'object',
              properties: {
                driver: { type: 'string' },
                database: { type: 'string' },
                status: { type: 'string' },
              },
            },
            timestamp: { type: 'string' },
          },
        },
      },
    },
  }, async () => {
    const storage = await app.repositories.healthCheck();

    return {
      status: 'ok',
      service: app.runtimeConfig.appName,
      version: app.runtimeConfig.appVersion,
      storage,
      timestamp: new Date().toISOString(),
    };
  });

  app.get('/api/v1/architecture', {
    schema: {
      tags: ['System'],
      summary: 'Architecture overview',
    },
  }, async () => {
    return {
      backendStyle: 'modular-monolith-ready-for-microservice-extraction',
      deployableDomains: [
        'auth',
        'catalog',
        'inventory',
        'orders',
        'payments',
        'users',
        'search',
        'sellers',
        'carts',
        'reviews',
        'shipping',
        'loyalty',
      ],
      plannedPlatformCapabilities: [
        'api-gateway',
        'redis-cache',
        'kafka-event-bus',
        'observability',
        'ai-ml-services',
        'fraud-detection',
        'loyalty',
        'social-commerce',
      ],
      currentStorage: app.repositories.driver,
    };
  });

  app.get('/metrics', {
    schema: {
      tags: ['System'],
      summary: 'Basic Prometheus-style metrics',
      hide: true,
    },
  }, async (request, reply) => {
    const metrics = app.metricsState;
    const uptimeSeconds = Math.max(0, Math.floor((Date.now() - metrics.startedAt) / 1000));
    const latencyAverage = metrics.requestCount === 0
      ? 0
      : Number((metrics.totalLatencyMs / metrics.requestCount).toFixed(2));

    reply.header('content-type', 'text/plain; version=0.0.4');
    return [
      '# HELP zenvy_requests_total Total HTTP requests processed',
      '# TYPE zenvy_requests_total counter',
      `zenvy_requests_total ${metrics.requestCount}`,
      '# HELP zenvy_errors_total Total HTTP responses with status >= 400',
      '# TYPE zenvy_errors_total counter',
      `zenvy_errors_total ${metrics.errorCount}`,
      '# HELP zenvy_request_latency_avg_ms Average request latency in milliseconds',
      '# TYPE zenvy_request_latency_avg_ms gauge',
      `zenvy_request_latency_avg_ms ${latencyAverage}`,
      '# HELP zenvy_uptime_seconds Process uptime in seconds',
      '# TYPE zenvy_uptime_seconds gauge',
      `zenvy_uptime_seconds ${uptimeSeconds}`,
    ].join('\n');
  });
}

module.exports = { systemRoutes };
