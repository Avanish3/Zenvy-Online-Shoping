"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { SectionHeading } from "@/components/SectionHeading";
import { searchProducts } from "@/services/productService";
import { useCompareStore } from "@/store/compareStore";
import { useSearchStore } from "@/store/searchStore";
import type { Product } from "@/types";

const categoryAliasMap: Record<string, string> = {
  mobiles: "electronics",
  beauty: "wearables",
  appliances: "audio",
  toys: "wearables",
  auto: "electronics",
  sports: "fashion",
  furniture: "home",
  "food & more": "grocery",
};

export function ProductsPageClient() {
  const searchParams = useSearchParams();
  const { filters, setFilters, resetFilters, addRecentSearch } = useSearchStore();
  const comparedItems = useCompareStore((state) => state.items);
  const clearCompare = useCompareStore((state) => state.clearCompare);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);

  const selectedCategoryFromUrl = useMemo(() => {
    const raw = searchParams.get("category")?.trim().toLowerCase();
    if (!raw) {
      return undefined;
    }

    return categoryAliasMap[raw] ?? raw;
  }, [searchParams]);

  useEffect(() => {
    const nextBrand = searchParams.get("brand")?.trim() || undefined;
    const nextQuery = searchParams.get("q")?.trim() || "";

    setQuery(nextQuery);
    setFilters({
      category: selectedCategoryFromUrl,
      brand: nextBrand,
    });
  }, [searchParams, selectedCategoryFromUrl, setFilters]);

  useEffect(() => {
    searchProducts(query, filters.category).then((response) => {
      setAvailableBrands(response.facets.brands);
      const sorted = [...response.items]
        .filter((product) =>
          filters.brand ? product.brand?.toLowerCase() === filters.brand.toLowerCase() : true,
        )
        .filter((product) => (filters.rating ? (product.rating ?? 0) >= filters.rating : true))
        .filter((product) => (filters.minPrice ? product.price >= filters.minPrice : true))
        .filter((product) => (filters.maxPrice ? product.price <= filters.maxPrice : true));

      if (filters.sort === "price-asc") {
        sorted.sort((left, right) => left.price - right.price);
      } else if (filters.sort === "price-desc") {
        sorted.sort((left, right) => right.price - left.price);
      } else if (filters.sort === "rating") {
        sorted.sort((left, right) => (right.rating ?? 0) - (left.rating ?? 0));
      } else if (filters.sort === "discount") {
        sorted.sort(
          (left, right) =>
            ((right.originalPrice ?? right.price) - right.price) -
            ((left.originalPrice ?? left.price) - left.price),
        );
      }

      setResults(sorted);
    });
  }, [filters, query]);

  const activeFilterCount = useMemo(
    () =>
      [filters.category, filters.brand, filters.rating, filters.minPrice, filters.maxPrice].filter(
        Boolean,
      ).length,
    [filters],
  );
  const activeFilterChips = useMemo(
    () =>
      [
        filters.category ? `Category: ${filters.category}` : null,
        filters.brand ? `Brand: ${filters.brand}` : null,
        filters.rating ? `${filters.rating}+ stars` : null,
        filters.minPrice ? `Min INR ${filters.minPrice}` : null,
        filters.maxPrice ? `Max INR ${filters.maxPrice}` : null,
      ].filter((value): value is string => Boolean(value)),
    [filters],
  );

  return (
    <div className="section-shell space-y-8 py-10">
      <section className="glass-panel rounded-[34px] p-6 sm:p-8">
        <SectionHeading
          eyebrow="Catalog"
          title={
            filters.category
              ? `${filters.category[0].toUpperCase()}${filters.category.slice(1)} picks on ZENVY`
              : "Faceted browsing with a cleaner product listing experience."
          }
          description={
            filters.category
              ? "Category taps from the top navbar now open matching product results with price, offer, and product details."
              : "This page covers the document's product listing section with filters, sorting, shareable discovery lanes, and both grid and list presentation."
          }
        />

        <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_auto]">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onBlur={() => {
              if (query.trim()) {
                addRecentSearch(query.trim());
              }
            }}
            className="input-field"
            placeholder="Search products, use cases, or brands"
          />
          <div className="flex flex-wrap gap-3">
            <button className="btn-secondary">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </button>
            <button className="btn-secondary">
              <ChevronDown className="h-4 w-4" />
              {filters.sort ?? "relevance"}
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-[18rem_1fr]">
          <aside className="space-y-4 rounded-[28px] border border-slate-100 bg-white p-5">
            <div>
              <p className="text-sm font-semibold text-zenvy-ink">Category</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {["electronics", "fashion", "audio", "wearables", "home", "grocery"].map(
                  (category) => (
                    <button
                      key={category}
                      className={`rounded-full px-3 py-2 text-sm ${
                        filters.category === category
                          ? "bg-zenvy-ink text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                      onClick={() =>
                        setFilters({
                          category: filters.category === category ? undefined : category,
                        })
                      }
                    >
                      {category}
                    </button>
                  ),
                )}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-zenvy-ink">Brand</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {availableBrands.slice(0, 6).map((brand) => (
                  <button
                    key={brand}
                    className={`rounded-full px-3 py-2 text-sm ${
                      filters.brand === brand
                        ? "bg-zenvy-ink text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                    onClick={() =>
                      setFilters({ brand: filters.brand === brand ? undefined : brand })
                    }
                  >
                    {brand}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-zenvy-ink">Rating</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {[4, 4.5].map((rating) => (
                  <button
                    key={rating}
                    className={`rounded-full px-3 py-2 text-sm ${
                      filters.rating === rating
                        ? "bg-zenvy-ink text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                    onClick={() =>
                      setFilters({ rating: filters.rating === rating ? undefined : rating })
                    }
                  >
                    {rating}+ stars
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-zenvy-ink">Sort</p>
              <select
                className="input-field mt-3"
                value={filters.sort ?? "relevance"}
                onChange={(event) =>
                  setFilters({
                    sort: event.target.value as NonNullable<typeof filters.sort>,
                  })
                }
              >
                <option value="relevance">Relevance</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
                <option value="rating">Customer rating</option>
                <option value="discount">Discount</option>
              </select>
            </div>

            <button className="btn-secondary w-full" onClick={resetFilters}>
              Clear all filters
            </button>
          </aside>

          <div>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-600">
                Showing {results.length} results
                {query ? ` for "${query}"` : ""}
                {activeFilterCount ? ` | ${activeFilterCount} active filters` : ""}
              </p>
              <div className="flex gap-2">
                <button
                  className={`rounded-full px-4 py-2 text-sm ${
                    (filters.view ?? "grid") === "grid"
                      ? "bg-zenvy-ink text-white"
                      : "bg-white text-slate-600"
                  }`}
                  onClick={() => setFilters({ view: "grid" })}
                >
                  Grid
                </button>
                <button
                  className={`rounded-full px-4 py-2 text-sm ${
                    filters.view === "list"
                      ? "bg-zenvy-ink text-white"
                      : "bg-white text-slate-600"
                  }`}
                  onClick={() => setFilters({ view: "list" })}
                >
                  List
                </button>
              </div>
            </div>

            {activeFilterChips.length ? (
              <div className="mb-5 flex flex-wrap gap-2">
                {activeFilterChips.map((chip) => (
                  <span key={chip} className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
                    {chip}
                  </span>
                ))}
              </div>
            ) : null}

            {results.length ? (
              <div
                className={`grid gap-5 ${
                  (filters.view ?? "grid") === "list"
                    ? "grid-cols-1"
                    : "sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
                }`}
              >
                {results.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    variant={(filters.view ?? "grid") === "list" ? "list" : "grid"}
                    highlight={product.recommendationReason ? "Why this?" : undefined}
                    showCompare
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-[28px] border border-dashed border-slate-200 bg-white p-10 text-center">
                <p className="text-lg font-semibold text-zenvy-ink">
                  No products matched this combination.
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Try widening the budget or clearing one filter.
                </p>
                <Link href="/search" prefetch={false} className="btn-primary mt-6">
                  Switch to AI search
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {comparedItems.length >= 2 ? (
        <div className="fixed bottom-20 left-1/2 z-40 flex w-[min(92vw,38rem)] -translate-x-1/2 items-center justify-between gap-3 rounded-full border border-slate-200 bg-white px-4 py-3 shadow-glow md:bottom-6">
          <p className="text-sm font-medium text-slate-700">
            {comparedItems.length} products ready to compare
          </p>
          <div className="flex gap-2">
            <button className="btn-secondary px-4 py-2" onClick={clearCompare}>
              Clear
            </button>
            <Link
              href={`/compare?ids=${comparedItems.map((item) => item.id).join(",")}`}
              prefetch={false}
              className="btn-primary px-4 py-2"
            >
              Compare
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
