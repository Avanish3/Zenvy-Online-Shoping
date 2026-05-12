"use client";

import { ProductCard } from "@/components/ProductCard";
import { SectionHeading } from "@/components/SectionHeading";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";

export function RecentlyViewedSection() {
  const { items } = useRecentlyViewed();

  if (!items.length) {
    return null;
  }

  return (
    <section className="section-shell space-y-6 py-4">
      <SectionHeading
        eyebrow="Recently viewed"
        title="Inspired by your browsing"
        description="Recently viewed items stay near the top so shoppers can resume high-intent browsing without friction."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {items.map((product) => (
          <ProductCard key={product.id} product={product} variant="compact" highlight="Viewed" />
        ))}
      </div>
    </section>
  );
}
