'use strict';

const serviceMap = [
  { service: 'gateway', prefix: '/api/v1/gateway', mode: 'edge-route', protocol: 'http' },
  { service: 'auth', prefix: '/api/v1/auth', mode: 'local-route', protocol: 'http' },
  { service: 'catalog', prefix: '/api/v1/catalog', mode: 'local-route', protocol: 'http' },
  { service: 'search', prefix: '/api/v1/search', mode: 'local-route', protocol: 'http' },
  { service: 'inventory', prefix: '/api/v1/inventory', mode: 'local-route', protocol: 'http' },
  { service: 'orders', prefix: '/api/v1/orders', mode: 'local-route', protocol: 'http' },
  { service: 'payments', prefix: '/api/v1/payments', mode: 'local-route', protocol: 'http' },
  { service: 'assistant', prefix: '/api/v1/assistant', mode: 'provider-adapter', protocol: 'http+sse' },
  { service: 'analytics', prefix: '/api/v1/analytics', mode: 'local-route', protocol: 'http' },
  { service: 'logistics', prefix: '/api/v1/logistics', mode: 'provider-adapter', protocol: 'http' },
  { service: 'shipping', prefix: '/api/v1/shipping', mode: 'provider-adapter', protocol: 'http' },
  { service: 'events', prefix: '/api/v1/events', mode: 'event-gateway', protocol: 'http' },
  { service: 'ai-runtime', prefix: '/api/v1/integrations/ai', mode: 'external-runtime', protocol: 'http' },
  { service: 'realtime', prefix: '/ws', mode: 'websocket-hub', protocol: 'ws' },
];

async function gatewayRoutes(app) {
  app.get('/api/v1/gateway/routes', {
    schema: {
      tags: ['Gateway'],
      summary: 'Gateway route registry',
    },
  }, async () => {
    return serviceMap;
  });

  app.get('/api/v1/gateway/services/:service', {
    schema: {
      tags: ['Gateway'],
      summary: 'Gateway service discovery detail',
      params: {
        type: 'object',
        required: ['service'],
        properties: {
          service: { type: 'string' },
        },
      },
    },
  }, async (request) => {
    const service = serviceMap.find((entry) => entry.service === request.params.service);
    if (!service) {
      const error = new Error('Service not found');
      error.statusCode = 404;
      throw error;
    }

    return {
      ...service,
      upstream: ['assistant', 'shipping', 'ai-runtime'].includes(service.service) ? 'provider-capable' : 'in-process',
      authForwarding: true,
      requestDeduplication: true,
      responseCaching: service.protocol === 'http',
    };
  });
}

module.exports = { gatewayRoutes };
