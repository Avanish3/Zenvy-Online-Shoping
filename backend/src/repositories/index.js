'use strict';

const { createMemoryRepository } = require('./memoryRepository');
const { createPostgresRepository } = require('./postgresRepository');

function createRepository(config) {
  if (config.storageDriver === 'postgres') {
    if (!config.databaseUrl) {
      throw new Error('DATABASE_URL is required when STORAGE_DRIVER=postgres');
    }

    return createPostgresRepository(config.databaseUrl);
  }

  return createMemoryRepository();
}

module.exports = { createRepository };

