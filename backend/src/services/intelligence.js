'use strict';

function uniqueById(items) {
  const seen = new Set();
  const result = [];

  for (const item of items) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      result.push(item);
    }
  }

  return result;
}

function normalizeQuery(query) {
  return String(query || '').trim().toLowerCase();
}

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function scoreProductAgainstText(product, query) {
  const q = normalizeQuery(query);
  if (!q) {
    return 0;
  }

  let score = 0;
  if (product.name.toLowerCase().includes(q)) {
    score += 5;
  }
  if (product.category.toLowerCase().includes(q)) {
    score += 3;
  }
  if ((product.description || '').toLowerCase().includes(q)) {
    score += 2;
  }
  if ((product.sellerName || '').toLowerCase().includes(q)) {
    score += 1;
  }
  for (const tag of product.tags || []) {
    if (tag.toLowerCase().includes(q)) {
      score += 2;
    }
  }

  return score;
}

function scoreProductForMode(product, query, mode = 'hybrid') {
  const textScore = scoreProductAgainstText(product, query);
  if (mode === 'visual') {
    return textScore + ((product.tags || []).includes('camera') ? 1 : 0);
  }

  if (mode === 'semantic') {
    const wordCountBoost = normalizeQuery(query).split(/\s+/).filter(Boolean).length > 2 ? 2 : 0;
    return textScore + wordCountBoost + Math.min(3, (product.tags || []).length);
  }

  return textScore + Math.min(2, (product.tags || []).length);
}

function buildAutocomplete(products, query) {
  const q = normalizeQuery(query);
  return uniqueById(
    products
      .flatMap((product) => {
        const suggestions = [];

        if (product.name.toLowerCase().includes(q)) {
          suggestions.push({ id: `${product.id}:name`, suggestion: product.name, type: 'product' });
        }
        if (product.category.toLowerCase().includes(q)) {
          suggestions.push({ id: `${product.id}:category`, suggestion: product.category, type: 'category' });
        }
        for (const tag of product.tags || []) {
          if (tag.toLowerCase().includes(q)) {
            suggestions.push({ id: `${product.id}:tag:${tag}`, suggestion: tag, type: 'tag' });
          }
        }

        return suggestions;
      })
      .slice(0, 10)
  );
}

function buildSimilarProducts(products, productId, limit = 10) {
  const source = products.find((product) => product.id === productId);
  if (!source) {
    return [];
  }

  return products
    .filter((product) => product.id !== productId)
    .map((product) => {
      let score = 0;
      if (product.category === source.category) {
        score += 5;
      }

      const sourceTags = new Set(source.tags || []);
      for (const tag of product.tags || []) {
        if (sourceTags.has(tag)) {
          score += 2;
        }
      }

      const priceGap = Math.abs(product.price - source.price);
      score += Math.max(0, 3 - Math.floor(priceGap / 10000));

      return {
        ...product,
        similarityScore: score,
      };
    })
    .sort((left, right) => right.similarityScore - left.similarityScore)
    .slice(0, limit);
}

function parseNaturalLanguageQuery(query) {
  const text = String(query || '');
  const lower = text.toLowerCase();
  const budgetMatch = lower.match(/(?:under|below|less than)\s+(\d+)/);
  const mode = lower.includes('similar') ? 'similar' : lower.includes('visual') ? 'visual' : 'hybrid';

  return {
    originalQuery: text,
    mode,
    budget: budgetMatch ? Number(budgetMatch[1]) : null,
    wantsDeals: lower.includes('deal') || lower.includes('cheap') || lower.includes('discount'),
    inferredCategory: ['electronics', 'wearables', 'audio'].find((category) => lower.includes(category)) || null,
    inferredColor: ['blue', 'red', 'black', 'white'].find((color) => lower.includes(color)) || null,
  };
}

