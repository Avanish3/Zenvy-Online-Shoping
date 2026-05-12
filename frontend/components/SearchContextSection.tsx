"use client";

import { ProductCard } from "@/components/ProductCard";
import { SectionHeading } from "@/components/SectionHeading";
import { useSearchStore } from "@/store/searchStore";
import type { Product } from "@/types";

interface SearchContextSectionProps {
  products: Product[];
}

const defaultQueries = ["phone", "audio", "home"];

export function SearchContextSection({ products }: SearchContextSectionProps) {
  const recentSearches = useSearchStore((state) => state.recentSearches);
  const searchFocus = recentSearches[0] ?? defaultQueries[0];
  const queries = recentSearches.length ? recentSearches : defaultQueries;

  const matches = products.filter((product) => {
    const searchableText = [
      product.name,
      product.description,
      product.brand ?? "",
      product.category,
      product.tags.join(" "),
    ]
      .join(" ")
      .toLowerCase();

    return queries.some((query) => searchableText.includes(query.toLowerCase()));
  });

  const items = (matches.length ? matches : products).slice(0, 5);
  const title = recentSearches.length
    ? `Based on your search history for "${searchFocus}"`
    : "Based on search history and fast-moving shopper intent";
  const description = recentSearches.length
    ? "This lane reacts to recent search intent so shoppers can continue where they left off."
    : "Search-led picks stay visible even before a user builds more history, which gives the homepage stronger shopping momentum.";

  return (
    <section className="section-shell space-y-6 py-4">
      <SectionHeading
        eyebrow="Search-led picks"
        title={title}
        description={description}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {items.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            variant="compact"
            highlight="Search match"
          />
        ))}
      </div>
    </section>
  );
}
