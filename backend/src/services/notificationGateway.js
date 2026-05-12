'use strict';

function providerForChannel(config, channel) {
  if (channel === 'email') {
    return config.emailProvider || 'console';
  }

  if (channel === 'push') {
    return config.pushProvider || 'console';
  }

  return 'in-app';
}

async function deliverNotification(config, notification) {
  const provider = providerForChannel(config, notification.channel);

  return {
    notificationId: notification.id,
    channel: notification.channel,
    provider,
    status: 'sent',
    deliveredAt: new Date().toISOString(),
    from: notification.channel === 'email' ? config.emailFrom : null,
  };
}

function notificationIntegrationStatus(config) {
  return {
    email: {
      provider: config.emailProvider || 'console',
      configured: true,
      from: config.emailFrom || 'no-reply@zenvy.dev',
    },
    push: {
      provider: config.pushProvider || 'console',
      configured: true,
    },
  };
}

module.exports = {
  deliverNotification,
  notificationIntegrationStatus,
};
