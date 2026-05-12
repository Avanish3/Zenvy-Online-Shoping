'use strict';

const { createServiceApp } = require('../../src/platform/createServiceApp');

async function start() {
  const app = await createServiceApp('payments', {
    config: {
      port: Number(process.env.PORT || 8093),
    },
  });
  await app.listen({ host: process.env.HOST || '0.0.0.0', port: Number(process.env.PORT || 8093) });
}

start().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
