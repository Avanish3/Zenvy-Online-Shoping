'use strict';

const {
  serviceStackReference,
  resilienceReference,
  observabilityReference,
} = require('../services/referenceData');
const { sectionCoverage } = require('../services/sectionCoverage');

async function referenceRoutes(app) {
  app.get('/api/v1/reference/stack', {
    schema: {
      tags: ['Reference'],
      summary: 'Complete tech stack reference',
    },
  }, async () => {
    return serviceStackReference;
  });

  app.get('/api/v1/reference/resilience', {
    schema: {
      tags: ['Reference'],
      summary: 'Resilience patterns reference',
    },
  }, async () => {
    return resilienceReference;
  });

  app.get('/api/v1/reference/observability', {
    schema: {
      tags: ['Reference'],
      summary: 'Observability reference',
    },
  }, async () => {
    return observabilityReference;
  });

  app.get('/api/v1/reference/coverage', {
    schema: {
      tags: ['Reference'],
      summary: '9-section implementation coverage reference',
    },
  }, async () => {
    return sectionCoverage;
  });
}

module.exports = { referenceRoutes };