function runNlqSearch(products, query) {
  const parsed = parseNaturalLanguageQuery(query);
  return products
    .filter((product) => !parsed.inferredCategory || product.category === parsed.inferredCategory)
    .filter((product) => !parsed.budget || product.price <= parsed.budget)
    .map((product) => ({
      ...product,
      relevanceScore: scoreProductAgainstText(product, query) + (parsed.wantsDeals ? Math.max(0, 3 - Math.floor(product.price / 10000)) : 0),
    }))
    .sort((left, right) => right.relevanceScore - left.relevanceScore)
    .slice(0, 10);
}

function searchCatalog(products, payload = {}) {
  const query = payload.query || payload.q || '';
  const normalizedQuery = normalizeQuery(query);
  const mode = payload.mode || 'hybrid';
  const filters = payload.filters || {};
  const page = Math.max(1, Number(payload.page || 1));
  const pageSize = Math.min(50, Math.max(1, Number(payload.pageSize || payload.limit || 10)));
  const sort = payload.sort || 'relevance';

  const filtered = products
    .filter((product) => !filters.category || product.category === filters.category)
    .filter((product) => !filters.sellerId || product.sellerId === filters.sellerId)
    .filter((product) => !filters.tag || (product.tags || []).includes(filters.tag))
    .filter((product) => !filters.inStockOnly || (product.availableQuantity || 0) > 0)
    .filter((product) => !filters.maxPrice || product.price <= Number(filters.maxPrice))
    .filter((product) => !filters.minPrice || product.price >= Number(filters.minPrice))
    .map((product) => ({
      ...product,
      relevanceScore: normalizedQuery ? scoreProductForMode(product, normalizedQuery, mode) : 1,
    }))
    .filter((product) => !normalizedQuery || product.relevanceScore > 0);

  const sorted = filtered.sort((left, right) => {
    if (sort === 'price_asc') {
      return left.price - right.price;
    }
    if (sort === 'price_desc') {
      return right.price - left.price;
    }
    if (sort === 'newest') {
      return String(right.createdAt || '').localeCompare(String(left.createdAt || ''));
    }
    return right.relevanceScore - left.relevanceScore || right.availableQuantity - left.availableQuantity;
  });

  const start = (page - 1) * pageSize;
  const items = sorted.slice(start, start + pageSize);

  return {
    query,
    mode,
    page,
    pageSize,
    total: sorted.length,
    items,
    facets: {
      categories: Array.from(new Set(filtered.map((product) => product.category))).sort(),
      sellers: Array.from(new Set(filtered.map((product) => product.sellerId))).sort(),
      price: {
        min: filtered.length ? Math.min(...filtered.map((product) => product.price)) : 0,
        max: filtered.length ? Math.max(...filtered.map((product) => product.price)) : 0,
      },
    },
  };
}

function buildVisualSearch(products, payload) {
  const hints = [payload.imageLabel, payload.query, payload.colorHint].filter(Boolean).join(' ');
  return runNlqSearch(products, hints || 'product');
}

function buildRecommendations(products, payload = {}) {
  const type = payload.type || 'homepage';
  const limit = payload.limit || 10;
  const focusProductId = payload.productId || null;
  const focusCategory = payload.focusCategory || null;
  const cartProductIds = new Set(payload.cartProductIds || []);

  let candidates = products.slice();
  if (type === 'similar' && focusProductId) {
    return buildSimilarProducts(products, focusProductId, limit);
  }

  if (type === 'cart' && cartProductIds.size > 0) {
    const categories = new Set(
      products
        .filter((product) => cartProductIds.has(product.id))
        .map((product) => product.category)
    );

    candidates = candidates
      .filter((product) => !cartProductIds.has(product.id))
      .filter((product) => categories.has(product.category));
  }

  if (focusCategory) {
    candidates = candidates.filter((product) => product.category === focusCategory);
  }

  return candidates
    .map((product, index) => ({
      ...product,
      recommendationScore: (product.availableQuantity || 0) + ((product.tags || []).length * 4) + (100 - index),
    }))
    .sort((left, right) => right.recommendationScore - left.recommendationScore)
    .slice(0, limit);
}

function buildPriceHistory(product, points = 7) {
  const history = [];
  for (let index = points - 1; index >= 0; index -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - index);
    const factor = 1 + (((index % 3) - 1) * 0.015);
    history.push({
      date: date.toISOString().slice(0, 10),
      amount: Math.round(product.price * factor),
      currency: product.currency,
    });
  }

  return history;
}

