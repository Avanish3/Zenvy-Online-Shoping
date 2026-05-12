'use strict';

const { scoreFraud } = require('../services/intelligence');

async function fraudRoutes(app) {
  const reports = [];

  app.post('/api/v1/fraud/score', {
    schema: {
      tags: ['AI Fraud'],
      summary: 'Score a transaction for fraud risk',
      body: {
        type: 'object',
        properties: {
          orderAmount: { type: 'integer' },
          userAverageOrderAmount: { type: 'integer' },
          failedAttempts1h: { type: 'integer' },
          ipIsVpn: { type: 'boolean' },
          checkoutSpeedSec: { type: 'integer' },
          multipleCards30m: { type: 'boolean' },
        },
      },
    },
  }, async (request) => {
    return scoreFraud(request.body || {});
  });

  app.post('/api/v1/fraud/report', {
    schema: {
      tags: ['AI Fraud'],
      summary: 'Report a confirmed fraud case',
      body: {
        type: 'object',
        required: ['caseId', 'label'],
        properties: {
          caseId: { type: 'string' },
          label: { type: 'string', enum: ['fraud', 'legit'] },
          notes: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    reports.push({
      ...request.body,
      createdAt: new Date().toISOString(),
    });
    reply.code(201);
    return {
      status: 'accepted',
      reportCount: reports.length,
    };
  });

  app.get('/api/v1/fraud/stats', {
    schema: {
      tags: ['AI Fraud'],
      summary: 'Fraud reporting statistics',
    },
  }, async () => {
    const fraudCount = reports.filter((item) => item.label === 'fraud').length;
    return {
      totalReports: reports.length,
      fraudReports: fraudCount,
      legitReports: reports.length - fraudCount,
    };
  });
}

module.exports = { fraudRoutes };
