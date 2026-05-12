'use strict';

const { randomUUID } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { Pool } = require('pg');
const { slugify } = require('../services/intelligence');
const { hashPassword, verifyPassword } = require('../utils/security');

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
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

function normalizeUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: normalizeRole(row.role),
  };
}

function normalizeProduct(row) {
  return {
    id: row.id,
    sku: row.sku,
    slug: row.slug,
    name: row.name,
    description: row.description,
    category: row.category,
    price: Number(row.price),
    currency: row.currency,
    sellerId: row.sellerId,
    sellerName: row.sellerName,
    tags: row.tags || [],
    status: row.status || 'active',
    availableQuantity: Number(row.availableQuantity || 0),
    reservedQuantity: Number(row.reservedQuantity || 0),
    warehouseCode: row.warehouseCode || null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function normalizeSeller(row) {
  return {
    id: row.id,
    name: row.name,
    gstNumber: row.gstNumber,
    status: row.status,
    rating: Number(row.rating),
    fulfillmentScore: Number(row.fulfillmentScore),
  };
}

function buildProductVariant(productRow, inventoryRow) {
  return {
    variantId: `${productRow.id}-default`,
    sku: `${productRow.sku}-DEFAULT`,
    attributes: {
      color: 'default',
      size: 'standard',
    },
    price: Number(productRow.price),
    currency: productRow.currency,
    inventory: {
      quantity: Number(inventoryRow.availableQuantity) + Number(inventoryRow.reservedQuantity),
      reserved: Number(inventoryRow.reservedQuantity),
      available: Number(inventoryRow.availableQuantity),
    },
  };
}

function loadBootstrapSql() {
  const bootstrapPath = path.resolve(__dirname, '../../db/init.sql');
  return fs.readFileSync(bootstrapPath, 'utf8');
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

function buildProviderReference(provider, prefixOverride = null) {
  if (prefixOverride) {
    return `${prefixOverride}_${randomUUID()}`;
  }

  return provider === 'stripe'
    ? `pi_${randomUUID()}`
    : `order_${randomUUID()}`;
}

async function ensureUserExists(executor, userId) {
  const result = await executor.query('SELECT id FROM users WHERE id = $1', [userId]);
  if (result.rowCount === 0) {
    throw createHttpError(404, 'User not found');
  }
}

async function ensureProductExists(executor, productId) {
  const result = await executor.query(
    'SELECT id, name, price_amount AS price, currency FROM products WHERE id = $1',
    [productId]
  );

  if (result.rowCount === 0) {
    throw createHttpError(404, `Product ${productId} not found`);
  }

  return result.rows[0];
}

async function ensureCart(executor, userId) {
  const existingCart = await executor.query(
    'SELECT id FROM carts WHERE user_id = $1',
    [userId]
  );

  if (existingCart.rowCount > 0) {
    return existingCart.rows[0].id;
  }

  const cartId = randomUUID();
  await executor.query(
    'INSERT INTO carts (id, user_id) VALUES ($1, $2)',
    [cartId, userId]
  );

  return cartId;
}

async function ensureUniqueProductSlug(executor, proposedSlug, excludeProductId = null) {
  const normalizedBase = slugify(proposedSlug) || 'product';
  let candidate = normalizedBase;
  let suffix = 2;

  while (true) {
    const result = await executor.query(
      'SELECT id FROM products WHERE slug = $1 AND ($2::text IS NULL OR id <> $2) LIMIT 1',
      [candidate, excludeProductId]
    );
    if (result.rowCount === 0) {
      return candidate;
    }

    candidate = `${normalizedBase}-${suffix}`;
    suffix += 1;
  }
}

async function hydrateCart(executor, userId) {
  await ensureUserExists(executor, userId);

  const cartResult = await executor.query(
    'SELECT id, updated_at AS "updatedAt" FROM carts WHERE user_id = $1',
    [userId]
  );

  if (cartResult.rowCount === 0) {
    return {
      userId,
      currency: 'INR',
      items: [],
      totalAmount: 0,
      updatedAt: new Date().toISOString(),
    };
  }

  const itemsResult = await executor.query(
    `
      SELECT
        ci.product_id AS "productId",
        p.name AS "productName",
        ci.quantity,
        p.price_amount AS "unitPrice",
        p.currency
      FROM cart_items ci
      JOIN products p ON p.id = ci.product_id
      WHERE ci.cart_id = $1
      ORDER BY ci.id ASC
    `,
    [cartResult.rows[0].id]
  );

  let totalAmount = 0;
  const items = itemsResult.rows.map((row) => {
    const unitPrice = Number(row.unitPrice);
    const quantity = Number(row.quantity);
    const lineTotal = unitPrice * quantity;
    totalAmount += lineTotal;

    return {
      productId: row.productId,
      productName: row.productName,
      quantity,
      unitPrice,
      currency: row.currency,
      lineTotal,
    };
  });

  return {
    userId,
    currency: 'INR',
    items,
    totalAmount,
    updatedAt: cartResult.rows[0].updatedAt,
  };
}

function createPostgresRepository(connectionString) {
  const pool = new Pool({
    connectionString,
  });
  const bootstrapSql = loadBootstrapSql();
  let initializationPromise;

  async function initialize() {
    if (!initializationPromise) {
      initializationPromise = pool.query(bootstrapSql);
    }

    await initializationPromise;
  }

  const repository = {
    driver: 'postgres',

    async initialize() {
      await initialize();
    },

    async healthCheck() {
      await pool.query('SELECT 1');
      return { driver: 'postgres', database: 'connected', status: 'ok' };
    },

    async listProducts(filters = {}) {
      const result = await pool.query(
        `
          SELECT
            p.id,
            p.sku,
            p.slug,
            p.name,
            p.description,
            p.category,
            p.price_amount AS price,
            p.currency,
            p.seller_id AS "sellerId",
            s.name AS "sellerName",
            p.tags,
            p.status,
            COALESCE(i.available_quantity, 0) AS "availableQuantity",
            COALESCE(i.reserved_quantity, 0) AS "reservedQuantity",
            i.warehouse_code AS "warehouseCode",
            p.created_at AS "createdAt",
            p.updated_at AS "updatedAt"
          FROM products p
          LEFT JOIN inventory i ON i.product_id = p.id
          LEFT JOIN sellers s ON s.id = p.seller_id
          WHERE ($1::text IS NULL OR p.category = $1)
            AND ($2::text IS NULL OR p.seller_id = $2)
            AND ($3::text IS NULL OR p.status = $3)
            AND ($4::numeric IS NULL OR p.price_amount >= $4)
            AND ($5::numeric IS NULL OR p.price_amount <= $5)
            AND ($6::text IS NULL OR (
              p.name ILIKE $6
              OR p.slug ILIKE $6
              OR p.description ILIKE $6
              OR p.category ILIKE $6
            ))
            AND p.status <> 'deleted'
          ORDER BY p.created_at DESC
          LIMIT 100
        `,
        [
          filters.category || null,
          filters.sellerId || null,
          filters.status || null,
          filters.minPrice || null,
          filters.maxPrice || null,
          filters.q ? `%${String(filters.q).trim()}%` : null,
        ]
      );

      return result.rows.map(normalizeProduct);
    },

    async getProductById(productId) {
      const result = await pool.query(
        `
          SELECT
            p.id,
            p.sku,
            p.slug,
            p.name,
            p.description,
            p.category,
            p.price_amount AS price,
            p.currency,
            p.seller_id AS "sellerId",
            s.name AS "sellerName",
            p.tags,
            p.status,
            COALESCE(i.available_quantity, 0) AS "availableQuantity",
            COALESCE(i.reserved_quantity, 0) AS "reservedQuantity",
            i.warehouse_code AS "warehouseCode",
            p.created_at AS "createdAt",
            p.updated_at AS "updatedAt"
          FROM products p
          LEFT JOIN inventory i ON i.product_id = p.id
          LEFT JOIN sellers s ON s.id = p.seller_id
          WHERE (p.id = $1 OR p.slug = $1)
            AND p.status <> 'deleted'
        `,
        [productId]
      );

      if (result.rowCount === 0) {
        throw createHttpError(404, 'Product not found');
      }

      return normalizeProduct(result.rows[0]);
    },

    async createProduct(payload) {
      const client = await pool.connect();

      try {
        await client.query('BEGIN');
        const seller = await this.getSellerById(payload.sellerId);
        const id = payload.id || randomUUID();
        const slug = await ensureUniqueProductSlug(client, payload.slug || payload.name);

        await client.query(
          `
            INSERT INTO products (id, sku, slug, name, description, category, price_amount, currency, seller_id, tags, status, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
          `,
          [
            id,
            payload.sku || `ZNV-${String(Date.now()).slice(-6)}`,
            slug,
            payload.name,
            payload.description || `${payload.name} listed on ZENVY.`,
            payload.category || 'general',
            Number(payload.price || 0),
            payload.currency || 'INR',
            seller.id,
            payload.tags || [],
            payload.status || 'active',
          ]
        );

        await client.query(
          `
            INSERT INTO inventory (product_id, available_quantity, reserved_quantity, warehouse_code)
            VALUES ($1, $2, 0, $3)
          `,
          [id, Number(payload.availableQuantity || 0), payload.warehouseCode || 'blr-a']
        );

        await client.query('COMMIT');
        return this.getProductById(id);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    },

    async updateProduct(productId, payload) {
      const client = await pool.connect();

      try {
        await client.query('BEGIN');
        const current = await this.getProductById(productId);
        const sellerId = payload.sellerId || current.sellerId;
        await this.getSellerById(sellerId);
        const slug = payload.slug || payload.name
          ? await ensureUniqueProductSlug(client, payload.slug || payload.name, current.id)
          : current.slug;

        await client.query(
          `
            UPDATE products
            SET sku = $2,
                slug = $3,
                name = $4,
                description = $5,
                category = $6,
                price_amount = $7,
                currency = $8,
                seller_id = $9,
                tags = $10,
                status = $11,
                updated_at = NOW()
            WHERE id = $1
          `,
          [
            current.id,
            payload.sku || current.sku,
            slug,
            payload.name || current.name,
            payload.description || current.description,
            payload.category || current.category,
            payload.price === undefined ? current.price : Number(payload.price),
            payload.currency || current.currency,
            sellerId,
            payload.tags || current.tags,
            payload.status || current.status,
          ]
        );

        if (payload.availableQuantity !== undefined || payload.warehouseCode) {
          await client.query(
            `
              UPDATE inventory
              SET available_quantity = $2,
                  warehouse_code = $3,
                  updated_at = NOW()
              WHERE product_id = $1
            `,
            [
              current.id,
              payload.availableQuantity === undefined ? current.availableQuantity : Number(payload.availableQuantity),
              payload.warehouseCode || current.warehouseCode,
            ]
          );
        }

        await client.query('COMMIT');
        return this.getProductById(current.id);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    },

    async deleteProduct(productId) {
      const product = await this.getProductById(productId);
      await pool.query(
        `UPDATE products SET status = 'deleted', updated_at = NOW() WHERE id = $1`,
        [product.id]
      );

      return {
        id: product.id,
        status: 'deleted',
        deletedAt: new Date().toISOString(),
      };
    },

    async listProductVariants(productId) {
      const result = await pool.query(
        `
          SELECT
            p.id,
            p.sku,
            p.price_amount AS price,
            p.currency,
            COALESCE(i.available_quantity, 0) AS "availableQuantity",
            COALESCE(i.reserved_quantity, 0) AS "reservedQuantity"
          FROM products p
          LEFT JOIN inventory i ON i.product_id = p.id
          WHERE p.id = $1
        `,
        [productId]
      );

      if (result.rowCount === 0) {
        throw createHttpError(404, 'Product not found');
      }

      return [buildProductVariant(result.rows[0], result.rows[0])];
    },

    async bulkCreateProducts(payload) {
      const client = await pool.connect();
      const created = [];

      try {
        await client.query('BEGIN');
        for (const entry of payload.products || []) {
          const id = entry.id || randomUUID();
          const productRecord = {
            id,
            sku: entry.sku || `ZNV-${String(Date.now()).slice(-6)}`,
            name: entry.name,
            description: entry.description || `${entry.name} created via bulk import.`,
            category: entry.category || 'general',
            price: Number(entry.price || 0),
            currency: entry.currency || 'INR',
            sellerId: entry.sellerId,
            sellerName: null,
            tags: entry.tags || [],
            availableQuantity: Number(entry.availableQuantity || 0),
            reservedQuantity: 0,
            warehouseCode: entry.warehouseCode || 'blr-a',
          };
          await client.query(
            `
              INSERT INTO products (id, sku, name, description, category, price_amount, currency, seller_id, tags)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            `,
            [
              productRecord.id,
              productRecord.sku,
              productRecord.name,
              productRecord.description,
              productRecord.category,
              productRecord.price,
              productRecord.currency,
              productRecord.sellerId,
              productRecord.tags,
            ]
          );

          await client.query(
            `
              INSERT INTO inventory (product_id, available_quantity, reserved_quantity, warehouse_code)
              VALUES ($1, $2, 0, $3)
            `,
            [productRecord.id, productRecord.availableQuantity, productRecord.warehouseCode]
          );

          created.push(productRecord);
        }
        await client.query('COMMIT');
        return created;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    },

    async createProductMediaUpload(payload) {
      await ensureProductExists(pool, payload.productId);
      const uploads = [];
      for (let index = 0; index < (payload.files || []).length; index += 1) {
        const file = payload.files[index];
        const id = randomUUID();
        const assetUrl = `https://cdn.zenvy.dev/${payload.productId}/${encodeURIComponent(file.fileName)}`;
        await pool.query(
          `
            INSERT INTO product_media (id, product_id, url, alt_text, media_order)
            VALUES ($1, $2, $3, $4, $5)
          `,
          [id, payload.productId, assetUrl, file.altText || 'Product media', index + 1]
        );

        uploads.push({
          id,
          uploadUrl: `https://upload.zenvy.dev/${payload.productId}/${encodeURIComponent(file.fileName)}`,
          assetUrl,
          altText: file.altText || 'Product media',
          order: index + 1,
        });
      }

      return uploads;
    },

    async searchProducts(query) {
      const q = `%${query.trim()}%`;
      const result = await pool.query(
        `
          SELECT
            p.id,
            p.sku,
            p.slug,
            p.name,
            p.description,
            p.category,
            p.price_amount AS price,
            p.currency,
            p.seller_id AS "sellerId",
            s.name AS "sellerName",
            p.tags,
            p.status,
            COALESCE(i.available_quantity, 0) AS "availableQuantity",
            COALESCE(i.reserved_quantity, 0) AS "reservedQuantity",
            i.warehouse_code AS "warehouseCode",
            p.created_at AS "createdAt",
            p.updated_at AS "updatedAt"
          FROM products p
          LEFT JOIN inventory i ON i.product_id = p.id
          LEFT JOIN sellers s ON s.id = p.seller_id
          WHERE (
                p.name ILIKE $1
             OR p.slug ILIKE $1
             OR p.description ILIKE $1
             OR p.category ILIKE $1
          )
            AND p.status <> 'deleted'
          ORDER BY p.created_at DESC
          LIMIT 25
        `,
        [q]
      );

      return result.rows.map(normalizeProduct);
    },

    async getInventory(productId) {
      const result = await pool.query(
        `
          SELECT
            product_id AS "productId",
            available_quantity AS "availableQuantity",
            reserved_quantity AS "reservedQuantity",
            warehouse_code AS "warehouseCode"
          FROM inventory
          WHERE product_id = $1
        `,
        [productId]
      );

      if (result.rowCount === 0) {
        throw createHttpError(404, 'Inventory record not found');
      }

      return {
        productId: result.rows[0].productId,
        availableQuantity: Number(result.rows[0].availableQuantity),
        reservedQuantity: Number(result.rows[0].reservedQuantity),
        warehouseCode: result.rows[0].warehouseCode,
      };
    },

    async reserveInventory(payload) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const record = await this.getInventory(payload.productId);
        if (record.availableQuantity < payload.quantity) {
          throw createHttpError(409, 'Insufficient inventory');
        }

        await client.query(
          `
            UPDATE inventory
            SET available_quantity = available_quantity - $1,
                reserved_quantity = reserved_quantity + $1,
                updated_at = NOW()
            WHERE product_id = $2
          `,
          [payload.quantity, payload.productId]
        );
        await client.query(
          `
            INSERT INTO inventory_transactions (id, product_id, type, quantity, order_id, reason)
            VALUES ($1, $2, 'RESERVE', $3, $4, $5)
          `,
          [randomUUID(), payload.productId, payload.quantity, payload.orderId || null, payload.reason || 'manual reserve']
        );
        await client.query('COMMIT');
        return this.getInventory(payload.productId);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    },

    async releaseInventory(payload) {
      await pool.query(
        `
          UPDATE inventory
          SET available_quantity = available_quantity + $1,
              reserved_quantity = GREATEST(0, reserved_quantity - $1),
              updated_at = NOW()
          WHERE product_id = $2
        `,
        [payload.quantity, payload.productId]
      );
      await pool.query(
        `
          INSERT INTO inventory_transactions (id, product_id, type, quantity, order_id, reason)
          VALUES ($1, $2, 'RELEASE', $3, $4, $5)
        `,
        [randomUUID(), payload.productId, payload.quantity, payload.orderId || null, payload.reason || 'manual release']
      );
      return this.getInventory(payload.productId);
    },

    async deductInventory(payload) {
      await pool.query(
        `
          UPDATE inventory
          SET reserved_quantity = GREATEST(0, reserved_quantity - $1),
              updated_at = NOW()
          WHERE product_id = $2
        `,
        [payload.quantity, payload.productId]
      );
      await pool.query(
        `
          INSERT INTO inventory_transactions (id, product_id, type, quantity, order_id, reason)
          VALUES ($1, $2, 'DEDUCT', $3, $4, $5)
        `,
        [randomUUID(), payload.productId, payload.quantity, payload.orderId || null, payload.reason || 'shipment deduction']
      );
      return this.getInventory(payload.productId);
    },

    async restockInventory(payload) {
      await pool.query(
        `
          UPDATE inventory
          SET available_quantity = available_quantity + $1,
              updated_at = NOW()
          WHERE product_id = $2
        `,
        [payload.quantity, payload.productId]
      );
      await pool.query(
        `
          INSERT INTO inventory_transactions (id, product_id, type, quantity, order_id, reason)
          VALUES ($1, $2, 'RESTOCK', $3, $4, $5)
        `,
        [randomUUID(), payload.productId, payload.quantity, payload.orderId || null, payload.reason || 'warehouse restock']
      );
      return this.getInventory(payload.productId);
    },

    async listInventoryTransactions(productId) {
      const result = await pool.query(
        `
          SELECT id, product_id AS "productId", type, quantity, order_id AS "orderId", reason, created_at AS "createdAt"
          FROM inventory_transactions
          WHERE product_id = $1
          ORDER BY created_at DESC
        `,
        [productId]
      );

      return result.rows.map((row) => ({
        ...row,
        quantity: Number(row.quantity),
      }));
    },

    async getUserById(userId) {
      const result = await pool.query(
        `
          SELECT
            id,
            full_name AS name,
            email,
            role
          FROM users
          WHERE id = $1
        `,
        [userId]
      );

      if (result.rowCount === 0) {
        throw createHttpError(404, 'User not found');
      }

      return normalizeUser(result.rows[0]);
    },

    async listUsers() {
      const result = await pool.query(
        `
          SELECT
            id,
            full_name AS name,
            email,
            role
          FROM users
          ORDER BY created_at ASC
        `
      );

      return result.rows.map(normalizeUser);
    },

    async getUserByEmail(email) {
      const result = await pool.query(
        `
          SELECT
            id,
            full_name AS name,
            email,
            role
          FROM users
          WHERE LOWER(email) = LOWER($1)
        `,
        [email]
      );

      if (result.rowCount === 0) {
        throw createHttpError(404, 'User not found');
      }

      return normalizeUser(result.rows[0]);
    },

    async createUser(payload) {
      const normalizedEmail = String(payload.email || '').trim().toLowerCase();
      const user = {
        id: payload.id || randomUUID(),
        name: payload.name,
        email: normalizedEmail,
        role: normalizeRole(payload.role || 'user'),
        passwordHash: hashPassword(payload.password),
      };

      try {
        await pool.query(
          `
            INSERT INTO users (id, full_name, email, role, password_hash)
            VALUES ($1, $2, $3, $4, $5)
          `,
          [user.id, user.name, user.email, user.role, user.passwordHash]
        );
      } catch (error) {
        if (error && error.code === '23505') {
          throw createHttpError(409, 'User with this email already exists');
        }
        throw error;
      }

      return normalizeUser(user);
    },

    async verifyUserCredentials(payload) {
      const result = await pool.query(
        `
          SELECT
            id,
            full_name AS name,
            email,
            role,
            password_hash AS "passwordHash"
          FROM users
          WHERE LOWER(email) = LOWER($1)
        `,
        [payload.email]
      );

      if (result.rowCount === 0 || !verifyPassword(payload.password, result.rows[0].passwordHash)) {
        throw createHttpError(401, 'Invalid email or password');
      }

      return normalizeUser(result.rows[0]);
    },

    async listSellers() {
      const result = await pool.query(
        `
          SELECT
            id,
            name,
            gst_number AS "gstNumber",
            status,
            rating,
            fulfillment_score AS "fulfillmentScore"
          FROM sellers
          ORDER BY created_at ASC
        `
      );

      return result.rows.map(normalizeSeller);
    },

    async getSellerById(sellerId) {
      const result = await pool.query(
        `
          SELECT
            id,
            name,
            gst_number AS "gstNumber",
            status,
            rating,
            fulfillment_score AS "fulfillmentScore"
          FROM sellers
          WHERE id = $1
        `,
        [sellerId]
      );

      if (result.rowCount === 0) {
        throw createHttpError(404, 'Seller not found');
      }

      return normalizeSeller(result.rows[0]);
    },

    async getCartByUserId(userId) {
      return hydrateCart(pool, userId);
    },

    async upsertCartItem(payload) {
      const client = await pool.connect();

      try {
        await client.query('BEGIN');
        await ensureUserExists(client, payload.userId);
        await ensureProductExists(client, payload.productId);

        const cartId = await ensureCart(client, payload.userId);
        await client.query(
          `
            INSERT INTO cart_items (cart_id, product_id, quantity)
            VALUES ($1, $2, $3)
            ON CONFLICT (cart_id, product_id)
            DO UPDATE SET quantity = EXCLUDED.quantity
          `,
          [cartId, payload.productId, payload.quantity]
        );

        await client.query(
          'UPDATE carts SET updated_at = NOW() WHERE id = $1',
          [cartId]
        );

        await client.query('COMMIT');
        return hydrateCart(pool, payload.userId);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    },

    async listReviews(productId) {
      await ensureProductExists(pool, productId);
      const result = await pool.query(
        `
          SELECT
            r.id,
            r.product_id AS "productId",
            r.user_id AS "userId",
            u.full_name AS "userName",
            r.rating,
            r.title,
            r.comment,
            r.created_at AS "createdAt"
          FROM reviews r
          JOIN users u ON u.id = r.user_id
          WHERE r.product_id = $1
          ORDER BY r.created_at DESC
        `,
        [productId]
      );

      return result.rows.map((row) => ({
        ...row,
        rating: Number(row.rating),
      }));
    },

    async createReview(payload) {
      const client = await pool.connect();

      try {
        await client.query('BEGIN');
        await ensureUserExists(client, payload.userId);
        await ensureProductExists(client, payload.productId);

        const reviewId = randomUUID();
        await client.query(
          `
            INSERT INTO reviews (id, product_id, user_id, rating, title, comment)
            VALUES ($1, $2, $3, $4, $5, $6)
          `,
          [reviewId, payload.productId, payload.userId, payload.rating, payload.title, payload.comment]
        );

        const result = await client.query(
          `
            SELECT
              r.id,
              r.product_id AS "productId",
              r.user_id AS "userId",
              u.full_name AS "userName",
              r.rating,
              r.title,
              r.comment,
              r.created_at AS "createdAt"
            FROM reviews r
            JOIN users u ON u.id = r.user_id
            WHERE r.id = $1
          `,
          [reviewId]
        );

        await client.query('COMMIT');
        return {
          ...result.rows[0],
          rating: Number(result.rows[0].rating),
        };
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    },

    async getLoyaltyByUserId(userId) {
      const result = await pool.query(
        `
          SELECT
            l.user_id AS "userId",
            l.points_balance AS "pointsBalance",
            l.tier
          FROM loyalty_accounts l
          WHERE l.user_id = $1
        `,
        [userId]
      );

      if (result.rowCount === 0) {
        await ensureUserExists(pool, userId);
        return {
          userId,
          pointsBalance: 0,
          tier: 'bronze',
          nextTier: 'silver',
        };
      }

      const pointsBalance = Number(result.rows[0].pointsBalance);
      return {
        userId: result.rows[0].userId,
        pointsBalance,
        tier: result.rows[0].tier,
        nextTier: result.rows[0].tier === 'bronze' ? 'silver' : result.rows[0].tier === 'silver' ? 'gold' : 'gold',
      };
    },

    async createShippingQuote(payload) {
      await ensureUserExists(pool, payload.userId);
      if (!Array.isArray(payload.items) || payload.items.length === 0) {
        throw createHttpError(400, 'Shipping quote requires at least one item');
      }

      let totalItems = 0;
      for (const item of payload.items) {
        await ensureProductExists(pool, item.productId);
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
      const client = await pool.connect();

      try {
        await client.query('BEGIN');
        await ensureUserExists(client, payload.userId);

        if (!Array.isArray(payload.items) || payload.items.length === 0) {
          throw createHttpError(400, 'Order must include at least one item');
        }

        const orderItems = [];
        let totalAmount = 0;

        for (const requestedItem of payload.items) {
          const productResult = await client.query(
            `
              SELECT
                p.id,
                p.name,
                p.price_amount AS price,
                p.currency,
                i.available_quantity AS "availableQuantity"
              FROM products p
              JOIN inventory i ON i.product_id = p.id
              WHERE p.id = $1
              FOR UPDATE OF i
            `,
            [requestedItem.productId]
          );

          if (productResult.rowCount === 0) {
            throw createHttpError(404, `Product ${requestedItem.productId} not found`);
          }

          const product = productResult.rows[0];
          if (Number(product.availableQuantity) < requestedItem.quantity) {
            throw createHttpError(409, `Insufficient inventory for ${product.name}`);
          }

          const unitPrice = Number(product.price);
          const lineTotal = unitPrice * requestedItem.quantity;
          totalAmount += lineTotal;

          orderItems.push({
            productId: product.id,
            productName: product.name,
            quantity: requestedItem.quantity,
            unitPrice,
            lineTotal,
          });
        }

        const orderId = randomUUID();
        const orderNumber = `ZENVY-${new Date().getFullYear()}-${String(Date.now()).slice(-8)}`;
        const currency = payload.currency || 'INR';

        await client.query(
          `
            INSERT INTO orders (id, order_number, user_id, status, payment_status, currency, total_amount)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `,
          [orderId, orderNumber, payload.userId, 'pending', 'awaiting_payment', currency, totalAmount]
        );
        await client.query(
          `
            INSERT INTO order_events (order_id, status, note)
            VALUES ($1, $2, $3)
          `,
          [orderId, 'PENDING', 'Order created and awaiting payment.']
        );

        for (const item of orderItems) {
          await client.query(
            `
              INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, line_total)
              VALUES ($1, $2, $3, $4, $5, $6)
            `,
            [orderId, item.productId, item.productName, item.quantity, item.unitPrice, item.lineTotal]
          );

          await client.query(
            `
              UPDATE inventory
              SET
                available_quantity = available_quantity - $1,
                reserved_quantity = reserved_quantity + $1,
                updated_at = NOW()
              WHERE product_id = $2
            `,
            [item.quantity, item.productId]
          );
          await client.query(
            `
              INSERT INTO inventory_transactions (id, product_id, type, quantity, order_id, reason)
              VALUES ($1, $2, 'RESERVE', $3, $4, $5)
            `,
            [randomUUID(), item.productId, item.quantity, orderId, 'order created']
          );
        }

        const earnedPoints = Math.floor(totalAmount / 1000);
        const currentLoyalty = await client.query(
          'SELECT points_balance FROM loyalty_accounts WHERE user_id = $1',
          [payload.userId]
        );
        const currentPoints = currentLoyalty.rowCount === 0 ? 0 : Number(currentLoyalty.rows[0].points_balance);
        const nextPoints = currentPoints + earnedPoints;

        await client.query(
          `
            INSERT INTO loyalty_accounts (user_id, points_balance, tier, updated_at)
            VALUES ($1, $2, $3, NOW())
            ON CONFLICT (user_id)
            DO UPDATE SET
              points_balance = EXCLUDED.points_balance,
              tier = EXCLUDED.tier,
              updated_at = NOW()
          `,
          [payload.userId, nextPoints, calculateTier(nextPoints)]
        );

        await client.query(
          `
            DELETE FROM cart_items
            WHERE cart_id IN (
              SELECT id FROM carts WHERE user_id = $1
            )
          `,
          [payload.userId]
        );
        await client.query(
          'UPDATE carts SET updated_at = NOW() WHERE user_id = $1',
          [payload.userId]
        );

        await client.query('COMMIT');

        return {
          id: orderId,
          orderNumber,
          userId: payload.userId,
          status: 'pending',
          paymentStatus: 'awaiting_payment',
          currency,
          totalAmount,
          createdAt: new Date().toISOString(),
          trackingId: null,
          carrier: null,
          packedAt: null,
          shippedAt: null,
          deliveredAt: null,
          items: orderItems,
        };
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    },

    async getOrderById(orderId) {
      const orderResult = await pool.query(
        `
          SELECT
            id,
            order_number AS "orderNumber",
            user_id AS "userId",
            status,
            payment_status AS "paymentStatus",
            currency,
            total_amount AS "totalAmount",
            tracking_id AS "trackingId",
            carrier,
            packed_at AS "packedAt",
            shipped_at AS "shippedAt",
            delivered_at AS "deliveredAt",
            created_at AS "createdAt"
          FROM orders
          WHERE id = $1
        `,
        [orderId]
      );

      if (orderResult.rowCount === 0) {
        throw createHttpError(404, 'Order not found');
      }

      const itemsResult = await pool.query(
        `
          SELECT
            product_id AS "productId",
            product_name AS "productName",
            quantity,
            unit_price AS "unitPrice",
            line_total AS "lineTotal"
          FROM order_items
          WHERE order_id = $1
          ORDER BY id ASC
        `,
        [orderId]
      );

      return {
        ...orderResult.rows[0],
        totalAmount: Number(orderResult.rows[0].totalAmount),
        items: itemsResult.rows.map((row) => ({
          ...row,
          quantity: Number(row.quantity),
          unitPrice: Number(row.unitPrice),
          lineTotal: Number(row.lineTotal),
        })),
      };
    },

    async listOrdersByUserId(userId) {
      const result = await pool.query(
        `
          SELECT
            id,
            order_number AS "orderNumber",
            user_id AS "userId",
            status,
            payment_status AS "paymentStatus",
            currency,
            total_amount AS "totalAmount",
            tracking_id AS "trackingId",
            carrier,
            packed_at AS "packedAt",
            shipped_at AS "shippedAt",
            delivered_at AS "deliveredAt",
            created_at AS "createdAt"
          FROM orders
          WHERE user_id = $1
          ORDER BY created_at DESC
        `,
        [userId]
      );

      return result.rows.map((row) => ({
        ...row,
        totalAmount: Number(row.totalAmount),
      }));
    },

    async listAllOrders() {
      const result = await pool.query(
        `
          SELECT
            id,
            order_number AS "orderNumber",
            user_id AS "userId",
            status,
            payment_status AS "paymentStatus",
            currency,
            total_amount AS "totalAmount",
            tracking_id AS "trackingId",
            carrier,
            packed_at AS "packedAt",
            shipped_at AS "shippedAt",
            delivered_at AS "deliveredAt",
            created_at AS "createdAt"
          FROM orders
          ORDER BY created_at DESC
        `
      );

      return result.rows.map((row) => ({
        ...row,
        totalAmount: Number(row.totalAmount),
      }));
    },

    async cancelOrder(orderId) {
      const order = await this.getOrderById(orderId);
      if (['shipped', 'delivered', 'cancelled'].includes(order.status)) {
        throw createHttpError(409, 'Order cannot be cancelled in its current state');
      }

      await pool.query(
        `UPDATE orders SET status = 'cancelled' WHERE id = $1`,
        [orderId]
      );
      await pool.query(
        `INSERT INTO order_events (order_id, status, note) VALUES ($1, 'CANCELLED', 'Order cancelled by user request.')`,
        [orderId]
      );

      for (const item of order.items) {
        await this.releaseInventory({
          productId: item.productId,
          quantity: item.quantity,
          orderId,
          reason: 'order cancelled',
        });
      }

      return this.getOrderById(orderId);
    },

    async returnOrder(orderId, reason) {
      await this.getOrderById(orderId);
      await pool.query(
        `UPDATE orders SET status = 'return_requested' WHERE id = $1`,
        [orderId]
      );
      await pool.query(
        `INSERT INTO order_events (order_id, status, note) VALUES ($1, 'RETURN_REQUESTED', $2)`,
        [orderId, reason || 'Return initiated by user.']
      );

      return this.getOrderById(orderId);
    },

    async getOrderTimeline(orderId) {
      const result = await pool.query(
        `
          SELECT status, note, created_at AS "createdAt"
          FROM order_events
          WHERE order_id = $1
          ORDER BY created_at ASC, id ASC
        `,
        [orderId]
      );

      return result.rows;
    },

    async createPaymentIntent(payload) {
      const order = await this.getOrderById(payload.orderId);
      if (order.paymentStatus === 'paid') {
        throw createHttpError(409, 'Order is already paid');
      }

      const paymentId = randomUUID();
      const clientToken = payload.clientToken || `client_${randomUUID()}`;
      const providerReference = payload.providerReference || buildProviderReference(payload.provider);

      await pool.query(
        `
          INSERT INTO payments (
            id,
            order_id,
            provider,
            status,
            amount,
            currency,
            client_token,
            provider_reference,
            provider_payload,
            metadata,
            updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10::jsonb, NOW())
        `,
        [
          paymentId,
          payload.orderId,
          payload.provider,
          'created',
          order.totalAmount,
          order.currency,
          clientToken,
          providerReference,
          JSON.stringify(payload.providerPayload || {}),
          JSON.stringify(payload.metadata || {}),
        ]
      );

      await pool.query(
        `
          UPDATE orders
          SET payment_status = 'payment_created'
          WHERE id = $1
        `,
        [payload.orderId]
      );
      await pool.query(
        `
          INSERT INTO order_events (order_id, status, note)
          VALUES ($1, 'PAYMENT_INITIATED', $2)
        `,
        [payload.orderId, `Payment intent created with ${payload.provider}.`]
      );

      return {
        id: paymentId,
        orderId: payload.orderId,
        provider: payload.provider,
        status: 'created',
        amount: Number(order.totalAmount),
        currency: order.currency,
        clientToken,
        providerReference,
        providerPayload: payload.providerPayload || {},
        metadata: payload.metadata || {},
        createdAt: new Date().toISOString(),
      };
    },

    async getPaymentById(paymentId) {
      const paymentResult = await pool.query(
        `
          SELECT
            id,
            order_id AS "orderId",
            provider,
            status,
            amount,
            currency,
            client_token AS "clientToken",
            provider_reference AS "providerReference",
            provider_payment_id AS "providerPaymentId",
            refund_reference AS "refundReference",
            provider_payload AS "providerPayload",
            metadata,
            created_at AS "createdAt"
          FROM payments
          WHERE id = $1
        `,
        [paymentId]
      );
      if (paymentResult.rowCount === 0) {
        throw createHttpError(404, 'Payment not found');
      }

      return {
        ...paymentResult.rows[0],
        amount: Number(paymentResult.rows[0].amount),
      };
    },

    async getPaymentByProviderReference(provider, providerReference) {
      const paymentResult = await pool.query(
        `
          SELECT
            id,
            order_id AS "orderId",
            provider,
            status,
            amount,
            currency,
            client_token AS "clientToken",
            provider_reference AS "providerReference",
            provider_payment_id AS "providerPaymentId",
            refund_reference AS "refundReference",
            provider_payload AS "providerPayload",
            metadata,
            created_at AS "createdAt"
          FROM payments
          WHERE provider = $1
            AND provider_reference = $2
        `,
        [provider, providerReference]
      );
      if (paymentResult.rowCount === 0) {
        throw createHttpError(404, 'Payment not found');
      }

      return {
        ...paymentResult.rows[0],
        amount: Number(paymentResult.rows[0].amount),
      };
    },

    async updatePaymentStatus(paymentId, payload) {
      const payment = await this.getPaymentById(paymentId);
      const order = await this.getOrderById(payment.orderId);
      const refundReference = payload.status === 'refunded'
        ? buildProviderReference(payment.provider, 'refund')
        : payment.refundReference;

      await pool.query(
        `
          UPDATE payments
          SET status = $2,
              provider_payment_id = COALESCE($3, provider_payment_id),
              refund_reference = COALESCE($4, refund_reference),
              metadata = COALESCE($5::jsonb, metadata),
              updated_at = NOW()
          WHERE id = $1
        `,
        [
          paymentId,
          payload.status,
          payload.providerPaymentId || null,
          payload.status === 'refunded' ? refundReference : null,
          payload.metadata ? JSON.stringify(payload.metadata) : null,
        ]
      );

      if (payload.status === 'succeeded') {
        await pool.query(
          `UPDATE orders SET status = 'confirmed', payment_status = 'paid' WHERE id = $1`,
          [payment.orderId]
        );
        await pool.query(
          `INSERT INTO order_events (order_id, status, note) VALUES ($1, 'PAYMENT_SUCCESS', 'Payment confirmed successfully.')`,
          [payment.orderId]
        );
        await pool.query(
          `INSERT INTO order_events (order_id, status, note) VALUES ($1, 'CONFIRMED', 'Order confirmed and ready for fulfillment.')`,
          [payment.orderId]
        );
      } else if (payload.status === 'failed') {
        await pool.query(
          `UPDATE orders SET status = 'pending', payment_status = 'payment_failed' WHERE id = $1`,
          [payment.orderId]
        );
        await pool.query(
          `INSERT INTO order_events (order_id, status, note) VALUES ($1, 'PAYMENT_FAILED', $2)`,
          [payment.orderId, payload.reason || 'Payment failed.']
        );

        for (const item of order.items) {
          await this.releaseInventory({
            productId: item.productId,
            quantity: item.quantity,
            orderId: payment.orderId,
            reason: 'payment failed',
          });
        }
      } else if (payload.status === 'refunded') {
        await pool.query(
          `UPDATE orders SET payment_status = 'refunded' WHERE id = $1`,
          [payment.orderId]
        );
        await pool.query(
          `INSERT INTO order_events (order_id, status, note) VALUES ($1, 'REFUNDED', $2)`,
          [payment.orderId, payload.reason || 'Refund completed.']
        );
      }

      const refreshedOrder = await this.getOrderById(payment.orderId);
      return {
        ...payment,
        status: payload.status,
        amount: Number(payment.amount),
        providerPaymentId: payload.providerPaymentId || payment.providerPaymentId,
        orderStatus: refreshedOrder.status,
        paymentStatus: refreshedOrder.paymentStatus,
        refundReference,
        metadata: payload.metadata || payment.metadata,
      };
    },

    async createAuthSession(payload) {
      const session = {
        id: randomUUID(),
        userId: payload.userId,
        refreshTokenHash: payload.refreshTokenHash,
        userAgent: payload.userAgent || 'unknown',
        ipAddress: payload.ipAddress || null,
        expiresAt: payload.expiresAt,
      };

      await pool.query(
        `
          INSERT INTO auth_sessions (id, user_id, refresh_token_hash, user_agent, ip_address, expires_at)
          VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [session.id, session.userId, session.refreshTokenHash, session.userAgent, session.ipAddress, session.expiresAt]
      );

      return session;
    },

    async rotateAuthSession(payload) {
      const result = await pool.query(
        `
          UPDATE auth_sessions
          SET refresh_token_hash = $2,
              expires_at = $3,
              rotated_at = NOW()
          WHERE refresh_token_hash = $1
            AND revoked_at IS NULL
            AND expires_at > NOW()
          RETURNING id, user_id AS "userId", expires_at AS "expiresAt"
        `,
        [payload.refreshTokenHash, payload.nextRefreshTokenHash, payload.expiresAt]
      );

      if (result.rowCount === 0) {
        throw createHttpError(401, 'Refresh token is invalid or expired');
      }

      return result.rows[0];
    },

    async revokeAuthSession(refreshTokenHash) {
      await pool.query(
        `
          UPDATE auth_sessions
          SET revoked_at = NOW()
          WHERE refresh_token_hash = $1
            AND revoked_at IS NULL
        `,
        [refreshTokenHash]
      );

      return { revoked: true };
    },

    async recordBehaviorEvent(payload) {
      await ensureUserExists(pool, payload.userId);
      if (payload.productId) {
        await ensureProductExists(pool, payload.productId);
      }

      const event = {
        id: randomUUID(),
        userId: payload.userId,
        eventType: payload.eventType,
        productId: payload.productId || null,
        categoryHint: payload.categoryHint || null,
        metadata: payload.metadata || {},
      };

      await pool.query(
        `
          INSERT INTO behavior_events (id, user_id, event_type, product_id, category_hint, metadata)
          VALUES ($1, $2, $3, $4, $5, $6::jsonb)
        `,
        [event.id, event.userId, event.eventType, event.productId, event.categoryHint, JSON.stringify(event.metadata)]
      );

      return {
        ...event,
        createdAt: new Date().toISOString(),
      };
    },

    async listBehaviorEventsByUserId(userId) {
      await ensureUserExists(pool, userId);
      const result = await pool.query(
        `
          SELECT
            id,
            user_id AS "userId",
            event_type AS "eventType",
            product_id AS "productId",
            category_hint AS "categoryHint",
            metadata,
            created_at AS "createdAt"
          FROM behavior_events
          WHERE user_id = $1
          ORDER BY created_at DESC
        `,
        [userId]
      );

      return result.rows;
    },

    async listNotificationsByUserId(userId) {
      await ensureUserExists(pool, userId);
      const result = await pool.query(
        `
          SELECT
            id,
            user_id AS "userId",
            channel,
            title,
            message,
            status,
            read_at AS "readAt",
            created_at AS "createdAt"
          FROM notifications
          WHERE user_id = $1
          ORDER BY created_at DESC
        `,
        [userId]
      );

      return result.rows;
    },

    async createNotification(payload) {
      await ensureUserExists(pool, payload.userId);
      const notification = {
        id: randomUUID(),
        userId: payload.userId,
        channel: payload.channel || 'in_app',
        title: payload.title,
        message: payload.message,
        status: 'unread',
      };

      await pool.query(
        `
          INSERT INTO notifications (id, user_id, channel, title, message, status)
          VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [notification.id, notification.userId, notification.channel, notification.title, notification.message, notification.status]
      );

      return {
        ...notification,
        readAt: null,
        createdAt: new Date().toISOString(),
      };
    },

    async markNotificationRead(notificationId) {
      const result = await pool.query(
        `
          UPDATE notifications
          SET status = 'read',
              read_at = NOW()
          WHERE id = $1
          RETURNING
            id,
            user_id AS "userId",
            channel,
            title,
            message,
            status,
            read_at AS "readAt",
            created_at AS "createdAt"
        `,
        [notificationId]
      );

      if (result.rowCount === 0) {
        throw createHttpError(404, 'Notification not found');
      }

      return result.rows[0];
    },

    async updateOrderStatus(orderId, payload) {
      const order = await this.getOrderById(orderId);
      assertOrderTransition(order.status, payload.status);

      await pool.query(
        `
          UPDATE orders
          SET status = $2,
              carrier = CASE WHEN $2 = 'shipped' THEN COALESCE($3, carrier, 'Shiprocket') ELSE carrier END,
              tracking_id = CASE WHEN $2 = 'shipped' THEN COALESCE($4, tracking_id, $5) ELSE tracking_id END,
              packed_at = CASE WHEN $2 = 'packed' THEN NOW() ELSE packed_at END,
              shipped_at = CASE WHEN $2 = 'shipped' THEN NOW() ELSE shipped_at END,
              delivered_at = CASE WHEN $2 = 'delivered' THEN NOW() ELSE delivered_at END
          WHERE id = $1
        `,
        [orderId, payload.status, payload.carrier || null, payload.trackingId || null, `TRK-${Date.now()}`]
      );
      await pool.query(
        `INSERT INTO order_events (order_id, status, note) VALUES ($1, $2, $3)`,
        [orderId, payload.status.toUpperCase(), payload.note || `Order moved to ${payload.status}.`]
      );

      if (payload.status === 'delivered') {
        for (const item of order.items) {
          await pool.query(
            `
              UPDATE inventory
              SET reserved_quantity = GREATEST(0, reserved_quantity - $1),
                  updated_at = NOW()
              WHERE product_id = $2
            `,
            [item.quantity, item.productId]
          );
          await pool.query(
            `
              INSERT INTO inventory_transactions (id, product_id, type, quantity, order_id, reason)
              VALUES ($1, $2, 'FULFILL', $3, $4, $5)
            `,
            [randomUUID(), item.productId, item.quantity, orderId, 'order delivered']
          );
        }
      }

      return this.getOrderById(orderId);
    },

    async getOrderTracking(orderId) {
      const order = await this.getOrderById(orderId);
      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        trackingId: order.trackingId,
        carrier: order.carrier,
        packedAt: order.packedAt,
        shippedAt: order.shippedAt,
        deliveredAt: order.deliveredAt,
        timeline: await this.getOrderTimeline(orderId),
      };
    },

    async close() {
      await pool.end();
    },
  };

  return new Proxy(repository, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver);
      if (typeof value !== 'function' || property === 'initialize' || property === 'close') {
        return value;
      }

      return async function wrappedRepositoryMethod(...args) {
        await initialize();
        return value.apply(target, args);
      };
    },
  });
}

module.exports = { createPostgresRepository };
