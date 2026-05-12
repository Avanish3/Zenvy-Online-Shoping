# ZENVY Backend

ZENVY is set up here as a production-ready backend foundation for your e-commerce platform. This repository now covers the nine major sections from the backend Codex document in a runnable Node/Fastify implementation plus infrastructure and observability artifacts.

## Stack

- Node.js 20 + Fastify for the API layer
- Swagger / OpenAPI 3 via `@fastify/swagger` and `@fastify/swagger-ui`
- PostgreSQL-ready repositories via `pg`
- In-memory fallback so the backend runs cleanly even before infrastructure is provisioned
- Docker Compose for local PostgreSQL and Redis bootstrapping
- Provider-capable adapters for OpenAI, Shiprocket, EasyPost, Kafka, and RabbitMQ configuration
- Split service entrypoints under [`services`](./services)
- Python FastAPI AI runtime under [`services/ai-ml`](./services/ai-ml)
- Basic platform telemetry via `/health`, `/ready`, and `/metrics`
- AI-oriented APIs for recommendation, pricing, fraud, assistant, content, and future-feature simulation

## Why this implementation

The current workspace only has Node.js installed, so this backend is built in Node to keep it runnable and testable immediately. The architecture maps the document into:

- API gateway-facing HTTP backend
- JWT-ready auth entrypoint
- catalog, inventory, orders, payments, users, search, sellers, carts, reviews, shipping, and loyalty domains
- advanced search, recommendations, pricing, fraud, assistant, product-copy generation, multimodal search, emotion-state evaluation, and auto-reorder preview APIs
- resilience and observability config artifacts for Patroni, PgBouncer, Kubernetes, ArgoCD, OpenTelemetry, Prometheus, and Alertmanager
- PostgreSQL schema for OLTP workloads
- Redis placeholder in local infra for cache/session expansion
- clear seams for Kafka, CQRS, AI services, and future service extraction

## Run

```bash
npm install
npm test
npm start
```

Swagger UI is available at `http://localhost:8080/docs`.

Additional service entrypoints:

```bash
npm run start:gateway
npm run start:auth
npm run start:orders
npm run start:payments
npm run start:logistics
npm run start:ai
```

## Storage modes

- `memory`: default, requires no database
- `postgres`: enabled automatically when `DATABASE_URL` is set, or explicitly with `STORAGE_DRIVER=postgres`

## Status endpoints

- `GET /` returns `{ "status": "ok", "message": "Server running", ... }`
- `GET /health` reports service + storage health
- `GET /ready` reports readiness for probes/load balancers
- `GET /metrics` exposes basic Prometheus-style counters

## Database bootstrap

Start infrastructure:

```bash
docker compose up -d
```

The PostgreSQL container loads [`db/init.sql`](./db/init.sql) automatically.

Optional external integration env vars:

```bash
LLM_PROVIDER=local
OPENAI_API_KEY=
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4.1-mini
PYTHON_AI_SERVICE_URL=
SHIPPING_PROVIDER=internal
SHIPROCKET_TOKEN=
EASYPOST_API_KEY=
EVENT_BUS_DRIVER=memory
KAFKA_BROKERS=
RABBITMQ_URL=
VECTOR_SEARCH_URL=
```

## Included API areas

