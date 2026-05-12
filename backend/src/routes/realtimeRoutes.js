'use strict';

async function realtimeRoutes(app) {
  app.get('/api/v1/realtime/channels', {
    schema: {
      tags: ['Realtime'],
      summary: 'List realtime channels',
    },
  }, async () => {
    return app.realtimeHub ? app.realtimeHub.stats() : {
      channels: ['/ws/orders', '/ws/prices', '/ws/notifications', '/ws/live'],
      connectedClients: 0,
    };
  });

  app.post('/api/v1/realtime/publish', {
    schema: {
      tags: ['Realtime'],
      summary: 'Publish a realtime event into a channel',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        additionalProperties: false,
        required: ['channel', 'event'],
        properties: {
          channel: { type: 'string' },
          room: { type: 'string' },
          event: { type: 'string' },
          payload: { type: 'object', additionalProperties: true },
        },
      },
    },
  }, async (request, reply) => {
    await app.requireRole(request, ['admin', 'seller']);
    const count = app.realtimeHub
      ? app.realtimeHub.broadcast(request.body.channel, {
          type: 'event',
          event: request.body.event,
          room: request.body.room || 'default',
          payload: request.body.payload || {},
        }, request.body.room)
      : 0;
    if (app.eventBus) {
      app.eventBus.publish('realtime.publish', request.body.payload || {}, {
        channel: request.body.channel,
        room: request.body.room || 'default',
        event: request.body.event,
      });
    }

    reply.code(202);
    return {
      accepted: true,
      deliveredTo: count,
    };
  });
}

module.exports = { realtimeRoutes };
