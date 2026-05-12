"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/types";

interface CompareState {
  items: Product[];
  toggleCompare: (product: Product) => void;
  clearCompare: () => void;
  isCompared: (productId: string) => boolean;
}

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      items: [],
      toggleCompare: (product) =>
        set((state) => {
          const exists = state.items.some((item) => item.id === product.id);
          if (exists) {
            return {
              items: state.items.filter((item) => item.id !== product.id),
            };
          }

          return {
            items: [...state.items, product].slice(-4),
          };
        }),
      clearCompare: () => set({ items: [] }),
      isCompared: (productId) => get().items.some((item) => item.id === productId),
    }),
    {
      name: "zenvy-compare",
    },
  ),
);