- `GET /`
- `GET /ready`
- `GET /health`
- `GET /metrics`
- `GET /api/v1/architecture`
- `POST /api/v1/auth/token`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/catalog/products`
- `GET /api/v1/catalog/products/:id`
- `GET /api/v1/catalog/products/:id/variants`
- `POST /api/v1/catalog/products/bulk`
- `POST /api/v1/catalog/products/:id/media`
- `GET /api/v1/search`
- `GET /api/v1/search/autocomplete`
- `GET /api/v1/search/similar/:id`
- `POST /api/v1/search/visual`
- `POST /api/v1/search/nlq`
- `GET /api/v1/inventory/:productId`
- `GET /api/v1/inventory/transactions/:productId`
- `POST /api/v1/inventory/:productId/reserve`
- `POST /api/v1/inventory/:productId/release`
- `POST /api/v1/inventory/:productId/deduct`
- `POST /api/v1/inventory/:productId/restock`
- `GET /api/v1/users/:id`
- `GET /api/v1/sellers`
- `GET /api/v1/sellers/:id`
- `GET /api/v1/carts/:userId`
- `PUT /api/v1/carts/:userId/items`
- `GET /api/v1/reviews/:productId`
- `POST /api/v1/reviews`
- `POST /api/v1/shipping/quotes`
- `POST /api/v1/shipping/shipments`
- `GET /api/v1/shipping/integrations`
- `GET /api/v1/loyalty/:userId`
- `POST /api/v1/orders`
- `GET /api/v1/orders`
- `GET /api/v1/orders/:id`
- `GET /api/v1/orders/user/:userId`
- `POST /api/v1/orders/:id/cancel`
- `POST /api/v1/orders/:id/return`
- `GET /api/v1/orders/:id/timeline`
- `POST /api/v1/orders/:id/status`
- `GET /api/v1/orders/:id/tracking`
- `POST /api/v1/payments/intents`
- `POST /api/v1/payments/:id/status`
- `POST /api/v1/payments/:id/refund`
- `POST /api/v1/recommend/homepage`
- `POST /api/v1/recommend/similar`
- `POST /api/v1/recommend/cart`
- `POST /api/v1/recommend/session`
- `POST /api/v1/recommend/email`
- `POST /api/v1/recommend/ml-runtime`
- `GET /api/v1/pricing/:variantId`
- `POST /api/v1/pricing/preview`
- `GET /api/v1/pricing/:variantId/history`
- `POST /api/v1/fraud/score`
- `POST /api/v1/fraud/report`
- `GET /api/v1/fraud/stats`
- `POST /api/v1/assistant/chat`
- `POST /api/v1/assistant/chat/stream`
- `POST /api/v1/assistant/budget-optimizer`
- `POST /api/v1/content/product-description`
- `POST /api/v1/behavior/events`
- `GET /api/v1/behavior/:userId`
- `GET /api/v1/notifications/:userId`
- `POST /api/v1/notifications`
- `POST /api/v1/notifications/:id/read`
- `GET /api/v1/live/events`
- `POST /api/v1/live/events`
- `GET /api/v1/analytics/overview`
- `GET /api/v1/analytics/sales`
- `GET /api/v1/analytics/customer-segments`
- `GET /api/v1/analytics/demand-forecast`
- `GET /api/v1/analytics/churn-risk`
- `GET /api/v1/logistics/warehouses`
- `POST /api/v1/logistics/allocation/preview`
- `POST /api/v1/logistics/routes/optimize`
- `GET /api/v1/logistics/shipments/:orderId`
- `GET /api/v1/social/moments`
- `POST /api/v1/future/auto-reorder/preview`
- `POST /api/v1/future/search/multimodal`
- `POST /api/v1/future/personalization/emotion`
- `GET /api/v1/reference/stack`
- `GET /api/v1/reference/resilience`
- `GET /api/v1/reference/observability`
- `GET /api/v1/reference/coverage`
- `GET /api/v1/gateway/routes`
- `GET /api/v1/gateway/services/:service`
- `GET /api/v1/integrations/status`
- `GET /api/v1/events/status`
- `GET /api/v1/events/outbox`
- `POST /api/v1/events/publish`
- `GET /api/v1/realtime/channels`
- `POST /api/v1/realtime/publish`

## Database coverage

The PostgreSQL bootstrap now seeds and supports:

- `users`
- `sellers`
- `products`
- `inventory`
- `carts`
- `cart_items`
- `reviews`
- `loyalty_accounts`
- `orders`
- `order_items`
- `payments`
- `notifications`
- `auth_sessions`
- `behavior_events`

## Infrastructure coverage

The repository also includes reference artifacts for the non-runtime sections:

- [`infra/postgres`](./infra/postgres): Patroni, HAProxy, and PgBouncer
- [`infra/k8s`](./infra/k8s): deployment, HPA, PDB, canary routing, zero-trust policy, ArgoCD
- [`observability`](./observability): OTEL collector, Prometheus rules, Alertmanager, Grafana seed
- [`Dockerfile`](./Dockerfile): container build
- [`Makefile`](./Makefile): local commands
- [`infra/helm`](./infra/helm): Helm chart seed
- [`services`](./services): split service entrypoints and Python AI runtime

## Gateway-style behavior

- `x-request-id` is attached on responses
- `x-api-version: v1` is attached on responses
- `x-idempotency-key` is supported on POST requests with replay detection via `x-idempotency-replayed: true`

## External-ready integrations

- OpenAI-compatible assistant adapter via `LLM_PROVIDER=openai`
- Python AI runtime endpoint support via `PYTHON_AI_SERVICE_URL`
- Shipping provider adapters for Shiprocket and EasyPost
- Event bus runtime status for memory, Kafka, or RabbitMQ driver selection
- Split Node service entrypoints plus standalone Python AI service