function computeDynamicPrice(product, signals = {}) {
  let price = product.price;
  const reasons = [];
  const stockRemaining = Number(signals.stockRemaining ?? product.availableQuantity ?? 50);
  const competitorPrice = Number(signals.competitorPrice ?? product.price);
  const marginFloor = Number(signals.marginFloor ?? Math.round(product.price * 0.85));

  if (stockRemaining > 80) {
    price = Math.round(price * 0.95);
    reasons.push('High stock pressure applied 5% discount.');
  } else if (stockRemaining < 20) {
    price = Math.round(price * 1.04);
    reasons.push('Low stock premium applied.');
  }

  if (competitorPrice < price && competitorPrice >= marginFloor) {
    price = competitorPrice;
    reasons.push('Competitor price match applied.');
  }

  if (signals.festivalSeason) {
    price = Math.max(marginFloor, Math.round(price * 0.97));
    reasons.push('Festival pricing guardrails applied.');
  }

  price = Math.max(price, marginFloor);
  return {
    variantId: product.id,
    productId: product.id,
    currentPrice: price,
    originalPrice: product.price,
    currency: product.currency,
    reasons,
  };
}

function scoreFraud(payload = {}) {
  const reasons = [];
  let score = 0.08;

  if (payload.failedAttempts1h > 5) {
    score += 0.5;
    reasons.push('Velocity rule triggered: failed attempts in 1h > 5.');
  }
  if (payload.ipIsVpn) {
    score += 0.18;
    reasons.push('VPN IP detected.');
  }
  if (payload.checkoutSpeedSec && payload.checkoutSpeedSec < 5) {
    score += 0.16;
    reasons.push('Checkout completed unusually fast.');
  }
  if (payload.orderAmount && payload.userAverageOrderAmount && payload.orderAmount > (payload.userAverageOrderAmount * 3)) {
    score += 0.22;
    reasons.push('Order amount exceeds 3x historical average.');
  }
  if (payload.multipleCards30m) {
    score += 0.28;
    reasons.push('Multiple cards used in a short time window.');
  }

  const fraudProbability = Math.min(0.99, Number(score.toFixed(2)));
  let decision = 'allow';
  if (fraudProbability > 0.7) {
    decision = 'block';
  } else if (fraudProbability >= 0.4) {
    decision = 'challenge';
  }

  return {
    decision,
    fraudProbability,
    reasons,
    scoredAt: new Date().toISOString(),
  };
}

function generateProductDescription(payload = {}) {
  const attributes = payload.attributes || {};
  const featureList = Array.isArray(payload.keyFeatures) && payload.keyFeatures.length > 0
    ? payload.keyFeatures
    : Object.entries(attributes).map(([key, value]) => `${key}: ${value}`);
  const keyword = payload.productName || 'ZENVY product';

  return {
    shortDescription: `${keyword} is built for ${payload.targetAudience || 'modern shoppers'} with a clean focus on usability, quality, and value.`,
    longDescription: `${keyword} from ${payload.brand || 'ZENVY'} is designed for the ${payload.category || 'shopping'} category with a balanced mix of style, performance, and everyday practicality. Key highlights include ${featureList.slice(0, 3).join(', ')}. This listing is written to stay clear, search-friendly, and useful for both quick comparisons and confident buying decisions.`,
    bulletPoints: featureList.slice(0, 5),
    seoTitle: `${keyword} | ${payload.brand || 'ZENVY'} Online`,
    metaDescription: `${keyword} with ${featureList.slice(0, 2).join(' and ')}. Shop on ZENVY with trusted pricing, delivery, and returns support.`,
  };
}

