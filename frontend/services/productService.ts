import { API, withFallback } from "@/services/api";
import { getDidYouMean } from "@/services/experienceService";
import { mockProducts, mockReviews } from "@/services/mockData";
import type { Product, Review, SearchResponse } from "@/types";

export async function getProducts(filters?: Record<string, unknown>) {
  return withFallback(
    async () => {
      const response = await API.get<Product[]>("/api/v1/catalog/products", {
        params: filters,
      });
      return response.data;
    },
    mockProducts.filter((product) => {
      if (!filters) {
        return true;
      }

      const category = filters.category ? String(filters.category).toLowerCase() : "";
      const brand = filters.brand ? String(filters.brand).toLowerCase() : "";

      if (category && product.category.toLowerCase() !== category) {
        return false;
      }

      if (brand && product.brand?.toLowerCase() !== brand) {
        return false;
      }

      return true;
    }),
  );
}

export async function getProduct(productId: string) {
  return withFallback(
    async () => {
      const response = await API.get<Product>(`/api/v1/catalog/products/${productId}`);
      return response.data;
    },
    mockProducts.find((product) => product.id === productId || product.slug === productId) ?? mockProducts[0],
  );
}

export async function getReviews(productId: string) {
  return withFallback(
    async () => {
      const response = await API.get<Review[]>(`/api/v1/reviews/${productId}`);
      return response.data;
    },
    mockReviews.filter((review) => review.productId === productId),
  );
}

export async function getSimilarProducts(productId: string) {
  return withFallback(
    async () => {
      const response = await API.get<Product[]>(`/api/v1/search/similar/${productId}`);
      return response.data;
    },
    mockProducts.filter((product) => product.id !== productId).slice(0, 3),
  );
}

export async function searchProducts(query: string, category?: string) {
  return withFallback(
    async () => {
      const response = await API.post<SearchResponse>("/api/v1/search", {
        query,
        mode: "hybrid",
        filters: {
          category,
        },
      });
      return response.data;
    },
    {
      items: mockProducts.filter((product) => {
        const text = `${product.name} ${product.description} ${product.category} ${product.brand ?? ""} ${product.tags.join(" ")}`.toLowerCase();
        const matchesQuery = !query.trim() || text.includes(query.toLowerCase());
        const matchesCategory =
          !category || product.category.toLowerCase() === category.toLowerCase();
        return matchesQuery && matchesCategory;
      }),
      facets: {
        categories: Array.from(new Set(mockProducts.map((product) => product.category))),
        sellers: Array.from(new Set(mockProducts.map((product) => product.sellerId))),
        brands: Array.from(
          new Set(
            mockProducts
              .map((product) => product.brand)
              .filter((brand): brand is string => Boolean(brand)),
          ),
        ),
      },
      total: mockProducts.filter((product) => {
        const text = `${product.name} ${product.description} ${product.category} ${product.brand ?? ""} ${product.tags.join(" ")}`.toLowerCase();
        const matchesQuery = !query.trim() || text.includes(query.toLowerCase());
        const matchesCategory =
          !category || product.category.toLowerCase() === category.toLowerCase();
        return matchesQuery && matchesCategory;
      }).length,
      suggestedCorrection: getDidYouMean(query),
    },
  );
}

export async function getAutocomplete(query: string) {
  return withFallback(
    async () => {
      const response = await API.get<string[]>("/api/v1/search/autocomplete", {
        params: { q: query },
      });
      return response.data;
    },
    mockProducts
      .map((product) => product.name)
      .filter((name) => name.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 5),
  );
}
