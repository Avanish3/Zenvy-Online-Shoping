'use strict';

const socialMoments = [
  {
    id: 'social_demo_1',
    title: 'Group buy on PulseFit Pro',
    participants: 12,
    discountPercent: 8,
    createdAt: new Date().toISOString(),
  },
];

async function socialRoutes() {
  return [
    {
      method: 'GET',
      url: '/api/v1/social/moments',
      schema: {
        tags: ['Social Commerce'],
        summary: 'List social commerce moments',
      },
      handler: async () => socialMoments,
    },
  ];
}

module.exports = { socialRoutes };