function buildAssistantReply(message, context = {}) {
  const lower = String(message || '').toLowerCase();
  const productResults = context.products || [];
  const orderResults = context.orders || [];

  if (lower.includes('where is my order')) {
    if (orderResults.length === 0) {
      return 'I could not find a recent order in this demo session, but your backend is ready to expose order tracking and timeline data.';
    }

    const order = orderResults[0];
    return `Your latest order ${order.id} is currently ${order.status}. Payment status is ${order.paymentStatus}, and the total is INR ${order.totalAmount}.`;
  }

  if (lower.includes('recommend') || lower.includes('find')) {
    if (productResults.length === 0) {
      return 'I could not find a close match, so I would run a broader catalog search next.';
    }

    const top = productResults.slice(0, 3).map((product) => `${product.name} at INR ${product.price}`).join(', ');
    return `Here are strong matches from ZENVY right now: ${top}. I can narrow these further by budget, category, or delivery preference.`;
  }

  if (lower.includes('price')) {
    return 'I can compare current price, recent trend, and value context using the pricing and search services that are now exposed by this backend.';
  }

  return 'I can help with product search, recommendations, pricing checks, cart flows, and order tracking through the ZENVY backend tools now available.';
}

function buildAutoReorderPlan(payload = {}) {
  const avgQuantity = Number(payload.avgQuantity || 1);
  const avgDaysBetweenOrders = Number(payload.avgDaysBetweenOrders || 30);
  const lastQuantity = Number(payload.lastQuantity || avgQuantity);
  const reorderLeadDays = Number(payload.reorderLeadDays || 3);
  const consumptionRate = avgQuantity / avgDaysBetweenOrders;
  const daysUntilRunout = Math.max(0, Math.round(lastQuantity / consumptionRate));
  const shouldReorder = daysUntilRunout <= (reorderLeadDays + 2);

  return {
    productName: payload.productName || 'Subscribed item',
    consumptionRatePerDay: Number(consumptionRate.toFixed(3)),
    predictedRunOutInDays: daysUntilRunout,
    shouldReorder,
    approvalMode: payload.approvalMode || 'confirm',
    explanation: `We estimate that ${payload.productName || 'this item'} will run out in about ${daysUntilRunout} day(s), so ${shouldReorder ? 'a reorder should be prepared now.' : 'no reorder is needed yet.'}`,
  };
}

function evaluateEmotionState(payload = {}) {
  let state = 'BROWSING';
  const actions = [];

  if (payload.cartAddRemoveRatio > 1.5 || payload.clickHesitationMs > 2500) {
    state = 'DECIDING';
    actions.push('Show price history and comparison card.');
  }
  if (payload.sessionAbandonmentPoints >= 2 || payload.scrollVelocity > 0.9) {
    state = 'FRUSTRATED';
    actions.push('Reduce option count to top 3 and offer support.');
  }
  if (payload.dwellTimePerProduct > 25) {
    state = 'INTERESTED';
    actions.push('Surface reviews, specs, and return policy.');
  }
  if (payload.checkoutIntent) {
    state = 'CHECKOUT';
    actions.push('Minimize distractions and keep checkout focused.');
  }

  return {
    state,
    actions,
    ethicalGuardrails: [
      'explicit-opt-in-required',
      'no-dark-patterns',
      'no-false-urgency',
      'full-audit-log',
    ],
  };
}

function buildMultimodalSearch(products, payload = {}) {
  const mergedQuery = [payload.text, payload.voiceTranscript, payload.imageLabel, payload.imageQuery].filter(Boolean).join(' ');
  const results = runNlqSearch(products, mergedQuery || 'product');
  return {
    interpretedQuery: mergedQuery || 'product',
    modalities: {
      text: Boolean(payload.text),
      voice: Boolean(payload.voiceTranscript),
      image: Boolean(payload.imageLabel || payload.imageQuery),
      video: Boolean(payload.videoKeyFrameLabel),
    },
    results,
  };
}

module.exports = {
  buildAutocomplete,
  buildSimilarProducts,
  parseNaturalLanguageQuery,
  runNlqSearch,
  searchCatalog,
  buildVisualSearch,
  buildRecommendations,
  buildPriceHistory,
  computeDynamicPrice,
  scoreFraud,
  generateProductDescription,
  buildAssistantReply,
  buildAutoReorderPlan,
  evaluateEmotionState,
  buildMultimodalSearch,
  slugify,
};
