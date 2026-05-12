import { API, withFallback } from "@/services/api";
import { mockCart, mockOrders, mockTracking } from "@/services/mockData";
import type { Cart, Order, PaymentIntent, TrackingSummary } from "@/types";

export async function getCart(userId: string) {
  return withFallback(
    async () => {
      const response = await API.get<Cart>(`/api/v1/carts/${userId}`);
      return response.data;
    },
    { ...mockCart, userId },
  );
}

export async function saveCartItem(userId: string, productId: string, quantity: number) {
  return withFallback(
    async () => {
      const response = await API.put<Cart>(`/api/v1/carts/${userId}/items`, {
        productId,
        quantity,
      });
      return response.data;
    },
    mockCart,
  );
}

export async function createOrder(userId: string, items: Array<{ productId: string; quantity: number }>) {
  return withFallback(
    async () => {
      const response = await API.post<Order>("/api/v1/orders", {
        userId,
        items,
      });
      return response.data;
    },
    {
      ...mockOrders[0],
      id: `local-order-${Date.now()}`,
      orderNumber: `ZENVY-${Date.now()}`,
      userId,
      createdAt: new Date().toISOString(),
      items: items.map((item) => {
        const match = mockOrders[0].items.find(
          (orderItem) => orderItem.productId === item.productId,
        );
        return {
          productId: item.productId,
          productName: match?.productName ?? "ZENVY product",
          quantity: item.quantity,
          unitPrice: match?.unitPrice ?? 0,
          lineTotal: (match?.unitPrice ?? 0) * item.quantity,
        };
      }),
    },
  );
}

export async function listOrders(userId: string) {
  return withFallback(
    async () => {
      const response = await API.get<Order[]>(`/api/v1/orders/user/${userId}`);
      return response.data;
    },
    mockOrders,
  );
}

export async function getTracking(orderId: string) {
  return withFallback(
    async () => {
      const response = await API.get<TrackingSummary>(`/api/v1/orders/${orderId}/tracking`);
      return response.data;
    },
    {
      ...mockTracking,
      orderId,
    },
  );
}

export async function createPaymentIntent(orderId: string, provider: "razorpay" | "stripe") {
  return withFallback(
    async () => {
      const response = await API.post<PaymentIntent>("/api/v1/payments/intents", {
        orderId,
        provider,
      });
      return response.data;
    },
    {
      id: `local-payment-${Date.now()}`,
      orderId,
      provider,
      status: "created",
      amount: mockOrders[0].totalAmount,
      currency: "INR",
      clientToken: "local-client-token",
      providerReference: `local-${provider}-${Date.now()}`,
    },
  );
}

export async function confirmPayment(paymentId: string, providerPaymentId: string) {
  return withFallback(
    async () => {
      const response = await API.post(`/api/v1/payments/${paymentId}/confirm`, {
        providerPaymentId,
      });
      return response.data;
    },
    {
      paymentId,
      providerPaymentId,
      status: "confirmed",
    },
  );
}

export async function createShippingQuote(userId: string, items: Array<{ productId: string; quantity: number }>) {
  return withFallback(
    async () => {
      const response = await API.post("/api/v1/shipping/quotes", {
        userId,
        destinationPincode: "560001",
        mode: "express",
        items,
      });
      return response.data;
    },
    {
      quoteId: "local-quote",
      amount: 149,
      currency: "INR",
      estimatedDays: 2,
      carrier: "Shiprocket Express",
    },
  );
}
