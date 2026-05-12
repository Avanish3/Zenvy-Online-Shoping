'use strict';

const assert = require('node:assert/strict');
const { once } = require('node:events');
const { WebSocket } = require('ws');
const { buildApp } = require('../src/app');
const { attachWebSocketGateway } = require('../src/realtime/wsGateway');
const { createDevJwt } = require('../src/utils/devToken');
const { buildRazorpayClientSignature } = require('../src/services/paymentGateway');

function createTestToken(payload) {
  return createDevJwt(payload, 'zenvy-dev-secret', {
    issuer: 'zenvy-backend',
    audience: 'zenvy-clients',
  });
}

function userToken() {
  return createTestToken({
    sub: 'usr_demo_1',
    email: 'aarav@zenvy.dev',
    role: 'user',
  });
}

function adminToken() {
  return createTestToken({
    sub: 'usr_admin_1',
    email: 'naina@zenvy.dev',
    role: 'admin',
  });
}

function sellerToken() {
  return createTestToken({
    sub: 'usr_seller_1',
    email: 'rohan@zenvy.dev',
    role: 'seller',
  });
}

async function withApp(callback) {
  const app = await buildApp({
    config: {
      storageDriver: 'memory',
      databaseUrl: '',
    },
  });

  try {
    await callback(app);
  } finally {
    await app.close();
  }
}

async function testHealthEndpoint() {
  await withApp(async (app) => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    assert.equal(response.statusCode, 200);
    const payload = response.json();
    assert.equal(payload.status, 'ok');
    assert.equal(payload.storage.driver, 'memory');
  });
}

async function testAuthEndpoints() {
  await withApp(async (app) => {
    const registerResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        name: 'Test User',
        email: 'test.user@zenvy.dev',
        password: 'Password@123',
      },
    });
    assert.equal(registerResponse.statusCode, 201);
    assert.ok(registerResponse.json().accessToken);

    const loginResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'test.user@zenvy.dev',
        password: 'Password@123',
      },
    });
    assert.equal(loginResponse.statusCode, 200);
    assert.ok(loginResponse.json().refreshToken);

    const tokenResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/token',
      payload: {
        userId: 'usr_demo_1',
      },
    });

    assert.equal(tokenResponse.statusCode, 200);
    const payload = tokenResponse.json();
    assert.ok(payload.accessToken);
    assert.ok(payload.refreshToken);

    const meResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: {
        authorization: `Bearer ${payload.accessToken}`,
      },
    });

    assert.equal(meResponse.statusCode, 200);
    assert.equal(meResponse.json().user.id, 'usr_demo_1');

    const refreshResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      payload: {
        refreshToken: payload.refreshToken,
      },
    });
    assert.equal(refreshResponse.statusCode, 200);
    assert.ok(refreshResponse.json().accessToken);
    assert.ok(refreshResponse.json().refreshToken);

    const logoutResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/logout',
      payload: {
        refreshToken: refreshResponse.json().refreshToken,
      },
    });
    assert.equal(logoutResponse.statusCode, 200);
    assert.equal(logoutResponse.json().revoked, true);
  });
}

async function testRootEndpoint() {
  await withApp(async (app) => {
    const response = await app.inject({
      method: 'GET',
      url: '/',
    });

    assert.equal(response.statusCode, 200);
    const payload = response.json();
    assert.equal(payload.status, 'ok');
    assert.equal(payload.message, 'Server running');
    assert.equal(payload.docsUrl, '/docs');
  });
}

async function testReadinessAndMetricsEndpoints() {
  await withApp(async (app) => {
    const readyResponse = await app.inject({
      method: 'GET',
      url: '/ready',
    });

    assert.equal(readyResponse.statusCode, 200);
    assert.equal(readyResponse.json().ready, true);

    const metricsResponse = await app.inject({
      method: 'GET',
      url: '/metrics',
    });

    assert.equal(metricsResponse.statusCode, 200);
    assert.match(metricsResponse.body, /zenvy_requests_total/);
  });
}

async function testCatalogEndpoint() {
  await withApp(async (app) => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/catalog/products',
    });

    assert.equal(response.statusCode, 200);
    const payload = response.json();
    assert.equal(payload.length, 3);
    assert.equal(payload[0].currency, 'INR');
  });
}

