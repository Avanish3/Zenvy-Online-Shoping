'use strict';

const { generateAssistantResponse } = require('../services/llmGateway');

async function assistantRoutes(app) {
  app.post('/api/v1/assistant/chat', {
    schema: {
      tags: ['LLM Assistant'],
      summary: 'Conversational shopping assistant',
      body: {
        type: 'object',
        required: ['message'],
        properties: {
          userId: { type: 'string' },
          sessionId: { type: 'string' },
          message: { type: 'string', minLength: 1 },
        },
      },
    },
  }, async (request) => {
    return generateAssistantResponse(app.runtimeConfig, app.repositories, request.body);
  });

  app.post('/api/v1/assistant/chat/stream', {
    schema: {
      tags: ['LLM Assistant'],
      summary: 'Stream assistant response as SSE',
      body: {
        type: 'object',
        required: ['message'],
        properties: {
          message: { type: 'string', minLength: 1 },
          sessionId: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const response = await generateAssistantResponse(app.runtimeConfig, app.repositories, request.body);
    const text = response.message;

    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });

    const chunks = text.split(' ');
    for (let index = 0; index < chunks.length; index += 1) {
      reply.raw.write(`event: delta\n`);
      reply.raw.write(`data: ${JSON.stringify({ token: chunks[index], index })}\n\n`);
    }
    reply.raw.write(`event: done\n`);
    reply.raw.write(`data: ${JSON.stringify({ sessionId: response.sessionId || request.body.sessionId || 'demo-session', provider: response.provider })}\n\n`);
    reply.raw.end();
    return reply;
  });
}

module.exports = { assistantRoutes };
