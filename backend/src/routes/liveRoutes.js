'use strict';

const { randomUUID } = require('node:crypto');

const liveEvents = [
  {
    id: 'live_demo_1',
    streamId: 'stream_tech_1',
    title: 'Nova X live launch',
    host: 'Naina Kapoor',
    status: 'scheduled',
    createdAt: new Date().toISOString(),
  },
];

async function liveRoutes(app) {
  app.get('/api/v1/live/events', {
    schema: {
      tags: ['Live Commerce'],
      summary: 'List live commerce events',
    },
  }, async () => {
    return liveEvents;
  });

  app.post('/api/v1/live/events', {
    schema: {
      tags: ['Live Commerce'],
      summary: 'Create a live commerce event',
      body: {
        type: 'object',
        required: ['title', 'host'],
        properties: {
          title: { type: 'string' },
          host: { type: 'string' },
          status: { type: 'string', enum: ['scheduled', 'live', 'ended'] },
        },
      },
    },
  }, async (request, reply) => {
    const event = {
      id: randomUUID(),
      streamId: `stream_${randomUUID().slice(0, 8)}`,
      title: request.body.title,
      host: request.body.host,
      status: request.body.status || 'scheduled',
      createdAt: new Date().toISOString(),
    };

    liveEvents.unshift(event);
    if (app.realtimeHub) {
      app.realtimeHub.broadcast('/ws/live', {
        type: 'event',
        event: 'live.created',
        payload: event,
      });
    }

    reply.code(201);
    return event;
  });
}

module.exports = { liveRoutes };
