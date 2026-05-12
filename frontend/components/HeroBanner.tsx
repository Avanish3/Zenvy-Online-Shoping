"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  ArrowRight,
  Clock3,
  Search,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";
import { DealCountdown } from "@/components/DealCountdown";
import { ProductVisual } from "@/components/ProductVisual";
import { formatCurrency } from "@/lib/formatters";
import { useSearchStore } from "@/store/searchStore";
import { useUiStore } from "@/store/uiStore";
import type { Product } from "@/types";

const heroSlides = [
  {
    eyebrow: "ZENVY signature drop",
    title: "A smarter marketplace with premium pace.",
    text: "Blend the energy of a live deal platform with the trust and depth of a modern commerce destination. ZENVY keeps discovery fast, clean, and elevated.",
    cta: "Enter deal gallery",
    href: "/products",
    classes: "from-[#0f172a] via-[#1d4ed8] to-[#5b21b6]",
  },
  {
    eyebrow: "Precision picks",
    title: "Products curated like an editorial front page.",
    text: "Budget-aware search, AI guidance, and high-signal merchandising help shoppers move from intent to checkout without scrolling through noise.",
    cta: "Explore mobiles",
    href: "/products?category=electronics",
    classes: "from-[#1f2937] via-[#7c3aed] to-[#f97316]",
  },
  {
    eyebrow: "Live demand",
    title: "Dashboards and storefronts that feel connected.",
    text: "The same premium system powers shopping, seller views, and admin control so the whole product feels like one serious platform.",
    cta: "See trending",
    href: "/products",
    classes: "from-[#111827] via-[#0f3b66] to-[#0f766e]",
  },
];

const aiPrompts = [
  "Find best phone under INR 20,000",
  "Best earbuds for commute under INR 5,000",
  "Suggest home decor under INR 3,000",
  "Gift ideas for fitness lovers",
];

interface HeroBannerProps {
  featuredProducts?: Product[];
}

