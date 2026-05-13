"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Camera, Mic, Search, Sparkles, TrendingUp } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { ProductVisual } from "@/components/ProductVisual";
import { SectionHeading } from "@/components/SectionHeading";
import { useVisualSearch } from "@/hooks/useVisualSearch";
import { useVoiceSearch } from "@/hooks/useVoiceSearch";
import {
  getCategoryQuickLinks,
  getDidYouMean,
  getTrendingSearches,
  getVisualSuggestions,
} from "@/services/experienceService";
import { askAssistant } from "@/services/aiService";
import { getAutocomplete, searchProducts } from "@/services/productService";
import { triggerHaptic } from "@/lib/haptics";
import { useSearchStore } from "@/store/searchStore";
import type { Product } from "@/types";

export default function SearchPage() {
  const { query: storedQuery, setQuery: setStoredQuery, addRecentSearch, recentSearches } =
    useSearchStore();
  const [query, setQuery] = useState(storedQuery || "audio");
  const [results, setResults] = useState<Product[]>([]);
  const [autocomplete, setAutocomplete] = useState<string[]>([]);
  const [assistantHint, setAssistantHint] = useState("");
  const [imageLabel, setImageLabel] = useState("");
  const [didYouMean, setDidYouMean] = useState<string | null>(null);
  const trendingSearches = getTrendingSearches();
  const visualSuggestions = useMemo(() => getVisualSuggestions(query), [query]);
  const categoryQuickLinks = getCategoryQuickLinks();
  const { isListening, isSupported, start } = useVoiceSearch((transcript) => {
    setQuery(transcript);
    addRecentSearch(transcript);
    triggerHaptic(12);
  });
  const {
    error: visualSearchError,
    handleFileChange,
    inputRef,
    isLoading: isVisualSearchLoading,
    openPicker,
  } = useVisualSearch({
    onResults: (nextResults, inferredLabel) => {
      setImageLabel(inferredLabel);
      setResults(nextResults);
    },
  });

  useEffect(() => {
    setStoredQuery(query);
    searchProducts(query).then((response) => {
      setResults(response.items);
      setDidYouMean(response.suggestedCorrection ?? getDidYouMean(query));
    });
    getAutocomplete(query).then(setAutocomplete);
    askAssistant(`Give me a short shopping tip for: ${query}`).then((response) =>
      setAssistantHint(response.message),
    );
  }, [query, setStoredQuery]);

  const headerStats = useMemo(
    () => [
      `${results.length} matches`,
      `${autocomplete.length} smart suggestions`,
      imageLabel ? `image hint: ${imageLabel}` : isListening ? "listening now" : "voice + image ready",
    ],
    [autocomplete.length, imageLabel, isListening, results.length],
  );

  return (
    <div className="section-shell space-y-8 py-10">
      <section className="glass-panel rounded-[34px] p-6 sm:p-8">
        <SectionHeading
          eyebrow="AI Search"
          title="Search like you are briefing a stylist, not feeding keywords."
          description="Text search, voice search, visual input, autocomplete, and guided corrections are all brought into one place so the search experience feels like its own product."
        />

        <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_auto]">
          <div className="flex items-center gap-3 rounded-[28px] border border-slate-100 bg-white px-4 py-4">
            <Search className="h-5 w-5 text-zenvy-rose" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onBlur={() => {
                if (query.trim()) {
                  addRecentSearch(query.trim());
                }
              }}
              className="w-full bg-transparent text-base outline-none placeholder:text-slate-400"
              placeholder="Best phone for coding under INR 70,000"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                if (!start()) {
                  setAssistantHint("Voice search is not available in this browser yet.");
                }
              }}
              className={`btn-secondary ${isListening ? "border-red-200 bg-red-50 text-red-600" : ""}`}
            >
              <Mic className="h-4 w-4" />
              {isListening ? "Listening" : isSupported ? "Voice" : "Voice off"}
            </button>
            <button onClick={openPicker} className="btn-secondary">
              <Camera className="h-4 w-4" />
              {isVisualSearchLoading ? "Scanning" : "Image"}
            </button>
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          {headerStats.map((stat) => (
            <span key={stat} className="pill-chip">
              {stat}
            </span>
          ))}
        </div>

        {didYouMean ? (
          <div className="mt-5 rounded-[24px] border border-[#dbeafe] bg-[#f8fbff] p-4 text-sm text-slate-700">
            Did you mean{" "}
            <button
              className="font-semibold text-[#1d4ed8]"
              onClick={() => setQuery(didYouMean)}
            >
              {didYouMean}
            </button>
            ?
          </div>
        ) : null}

        <div className="mt-5 rounded-[28px] bg-slate-50 p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-1 h-4 w-4 text-zenvy-rose" />
            <p className="text-sm leading-7 text-slate-600">
              {visualSearchError ?? assistantHint}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="glass-panel rounded-[32px] p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-zenvy-ink">
            <TrendingUp className="h-4 w-4 text-zenvy-rose" />
            Trending searches
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            {trendingSearches.map((item) => (
              <button
                key={item}
                onClick={() => {
                  setQuery(item);
                  triggerHaptic(10);
                }}
                className="pill-chip"
              >
                {item}
              </button>
            ))}
          </div>

          {recentSearches.length ? (
            <>
              <p className="mt-6 text-sm font-semibold text-zenvy-ink">Recent searches</p>
              <div className="mt-3 flex flex-wrap gap-3">
                {recentSearches.map((item) => (
                  <button key={item} onClick={() => setQuery(item)} className="pill-chip">
                    {item}
                  </button>
                ))}
              </div>
            </>
          ) : null}
        </div>

        <div className="glass-panel rounded-[32px] p-6">
          <p className="text-sm font-semibold text-zenvy-ink">Autocomplete with images</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {visualSuggestions.map((item) => (
              <button
                key={item.id}
                onClick={() => setQuery(item.text)}
                className="rounded-[22px] border border-slate-200 bg-white p-3 text-left transition hover:-translate-y-0.5 hover:shadow-sm"
              >
                <ProductVisual
                  category={item.category ?? "electronics"}
                  name={item.text}
                  compact
                  imageUrl={item.imageUrl}
                />
                <p className="mt-3 text-sm font-semibold text-zenvy-ink">{item.text}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">
                  {item.category ?? "suggestion"}
                </p>
              </button>
            ))}
          </div>

          {autocomplete.length ? (
            <>
              <p className="mt-6 text-sm font-semibold text-zenvy-ink">Suggested refinements</p>
              <div className="mt-3 flex flex-wrap gap-3">
                {autocomplete.map((item) => (
                  <button key={item} onClick={() => setQuery(item)} className="pill-chip">
                    {item}
                  </button>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </section>

      {results.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {results.map((product) => (
            <ProductCard key={product.id} product={product} highlight="Search match" />
          ))}
        </div>
      ) : (
        <div className="glass-panel rounded-[28px] p-8 text-center">
          <p className="text-lg font-semibold text-zenvy-ink">
            No direct matches found{query ? ` for "${query}"` : ""}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Try one of the trending searches, browse a category, or pivot with AI guidance.
          </p>
          {didYouMean ? (
            <p className="mt-3 text-sm text-slate-600">
              Did you mean{" "}
              <button className="font-semibold text-[#1d4ed8]" onClick={() => setQuery(didYouMean)}>
                {didYouMean}
              </button>
              ?
            </p>
          ) : null}
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {categoryQuickLinks.map((item) => (
              <Link key={item.label} href={item.href} className="pill-chip">
                {item.label}
              </Link>
            ))}
          </div>
          <Link href="/products" className="btn-primary mt-6">
            Open catalog
          </Link>
        </div>
      )}
    </div>
  );
}
