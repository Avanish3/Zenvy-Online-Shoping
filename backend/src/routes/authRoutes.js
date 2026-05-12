'use strict';

const { createDevJwt, createOpaqueToken, hashOpaqueToken } = require('../utils/devToken');

async function authRoutes(app) {
  function buildAccessToken(user) {
    return createDevJwt(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
      },
      app.runtimeConfig.jwtDevSecret,
      {
        issuer: app.runtimeConfig.jwtIssuer,
        audience: app.runtimeConfig.jwtAudience,
        expiresIn: app.runtimeConfig.accessTokenTtlSeconds,
      }
    );
  }

  async function issueSessionTokens(user, request) {
    const accessToken = buildAccessToken(user);
    const refreshToken = createOpaqueToken();
    const refreshExpiresIn = app.runtimeConfig.refreshTokenTtlSeconds;
    const expiresAt = new Date(Date.now() + (refreshExpiresIn * 1000)).toISOString();
    const session = app.repositories.createAuthSession
      ? await app.repositories.createAuthSession({
        userId: user.id,
        refreshTokenHash: hashOpaqueToken(refreshToken),
        expiresAt,
        userAgent: request.headers['user-agent'] || 'unknown',
        ipAddress: request.ip,
      })
      : { id: `session_${user.id}` };

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: app.runtimeConfig.accessTokenTtlSeconds,
      refreshExpiresIn,
      sessionId: session.id,
      user,
    };
  }

  async function findUserByIdOrCreateDemo(userId) {
    try {
      return await app.repositories.getUserById(userId);
    } catch (error) {
      if (userId !== 'usr_demo_1' || !app.repositories.createUser) {
        throw error;
      }

      try {
        return await app.repositories.createUser({
          id: 'usr_demo_1',
          name: 'Aarav Mehta',
          email: 'aarav@zenvy.dev',
          role: 'user',
          password: 'Password@123',
        });
      } catch {
        return await app.repositories.getUserById(userId);
      }
    }
  }

  app.post('/api/v1/auth/register', {
    config: {
      rateLimit: {
        maxRequests: app.runtimeConfig.authRateLimitMaxRequests,
      },
    },
    schema: {
      tags: ['Auth'],
      summary: 'Register a new user account',
      body: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', minLength: 2, maxLength: 120 },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8, maxLength: 128 },
          role: { type: 'string', enum: ['user', 'seller'] },
        },
      },
    },
  }, async (request, reply) => {
    const user = await app.repositories.createUser({
      ...request.body,
      role: request.body.role || 'user',
    });
    const session = await issueSessionTokens(user, request);
    reply.code(201);
    return session;
  });

  app.post('/api/v1/auth/login', {
    config: {
      rateLimit: {
        maxRequests: app.runtimeConfig.authRateLimitMaxRequests,
      },
    },
    schema: {
      tags: ['Auth'],
      summary: 'Authenticate with email and password',
      body: {
        type: 'object',
        additionalProperties: false,
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8, maxLength: 128 },
        },
      },
    },
  }, async (request) => {
    const user = await app.repositories.verifyUserCredentials(request.body);
    return issueSessionTokens(user, request);
  });

  app.post('/api/v1/auth/token', {
    config: {
      rateLimit: {
        maxRequests: app.runtimeConfig.authRateLimitMaxRequests,
      },
    },
    schema: {
      tags: ['Auth'],
      summary: 'Issue an access token plus refresh token',
      description: 'Development bootstrap flow that exchanges a known user ID for a JWT and refresh token.',
      body: {
        type: 'object',
        additionalProperties: false,
        required: ['userId'],
        properties: {
          userId: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
            tokenType: { type: 'string' },
            expiresIn: { type: 'integer' },
            refreshExpiresIn: { type: 'integer' },
            sessionId: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                email: { type: 'string' },
                role: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, async (request) => {
    const user = await findUserByIdOrCreateDemo(request.body.userId);
    return issueSessionTokens(user, request);
  });

  app.post('/api/v1/auth/refresh', {
    config: {
      rateLimit: {
        maxRequests: app.runtimeConfig.authRateLimitMaxRequests,
      },
    },
    schema: {
      tags: ['Auth'],
      summary: 'Rotate refresh token and issue a new access token',
      body: {
        type: 'object',
        additionalProperties: false,
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string', minLength: 20 },
        },
      },
    },
  }, async (request) => {
    if (!app.repositories.rotateAuthSession) {
      const error = new Error('Refresh token rotation is not configured');
      error.statusCode = 501;
      throw error;
    }

    const nextRefreshToken = createOpaqueToken();
    const refreshExpiresIn = app.runtimeConfig.refreshTokenTtlSeconds;
    const session = await app.repositories.rotateAuthSession({
      refreshTokenHash: hashOpaqueToken(request.body.refreshToken),
      nextRefreshTokenHash: hashOpaqueToken(nextRefreshToken),
      expiresAt: new Date(Date.now() + (refreshExpiresIn * 1000)).toISOString(),
    });
    const user = await app.repositories.getUserById(session.userId);

    return {
      accessToken: buildAccessToken(user),
      refreshToken: nextRefreshToken,
      tokenType: 'Bearer',
      expiresIn: app.runtimeConfig.accessTokenTtlSeconds,
      refreshExpiresIn,
      user,
    };
  });

  app.post('/api/v1/auth/logout', {
    schema: {
      tags: ['Auth'],
      summary: 'Revoke a refresh token session',
      body: {
        type: 'object',
        additionalProperties: false,
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string', minLength: 20 },
        },
      },
    },
  }, async (request) => {
    if (app.repositories.revokeAuthSession) {
      await app.repositories.revokeAuthSession(hashOpaqueToken(request.body.refreshToken));
    }

    return {
      status: 'ok',
      revoked: true,
    };
  });

  app.get('/api/v1/auth/me', {
    schema: {
      tags: ['Auth'],
      summary: 'Return the authenticated user context',
      security: [{ bearerAuth: [] }],
    },
  }, async (request) => {
    const authUser = await app.requireAuth(request);
    const user = await app.repositories.getUserById(authUser.sub);
    return {
      user,
      session: {
        sub: authUser.sub,
        role: authUser.role,
        exp: authUser.exp,
      },
    };
  });
}

module.exports = { authRoutes };
