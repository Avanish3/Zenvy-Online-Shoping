'use strict';

const WAREHOUSE_DIRECTORY = {
  'mum-a': { code: 'mum-a', city: 'Mumbai', region: 'West', lat: 19.076, lng: 72.8777 },
  'blr-b': { code: 'blr-b', city: 'Bengaluru', region: 'South', lat: 12.9716, lng: 77.5946 },
  'del-c': { code: 'del-c', city: 'Delhi', region: 'North', lat: 28.6139, lng: 77.2090 },
};

function daysBetween(left, right) {
  const deltaMs = Math.abs(new Date(left).getTime() - new Date(right).getTime());
  return Math.floor(deltaMs / (24 * 60 * 60 * 1000));
}

function summarizeSales(orders = []) {
  const byStatus = {};
  const byDay = {};
  let revenueInr = 0;

  for (const order of orders) {
    byStatus[order.status] = (byStatus[order.status] || 0) + 1;
    const dayKey = String(order.createdAt || '').slice(0, 10);
    byDay[dayKey] = (byDay[dayKey] || 0) + Number(order.totalAmount || 0);

    if (['confirmed', 'packed', 'shipped', 'delivered'].includes(order.status)) {
      revenueInr += Number(order.totalAmount || 0);
    }
  }

  return {
    revenueInr,
    ordersByStatus: byStatus,
    revenueByDay: Object.entries(byDay)
      .sort((left, right) => left[0].localeCompare(right[0]))
      .map(([date, amount]) => ({ date, amount })),
  };
}

function buildCustomerSegments(users = [], orders = []) {
  const spendByUser = new Map();
  const orderCountByUser = new Map();

  for (const order of orders) {
    spendByUser.set(order.userId, (spendByUser.get(order.userId) || 0) + Number(order.totalAmount || 0));
    orderCountByUser.set(order.userId, (orderCountByUser.get(order.userId) || 0) + 1);
  }

  return users.map((user) => {
    const totalSpend = spendByUser.get(user.id) || 0;
    const ordersCount = orderCountByUser.get(user.id) || 0;
    let segment = 'new';

    if (ordersCount >= 5 || totalSpend >= 100000) {
      segment = 'vip';
    } else if (ordersCount >= 2 || totalSpend >= 25000) {
      segment = 'repeat';
    }

    return {
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      totalSpend,
      ordersCount,
      segment,
    };
  });
}

function buildDemandForecast(products = [], orders = []) {
  const soldByProduct = new Map();

  for (const order of orders) {
    for (const item of order.items || []) {
      soldByProduct.set(item.productId, (soldByProduct.get(item.productId) || 0) + Number(item.quantity || 0));
    }
  }

  return products.map((product) => {
    const recentUnitsSold = soldByProduct.get(product.id) || 0;
    const available = Number(product.availableQuantity || 0);
    const pressure = recentUnitsSold * 2;
    const confidence = Math.min(0.95, 0.45 + Math.min(0.45, recentUnitsSold * 0.05));

    return {
      productId: product.id,
      name: product.name,
      category: product.category,
      recentUnitsSold,
      availableQuantity: available,
      forecastNext7Days: Math.max(1, recentUnitsSold + Math.ceil((available < 20 ? 3 : 1) + pressure / 3)),
      reorderSuggested: available < Math.max(15, recentUnitsSold * 2),
      confidence: Number(confidence.toFixed(2)),
    };
  });
}

function buildChurnRisk(users = [], orders = []) {
  const latestOrderByUser = new Map();
  const totals = new Map();

  for (const order of orders) {
    const previous = latestOrderByUser.get(order.userId);
    if (!previous || new Date(order.createdAt) > new Date(previous.createdAt)) {
      latestOrderByUser.set(order.userId, order);
    }
    totals.set(order.userId, (totals.get(order.userId) || 0) + 1);
  }

  const now = new Date();
  return users.map((user) => {
    const latestOrder = latestOrderByUser.get(user.id);
    const totalOrders = totals.get(user.id) || 0;
    const inactivityDays = latestOrder ? daysBetween(now, latestOrder.createdAt) : 365;
    const riskScore = Math.min(0.99, Number(((inactivityDays / 120) + (totalOrders === 0 ? 0.4 : 0.1)).toFixed(2)));

    return {
      userId: user.id,
      latestOrderAt: latestOrder ? latestOrder.createdAt : null,
      inactivityDays,
      totalOrders,
      riskScore,
      riskBand: riskScore >= 0.75 ? 'high' : riskScore >= 0.45 ? 'medium' : 'low',
    };
  });
}

