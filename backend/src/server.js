'use strict';

const { buildApp } = require('./app');
const { config } = require('./config');
const { attachWebSocketGateway } = require('./realtime/wsGateway');

async function detectExistingZenvyServer(port) {
  try {
    const response = await fetch(`http://127.0.0.1:${port}/health`, {
      signal: AbortSignal.timeout(1500),
    });

    if (!response.ok) {
      return false;
    }

    const payload = await response.json();
    return payload && payload.service === config.appName;
  } catch {
    return false;
  }
}

async function start() {
  const app = await buildApp();
  attachWebSocketGateway(app);

  try {
    const address = await app.listen({
      host: config.host,
      port: config.port,
    });
    const browserHost = config.host === '0.0.0.0' ? 'localhost' : config.host;

    console.log(`ZENVY backend running at ${address}`);
    console.log(`Swagger UI available at http://${browserHost}:${config.port}/docs`);
  } catch (error) {
    if (error.code === 'EADDRINUSE') {
      const existingZenvy = await detectExistingZenvyServer(config.port);

      if (existingZenvy) {
        console.log(`ZENVY is already running on http://localhost:${config.port}`);
        console.log(`Swagger UI available at http://localhost:${config.port}/docs`);
        await app.close();
        return;
      }

      error.message = `Port ${config.port} is already in use by another process. Stop that process or set a different PORT.`;
    }

    console.error(error);
    process.exitCode = 1;
  }
}

start();
