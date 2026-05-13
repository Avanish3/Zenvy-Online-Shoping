"use client";

import { useEffect, useState } from "react";
import { getProduct } from "@/services/productService";
import { getProductLiveSignal, subscribeToLiveProduct } from "@/services/experienceService";
import type { Product } from "@/types";

export function useViewerCount(productId: string) {
  const [product, setProduct] = useState<Product | null>(null);
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let active = true;

    getProduct(productId).then((item) => {
      if (!active) {
        return;
      }

      setProduct(item);
      setCount(getProductLiveSignal(item).viewerCount);
    });

    return () => {
      active = false;
    };
  }, [productId]);

  useEffect(() => {
    if (!product) {
      return;
    }

    const unsubscribe = subscribeToLiveProduct(product, (signal) => {
      setCount(signal.viewerCount);
    });

    return unsubscribe;
  }, [product]);

  return count;
}