function listWarehouses(products = []) {
  const capacityByWarehouse = new Map();

  for (const product of products) {
    const code = product.warehouseCode || 'unknown';
    capacityByWarehouse.set(code, (capacityByWarehouse.get(code) || 0) + Number(product.availableQuantity || 0));
  }

  return Object.entries(WAREHOUSE_DIRECTORY).map(([code, base]) => ({
    ...base,
    availableUnits: capacityByWarehouse.get(code) || 0,
  }));
}

function previewWarehouseAllocation(products = [], items = []) {
  const productMap = new Map(products.map((product) => [product.id, product]));
  const allocations = [];

  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product) {
      continue;
    }

    const warehouse = WAREHOUSE_DIRECTORY[product.warehouseCode] || {
      code: product.warehouseCode || 'unknown',
      city: 'Unknown',
      region: 'Unknown',
    };

    allocations.push({
      productId: product.id,
      productName: product.name,
      quantity: item.quantity,
      warehouseCode: warehouse.code,
      warehouseCity: warehouse.city,
      availableQuantity: product.availableQuantity || 0,
      splitShipment: false,
    });
  }

  return allocations;
}

function optimizeDeliveryRoute(stops = []) {
  const normalizedStops = (stops || []).map((stop, index) => ({
    id: stop.id || `stop-${index + 1}`,
    label: stop.label || stop.city || stop.pincode || `Stop ${index + 1}`,
    city: stop.city || 'Unknown',
    priority: Number(stop.priority || 0),
    lat: stop.lat === undefined ? null : Number(stop.lat),
    lng: stop.lng === undefined ? null : Number(stop.lng),
  }));

  const orderedStops = normalizedStops
    .slice()
    .sort((left, right) => right.priority - left.priority || left.city.localeCompare(right.city));

  return {
    optimizedStops: orderedStops.map((stop, index) => ({
      ...stop,
      sequence: index + 1,
    })),
    strategy: 'priority_then_city_cluster',
  };
}

function scoreBehaviorAffinity(product, behaviorEvents = []) {
  let score = 0;
  for (const event of behaviorEvents) {
    if (event.productId && event.productId === product.id) {
      score += event.eventType === 'purchase' ? 12 : event.eventType === 'add_to_cart' ? 8 : 4;
    }
    if (event.categoryHint && event.categoryHint === product.category) {
      score += 3;
    }
  }
  return score;
}

function buildPersonalizedRecommendations(products = [], behaviorEvents = [], payload = {}) {
  const excluded = new Set(payload.excludeProductIds || []);
  const focusCategory = payload.focusCategory || null;
  const limit = Math.min(20, Math.max(1, Number(payload.limit || 10)));

  return products
    .filter((product) => !excluded.has(product.id))
    .filter((product) => !focusCategory || product.category === focusCategory)
    .map((product) => ({
      ...product,
      recommendationScore: scoreBehaviorAffinity(product, behaviorEvents) + Number(product.availableQuantity || 0) / 5,
    }))
    .sort((left, right) => right.recommendationScore - left.recommendationScore || left.price - right.price)
    .slice(0, limit);
}

function buildBudgetOptimizer(products = [], behaviorEvents = [], payload = {}) {
  const budget = Math.max(1, Number(payload.budget || 0));
  const focusCategory = payload.focusCategory || null;
  const candidateProducts = buildPersonalizedRecommendations(products, behaviorEvents, {
    focusCategory,
    limit: products.length,
  }).filter((product) => Number(product.price || 0) <= budget);

  const bundle = [];
  let spent = 0;

  for (const product of candidateProducts) {
    if (spent + product.price > budget) {
      continue;
    }

    bundle.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      category: product.category,
      recommendationScore: Number(product.recommendationScore.toFixed(2)),
    });
    spent += Number(product.price || 0);

    if (bundle.length >= Math.max(1, Number(payload.maxItems || 3))) {
      break;
    }
  }

  return {
    budget,
    spent,
    remainingBudget: Math.max(0, budget - spent),
    bundle,
    summary: bundle.length > 0
      ? `Built a ${bundle.length}-item bundle under budget with preference for ${focusCategory || 'cross-category'} value.`
      : 'No matching bundle fit the selected budget constraints.',
  };
}

module.exports = {
  buildBudgetOptimizer,
  buildChurnRisk,
  buildCustomerSegments,
  buildDemandForecast,
  buildPersonalizedRecommendations,
  listWarehouses,
  optimizeDeliveryRoute,
  previewWarehouseAllocation,
  summarizeSales,
};