async function testCatalogAdvancedEndpoints() {
  await withApp(async (app) => {
    const variantsResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/catalog/products/prd_phone_1/variants',
    });
    assert.equal(variantsResponse.statusCode, 200);
    assert.equal(variantsResponse.json()[0].variantId, 'prd_phone_1-default');

    const bulkResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/catalog/products/bulk',
      headers: {
        authorization: `Bearer ${sellerToken()}`,
      },
      payload: {
        products: [
          {
            name: 'Desk Lamp',
            sellerId: 'seller_techhub',
            category: 'home',
            price: 1999,
            availableQuantity: 10,
          },
        ],
      },
    });
    assert.equal(bulkResponse.statusCode, 201);
    assert.equal(bulkResponse.json().length, 1);

    const mediaResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/catalog/products/prd_phone_1/media',
      headers: {
        authorization: `Bearer ${sellerToken()}`,
      },
      payload: {
        files: [
          { fileName: 'angle-1.jpg', altText: 'Angle one' },
        ],
      },
    });
    assert.equal(mediaResponse.statusCode, 201);
    assert.match(mediaResponse.json()[0].uploadUrl, /upload\.zenvy\.dev/);
  });
}

async function testCatalogCrudLifecycle() {
  await withApp(async (app) => {
    const createResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/catalog/products',
      headers: {
        authorization: `Bearer ${sellerToken()}`,
      },
      payload: {
        name: 'Trail Speaker Mini',
        sellerId: 'seller_sonicmart',
        category: 'audio',
        description: 'Portable outdoor speaker.',
        price: 3499,
        tags: ['speaker', 'portable'],
        availableQuantity: 15,
      },
    });
    assert.equal(createResponse.statusCode, 201);
    const created = createResponse.json();
    assert.equal(created.slug, 'trail-speaker-mini');

    const getBySlugResponse = await app.inject({
      method: 'GET',
      url: `/api/v1/catalog/products/${created.slug}`,
    });
    assert.equal(getBySlugResponse.statusCode, 200);
    assert.equal(getBySlugResponse.json().id, created.id);

    const updateResponse = await app.inject({
      method: 'PUT',
      url: `/api/v1/catalog/products/${created.id}`,
      headers: {
        authorization: `Bearer ${sellerToken()}`,
      },
      payload: {
        price: 3299,
        availableQuantity: 22,
        tags: ['speaker', 'portable', 'travel'],
      },
    });
    assert.equal(updateResponse.statusCode, 200);
    assert.equal(updateResponse.json().price, 3299);
    assert.equal(updateResponse.json().availableQuantity, 22);

    const deleteResponse = await app.inject({
      method: 'DELETE',
      url: `/api/v1/catalog/products/${created.id}`,
      headers: {
        authorization: `Bearer ${sellerToken()}`,
      },
    });
    assert.equal(deleteResponse.statusCode, 200);
    assert.equal(deleteResponse.json().status, 'deleted');

    const fetchDeletedResponse = await app.inject({
      method: 'GET',
      url: `/api/v1/catalog/products/${created.id}`,
    });
    assert.equal(fetchDeletedResponse.statusCode, 404);
  });
}

async function testSellerCartAndReviewEndpoints() {
  await withApp(async (app) => {
    const sellerResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/sellers',
    });

    assert.equal(sellerResponse.statusCode, 200);
    assert.equal(sellerResponse.json().length, 3);

    const cartUpdateResponse = await app.inject({
      method: 'PUT',
      url: '/api/v1/carts/usr_demo_1/items',
      headers: {
        authorization: `Bearer ${userToken()}`,
      },
      payload: {
        productId: 'prd_audio_1',
        quantity: 2,
      },
    });

    assert.equal(cartUpdateResponse.statusCode, 200);
    const cart = cartUpdateResponse.json();
    assert.equal(cart.userId, 'usr_demo_1');
    assert.ok(cart.totalAmount > 0);

    const reviewResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/reviews',
      headers: {
        authorization: `Bearer ${userToken()}`,
      },
      payload: {
        productId: 'prd_phone_1',
        userId: 'usr_demo_1',
        rating: 5,
        title: 'Loved it',
        comment: 'Fast delivery and premium build quality.',
      },
    });

    assert.equal(reviewResponse.statusCode, 201);
    assert.equal(reviewResponse.json().rating, 5);
  });
}

