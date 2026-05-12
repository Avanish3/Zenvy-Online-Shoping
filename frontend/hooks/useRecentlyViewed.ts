"use client";

import { useCallback, useEffect, useState } from "react";
import type { Product } from "@/types";

const STORAGE_KEY = "zenvy:recently_viewed";

export function useRecentlyViewed() {
  const [items, setItems] = useState<Product[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      setItems(raw ? (JSON.parse(raw) as Product[]) : []);
    } catch {
      setItems([]);
    }
  }, []);

  const recordProduct = useCallback(
    (product: Product) => {
      setItems((current) => {
        const nextItems = [product, ...current.filter((item) => item.id !== product.id)].slice(
          0,
          8,
        );
        if (typeof window !== "undefined") {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextItems));
        }
        return nextItems;
      });
    },
    [],
  );

  return {
    items,
    recordProduct,
  };
}
