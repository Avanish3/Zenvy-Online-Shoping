'use strict';

const serviceStackReference = [
  { service: 'API Gateway', language: 'Node.js 22 TS', primaryDb: 'Redis (sessions)', cache: 'Redis', queue: 'Kafka' },
  { service: 'Product Catalog', language: 'Go 1.22', primaryDb: 'MongoDB 7', cache: 'Redis', queue: 'Kafka' },
  { service: 'Inventory', language: 'Go 1.22', primaryDb: 'PostgreSQL 16', cache: 'Redis locks', queue: 'Kafka' },
  { service: 'Order Management', language: 'Go 1.22', primaryDb: 'PostgreSQL 16', cache: 'Redis', queue: 'Kafka + RabbitMQ' },
  { service: 'Payment Processing', language: 'Rust 1.78', primaryDb: 'PostgreSQL 16', cache: 'Redis', queue: 'Kafka (txn)' },
  { service: 'User Profiles', language: 'Go 1.22', primaryDb: 'PostgreSQL 16', cache: 'Redis', queue: 'Kafka' },
  { service: 'Search & Discovery', language: 'Go 1.22', primaryDb: 'Elasticsearch 8', cache: 'Redis', queue: 'Kafka' },
  { service: 'Cart & Wishlist', language: 'Go 1.22', primaryDb: 'Redis + PostgreSQL', cache: 'Redis', queue: 'Kafka' },
  { service: 'Recommendation AI', language: 'Python 3.12', primaryDb: 'Weaviate + ClickHouse', cache: 'Redis features', queue: 'Kafka' },
  { service: 'Dynamic Pricing', language: 'Go + Rust', primaryDb: 'ClickHouse + PG', cache: 'Redis', queue: 'NATS' },
  { service: 'Fraud Detection', language: 'Python + Rust', primaryDb: 'ClickHouse', cache: 'Redis bloom', queue: 'Kafka' },
  { service: 'LLM Shopping Agent', language: 'Python 3.12', primaryDb: 'Redis (history)', cache: 'Redis', queue: 'Kafka' },
  { service: 'Notifications', language: 'Node.js 22', primaryDb: 'Cassandra 5', cache: 'Redis pub/sub', queue: 'Kafka' },
  { service: 'Seller Dashboard', language: 'Java 21', primaryDb: 'PostgreSQL 16', cache: 'Redis', queue: 'Kafka' },
  { service: 'Live Commerce', language: 'Node.js 22', primaryDb: 'Cassandra 5', cache: 'Redis', queue: 'Kafka' },
  { service: 'Analytics / BI', language: 'Python 3.12', primaryDb: 'ClickHouse', cache: 'Redis', queue: 'Kafka' },
  { service: 'Loyalty & Rewards', language: 'Go 1.22', primaryDb: 'PostgreSQL 16', cache: 'Redis', queue: 'Kafka' },
  { service: 'Reviews & Ratings', language: 'Go 1.22', primaryDb: 'PostgreSQL 16', cache: 'Redis', queue: 'Kafka' },
  { service: 'Shipping / Logistics', language: 'Go 1.22', primaryDb: 'PostgreSQL 16', cache: 'Redis', queue: 'Kafka' },
  { service: 'Social Commerce', language: 'Go 1.22', primaryDb: 'Neo4j + PostgreSQL', cache: 'Redis', queue: 'Kafka' },
];

const resilienceReference = {
  databaseHa: {
    postgres: 'Patroni + etcd + PgBouncer + WAL-G',
    globalSql: 'CockroachDB multi-region',
    rtoMinutes: 10,
    rpoMinutes: 5,
  },
  kubernetes: {
    namespace: 'zenvy-production',
    replicas: { min: 3, max: 10 },
    deployStyle: 'rolling update + canary via Istio',
    disruptionBudget: 'minAvailable=2',
  },
  zeroDowntimePatterns: [
    'circuit-breaker',
    'saga-compensation',
    'idempotency-key',
    'readiness-probes',
    'graceful-shutdown',
    'topology-spread',
  ],
};

const observabilityReference = {
  tracing: ['OpenTelemetry', 'Jaeger'],
  metrics: ['Prometheus', 'Grafana'],
  logs: ['ELK Stack'],
  alerting: ['AlertManager', 'PagerDuty', 'Slack'],
  dashboards: [
    'ZENVY Overview',
    'Service Health',
    'Database',
    'Kafka',
    'Business Funnel',
    'AI/ML Performance',
  ],
};

module.exports = {
  serviceStackReference,
  resilienceReference,
  observabilityReference,
};