async function testInventoryOperations() {
  await withApp(async (app) => {
    const reserveResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/inventory/prd_watch_1/reserve',
      headers: {
        authorization: `Bearer ${sellerToken()}`,
      },
      payload: {
        quantity: 2,
        orderId: 'order-demo-1',
      },
    });
    assert.equal(reserveResponse.statusCode, 200);
    assert.equal(reserveResponse.json().reservedQuantity, 5);

    const releaseResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/inventory/prd_watch_1/release',
      headers: {
        authorization: `Bearer ${sellerToken()}`,
      },
      payload: {
        quantity: 1,
        orderId: 'order-demo-1',
      },
    });
    assert.equal(releaseResponse.statusCode, 200);

    const transactionsResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/inventory/transactions/prd_watch_1',
      headers: {
        authorization: `Bearer ${sellerToken()}`,
      },
    });
    assert.equal(transactionsResponse.statusCode, 200);
    assert.ok(transactionsResponse.json().length >= 2);
  });
}

async function testOrderAndPaymentFlow() {
  await withApp(async (app) => {
    const createOrderResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/orders',
      headers: {
        authorization: `Bearer ${userToken()}`,
      },
      payload: {
        userId: 'usr_demo_1',
        items: [
          { productId: 'prd_phone_1', quantity: 1 },
          { productId: 'prd_audio_1', quantity: 2 },
        ],
      },
    });

    assert.equal(createOrderResponse.statusCode, 201);
    const order = createOrderResponse.json();
    assert.equal(order.status, 'pending');
    assert.equal(order.totalAmount, 79997);

    const paymentResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/payments/intents',
      headers: {
        authorization: `Bearer ${userToken()}`,
      },
      payload: {
        orderId: order.id,
        provider: 'razorpay',
      },
    });

    assert.equal(paymentResponse.statusCode, 201);
    const payment = paymentResponse.json();
    assert.equal(payment.orderId, order.id);
    assert.equal(payment.status, 'created');

    const signature = buildRazorpayClientSignature(
      payment.providerReference,
      'pay_success_1',
      'zenvy-dev-secret'
    );
    const succeedResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/payments/${payment.id}/confirm`,
      headers: {
        authorization: `Bearer ${userToken()}`,
      },
      payload: {
        providerPaymentId: 'pay_success_1',
        signature,
      },
    });
    assert.equal(succeedResponse.statusCode, 200);
    assert.equal(succeedResponse.json().paymentStatus, 'paid');
    assert.equal(succeedResponse.json().orderStatus, 'confirmed');
    assert.ok(succeedResponse.json().providerReference);
  });
}

async function testFailedPaymentReleasesInventory() {
  await withApp(async (app) => {
    const createOrderResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/orders',
      headers: {
        authorization: `Bearer ${userToken()}`,
      },
      payload: {
        userId: 'usr_demo_1',
        items: [
          { productId: 'prd_watch_1', quantity: 1 },
        ],
      },
    });
    assert.equal(createOrderResponse.statusCode, 201);
    const order = createOrderResponse.json();

    const stockAfterOrder = await app.inject({
      method: 'GET',
      url: '/api/v1/inventory/prd_watch_1',
    });
    assert.equal(stockAfterOrder.statusCode, 200);
    assert.equal(stockAfterOrder.json().availableQuantity, 79);

    const paymentResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/payments/intents',
      headers: {
        authorization: `Bearer ${userToken()}`,
      },
      payload: {
        orderId: order.id,
        provider: 'razorpay',
      },
    });
    assert.equal(paymentResponse.statusCode, 201);

    const failResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/payments/${paymentResponse.json().id}/status`,
      headers: {
        authorization: `Bearer ${adminToken()}`,
      },
      payload: {
        status: 'failed',
        reason: 'Issuer declined payment.',
      },
    });
    assert.equal(failResponse.statusCode, 200);
    assert.equal(failResponse.json().paymentStatus, 'payment_failed');

    const stockAfterFailure = await app.inject({
      method: 'GET',
      url: '/api/v1/inventory/prd_watch_1',
    });
    assert.equal(stockAfterFailure.statusCode, 200);
    assert.equal(stockAfterFailure.json().availableQuantity, 80);
  });
}

