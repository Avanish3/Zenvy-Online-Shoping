import { withFallback, API } from "@/services/api";
import { getLiveCommerceSessions } from "@/services/experienceService";
import { mockOrders } from "@/services/mockData";
import { getProduct } from "@/services/productService";
import type {
  DynamicPriceSnapshot,
  InventorySnapshot,
  LiveCommerceSession,
  LoyaltySummary,
  PriceHistoryPoint,
  UserNotification,
} from "@/types";

export async function getDynamicPrice(variantId: string) {
  try {
    const response = await API.get<DynamicPriceSnapshot>(`/api/v1/pricing/${variantId}`);
    return response.data;
  } catch {
    const product = await getProduct(variantId);
    return {
      variantId: product.id,
      productId: product.id,
      currentPrice: product.price,
      originalPrice: product.price,
      currency: product.currency,
      reasons: ["Preview mode is using product pricing from the catalog response."],
    };
  }
}

export async function getPriceHistory(variantId: string) {
  try {
    const response = await API.get<PriceHistoryPoint[]>(`/api/v1/pricing/${variantId}/history`);
    return response.data;
  } catch {
    const product = await getProduct(variantId);
    return Array.from({ length: 7 }).map((_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      return {
        date: date.toISOString().slice(0, 10),
        amount: Math.round(product.price * (1 + (((index % 3) - 1) * 0.015))),
        currency: product.currency,
      };
    });
  }
}

export async function getInventorySnapshot(productId: string) {
  try {
    const response = await API.get<InventorySnapshot>(`/api/v1/inventory/${productId}`);
    return response.data;
  } catch {
    const product = await getProduct(productId);
    return {
      productId: product.id,
      availableQuantity: product.availableQuantity ?? 0,
      reservedQuantity: product.reservedQuantity ?? 0,
      warehouseCode: product.warehouseCode ?? null,
    };
  }
}

export async function getLiveEvents() {
  return withFallback(
    async () => {
      const response = await API.get<LiveCommerceSession[]>("/api/v1/live/events");
      return response.data;
    },
    getLiveCommerceSessions(),
  );
}

export async function getUserNotifications(userId: string) {
  return withFallback(
    async () => {
      const response = await API.get<UserNotification[]>(`/api/v1/notifications/${userId}`);
      return response.data;
    },
    [
      {
        id: "notif-local-1",
        userId,
        channel: "push",
        title: "Order status",
        message: `Your latest order ${mockOrders[0]?.orderNumber ?? "ZENVY order"} is ready for the next step.`,
        status: "unread",
        createdAt: new Date().toISOString(),
        readAt: null,
      },
    ],
  );
}

export async function markNotificationRead(notificationId: string) {
  return withFallback(
    async () => {
      const response = await API.post<UserNotification>(`/api/v1/notifications/${notificationId}/read`);
      return response.data;
    },
    {
      id: notificationId,
      userId: "local-user",
      channel: "in_app",
      title: "Notification read",
      message: "Marked as read in preview mode.",
      status: "read",
      createdAt: new Date().toISOString(),
      readAt: new Date().toISOString(),
    },
  );
}

export async function getLoyaltySummary(userId: string) {
  return withFallback(
    async () => {
      const response = await API.get<LoyaltySummary>(`/api/v1/loyalty/${userId}`);
      return response.data;
    },
    {
      userId,
      pointsBalance: 1240,
      tier: "gold" as const,
      nextTier: "platinum" as const,
    } satisfies LoyaltySummary,
  );
}
