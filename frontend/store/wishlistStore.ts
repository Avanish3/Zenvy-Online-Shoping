"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/types";

interface WishlistState {
  items: Product[];
  alerts: Record<string, number>;
  toggleWishlist: (product: Product) => void;
  isWishlisted: (productId: string) => boolean;
  setPriceAlert: (productId: string, targetPrice: number) => void;
  clearPriceAlert: (productId: string) => void;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      alerts: {},
      toggleWishlist: (product) =>
        set((state) => ({
          items: state.items.some((item) => item.id === product.id)
            ? state.items.filter((item) => item.id !== product.id)
            : [...state.items, product],
        })),
      isWishlisted: (productId) => get().items.some((item) => item.id === productId),
      setPriceAlert: (productId, targetPrice) =>
        set((state) => ({
          alerts: {
            ...state.alerts,
            [productId]: targetPrice,
          },
        })),
      clearPriceAlert: (productId) =>
        set((state) => {
          const next = { ...state.alerts };
          delete next[productId];
          return { alerts: next };
        }),
      clearWishlist: () => set({ items: [] }),
    }),
    {
      name: "zenvy-wishlist",
    },
  ),
);
