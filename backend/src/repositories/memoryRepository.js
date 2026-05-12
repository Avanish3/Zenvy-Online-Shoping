'use strict';

const { randomUUID } = require('node:crypto');
const { slugify } = require('../services/intelligence');
const { hashPassword, verifyPassword } = require('../utils/security');

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function nowIso() {
  return new Date().toISOString();
}

function buildVariant(product, stock) {
  return {
    variantId: `${product.id}-default`,
    sku: `${product.sku}-DEFAULT`,
    attributes: {
      color: 'default',
      size: 'standard',
    },
    price: product.price,
    currency: product.currency,
    inventory: {
      quantity: stock.availableQuantity + stock.reservedQuantity,
      reserved: stock.reservedQuantity,
      available: stock.availableQuantity,
    },
  };
}

function calculateTier(pointsBalance) {
  if (pointsBalance >= 1000) {
    return 'gold';
  }

  if (pointsBalance >= 250) {
    return 'silver';
  }

  return 'bronze';
}

function normalizeRole(role) {
  return role === 'customer' ? 'user' : role;
}

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: normalizeRole(user.role),
  };
}

function createMemoryRepository() {
  const users = [
    { id: 'usr_demo_1', name: 'Aarav Mehta', email: 'aarav@zenvy.dev', role: 'user', passwordHash: hashPassword('Password@123') },
    { id: 'usr_admin_1', name: 'Naina Kapoor', email: 'naina@zenvy.dev', role: 'admin', passwordHash: hashPassword('Admin@123') },
    { id: 'usr_seller_1', name: 'Rohan Verma', email: 'rohan@zenvy.dev', role: 'seller', passwordHash: hashPassword('Seller@123') },
  ];

  const sellers = [
    { id: 'seller_techhub', name: 'TechHub Electronics', gstNumber: '27ABCDE1234F1Z5', status: 'active', rating: 4.7, fulfillmentScore: 96 },
    { id: 'seller_fitnessx', name: 'FitnessX Gear', gstNumber: '29PQRSX5678L1Z2', status: 'active', rating: 4.5, fulfillmentScore: 92 },
    { id: 'seller_sonicmart', name: 'SonicMart Audio', gstNumber: '07LMNOP4321Q1Z8', status: 'active', rating: 4.6, fulfillmentScore: 94 },
  ];

  const seededAt = nowIso();
  const products = [
    {
      id: 'prd_phone_1',
      sku: 'ZNV-SMART-001',
      name: 'Zenvy Nova X',
      slug: 'zenvy-nova-x',
      description: 'Flagship 5G smartphone with AI photography pipeline and AMOLED display.',
      category: 'electronics',
      price: 69999,
      currency: 'INR',
      sellerId: 'seller_techhub',
      tags: ['smartphone', '5g', 'camera'],
      status: 'active',
      createdAt: seededAt,
      updatedAt: seededAt,
    },
    {
      id: 'prd_watch_1',
      sku: 'ZNV-WEAR-002',
      name: 'PulseFit Pro',
      slug: 'pulsefit-pro',
      description: 'Health-focused smartwatch with GPS, SpO2, and 10-day battery life.',
      category: 'wearables',
      price: 14999,
      currency: 'INR',
      sellerId: 'seller_fitnessx',
      tags: ['watch', 'fitness', 'gps'],
      status: 'active',
      createdAt: seededAt,
      updatedAt: seededAt,
    },
    {
      id: 'prd_audio_1',
      sku: 'ZNV-AUDIO-003',
      name: 'EchoBuds Air',
      slug: 'echobuds-air',
      description: 'Noise-cancelling wireless earbuds with low-latency gaming mode.',
      category: 'audio',
      price: 4999,
      currency: 'INR',
      sellerId: 'seller_sonicmart',
      tags: ['earbuds', 'audio', 'gaming'],
      status: 'active',
      createdAt: seededAt,
      updatedAt: seededAt,
    },
  ];

  const inventory = new Map([
    ['prd_phone_1', { productId: 'prd_phone_1', availableQuantity: 120, reservedQuantity: 4, warehouseCode: 'mum-a' }],
    ['prd_watch_1', { productId: 'prd_watch_1', availableQuantity: 80, reservedQuantity: 3, warehouseCode: 'blr-b' }],
    ['prd_audio_1', { productId: 'prd_audio_1', availableQuantity: 200, reservedQuantity: 7, warehouseCode: 'del-c' }],
  ]);

  const reviews = [
    {
      id: 'rev_demo_1',
      productId: 'prd_phone_1',
      userId: 'usr_demo_1',
      userName: 'Aarav Mehta',
      rating: 5,
      title: 'Excellent flagship',
      comment: 'Camera quality and battery life are both impressive for daily use.',
      createdAt: nowIso(),
    },
    {
      id: 'rev_demo_2',
      productId: 'prd_audio_1',
      userId: 'usr_admin_1',
      userName: 'Naina Kapoor',
      rating: 4,
      title: 'Great value',
      comment: 'Comfortable fit and strong ANC for the price point.',
      createdAt: nowIso(),
    },
  ];

  const carts = new Map([
    ['usr_demo_1', { userId: 'usr_demo_1', items: [{ productId: 'prd_watch_1', quantity: 1 }], updatedAt: nowIso() }],
  ]);

  const productMedia = new Map([
    ['prd_phone_1', [{ id: 'media_phone_1', url: 'https://cdn.zenvy.dev/products/nova-x/front.jpg', altText: 'Nova X front view', order: 1 }]],
    ['prd_watch_1', [{ id: 'media_watch_1', url: 'https://cdn.zenvy.dev/products/pulsefit/front.jpg', altText: 'PulseFit Pro hero image', order: 1 }]],
  ]);

  const loyalty = new Map([
    ['usr_demo_1', { userId: 'usr_demo_1', pointsBalance: 240, tier: 'silver' }],
    ['usr_admin_1', { userId: 'usr_admin_1', pointsBalance: 1200, tier: 'gold' }],
  ]);

  const notifications = [
    {
      id: 'notif_demo_1',
      userId: 'usr_demo_1',
      channel: 'push',
      title: 'Order update',
      message: 'Your Zenvy Nova X order is ready for payment.',
      status: 'unread',
      createdAt: nowIso(),
      readAt: null,
    },
  ];

  const orders = new Map();
  const payments = new Map();
  const inventoryTransactions = [];
  const authSessions = [];
  const behaviorEvents = [];

  function isVisibleProduct(product) {
    return product.status !== 'deleted';
  }

  function ensureUniqueSlug(baseSlug, excludeProductId = null) {
    const normalizedBase = slugify(baseSlug) || `product-${products.length + 1}`;
    let candidate = normalizedBase;
    let suffix = 2;

    while (products.some((entry) => entry.id !== excludeProductId && entry.slug === candidate)) {
      candidate = `${normalizedBase}-${suffix}`;
      suffix += 1;
    }

    return candidate;
  }

  function getUserRecord(userId) {
    const user = users.find((entry) => entry.id === userId);
    if (!user) {
      throw createHttpError(404, 'User not found');
    }

    user.role = normalizeRole(user.role);
    return user;
  }

  function getUser(userId) {
    return sanitizeUser(getUserRecord(userId));
  }

  function getUserByEmailRecord(email) {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const user = users.find((entry) => entry.email.toLowerCase() === normalizedEmail);
    if (!user) {
      throw createHttpError(404, 'User not found');
    }

    user.role = normalizeRole(user.role);
    return user;
  }

  function getProduct(productId) {
    const product = products.find((entry) => entry.id === productId || entry.slug === productId);
    if (!product || !isVisibleProduct(product)) {
      throw createHttpError(404, `Product ${productId} not found`);
    }

    return product;
  }

  function getSeller(sellerId) {
    const seller = sellers.find((entry) => entry.id === sellerId);
    if (!seller) {
      throw createHttpError(404, 'Seller not found');
    }

    return seller;
  }

  function buildCatalogView(product) {
    const stock = inventory.get(product.id) || {
      productId: product.id,
      availableQuantity: 0,
      reservedQuantity: 0,
      warehouseCode: null,
    };
    const seller = getSeller(product.sellerId);

    return {
      ...product,
      sellerName: seller.name,
      availableQuantity: stock.availableQuantity,
      reservedQuantity: stock.reservedQuantity,
      warehouseCode: stock.warehouseCode,
      media: productMedia.get(product.id) || [],
    };
  }

  function buildCart(userId) {
    getUser(userId);
    const cart = carts.get(userId) || { userId, items: [], updatedAt: nowIso() };

    let totalAmount = 0;
    const items = cart.items.map((item) => {
      const product = getProduct(item.productId);
      const lineTotal = product.price * item.quantity;
      totalAmount += lineTotal;

      return {
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: product.price,
        currency: product.currency,
        lineTotal,
      };
    });

    return {
      userId,
      currency: 'INR',
      items,
      totalAmount,
      updatedAt: cart.updatedAt,
    };
  }

  function awardLoyaltyPoints(userId, totalAmount) {
    const earnedPoints = Math.floor(totalAmount / 1000);
    const account = loyalty.get(userId) || { userId, pointsBalance: 0, tier: 'bronze' };
    account.pointsBalance += earnedPoints;
    account.tier = calculateTier(account.pointsBalance);
    loyalty.set(userId, account);
  }

  function recordInventoryTransaction(entry) {
    inventoryTransactions.push({
      id: randomUUID(),
      createdAt: nowIso(),
      ...entry,
    });
  }

  function appendOrderTimeline(order, status, note) {
    if (!order.timeline) {
      order.timeline = [];
    }

    order.timeline.push({
      status,
      note,
      createdAt: nowIso(),
    });
  }

  function assertOrderTransition(currentStatus, nextStatus) {
    const allowedTransitions = {
      pending: ['confirmed'],
      confirmed: ['packed'],
      packed: ['shipped'],
      shipped: ['delivered'],
      delivered: [],
      cancelled: [],
      return_requested: [],
    };

    const allowed = allowedTransitions[currentStatus] || [];
    if (!allowed.includes(nextStatus)) {
      throw createHttpError(409, `Order cannot transition from ${currentStatus} to ${nextStatus}`);
    }
  }

  return {
    driver: 'memory',

    async healthCheck() {
      return { driver: 'memory', database: 'not-configured', status: 'ok' };
    },

    async listProducts(filters = {}) {
      return products
        .filter((product) => isVisibleProduct(product))
        .filter((product) => !filters.category || product.category === filters.category)
        .filter((product) => !filters.sellerId || product.sellerId === filters.sellerId)
        .filter((product) => !filters.status || product.status === filters.status)
        .filter((product) => !filters.minPrice || product.price >= Number(filters.minPrice))
        .filter((product) => !filters.maxPrice || product.price <= Number(filters.maxPrice))
        .filter((product) => {
          if (!filters.q) {
            return true;
          }

          const q = String(filters.q).toLowerCase();
          return [
            product.name,
            product.slug,
            product.description,
            product.category,
            product.tags.join(' '),
          ].some((value) => String(value || '').toLowerCase().includes(q));
        })
        .map((product) => buildCatalogView(product));
    },

    async getProductById(productId) {
      return buildCatalogView(getProduct(productId));
    },

    async createProduct(payload) {
      getSeller(payload.sellerId);

      const now = nowIso();
      const product = {
        id: payload.id || randomUUID(),
        sku: payload.sku || `ZNV-${String(products.length + 1).padStart(4, '0')}`,
        name: payload.name,
        slug: ensureUniqueSlug(payload.slug || payload.name),
        description: payload.description || `${payload.name} listed on ZENVY.`,
        category: payload.category || 'general',
        price: Number(payload.price || 0),
        currency: payload.currency || 'INR',
        sellerId: payload.sellerId,
        tags: payload.tags || [],
        status: payload.status || 'active',
        createdAt: now,
        updatedAt: now,
      };

      products.push(product);
      inventory.set(product.id, {
        productId: product.id,
        availableQuantity: Number(payload.availableQuantity || 0),
        reservedQuantity: 0,
        warehouseCode: payload.warehouseCode || 'blr-a',
      });

      return buildCatalogView(product);
    },

    async updateProduct(productId, payload) {
      const product = getProduct(productId);
      if (payload.sellerId) {
        getSeller(payload.sellerId);
      }

      product.sku = payload.sku || product.sku;
      product.name = payload.name || product.name;
      product.slug = payload.slug
        ? ensureUniqueSlug(payload.slug, product.id)
        : payload.name
          ? ensureUniqueSlug(payload.name, product.id)
          : product.slug;
      product.description = payload.description || product.description;
      product.category = payload.category || product.category;
      product.price = payload.price === undefined ? product.price : Number(payload.price);
      product.currency = payload.currency || product.currency;
      product.sellerId = payload.sellerId || product.sellerId;
      product.tags = payload.tags || product.tags;
      product.status = payload.status || product.status;
      product.updatedAt = nowIso();

      if (payload.availableQuantity !== undefined || payload.warehouseCode) {
        const stock = inventory.get(product.id) || {
          productId: product.id,
          availableQuantity: 0,
          reservedQuantity: 0,
          warehouseCode: 'blr-a',
        };

        if (payload.availableQuantity !== undefined) {
          stock.availableQuantity = Number(payload.availableQuantity);
        }
        if (payload.warehouseCode) {
          stock.warehouseCode = payload.warehouseCode;
        }
        inventory.set(product.id, stock);
      }

      return buildCatalogView(product);
    },

    async deleteProduct(productId) {
      const product = getProduct(productId);
      product.status = 'deleted';
      product.updatedAt = nowIso();
      return {
        id: product.id,
        status: product.status,
        deletedAt: product.updatedAt,
      };
    },

    async listProductVariants(productId) {
      const product = getProduct(productId);
      const stock = inventory.get(product.id);
      return [buildVariant(product, stock)];
    },

    async bulkCreateProducts(payload) {
      const created = [];
      for (const entry of payload.products || []) {
        created.push(await this.createProduct({
          ...entry,
          sellerId: entry.sellerId || sellers[0].id,
        }));
      }

      return created;
    },

    async createProductMediaUpload(payload) {
      const product = getProduct(payload.productId);
      const current = productMedia.get(product.id) || [];
      const uploads = (payload.files || []).map((file, index) => ({
        id: randomUUID(),
        uploadUrl: `https://upload.zenvy.dev/${product.id}/${encodeURIComponent(file.fileName)}`,
        assetUrl: `https://cdn.zenvy.dev/${product.id}/${encodeURIComponent(file.fileName)}`,
        altText: file.altText || `${product.name} media`,
        order: current.length + index + 1,
      }));

      productMedia.set(product.id, current.concat(uploads.map((item) => ({
        id: item.id,
        url: item.assetUrl,
        altText: item.altText,
        order: item.order,
      }))));

      return uploads;
    },

    async searchProducts(query) {
      const q = String(query || '').trim().toLowerCase();
      if (!q) {
        return [];
      }

      return products
        .filter((product) => isVisibleProduct(product))
        .filter((product) => {
          return [
            product.name,
            product.slug,
            product.description,
            product.category,
            product.tags.join(' '),
          ].some((value) => String(value || '').toLowerCase().includes(q));
        })
        .map((product) => buildCatalogView(product));
    },

    async getInventory(productId) {
      const product = getProduct(productId);
      const record = inventory.get(product.id);
      if (!record) {
        throw createHttpError(404, 'Inventory record not found');
      }

      return record;
    },

    async reserveInventory(payload) {
      const product = getProduct(payload.productId);
      const stock = inventory.get(product.id);
      if (stock.availableQuantity < payload.quantity) {
        throw createHttpError(409, `Insufficient inventory for ${product.name}`);
      }

      stock.availableQuantity -= payload.quantity;
      stock.reservedQuantity += payload.quantity;
      recordInventoryTransaction({
        productId: product.id,
        type: 'RESERVE',
        quantity: payload.quantity,
        orderId: payload.orderId || null,
        reason: payload.reason || 'manual reserve',
      });
      return stock;
    },

    async releaseInventory(payload) {
      const product = getProduct(payload.productId);
      const stock = inventory.get(product.id);
      stock.availableQuantity += payload.quantity;
      stock.reservedQuantity = Math.max(0, stock.reservedQuantity - payload.quantity);
      recordInventoryTransaction({
        productId: product.id,
        type: 'RELEASE',
        quantity: payload.quantity,
        orderId: payload.orderId || null,
        reason: payload.reason || 'manual release',
      });
      return stock;
    },

    async deductInventory(payload) {
      const product = getProduct(payload.productId);
      const stock = inventory.get(product.id);
      stock.reservedQuantity = Math.max(0, stock.reservedQuantity - payload.quantity);
      recordInventoryTransaction({
        productId: product.id,
        type: 'DEDUCT',
        quantity: payload.quantity,
        orderId: payload.orderId || null,
        reason: payload.reason || 'shipment deduction',
      });
      return stock;
    },

    async restockInventory(payload) {
      const product = getProduct(payload.productId);
      const stock = inventory.get(product.id);
      stock.availableQuantity += payload.quantity;
      recordInventoryTransaction({
        productId: product.id,
        type: 'RESTOCK',
        quantity: payload.quantity,
        orderId: payload.orderId || null,
        reason: payload.reason || 'warehouse restock',
      });
      return stock;
    },

    async listInventoryTransactions(productId) {
      const product = getProduct(productId);
      return inventoryTransactions.filter((entry) => entry.productId === product.id);
    },

    async getUserById(userId) {
      return getUser(userId);
    },

    async listUsers() {
      return users.map((entry) => sanitizeUser(entry));
    },

    async getUserByEmail(email) {
      return sanitizeUser(getUserByEmailRecord(email));
    },

    async createUser(payload) {
      const normalizedEmail = String(payload.email || '').trim().toLowerCase();
      if (users.some((entry) => entry.email.toLowerCase() === normalizedEmail)) {
        throw createHttpError(409, 'User with this email already exists');
      }

      const user = {
        id: payload.id || randomUUID(),
        name: payload.name,
        email: normalizedEmail,
        role: normalizeRole(payload.role || 'user'),
        passwordHash: hashPassword(payload.password),
      };
      users.push(user);
      return sanitizeUser(user);
    },

    async verifyUserCredentials(payload) {
      const user = getUserByEmailRecord(payload.email);
      if (!verifyPassword(payload.password, user.passwordHash)) {
        throw createHttpError(401, 'Invalid email or password');
      }

      return sanitizeUser(user);
    },

    async listSellers() {
      return sellers;
    },

    async getSellerById(sellerId) {
      return getSeller(sellerId);
    },

    async getCartByUserId(userId) {
      return buildCart(userId);
    },

    async upsertCartItem(payload) {
      getUser(payload.userId);
      const product = getProduct(payload.productId);

      const cart = carts.get(payload.userId) || { userId: payload.userId, items: [], updatedAt: nowIso() };
      const existingItem = cart.items.find((item) => item.productId === product.id);

      if (existingItem) {
        existingItem.quantity = payload.quantity;
      } else {
        cart.items.push({
          productId: product.id,
          quantity: payload.quantity,
        });
      }

      cart.updatedAt = nowIso();
      carts.set(payload.userId, cart);
      return buildCart(payload.userId);
    },

    async listReviews(productId) {
      const product = getProduct(productId);
      return reviews
        .filter((review) => review.productId === product.id)
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
    },

    async createReview(payload) {
      const user = getUser(payload.userId);
      const product = getProduct(payload.productId);

      const review = {
        id: randomUUID(),
        productId: product.id,
        userId: user.id,
        userName: user.name,
        rating: payload.rating,
        title: payload.title,
        comment: payload.comment,
        createdAt: nowIso(),
      };

      reviews.push(review);
      return review;
    },

    async getLoyaltyByUserId(userId) {
      getUser(userId);
      const account = loyalty.get(userId) || { userId, pointsBalance: 0, tier: 'bronze' };
      return {
        ...account,
        nextTier: account.tier === 'bronze' ? 'silver' : account.tier === 'silver' ? 'gold' : 'gold',
      };
    },

    async createShippingQuote(payload) {
      getUser(payload.userId);
      if (!Array.isArray(payload.items) || payload.items.length === 0) {
        throw createHttpError(400, 'Shipping quote requires at least one item');
      }

      let totalItems = 0;
      for (const item of payload.items) {
        getProduct(item.productId);
        totalItems += item.quantity;
      }

      const baseFee = payload.mode === 'express' ? 149 : 79;
      const amount = baseFee + (totalItems * 20);
      const estimatedDays = payload.mode === 'express' ? 2 : 5;

      return {
        quoteId: randomUUID(),
        userId: payload.userId,
        destinationPincode: payload.destinationPincode,
        mode: payload.mode,
        amount,
        currency: 'INR',
        estimatedDays,
        carrier: payload.mode === 'express' ? 'Shiprocket Express' : 'EasyPost Standard',
      };
    },

    async createOrder(payload) {
      const user = getUser(payload.userId);

      if (!Array.isArray(payload.items) || payload.items.length === 0) {
        throw createHttpError(400, 'Order must include at least one item');
      }

      const orderItems = payload.items.map((item) => {
        const product = getProduct(item.productId);
        const stock = inventory.get(product.id);
        if (!stock) {
          throw createHttpError(404, `Inventory for ${item.productId} not found`);
        }

        if (stock.availableQuantity < item.quantity) {
          throw createHttpError(409, `Insufficient inventory for ${product.name}`);
        }

        return {
          productId: product.id,
          productName: product.name,
          quantity: item.quantity,
          unitPrice: product.price,
          lineTotal: product.price * item.quantity,
        };
      });

      let totalAmount = 0;
      for (const item of orderItems) {
        totalAmount += item.lineTotal;
      }

      for (const item of orderItems) {
        const stock = inventory.get(item.productId);
        stock.availableQuantity -= item.quantity;
        stock.reservedQuantity += item.quantity;
      }

      const order = {
        id: randomUUID(),
        orderNumber: `ZENVY-${new Date().getFullYear()}-${String(orders.size + 1).padStart(8, '0')}`,
        userId: user.id,
        status: 'pending',
        paymentStatus: 'awaiting_payment',
        currency: payload.currency || 'INR',
        totalAmount,
        createdAt: nowIso(),
        items: orderItems,
        trackingId: null,
        carrier: null,
        packedAt: null,
        shippedAt: null,
        deliveredAt: null,
        timeline: [],
      };

      appendOrderTimeline(order, 'PENDING', 'Order created and awaiting payment.');
      orders.set(order.id, order);
      awardLoyaltyPoints(user.id, totalAmount);
      carts.set(user.id, { userId: user.id, items: [], updatedAt: nowIso() });
      return order;
    },

    async getOrderById(orderId) {
      const order = orders.get(orderId);
      if (!order) {
        throw createHttpError(404, 'Order not found');
      }

      return order;
    },

    async listOrdersByUserId(userId) {
      getUser(userId);
      return Array.from(orders.values())
        .filter((order) => order.userId === userId)
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
    },

    async listAllOrders() {
      return Array.from(orders.values()).sort((left, right) => right.createdAt.localeCompare(left.createdAt));
    },

    async cancelOrder(orderId) {
      const order = orders.get(orderId);
      if (!order) {
        throw createHttpError(404, 'Order not found');
      }

      if (['shipped', 'delivered', 'cancelled'].includes(order.status)) {
        throw createHttpError(409, 'Order cannot be cancelled in its current state');
      }

      order.status = 'cancelled';
      order.paymentStatus = order.paymentStatus === 'payment_created' ? 'refund_pending' : order.paymentStatus;
      appendOrderTimeline(order, 'CANCELLED', 'Order cancelled by user request.');

      for (const item of order.items) {
        const stock = inventory.get(item.productId);
        stock.availableQuantity += item.quantity;
        stock.reservedQuantity = Math.max(0, stock.reservedQuantity - item.quantity);
        recordInventoryTransaction({
          productId: item.productId,
          type: 'RELEASE',
          quantity: item.quantity,
          orderId,
          reason: 'order cancelled',
        });
      }

      return order;
    },

    async returnOrder(orderId, reason) {
      const order = orders.get(orderId);
      if (!order) {
        throw createHttpError(404, 'Order not found');
      }

      order.status = 'return_requested';
      appendOrderTimeline(order, 'RETURN_REQUESTED', reason || 'Return initiated by user.');
      return order;
    },

    async getOrderTimeline(orderId) {
      const order = orders.get(orderId);
      if (!order) {
        throw createHttpError(404, 'Order not found');
      }

      return order.timeline || [];
    },

    async updateOrderStatus(orderId, payload) {
      const order = orders.get(orderId);
      if (!order) {
        throw createHttpError(404, 'Order not found');
      }

      assertOrderTransition(order.status, payload.status);
      order.status = payload.status;

      if (payload.status === 'packed') {
        order.packedAt = nowIso();
      }

      if (payload.status === 'shipped') {
        order.shippedAt = nowIso();
        order.carrier = payload.carrier || order.carrier || 'Shiprocket';
        order.trackingId = payload.trackingId || order.trackingId || `TRK-${Date.now()}`;
      }

      if (payload.status === 'delivered') {
        order.deliveredAt = nowIso();
        for (const item of order.items) {
          const stock = inventory.get(item.productId);
          stock.reservedQuantity = Math.max(0, stock.reservedQuantity - item.quantity);
          recordInventoryTransaction({
            productId: item.productId,
            type: 'FULFILL',
            quantity: item.quantity,
            orderId,
            reason: 'order delivered',
          });
        }
      }

      appendOrderTimeline(order, payload.status.toUpperCase(), payload.note || `Order moved to ${payload.status}.`);
      return order;
    },

    async getOrderTracking(orderId) {
      const order = orders.get(orderId);
      if (!order) {
        throw createHttpError(404, 'Order not found');
      }

      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        trackingId: order.trackingId,
        carrier: order.carrier,
        packedAt: order.packedAt,
        shippedAt: order.shippedAt,
        deliveredAt: order.deliveredAt,
        timeline: order.timeline || [],
      };
    },

    async createPaymentIntent(payload) {
      const order = orders.get(payload.orderId);
      if (!order) {
        throw createHttpError(404, 'Order not found');
      }

      if (order.paymentStatus === 'paid') {
        throw createHttpError(409, 'Order is already paid');
      }

      const payment = {
        id: randomUUID(),
        orderId: order.id,
        provider: payload.provider,
        status: 'created',
        amount: order.totalAmount,
        currency: order.currency,
        clientToken: `client_${randomUUID()}`,
        providerReference: payload.provider === 'stripe' ? `pi_${randomUUID()}` : `order_${randomUUID()}`,
        providerPayload: payload.providerPayload || null,
        providerPaymentId: null,
        refundReference: null,
        metadata: payload.metadata || {},
        createdAt: nowIso(),
      };

      payments.set(payment.id, payment);
      order.paymentStatus = 'payment_created';
      appendOrderTimeline(order, 'PAYMENT_INITIATED', `Payment intent created with ${payload.provider}.`);
      return payment;
    },

    async getPaymentById(paymentId) {
      const payment = payments.get(paymentId);
      if (!payment) {
        throw createHttpError(404, 'Payment not found');
      }

      return payment;
    },

    async getPaymentByProviderReference(provider, providerReference) {
      const payment = Array.from(payments.values()).find((entry) => entry.provider === provider && entry.providerReference === providerReference);
      if (!payment) {
        throw createHttpError(404, 'Payment not found');
      }

      return payment;
    },

    async updatePaymentStatus(paymentId, payload) {
      const payment = payments.get(paymentId);
      if (!payment) {
        throw createHttpError(404, 'Payment not found');
      }

      const order = orders.get(payment.orderId);
      if (!order) {
        throw createHttpError(404, 'Order not found');
      }

      payment.status = payload.status;
      payment.updatedAt = nowIso();
      payment.providerPaymentId = payload.providerPaymentId || payment.providerPaymentId;
      payment.metadata = payload.metadata || payment.metadata || {};

      if (payload.status === 'succeeded') {
        order.paymentStatus = 'paid';
        order.status = 'confirmed';
        appendOrderTimeline(order, 'PAYMENT_SUCCESS', 'Payment confirmed successfully.');
        appendOrderTimeline(order, 'CONFIRMED', 'Order confirmed and ready for fulfillment.');
      } else if (payload.status === 'failed') {
        order.paymentStatus = 'payment_failed';
        order.status = 'pending';
        appendOrderTimeline(order, 'PAYMENT_FAILED', payload.reason || 'Payment failed.');

        for (const item of order.items) {
          const stock = inventory.get(item.productId);
          stock.availableQuantity += item.quantity;
          stock.reservedQuantity = Math.max(0, stock.reservedQuantity - item.quantity);
          recordInventoryTransaction({
            productId: item.productId,
            type: 'RELEASE',
            quantity: item.quantity,
            orderId: order.id,
            reason: 'payment failed',
          });
        }
      } else if (payload.status === 'refunded') {
        order.paymentStatus = 'refunded';
        payment.refundReference = payload.refundReference || payment.refundReference || `refund_${randomUUID()}`;
        appendOrderTimeline(order, 'REFUNDED', payload.reason || 'Refund completed.');
      }

      return {
        ...payment,
        orderStatus: order.status,
        paymentStatus: order.paymentStatus,
      };
    },

    async createAuthSession(payload) {
      getUser(payload.userId);
      const session = {
        id: randomUUID(),
        userId: payload.userId,
        refreshTokenHash: payload.refreshTokenHash,
        userAgent: payload.userAgent || 'unknown',
        ipAddress: payload.ipAddress || null,
        expiresAt: payload.expiresAt,
        revokedAt: null,
        createdAt: nowIso(),
      };
      authSessions.push(session);
      return session;
    },

    async rotateAuthSession(payload) {
      const session = authSessions.find((item) => item.refreshTokenHash === payload.refreshTokenHash && !item.revokedAt);
      if (!session || new Date(session.expiresAt) <= new Date()) {
        throw createHttpError(401, 'Refresh token is invalid or expired');
      }

      session.refreshTokenHash = payload.nextRefreshTokenHash;
      session.expiresAt = payload.expiresAt;
      session.rotatedAt = nowIso();
      return session;
    },

    async revokeAuthSession(refreshTokenHash) {
      const session = authSessions.find((item) => item.refreshTokenHash === refreshTokenHash && !item.revokedAt);
      if (session) {
        session.revokedAt = nowIso();
      }

      return { revoked: true };
    },

    async recordBehaviorEvent(payload) {
      getUser(payload.userId);
      if (payload.productId) {
        getProduct(payload.productId);
      }

      const event = {
        id: randomUUID(),
        userId: payload.userId,
        eventType: payload.eventType,
        productId: payload.productId || null,
        categoryHint: payload.categoryHint || null,
        metadata: payload.metadata || {},
        createdAt: nowIso(),
      };
      behaviorEvents.unshift(event);
      return event;
    },

    async listBehaviorEventsByUserId(userId) {
      getUser(userId);
      return behaviorEvents.filter((item) => item.userId === userId);
    },

    async listNotificationsByUserId(userId) {
      getUser(userId);
      return notifications
        .filter((item) => item.userId === userId)
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
    },

    async createNotification(payload) {
      getUser(payload.userId);
      const notification = {
        id: randomUUID(),
        userId: payload.userId,
        channel: payload.channel || 'in_app',
        title: payload.title,
        message: payload.message,
        status: 'unread',
        createdAt: nowIso(),
        readAt: null,
      };

      notifications.unshift(notification);
      return notification;
    },

    async markNotificationRead(notificationId) {
      const notification = notifications.find((item) => item.id === notificationId);
      if (!notification) {
        throw createHttpError(404, 'Notification not found');
      }

      notification.status = 'read';
      notification.readAt = nowIso();
      return notification;
    },

    async close() {
      return undefined;
    },
  };
}

module.exports = { createMemoryRepository };
