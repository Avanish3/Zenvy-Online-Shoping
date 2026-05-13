"use client";

import { useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductVisual } from "@/components/ProductVisual";
import { triggerHaptic } from "@/lib/haptics";
import type { Product } from "@/types";

export function ProductImageGallery({ product }: { product: Product }) {
  const slides = useMemo(
    () =>
      (product.variants?.slice(0, 4).map((variant, index) => ({
        id: variant.id,
        name: variant.label,
        imageUrl: product.media?.[index % (product.media?.length || 1)]?.url,
      })) ?? []).length
        ? product.variants!.slice(0, 4).map((variant, index) => ({
            id: variant.id,
            name: variant.label,
            imageUrl: product.media?.[index % (product.media?.length || 1)]?.url,
          }))
        : [
            {
              id: `${product.id}-hero`,
              name: product.name,
              imageUrl: product.media?.[0]?.url,
            },
          ],
    [product],
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  function move(delta: number) {
    setActiveIndex((current) => {
      const next = (current + delta + slides.length) % slides.length;
      triggerHaptic(10);
      return next;
    });
  }

  function handleTouchStart(clientX: number) {
    touchStartX.current = clientX;
  }

  function handleTouchEnd(clientX: number) {
    if (touchStartX.current === null) {
      return;
    }

    const delta = clientX - touchStartX.current;
    touchStartX.current = null;

    if (Math.abs(delta) < 40) {
      return;
    }

    move(delta > 0 ? -1 : 1);
  }

  return (
    <div className="space-y-4">
      <div
        className="relative"
        onTouchStart={(event) => handleTouchStart(event.touches[0]?.clientX ?? 0)}
        onTouchEnd={(event) => handleTouchEnd(event.changedTouches[0]?.clientX ?? 0)}
      >
        <ProductVisual
          category={product.category}
          name={slides[activeIndex]?.name ?? product.name}
          imageUrl={slides[activeIndex]?.imageUrl}
        />
        {slides.length > 1 ? (
          <>
            <button
              className="absolute left-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-slate-700 shadow-sm"
              onClick={() => move(-1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              className="absolute right-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-slate-700 shadow-sm"
              onClick={() => move(1)}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        ) : null}
      </div>

      <div className="flex gap-3 overflow-x-auto scrollbar-none">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            className={`min-w-[6rem] rounded-[18px] border p-2 text-left ${
              activeIndex === index ? "border-[#1d4ed8] bg-[#f5f9ff]" : "border-slate-200 bg-white"
            }`}
            onClick={() => {
              setActiveIndex(index);
              triggerHaptic(8);
            }}
          >
            <ProductVisual
              category={product.category}
              name={slide.name}
              imageUrl={slide.imageUrl}
              compact
            />
            <p className="mt-2 line-clamp-1 text-xs font-medium text-slate-600">{slide.name}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
