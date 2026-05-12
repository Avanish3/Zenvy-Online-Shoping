import { API, withFallback } from "@/services/api";
import { mockOrders, mockProducts } from "@/services/mockData";
import type { Order } from "@/types";

export interface AdminOverview {
  gmvsnapshotInr: number;
  catalogValueInr: number;
  activeProducts: number;
  activeSellers: number;
  totalOrders: number;
  confirmedOrders: number;
  pendingOrders: number;
  lowStockProducts: number;
  generatedAt: string;
}

export interface AdminSeller {
  id: string;
  name: string;
  gstNumber?: string;
  status: string;
  rating: number;
  fulfillmentScore: number;
}

function buildOverviewFallback(): AdminOverview {
  const totalOrders = mockOrders.length;
  const confirmedOrders = mockOrders.filter((order) =>
    ["confirmed", "packed", "shipped", "delivered"].includes(order.status),
  ).length;

  return {
    gmvsnapshotInr: mockOrders.reduce((sum, order) => sum + order.totalAmount, 0),
    catalogValueInr: mockProducts.reduce((sum, product) => sum + product.price, 0),
    activeProducts: mockProducts.length,
    activeSellers: new Set(mockProducts.map((product) => product.sellerId)).size,
    totalOrders,
    confirmedOrders,
    pendingOrders: totalOrders - confirmedOrders,
    lowStockProducts: mockProducts.filter((product) => (product.availableQuantity ?? 0) < 20)
      .length,
    generatedAt: new Date().toISOString(),
  };
}

function buildSellerFallback(): AdminSeller[] {
  return Array.from(
    mockProducts.reduce((map, product) => {
      if (!map.has(product.sellerId)) {
        map.set(product.sellerId, {
          id: product.sellerId,
          name: product.sellerName ?? product.sellerId,
          gstNumber: "Available in backend records",
          status: "active",
          rating: Number((product.rating ?? 4.4).toFixed(1)),
          fulfillmentScore: Math.min(99, 80 + (product.dealScore ?? 10) / 5),
        });
      }

      return map;
    }, new Map<string, AdminSeller>()),
  ).map(([, seller]) => seller);
}

export async function getAdminOverview() {
  return withFallback(
    async () => {
      const response = await API.get<AdminOverview>("/api/v1/analytics/overview");
      return response.data;
    },
    buildOverviewFallback(),
  );
}

export async function getAdminOrders() {
  return withFallback(
    async () => {
      const response = await API.get<Order[]>("/api/v1/orders");
      return response.data;
    },
    mockOrders,
  );
}

export async function getAdminSellers() {
  return withFallback(
    async () => {
      const response = await API.get<AdminSeller[]>("/api/v1/sellers");
      return response.data;
    },
    buildSellerFallback(),
  );
}
