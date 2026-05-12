'use strict';

const crypto = require('node:crypto');

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const normalizedPassword = String(password || '');
  const derivedKey = crypto.scryptSync(normalizedPassword, salt, 64).toString('hex');
  return `scrypt$${salt}$${derivedKey}`;
}

function verifyPassword(password, hashedPassword) {
  const [algorithm, salt, storedHash] = String(hashedPassword || '').split('$');
  if (algorithm !== 'scrypt' || !salt || !storedHash) {
    return false;
  }

  const candidate = crypto.scryptSync(String(password || ''), salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(candidate, 'hex'), Buffer.from(storedHash, 'hex'));
}

module.exports = {
  hashPassword,
  verifyPassword,
};
