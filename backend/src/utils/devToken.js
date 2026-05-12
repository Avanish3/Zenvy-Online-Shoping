'use strict';

const crypto = require('node:crypto');

function base64UrlEncode(value) {
  const normalized = typeof value === 'string' ? value : JSON.stringify(value);
  return Buffer.from(normalized)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function createDevJwt(payload, secret, options = {}) {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresIn = Number(options.expiresIn || 60 * 60);
  const tokenPayload = {
    iss: options.issuer || 'zenvy-backend',
    aud: options.audience || 'zenvy-clients',
    iat: issuedAt,
    exp: issuedAt + expiresIn,
    jti: options.jwtId || crypto.randomUUID(),
    ...payload,
  };

  const encodedHeader = base64UrlEncode(header);
  const encodedPayload = base64UrlEncode(tokenPayload);
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function createOpaqueToken() {
  return crypto.randomBytes(32).toString('base64url');
}

function hashOpaqueToken(token) {
  return crypto
    .createHash('sha256')
    .update(String(token || ''))
    .digest('hex');
}

function base64UrlDecode(value) {
  const normalized = value
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(value.length / 4) * 4, '=');

  return Buffer.from(normalized, 'base64').toString('utf8');
}

function verifyDevJwt(token, secret, options = {}) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) {
    throw new Error('Malformed token');
  }

  const [encodedHeader, encodedPayload, signature] = parts;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  if (signature !== expectedSignature) {
    throw new Error('Invalid signature');
  }

  const header = JSON.parse(base64UrlDecode(encodedHeader));
  const payload = JSON.parse(base64UrlDecode(encodedPayload));
  if (header.alg !== 'HS256') {
    throw new Error('Unsupported algorithm');
  }

  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('Token expired');
  }
  if (options.issuer && payload.iss !== options.issuer) {
    throw new Error('Invalid issuer');
  }
  if (options.audience && payload.aud !== options.audience) {
    throw new Error('Invalid audience');
  }

  return payload;
}

module.exports = { createDevJwt, createOpaqueToken, hashOpaqueToken, verifyDevJwt };
