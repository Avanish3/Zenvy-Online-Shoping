'use strict';

const { buildVisualSearch, buildRecommendations } = require('./intelligence');

async function fetchPythonAiService(baseUrl, endpoint, payload) {
  const response = await fetch(`${baseUrl.replace(/\/$/, '')}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Python AI service failed with ${response.status}`);
  }

  return response.json();
}

async function createVisualSearchResult(config, products, payload) {
  if (config.pythonAiServiceUrl) {
    try {
      return {
        provider: 'python-ai-service',
        live: true,
        ...(await fetchPythonAiService(config.pythonAiServiceUrl, '/vision/search', {
          products,
          ...payload,
        })),
      };
    } catch (error) {
      return {
        provider: 'local-fallback',
        live: false,
        warning: error.message,
        results: buildVisualSearch(products, payload),
      };
    }
  }

  return {
    provider: 'local',
    live: false,
    results: buildVisualSearch(products, payload),
  };
}

async function createMlRecommendationResult(config, products, payload) {
  if (config.pythonAiServiceUrl) {
    try {
      return {
        provider: 'python-ai-service',
        live: true,
        ...(await fetchPythonAiService(config.pythonAiServiceUrl, '/recommend', {
          products,
          ...payload,
        })),
      };
    } catch (error) {
      return {
        provider: 'local-fallback',
        live: false,
        warning: error.message,
        items: buildRecommendations(products, payload),
      };
    }
  }

  return {
    provider: 'local',
    live: false,
    items: buildRecommendations(products, payload),
  };
}

function runtimeStatus(config) {
  return {
    llm: {
      provider: config.llmProvider,
      configured: config.llmProvider === 'openai' ? Boolean(config.openAiApiKey) : true,
      model: config.openAiModel,
    },
    pythonAiService: {
      configured: Boolean(config.pythonAiServiceUrl),
      url: config.pythonAiServiceUrl || null,
    },
    vectorSearch: {
      configured: Boolean(config.vectorSearchUrl),
      url: config.vectorSearchUrl || null,
    },
  };
}

module.exports = { createMlRecommendationResult, createVisualSearchResult, runtimeStatus };
