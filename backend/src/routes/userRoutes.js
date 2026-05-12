'use strict';

async function userRoutes(app) {
  app.get('/api/v1/users/:id', {
    schema: {
      tags: ['Users'],
      summary: 'Get user profile',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
    },
  }, async (request) => {
    await app.authorizeUserId(request, request.params.id, ['admin']);
    return app.repositories.getUserById(request.params.id);
  });
}

module.exports = { userRoutes };