async function testOrderLifecycleAndIdempotency() {
  await withApp(async (app) => {
    const key = 'idem-order-1';
    const firstResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/orders',
      headers: {
        'x-idempotency-key': key,
        authorization: `Bearer ${userToken()}`,
      },
      payload: {
        userId: 'usr_demo_1',
        items: [
          { productId: 'prd_watch_1', quantity: 1 },
        ],
      },
    });
    assert.equal(firstResponse.statusCode, 201);
    const firstOrder = firstResponse.json();

    const secondResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/orders',
      headers: {
        'x-idempotency-key': key,
        authorization: `Bearer ${userToken()}`,
      },
      payload: {
        userId: 'usr_demo_1',
        items: [
          { productId: 'prd_watch_1', quantity: 1 },
        ],
      },
    });
    assert.equal(secondResponse.statusCode, 201);
    assert.equal(secondResponse.headers['x-idempotency-replayed'], 'true');
    const replayedOrder = secondResponse.json();
    assert.equal(replayedOrder.id, firstOrder.id);

    const userOrdersResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/orders/user/usr_demo_1',
      headers: {
        authorization: `Bearer ${userToken()}`,
      },
    });
    assert.equal(userOrdersResponse.statusCode, 200);
    assert.ok(userOrdersResponse.json().length >= 1);

    const cancelResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/orders/${firstOrder.id}/cancel`,
      headers: {
        authorization: `Bearer ${userToken()}`,
      },
    });
    assert.equal(cancelResponse.statusCode, 200);
    assert.equal(cancelResponse.json().status, 'cancelled');

    const timelineResponse = await app.inject({
      method: 'GET',
      url: `/api/v1/orders/${firstOrder.id}/timeline`,
      headers: {
        authorization: `Bearer ${userToken()}`,
      },
    });
    assert.equal(timelineResponse.statusCode, 200);
    assert.ok(timelineResponse.json().length >= 2);
  });
}

async function testShippingAndLoyaltyEndpoints() {
  await withApp(async (app) => {
    const shippingResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/shipping/quotes',
      headers: {
        authorization: `Bearer ${userToken()}`,
      },
      payload: {
        userId: 'usr_demo_1',
        destinationPincode: '560001',
        mode: 'express',
        items: [
          { productId: 'prd_phone_1', quantity: 1 },
        ],
      },
    });

    assert.equal(shippingResponse.statusCode, 201);
    assert.equal(shippingResponse.json().mode, 'express');
    assert.equal(shippingResponse.json().provider, 'internal');

    const loyaltyResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/loyalty/usr_demo_1',
    });

    assert.equal(loyaltyResponse.statusCode, 200);
    assert.ok(loyaltyResponse.json().pointsBalance >= 0);
  });
}

async function testShippingShipmentAndIntegrationStatus() {
  await withApp(async (app) => {
    const orderResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/orders',
      headers: {
        authorization: `Bearer ${userToken()}`,
      },
      payload: {
        userId: 'usr_demo_1',
        items: [
          { productId: 'prd_audio_1', quantity: 1 },
        ],
      },
    });
    assert.equal(orderResponse.statusCode, 201);

    const shipmentResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/shipping/shipments',
      headers: {
        authorization: `Bearer ${sellerToken()}`,
      },
      payload: {
        orderId: orderResponse.json().id,
      },
    });
    assert.equal(shipmentResponse.statusCode, 201);
    assert.ok(shipmentResponse.json().trackingId);

    const integrationResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/shipping/integrations',
    });
    assert.equal(integrationResponse.statusCode, 200);
    assert.equal(typeof integrationResponse.json().liveModeEnabled, 'boolean');
  });
}

async function testAdvancedSearchEndpoints() {
  await withApp(async (app) => {
    const hybridResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/search',
      payload: {
        query: 'audio',
        mode: 'hybrid',
        filters: {
          maxPrice: 6000,
          inStockOnly: true,
        },
      },
    });
    assert.equal(hybridResponse.statusCode, 200);
    assert.ok(hybridResponse.json().items.length >= 1);
    assert.ok(hybridResponse.json().facets.categories.length >= 1);

    const autocompleteResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/search/autocomplete?q=watch',
    });
    assert.equal(autocompleteResponse.statusCode, 200);
    assert.ok(autocompleteResponse.json().length >= 1);

    const similarResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/search/similar/prd_phone_1',
    });
    assert.equal(similarResponse.statusCode, 200);

    const nlqResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/search/nlq',
      payload: {
        query: 'find audio under 6000',
      },
    });
    assert.equal(nlqResponse.statusCode, 200);
    assert.equal(nlqResponse.json().parsed.budget, 6000);

    const firstCatalogResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/catalog/products',
    });
    assert.equal(firstCatalogResponse.statusCode, 200);
    assert.equal(firstCatalogResponse.headers['x-cache'], 'miss');

    const secondCatalogResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/catalog/products',
    });
    assert.equal(secondCatalogResponse.statusCode, 200);
    assert.equal(secondCatalogResponse.headers['x-cache'], 'hit');
  });
}

async function testAiRuntimeEndpoints() {
  await withApp(async (app) => {
    const recResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/recommend/homepage',
      payload: {
        focusCategory: 'audio',
        limit: 5,
      },
    });
    assert.equal(recResponse.statusCode, 200);
    assert.ok(recResponse.json().length >= 1);

    const pricingResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/pricing/preview',
      payload: {
        variantId: 'prd_phone_1',
        stockRemaining: 12,
        competitorPrice: 68999,
        marginFloor: 62000,
        festivalSeason: true,
      },
    });
    assert.equal(pricingResponse.statusCode, 200);
    assert.ok(pricingResponse.json().currentPrice >= 62000);

    const fraudResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/fraud/score',
      payload: {
        orderAmount: 150000,
        userAverageOrderAmount: 30000,
        failedAttempts1h: 6,
        ipIsVpn: true,
        checkoutSpeedSec: 3,
      },
    });
    assert.equal(fraudResponse.statusCode, 200);
    assert.equal(fraudResponse.json().decision, 'block');

    const assistantResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/assistant/chat',
      payload: {
        message: 'recommend good audio products',
      },
    });
    assert.equal(assistantResponse.statusCode, 200);
    assert.match(assistantResponse.json().message, /ZENVY|match/i);

    const contentResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/content/product-description',
      payload: {
        productName: 'Nova X',
        brand: 'ZENVY',
        category: 'electronics',
        keyFeatures: ['5G', 'AMOLED display', 'AI camera'],
      },
    });
    assert.equal(contentResponse.statusCode, 201);
    assert.match(contentResponse.json().seoTitle, /Nova X/);

    const streamResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/assistant/chat/stream',
      payload: {
        message: 'recommend audio',
      },
    });
    assert.equal(streamResponse.statusCode, 200);
    assert.match(streamResponse.body, /event: delta/);

    const runtimeRecommendationResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/recommend/ml-runtime',
      payload: {
        focusCategory: 'audio',
        limit: 3,
      },
    });
    assert.equal(runtimeRecommendationResponse.statusCode, 200);
    assert.ok(runtimeRecommendationResponse.json().provider);
  });
}

async function testFutureAndReferenceEndpoints() {
  await withApp(async (app) => {
    const reorderResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/future/auto-reorder/preview',
      payload: {
        productName: 'Rice 5kg',
        avgQuantity: 5,
        avgDaysBetweenOrders: 25,
        lastQuantity: 5,
        reorderLeadDays: 3,
        approvalMode: 'confirm',
      },
    });
    assert.equal(reorderResponse.statusCode, 200);
    assert.equal(reorderResponse.json().approvalMode, 'confirm');

    const multimodalResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/future/search/multimodal',
      payload: {
        text: 'audio',
        imageLabel: 'earbuds',
      },
    });
    assert.equal(multimodalResponse.statusCode, 200);
    assert.ok(multimodalResponse.json().results.length >= 1);

    const emotionResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/future/personalization/emotion',
      payload: {
        dwellTimePerProduct: 30,
        clickHesitationMs: 3000,
      },
    });
    assert.equal(emotionResponse.statusCode, 200);
    assert.ok(emotionResponse.json().state.length > 0);

    const stackResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/reference/stack',
    });
    assert.equal(stackResponse.statusCode, 200);
    assert.ok(stackResponse.json().length >= 10);

    const gatewayResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/gateway/routes',
    });
    assert.equal(gatewayResponse.statusCode, 200);
    assert.ok(gatewayResponse.json().length >= 5);

    const coverageResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/reference/coverage',
    });
    assert.equal(coverageResponse.statusCode, 200);
    assert.equal(coverageResponse.json().length, 9);
  });
}

async function testFulfillmentLifecycleRefundAndTracking() {
  await withApp(async (app) => {
    const createOrderResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/orders',
      headers: {
        authorization: `Bearer ${userToken()}`,
      },
      payload: {
        userId: 'usr_demo_1',
        items: [
          { productId: 'prd_audio_1', quantity: 1 },
        ],
      },
    });
    assert.equal(createOrderResponse.statusCode, 201);
    const order = createOrderResponse.json();

    const paymentResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/payments/intents',
      headers: {
        authorization: `Bearer ${userToken()}`,
      },
      payload: {
        orderId: order.id,
        provider: 'stripe',
      },
    });
    assert.equal(paymentResponse.statusCode, 201);

    const confirmPaymentResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/payments/webhooks/stripe',
      payload: {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: paymentResponse.json().providerReference,
            latest_charge: 'ch_demo_1',
          },
        },
      },
    });
    assert.equal(confirmPaymentResponse.statusCode, 202);

    const packedResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/orders/${order.id}/status`,
      headers: {
        authorization: `Bearer ${adminToken()}`,
      },
      payload: {
        status: 'packed',
      },
    });
    assert.equal(packedResponse.statusCode, 200);
    assert.equal(packedResponse.json().status, 'packed');

    const shippedResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/orders/${order.id}/status`,
      headers: {
        authorization: `Bearer ${adminToken()}`,
      },
      payload: {
        status: 'shipped',
        carrier: 'Shiprocket',
      },
    });
    assert.equal(shippedResponse.statusCode, 200);
    assert.ok(shippedResponse.json().trackingId);

    const trackingResponse = await app.inject({
      method: 'GET',
      url: `/api/v1/orders/${order.id}/tracking`,
      headers: {
        authorization: `Bearer ${userToken()}`,
      },
    });
    assert.equal(trackingResponse.statusCode, 200);
    assert.ok(trackingResponse.json().trackingId);

    const deliveredResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/orders/${order.id}/status`,
      headers: {
        authorization: `Bearer ${adminToken()}`,
      },
      payload: {
        status: 'delivered',
      },
    });
    assert.equal(deliveredResponse.statusCode, 200);
    assert.equal(deliveredResponse.json().status, 'delivered');

    const refundResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/payments/${paymentResponse.json().id}/refund`,
      headers: {
        authorization: `Bearer ${adminToken()}`,
      },
      payload: {
        reason: 'Customer requested refund.',
      },
    });
    assert.equal(refundResponse.statusCode, 200);
    assert.equal(refundResponse.json().paymentStatus, 'refunded');
  });
}

async function testNotificationsLiveAnalyticsAndSocialEndpoints() {
  await withApp(async (app) => {
    const createNotificationResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/notifications',
      headers: {
        authorization: `Bearer ${adminToken()}`,
      },
      payload: {
        userId: 'usr_demo_1',
        channel: 'push',
        title: 'Deal alert',
        message: 'PulseFit Pro is now trending on ZENVY.',
      },
    });
    assert.equal(createNotificationResponse.statusCode, 201);

    const notificationsResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/notifications/usr_demo_1',
      headers: {
        authorization: `Bearer ${userToken()}`,
      },
    });
    assert.equal(notificationsResponse.statusCode, 200);
    assert.ok(notificationsResponse.json().length >= 1);

    const liveCreateResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/live/events',
      payload: {
        title: 'Weekend wearables showcase',
        host: 'Naina Kapoor',
      },
    });
    assert.equal(liveCreateResponse.statusCode, 201);

    const analyticsResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/analytics/overview',
    });
    assert.equal(analyticsResponse.statusCode, 200);
    assert.ok(analyticsResponse.json().activeProducts >= 3);
    assert.ok('totalOrders' in analyticsResponse.json());

    const socialResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/social/moments',
    });
    assert.equal(socialResponse.statusCode, 200);
    assert.ok(socialResponse.json().length >= 1);
  });
}

async function testBehaviorLogisticsAndAdvancedAnalytics() {
  await withApp(async (app) => {
    const behaviorResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/behavior/events',
      payload: {
        userId: 'usr_demo_1',
        eventType: 'view',
        productId: 'prd_audio_1',
        categoryHint: 'audio',
      },
    });
    assert.equal(behaviorResponse.statusCode, 201);

    const personalizedResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/recommend/personalized',
      payload: {
        userId: 'usr_demo_1',
        focusCategory: 'audio',
        limit: 5,
      },
    });
    assert.equal(personalizedResponse.statusCode, 200);
    assert.ok(personalizedResponse.json().length >= 1);

    const budgetResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/assistant/budget-optimizer',
      payload: {
        userId: 'usr_demo_1',
        budget: 20000,
        focusCategory: 'audio',
      },
    });
    assert.equal(budgetResponse.statusCode, 200);
    assert.ok(budgetResponse.json().spent <= 20000);

    const warehousesResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/logistics/warehouses',
    });
    assert.equal(warehousesResponse.statusCode, 200);
    assert.ok(warehousesResponse.json().length >= 3);

    const routeResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/logistics/routes/optimize',
      payload: {
        stops: [
          { city: 'Delhi', priority: 1 },
          { city: 'Mumbai', priority: 3 },
        ],
      },
    });
    assert.equal(routeResponse.statusCode, 200);
    assert.equal(routeResponse.json().optimizedStops[0].city, 'Mumbai');

    const salesResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/analytics/sales',
      headers: {
        authorization: `Bearer ${adminToken()}`,
      },
    });
    assert.equal(salesResponse.statusCode, 200);

    const segmentsResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/analytics/customer-segments',
      headers: {
        authorization: `Bearer ${adminToken()}`,
      },
    });
    assert.equal(segmentsResponse.statusCode, 200);
    assert.ok(segmentsResponse.json().length >= 2);

    const forecastResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/analytics/demand-forecast',
      headers: {
        authorization: `Bearer ${adminToken()}`,
      },
    });
    assert.equal(forecastResponse.statusCode, 200);
    assert.ok(forecastResponse.json().length >= 3);

    const churnResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/analytics/churn-risk',
      headers: {
        authorization: `Bearer ${adminToken()}`,
      },
    });
    assert.equal(churnResponse.statusCode, 200);
    assert.ok(churnResponse.json().length >= 2);
  });
}

async function testEventBusAndIntegrationRoutes() {
  await withApp(async (app) => {
    const publishResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/events/publish',
      payload: {
        topic: 'integration.test',
        payload: {
          ok: true,
        },
        metadata: {
          source: 'test',
        },
      },
    });
    assert.equal(publishResponse.statusCode, 202);
    assert.equal(publishResponse.json().topic, 'integration.test');

    const outboxResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/events/outbox?limit=5',
    });
    assert.equal(outboxResponse.statusCode, 200);
    assert.ok(outboxResponse.json().length >= 1);

    const statusResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/events/status',
    });
    assert.equal(statusResponse.statusCode, 200);
    assert.equal(statusResponse.json().driver, 'memory');

    const integrationsResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/integrations/status',
    });
    assert.equal(integrationsResponse.statusCode, 200);
    assert.ok('ai' in integrationsResponse.json());
    assert.ok('shipping' in integrationsResponse.json());
  });
}

async function testSwaggerJsonIncludesNewPaths() {
  await withApp(async (app) => {
    const response = await app.inject({
      method: 'GET',
      url: '/docs/json',
    });

    assert.equal(response.statusCode, 200);
    const payload = response.json();
    assert.ok(payload.paths['/api/v1/fraud/score']);
    assert.ok(payload.paths['/api/v1/future/search/multimodal']);
    assert.ok(payload.paths['/api/v1/reference/stack']);
    assert.ok(payload.paths['/api/v1/orders/{id}/timeline']);
    assert.ok(payload.paths['/api/v1/auth/refresh']);
    assert.ok(payload.paths['/api/v1/orders/{id}/status']);
    assert.ok(payload.paths['/api/v1/logistics/routes/optimize']);
    assert.ok(payload.paths['/api/v1/analytics/customer-segments']);
    assert.ok(payload.paths['/api/v1/events/status']);
    assert.ok(payload.paths['/api/v1/integrations/status']);
    assert.ok(payload.paths['/api/v1/shipping/shipments']);
  });
}

async function testRealtimeWebSocketGateway() {
  const app = await buildApp({
    config: {
      storageDriver: 'memory',
      databaseUrl: '',
    },
  });
  attachWebSocketGateway(app);

  try {
    const address = await app.listen({
      host: '127.0.0.1',
      port: 0,
    });
    const wsUrl = address.replace('http://', 'ws://').replace(/\/$/, '') + '/ws/orders?room=demo';
    const socket = new WebSocket(wsUrl);

    const [firstMessage] = await once(socket, 'message');
    const payload = JSON.parse(firstMessage.toString('utf8'));
    assert.equal(payload.type, 'connected');
    assert.equal(payload.channel, '/ws/orders');

    socket.send(JSON.stringify({ type: 'ping' }));
    const [secondMessage] = await once(socket, 'message');
    const pongPayload = JSON.parse(secondMessage.toString('utf8'));
    assert.equal(pongPayload.type, 'pong');

    const publishResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/realtime/publish',
      headers: {
        authorization: `Bearer ${sellerToken()}`,
      },
      payload: {
        channel: '/ws/orders',
        room: 'demo',
        event: 'order.updated',
        payload: { status: 'confirmed' },
      },
    });
    assert.equal(publishResponse.statusCode, 202);
    assert.equal(publishResponse.json().accepted, true);

    const [thirdMessage] = await once(socket, 'message');
    const eventPayload = JSON.parse(thirdMessage.toString('utf8'));
    assert.equal(eventPayload.type, 'event');
    assert.equal(eventPayload.event, 'order.updated');

    socket.close();
  } finally {
    await app.close();
  }
}

async function run() {
  const tests = [
    ['root endpoint', testRootEndpoint],
    ['readiness and metrics endpoints', testReadinessAndMetricsEndpoints],
    ['health endpoint', testHealthEndpoint],
    ['auth endpoints', testAuthEndpoints],
    ['catalog endpoint', testCatalogEndpoint],
    ['catalog advanced endpoints', testCatalogAdvancedEndpoints],
    ['catalog CRUD lifecycle', testCatalogCrudLifecycle],
    ['seller, cart, and review endpoints', testSellerCartAndReviewEndpoints],
    ['inventory operations', testInventoryOperations],
    ['order and payment flow', testOrderAndPaymentFlow],
    ['failed payment releases inventory', testFailedPaymentReleasesInventory],
    ['order lifecycle and idempotency', testOrderLifecycleAndIdempotency],
    ['shipping and loyalty endpoints', testShippingAndLoyaltyEndpoints],
    ['shipping shipment and integration status', testShippingShipmentAndIntegrationStatus],
    ['advanced search endpoints', testAdvancedSearchEndpoints],
    ['AI runtime endpoints', testAiRuntimeEndpoints],
    ['future and reference endpoints', testFutureAndReferenceEndpoints],
    ['fulfillment lifecycle, refund, and tracking', testFulfillmentLifecycleRefundAndTracking],
    ['notifications, live, analytics, and social endpoints', testNotificationsLiveAnalyticsAndSocialEndpoints],
    ['behavior, logistics, and advanced analytics', testBehaviorLogisticsAndAdvancedAnalytics],
    ['event bus and integration routes', testEventBusAndIntegrationRoutes],
    ['swagger json coverage', testSwaggerJsonIncludesNewPaths],
    ['realtime websocket gateway', testRealtimeWebSocketGateway],
  ];

  for (const [name, fn] of tests) {
    await fn();
    console.log(`PASS ${name}`);
  }

  console.log(`PASS ${tests.length} tests`);
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
