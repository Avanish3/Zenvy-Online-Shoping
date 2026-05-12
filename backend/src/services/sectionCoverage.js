'use strict';

const sectionCoverage = [
  {
    section: 1,
    title: 'Microservice Scaffolding',
    implemented: [
      'Fastify gateway',
      'JWT auth',
      'WebSocket channels',
      'idempotency',
      'rate limiting',
      'Docker and infra artifacts',
    ],
  },
  {
    section: 2,
    title: 'Core E-Commerce Services',
    implemented: [
      'catalog',
      'inventory mutations',
      'orders timeline',
      'cart',
      'users',
      'sellers',
      'reviews',
      'shipping',
      'loyalty',
    ],
  },
  {
    section: 3,
    title: 'Search & Discovery',
    implemented: [
      'keyword search',
      'autocomplete',
      'similar products',
      'visual-hinted search',
      'natural language query parsing',
    ],
  },
  {
    section: 4,
    title: 'AI / ML Platform',
    implemented: [
      'recommendations',
      'dynamic pricing preview',
      'fraud scoring',
      'analytics overview',
    ],
  },
  {
    section: 5,
    title: 'LLM & Generative AI Features',
    implemented: [
      'assistant chat',
      'assistant SSE stream',
      'product description generation',
    ],
  },
  {
    section: 6,
    title: 'Resilience & Zero-Downtime Patterns',
    implemented: [
      'Patroni/HAProxy/PgBouncer configs',
      'Kubernetes rollout artifacts',
      'readiness/liveness',
      'idempotency',
      'graceful server startup checks',
    ],
  },
  {
    section: 7,
    title: 'Observability & Monitoring',
    implemented: [
      'metrics endpoint',
      'OTEL collector config',
      'Prometheus rules',
      'Alertmanager config',
      'Grafana dashboard seed',
    ],
  },
  {
    section: 8,
    title: 'Next-Level & Future AI Features',
    implemented: [
      'auto reorder preview',
      'multimodal search preview',
      'emotion-aware personalization preview',
      'live commerce APIs',
      'social commerce APIs',
    ],
  },
  {
    section: 9,
    title: 'Complete Tech Stack Reference',
    implemented: [
      'stack reference API',
      'resilience reference API',
      'observability reference API',
      'coverage reference API',
    ],
  },
];

module.exports = { sectionCoverage };
