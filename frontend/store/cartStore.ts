"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartLine, Product } from "@/types";

interface CartState {
  items: CartLine[];
  couponCode: string | null;
  addItem: (product: Product) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  applyCoupon: (code: string | null) => void;
  itemCount: () => number;
  subtotal: () => number;
}

function buildLine(product: Product): CartLine {
  return {
    id: `line_${product.id}`,
    productId: product.id,
    variantId: product.variants?.[0]?.id,
    product,
    quantity: 1,
    unitPrice: product.price,
    currency: product.currency,
    lineTotal: product.price,
  };
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      couponCode: null,
      addItem: (product) =>
        set((state) => {
          const existing = state.items.find((item) => item.productId === product.id);
          if (existing) {
            return {
              items: state.items.map((item) =>
                item.productId === product.id
                  ? {
                      ...item,
                      quantity: item.quantity + 1,
                      lineTotal: (item.quantity + 1) * item.unitPrice,
                    }
                  : item,
              ),
            };
          }

          return {
            items: [...state.items, buildLine(product)],
          };
        }),
      updateQuantity: (productId, quantity) =>
        set((state) => ({
          items: state.items
            .map((item) =>
              item.productId === productId
                ? {
                    ...item,
                    quantity: Math.max(1, quantity),
                    lineTotal: Math.max(1, quantity) * item.unitPrice,
                  }
                : item,
            )
            .filter((item) => item.quantity > 0),
        })),
      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((item) => item.productId !== productId),
        })),
      clearCart: () => set({ items: [], couponCode: null }),
      applyCoupon: (code) => set({ couponCode: code }),
      itemCount: () =>
        get().items.reduce((total, item) => total + item.quantity, 0),
      subtotal: () =>
        get().items.reduce((total, item) => total + item.lineTotal, 0),
    }),
    {
      name: "zenvy-cart",
    },
  ),
);
