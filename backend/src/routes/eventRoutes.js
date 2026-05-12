'use strict';

async function eventRoutes(app) {
  app.get('/api/v1/events/status', {
    schema: {
      tags: ['Events'],
      summary: 'Event bus runtime status',
    },
  }, async () => {
    return app.eventBus.stats();
  });

  app.get('/api/v1/events/outbox', {
    schema: {
      tags: ['Events'],
      summary: 'Inspect recent domain events',
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 500 },
        },
      },
    },
  }, async (request) => {
    return app.eventBus.list(request.query.limit || 50);
  });

  app.post('/api/v1/events/publish', {
    schema: {
      tags: ['Events'],
      summary: 'Publish an integration or domain event',
      body: {
        type: 'object',
        required: ['topic', 'payload'],
        properties: {
          topic: { type: 'string' },
          payload: { type: 'object', additionalProperties: true },
          metadata: { type: 'object', additionalProperties: true },
        },
      },
    },
  }, async (request, reply) => {
    const event = app.eventBus.publish(
      request.body.topic,
      request.body.payload || {},
      request.body.metadata || {}
    );
    reply.code(202);
    return event;
  });
}

module.exports = { eventRoutes };
