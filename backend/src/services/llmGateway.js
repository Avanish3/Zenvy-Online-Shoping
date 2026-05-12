'use strict';

const { buildAssistantReply } = require('./intelligence');

async function buildAssistantContext(repositories, body) {
  const lowerMessage = String(body.message || '').toLowerCase();
  const products = lowerMessage.includes('order')
    ? []
    : await repositories.searchProducts(body.message);
  const orders = body.userId && lowerMessage.includes('order')
    ? await repositories.listOrdersByUserId(body.userId)
    : [];

  return { products, orders };
}

async function queryOpenAi(config, body, context) {
  const response = await fetch(`${config.openAiBaseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.openAiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.openAiModel,
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content: 'You are the ZENVY shopping assistant. Be concise, helpful, and ecommerce-focused.',
        },
        {
          role: 'user',
          content: JSON.stringify({
            message: body.message,
            userId: body.userId || null,
            products: context.products.slice(0, 8),
            orders: context.orders.slice(0, 4),
          }),
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${errorText}`);
  }

  const payload = await response.json();
  return {
    provider: config.llmProvider,
    message: payload.choices?.[0]?.message?.content || 'No assistant response returned.',
    model: payload.model || config.openAiModel,
    toolsUsed: ['provider_chat_completion'],
  };
}

async function generateAssistantResponse(config, repositories, body) {
  const context = await buildAssistantContext(repositories, body);

  if (config.llmProvider === 'openai' && config.openAiApiKey) {
    try {
      return {
        ...(await queryOpenAi(config, body, context)),
        sessionId: body.sessionId || 'demo-session',
        contextSummary: {
          matchedProducts: context.products.length,
          loadedOrders: context.orders.length,
        },
      };
    } catch (error) {
      return {
        provider: 'local-fallback',
        degradedFrom: 'openai',
        message: buildAssistantReply(body.message, context),
        toolsUsed: ['local_fallback_after_provider_error'],
        sessionId: body.sessionId || 'demo-session',
        warning: error.message,
      };
    }
  }

  return {
    provider: 'local',
    message: buildAssistantReply(body.message, context),
    toolsUsed: [
      context.products.length > 0 ? 'search_products' : 'conversation_only',
    ],
    sessionId: body.sessionId || 'demo-session',
  };
}

module.exports = { generateAssistantResponse };
