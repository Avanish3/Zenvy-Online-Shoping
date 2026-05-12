'use strict';

const { randomUUID } = require('node:crypto');
const { deliverNotification } = require('../services/notificationGateway');

const notifications = [
  {
    id: 'notif_demo_1',
    userId: 'usr_demo_1',
    channel: 'push',
    title: 'Order update',
    message: 'Your Zenvy Nova X order is ready for payment.',
    status: 'unread',
    createdAt: new Date().toISOString(),
  },
];

async function notificationRoutes(app) {
  app.get('/api/v1/notifications/:userId', {
    schema: {
      tags: ['Notifications'],
      summary: 'List notifications for a user',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['userId'],
        properties: {
          userId: { type: 'string' },
        },
      },
    },
  }, async (request) => {
    await app.authorizeUserId(request, request.params.userId, ['admin', 'seller']);
    if (app.repositories.listNotificationsByUserId) {
      return app.repositories.listNotificationsByUserId(request.params.userId);
    }

    return notifications.filter((item) => item.userId === request.params.userId);
  });

  app.post('/api/v1/notifications', {
    schema: {
      tags: ['Notifications'],
      summary: 'Create a notification',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        additionalProperties: false,
        required: ['userId', 'title', 'message'],
        properties: {
          userId: { type: 'string' },
          channel: { type: 'string', enum: ['push', 'email', 'sms', 'in_app'] },
          title: { type: 'string' },
          message: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    await app.requireRole(request, ['admin', 'seller']);
    const notification = app.repositories.createNotification
      ? await app.repositories.createNotification(request.body)
      : {
        id: randomUUID(),
        userId: request.body.userId,
        channel: request.body.channel || 'in_app',
        title: request.body.title,
        message: request.body.message,
        status: 'unread',
        createdAt: new Date().toISOString(),
      };

    if (!app.repositories.createNotification) {
      notifications.unshift(notification);
    }
    const delivery = await deliverNotification(app.runtimeConfig, notification);
    if (app.eventBus) {
      app.eventBus.publish('notification.created', notification, {
        userId: notification.userId,
        channel: notification.channel,
      });
      app.eventBus.publish('notification.delivered', delivery, {
        userId: notification.userId,
        notificationId: notification.id,
      });
    }
    if (app.realtimeHub) {
      app.realtimeHub.broadcast('/ws/notifications', {
        type: 'event',
        event: 'notification.created',
        payload: notification,
      }, request.body.userId);
    }

    reply.code(201);
    return notification;
  });

  app.post('/api/v1/notifications/:id/read', {
    schema: {
      tags: ['Notifications'],
      summary: 'Mark a notification as read',
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
    await app.requireAuth(request);
    if (app.repositories.markNotificationRead) {
      return app.repositories.markNotificationRead(request.params.id);
    }

    const notification = notifications.find((item) => item.id === request.params.id);
    if (!notification) {
      const error = new Error('Notification not found');
      error.statusCode = 404;
      throw error;
    }

    notification.status = 'read';
    return notification;
  });
}

module.exports = { notificationRoutes };
