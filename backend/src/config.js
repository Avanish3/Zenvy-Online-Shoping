'use strict';

const fs = require('node:fs');
const path = require('node:path');

function loadEnvFile() {
  const envPath = path.resolve(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    return;
  }

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^['"]|['"]$/g, '');

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile();

const config = {
  appName: 'ZENVY Backend API',
  appVersion: '1.0.0',
  host: process.env.HOST || '0.0.0.0',
  port: Number(process.env.PORT || 8080),
  jwtDevSecret: process.env.JWT_DEV_SECRET || 'zenvy-dev-secret',
  jwtIssuer: process.env.JWT_ISSUER || 'zenvy-backend',
  jwtAudience: process.env.JWT_AUDIENCE || 'zenvy-clients',
  accessTokenTtlSeconds: Number(process.env.ACCESS_TOKEN_TTL_SECONDS || 3600),
  refreshTokenTtlSeconds: Number(process.env.REFRESH_TOKEN_TTL_SECONDS || (60 * 60 * 24 * 30)),
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60000),
  rateLimitMaxRequests: Number(process.env.RATE_LIMIT_MAX_REQUESTS || 300),
  authRateLimitMaxRequests: Number(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || 20),
  databaseUrl: process.env.DATABASE_URL || '',
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || '',
  razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  llmProvider: process.env.LLM_PROVIDER || 'local',
  openAiApiKey: process.env.OPENAI_API_KEY || '',
  openAiBaseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  openAiModel: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
  pythonAiServiceUrl: process.env.PYTHON_AI_SERVICE_URL || '',
  shippingProvider: process.env.SHIPPING_PROVIDER || 'internal',
  shiprocketToken: process.env.SHIPROCKET_TOKEN || '',
  easypostApiKey: process.env.EASYPOST_API_KEY || '',
  emailProvider: process.env.EMAIL_PROVIDER || 'console',
  emailFrom: process.env.EMAIL_FROM || 'no-reply@zenvy.dev',
  pushProvider: process.env.PUSH_PROVIDER || 'console',
  eventBusDriver: process.env.EVENT_BUS_DRIVER || 'memory',
  kafkaBrokers: process.env.KAFKA_BROKERS || '',
  rabbitMqUrl: process.env.RABBITMQ_URL || '',
  vectorSearchUrl: process.env.VECTOR_SEARCH_URL || '',
};

config.storageDriver = process.env.STORAGE_DRIVER || (config.databaseUrl ? 'postgres' : 'memory');

module.exports = { config };