export function HeroBanner({ featuredProducts = [] }: HeroBannerProps) {
  const router = useRouter();
  const setChatbotOpen = useUiStore((state) => state.setChatbotOpen);
  const addRecentSearch = useSearchStore((state) => state.addRecentSearch);
  const setStoredQuery = useSearchStore((state) => state.setQuery);
  const [activeSlide, setActiveSlide] = useState(0);
  const [query, setQuery] = useState(aiPrompts[0]);
  const spotlightProducts = featuredProducts.slice(0, 3);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveSlide((value) => (value + 1) % heroSlides.length);
    }, 4200);

    return () => window.clearInterval(interval);
  }, []);

  function submitQuery(nextQuery: string) {
    const value = nextQuery.trim();

    if (!value) {
      return;
    }

    setStoredQuery(value);
    addRecentSearch(value);
    router.push(`/search?q=${encodeURIComponent(value)}`);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submitQuery(query);
  }

  const slide = heroSlides[activeSlide];

  return (
    <section className="section-shell py-3 sm:py-4">
      <div className="grid gap-4 xl:grid-cols-[1.18fr_0.82fr]">
        <div
          className={`relative min-h-[360px] overflow-hidden rounded-[32px] bg-gradient-to-br ${slide.classes} p-6 text-white shadow-[0_30px_80px_rgba(15,23,42,0.16)] sm:min-h-[410px] sm:p-8`}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.08),transparent_55%)]" />
          <div className="absolute right-[-28px] top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute bottom-[-36px] left-8 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute right-8 top-8 hidden w-[15rem] rounded-[28px] border border-white/20 bg-white/10 p-4 backdrop-blur xl:block">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/70">
              Market pulse
            </p>
            <div className="mt-4 grid gap-3">
              <div className="rounded-[22px] bg-white/10 p-3">
                <p className="text-[0.7rem] uppercase tracking-[0.22em] text-white/65">
                  Conversion lane
                </p>
                <p className="mt-1 text-2xl font-semibold">4.8x faster</p>
                <p className="mt-1 text-sm text-white/70">Search to shortlist motion</p>
              </div>
              <div className="rounded-[22px] bg-white/10 p-3">
                <p className="text-[0.7rem] uppercase tracking-[0.22em] text-white/65">
                  Trusted checkout
                </p>
                <p className="mt-1 text-2xl font-semibold">98%</p>
                <p className="mt-1 text-sm text-white/70">High-signal catalog coverage</p>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex h-full flex-col">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/90">
              <Sparkles className="h-3.5 w-3.5" />
              {slide.eyebrow}
            </div>
            <h2 className="mt-6 max-w-[30rem] text-4xl font-bold leading-[0.95] tracking-[-0.04em] sm:text-[3.6rem]">
              {slide.title}
            </h2>
            <p className="mt-4 max-w-[31rem] text-sm leading-7 text-white/82 sm:text-base">
              {slide.text}
            </p>

            <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/90">
              <span className="rounded-full border border-white/10 bg-white/15 px-3 py-2">
                Premium curation
              </span>
              <span className="rounded-full border border-white/10 bg-white/15 px-3 py-2">
                Fast delivery
              </span>
              <span className="rounded-full border border-white/10 bg-white/15 px-3 py-2">
                Live deals
              </span>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-[22px] border border-white/10 bg-white/10 p-4 backdrop-blur">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <Clock3 className="h-4 w-4 text-[#fbbf24]" />
                    Deal timer
                  </div>
                  <p className="mt-2 text-sm font-semibold text-[#fef08a]">
                    <DealCountdown seed="homepage-hero" prefix="Ends in" />
                  </p>
                </div>
                <div className="rounded-[22px] border border-white/10 bg-white/10 p-4 backdrop-blur">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <Truck className="h-4 w-4 text-emerald-300" />
                    Delivery
                  </div>
                  <p className="mt-2 text-sm text-white/75">Premium picks shipped by tomorrow.</p>
                </div>
                <div className="rounded-[22px] border border-white/10 bg-white/10 p-4 backdrop-blur">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <ShieldCheck className="h-4 w-4 text-sky-300" />
                    Trust
                  </div>
                  <p className="mt-2 text-sm text-white/75">Verified sellers and simpler returns.</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 md:justify-end">
                <Link
                  href={slide.href}
                  className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900"
                >
                  {slide.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <div className="flex gap-2">
                  {heroSlides.map((item, index) => (
                    <button
                      key={item.title}
                      aria-label={`Go to hero slide ${index + 1}`}
                      className={`h-2 rounded-full transition-all ${
                        activeSlide === index ? "w-8 bg-white" : "w-2 bg-white/45"
                      }`}
                      onClick={() => setActiveSlide(index)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-[32px] border border-white/70 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-[#eef4ff] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#1d4ed8]">
                  <Sparkles className="h-3.5 w-3.5" />
                  AI shopping copilot
                </div>
                <h3 className="mt-4 max-w-[20rem] text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-[2rem]">
                  Ask smarter. Shop cleaner.
                </h3>
              </div>
              <div className="rounded-[22px] bg-slate-50 px-4 py-3 text-right">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Search modes
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-950">AI, budget, brand</p>
              </div>
            </div>

            <p className="mt-3 text-sm leading-7 text-slate-600">
              Put the assistant at the center of discovery with budget-first prompts, shortlist support, and guided recommendations from the same premium storefront surface.
            </p>

            <form onSubmit={handleSubmit} className="mt-5">
              <div className="flex items-center gap-3 rounded-[22px] border border-[#c7d7ff] bg-[#f8fbff] px-4 py-3 shadow-sm">
                <Search className="h-5 w-5 text-slate-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="w-full bg-transparent text-base outline-none placeholder:text-slate-400"
                  placeholder="Try 'Best phone for camera and battery under INR 25,000'"
                />
                <button
                  type="submit"
                  className="rounded-full bg-[#1d4ed8] px-4 py-2 text-sm font-semibold text-white"
                >
                  Go
                </button>
              </div>
            </form>

            <div className="mt-4 flex flex-wrap gap-2">
              {aiPrompts.map((prompt) => (
                <button
                  key={prompt}
                  className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                  onClick={() => {
                    setQuery(prompt);
                    submitQuery(prompt);
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                className="inline-flex items-center gap-2 rounded-full bg-zenvy-ink px-4 py-3 text-sm font-semibold text-white"
                onClick={() => setChatbotOpen(true)}
              >
                Ask AI now
                <ArrowRight className="h-4 w-4" />
              </button>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
              >
                Browse all deals
              </Link>
            </div>
          </div>

          <div className="rounded-[32px] border border-[#e7ebf5] bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.06)] sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Spotlight picks
                </p>
                <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-slate-950">
                  Premium products worth opening first
                </h3>
              </div>
              <Link href="/products" className="text-sm font-semibold text-[#1d4ed8]">
                View all
              </Link>
            </div>

            <div className="mt-5 grid gap-3">
              {spotlightProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.slug ?? product.id}`}
                  className="grid gap-3 rounded-[24px] border border-slate-200 bg-[#fbfcff] p-3 transition hover:-translate-y-0.5 hover:shadow-sm sm:grid-cols-[7.5rem_1fr]"
                >
                  <ProductVisual
                    category={product.category}
                    name={product.name}
                    compact
                    imageUrl={product.media?.[0]?.url}
                  />
                  <div className="min-w-0">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                      {product.brand ?? product.category}
                    </p>
                    <p className="mt-1 line-clamp-2 text-base font-semibold text-slate-950">
                      {product.name}
                    </p>
                    <p className="mt-2 line-clamp-2 text-sm text-slate-500">{product.description}</p>
                    <div className="mt-3 flex items-end justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold text-slate-950">
                          {formatCurrency(product.price, product.currency)}
                        </p>
                        <p className="text-xs font-medium text-emerald-600">
                          {(product.rating ?? 4.6).toFixed(1)} rating
                        </p>
                      </div>
                      <span className="rounded-full bg-slate-900 px-3 py-2 text-xs font-semibold text-white">
                        Open
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
