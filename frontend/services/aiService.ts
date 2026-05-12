import { API, withFallback } from "@/services/api";
import { mockProducts } from "@/services/mockData";
import type { AssistantMessage, AssistantReply, Product } from "@/types";

export async function getHomepageRecommendations(focusCategory?: string) {
  return withFallback(
    async () => {
      const response = await API.post<Product[]>("/api/v1/recommend/homepage", {
        focusCategory,
        limit: 8,
      });
      return response.data;
    },
    mockProducts.filter(
      (product) => !focusCategory || product.category === focusCategory,
    ),
  );
}

export async function getCartRecommendations(userId: string) {
  return withFallback(
    async () => {
      const response = await API.post<Product[]>("/api/v1/recommend/cart", {
        userId,
        limit: 4,
      });
      return response.data;
    },
    mockProducts.slice(0, 3),
  );
}

export async function askAssistant(message: string, userId?: string) {
  return withFallback(
    async () => {
      const response = await API.post<AssistantReply>(
        "/api/v1/assistant/chat",
        {
          message,
          userId,
        },
      );
      return response.data;
    },
    {
      message:
        "I would shortlist EchoBuds Air for portability, PulseFit Pro for fitness gifting, and Zenvy Nova X if you want one standout premium pick.",
      provider: "local",
      suggestedProducts: mockProducts.slice(0, 3),
    },
  );
}

export async function visualSearch(imageLabel: string) {
  return withFallback(
    async () => {
      const response = await API.post<{ results: Product[] }>(
        "/api/v1/search/visual",
        {
          imageLabel,
          query: imageLabel,
        },
      );
      return response.data;
    },
    {
      results: mockProducts.filter((product) =>
        `${product.name} ${product.tags.join(" ")}`
          .toLowerCase()
          .includes(imageLabel.toLowerCase()),
      ),
    },
  );
}

export async function getAssistantStarterMessages(): Promise<AssistantMessage[]> {
  return Promise.resolve([
    {
      id: "assistant-greeting",
      role: "assistant",
      content:
        "Tell me your budget, purpose, or style and I will narrow the catalog into a few high-confidence picks.",
    },
  ]);
}
