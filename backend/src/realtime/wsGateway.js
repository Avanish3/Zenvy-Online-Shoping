'use strict';

const { WebSocketServer } = require('ws');
const { verifyDevJwt } = require('../utils/devToken');

const ALLOWED_PATHS = new Set([
  '/ws/orders',
  '/ws/prices',
  '/ws/notifications',
  '/ws/live',
]);

function attachWebSocketGateway(app) {
  const wss = new WebSocketServer({ noServer: true });
  const heartbeatIntervalMs = 30000;

  function sendJson(socket, payload) {
    if (socket.readyState === socket.OPEN) {
      socket.send(JSON.stringify(payload));
    }
  }

  function broadcast(channel, payload, room) {
    let delivered = 0;
    for (const socket of wss.clients) {
      if (socket.readyState !== socket.OPEN) {
        continue;
      }
      if (socket.channel !== channel) {
        continue;
      }
      if (room && socket.room !== room) {
        continue;
      }
      sendJson(socket, payload);
      delivered += 1;
    }
    return delivered;
  }

  function heartbeat() {
    for (const socket of wss.clients) {
      if (socket.isAlive === false) {
        socket.terminate();
        continue;
      }

      socket.isAlive = false;
      socket.ping();
    }
  }

  const interval = setInterval(heartbeat, heartbeatIntervalMs);
  app.realtimeHub = {
    broadcast,
    stats() {
      return {
        channels: Array.from(ALLOWED_PATHS),
        connectedClients: wss.clients.size,
      };
    },
  };

  wss.on('connection', (socket, request, meta) => {
    socket.isAlive = true;
    socket.channel = meta.channel;
    socket.room = meta.room || 'default';
    socket.authUser = meta.authUser || null;

    socket.on('pong', () => {
      socket.isAlive = true;
    });

    sendJson(socket, {
      type: 'connected',
      channel: socket.channel,
      room: socket.room,
      heartbeatIntervalMs,
      auth: socket.authUser ? {
        sub: socket.authUser.sub,
        role: socket.authUser.role,
      } : null,
    });

    socket.on('message', (buffer) => {
      let payload;
      try {
        payload = JSON.parse(buffer.toString('utf8'));
      } catch {
        sendJson(socket, {
          type: 'error',
          message: 'Invalid JSON payload.',
        });
        return;
      }

      if (payload.action === 'subscribe' && payload.room) {
        socket.room = payload.room;
        sendJson(socket, {
          type: 'subscribed',
          channel: socket.channel,
          room: socket.room,
        });
        return;
      }

      if (payload.type === 'ping') {
        sendJson(socket, {
          type: 'pong',
          channel: socket.channel,
          room: socket.room,
        });
        return;
      }

      sendJson(socket, {
        type: 'ack',
        channel: socket.channel,
        room: socket.room,
        received: payload,
      });
    });
  });

  app.server.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url, 'http://127.0.0.1');
    if (!ALLOWED_PATHS.has(url.pathname)) {
      socket.destroy();
      return;
    }

    let authUser = null;
    const token = url.searchParams.get('token');
    if (token) {
      try {
        authUser = verifyDevJwt(token, app.runtimeConfig.jwtDevSecret, {
          issuer: app.runtimeConfig.jwtIssuer,
          audience: app.runtimeConfig.jwtAudience,
        });
      } catch {
        socket.destroy();
        return;
      }
    }

    wss.handleUpgrade(request, socket, head, (client) => {
      wss.emit('connection', client, request, {
        channel: url.pathname,
        room: url.searchParams.get('room'),
        authUser,
      });
    });
  });

  app.addHook('onClose', async () => {
    clearInterval(interval);
    for (const socket of wss.clients) {
      socket.terminate();
    }
    wss.close();
  });
}

module.exports = { attachWebSocketGateway };
