'use strict';

const { randomUUID } = require('node:crypto');

function createEventBus(config) {
  const events = [];

  function getTransportStatus() {
    if (config.eventBusDriver === 'kafka') {
      return {
        driver: 'kafka',
        configured: Boolean(config.kafkaBrokers),
        target: config.kafkaBrokers || null,
      };
    }

    if (config.eventBusDriver === 'rabbitmq') {
      return {
        driver: 'rabbitmq',
        configured: Boolean(config.rabbitMqUrl),
        target: config.rabbitMqUrl || null,
      };
    }

    return {
      driver: 'memory',
      configured: true,
      target: 'in-process',
    };
  }

  return {
    publish(topic, payload, metadata = {}) {
      const event = {
        id: randomUUID(),
        topic,
        payload,
        metadata,
        transport: getTransportStatus(),
        createdAt: new Date().toISOString(),
      };

      events.unshift(event);
      if (events.length > 500) {
        events.length = 500;
      }

      return event;
    },

    list(limit = 100) {
      return events.slice(0, Math.max(1, Math.min(500, Number(limit) || 100)));
    },

    stats() {
      const transport = getTransportStatus();
      return {
        driver: transport.driver,
        configured: transport.configured,
        pendingEvents: events.length,
        target: transport.target,
      };
    },
  };
}

module.exports = { createEventBus };
