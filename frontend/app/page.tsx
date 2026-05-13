import { Suspense } from "react";
import Link from "next/link";
import { CategoryGrid } from "@/components/CategoryGrid";
import { DealSpotlightSection } from "@/components/DealSpotlightSection";
import { HeroBanner } from "@/components/HeroBanner";
import { InlineAiAssistantSection } from "@/components/InlineAiAssistantSection";
import { MarketplaceShelf } from "@/components/MarketplaceShelf";
import { PersonalizedSection } from "@/components/PersonalizedSection";
import { PersonalizedSectionSkeleton } from "@/components/PersonalizedSectionSkeleton";
import { RecentlyViewedSection } from "@/components/RecentlyViewedSection";
import { SearchContextSection } from "@/components/SearchContextSection";
import { getBudgetQuickLinks, getCategoryQuickLinks } from "@/services/experienceService";
import { getProducts } from "@/services/productService";

export const revalidate = 300;

export default async function HomePage() {
  const products = await getProducts();

  const interestingFinds = products.slice(0, 6);
  const trendingNow = products
    .filter((product) => product.badges?.includes("trending") || product.badges?.includes("bestseller"))
    .slice(0, 6);
  const electronics = products.filter((product) => product.category === "electronics").slice(0, 6);
  const fashionAndLifestyle = products.filter((product) => product.category === "fashion").slice(0, 6);
  const homeAndUtility = products
    .filter((product) => ["home", "grocery", "audio"].includes(product.category))
    .slice(0, 6);
  const budgetLinks = getBudgetQuickLinks();
  const categoryQuickLinks = getCategoryQuickLinks();

  return (
    <div className="bg-[#f1f3f6] pb-10">
      <HeroBanner featuredProducts={interestingFinds.slice(0, 3)} />
      <DealSpotlightSection products={trendingNow.length ? trendingNow : interestingFinds} />
      <section className="section-shell py-3">
        <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              Shop by budget
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {budgetLinks.map((item) => (
                <Link key={item.label} href={item.href} className="pill-chip">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              Category quick links
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {categoryQuickLinks.map((item) => (
                <Link key={item.label} href={item.href} className="pill-chip">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
      <InlineAiAssistantSection />

      <MarketplaceShelf
        title="Top deals today"
        subtitle="Discounts, ratings, and fast-delivery picks shoppers can act on quickly"
        accent="blue"
        products={interestingFinds}
      />

      <CategoryGrid />

      <MarketplaceShelf
        title="Trending now"
        subtitle="High-velocity products shoppers are clicking right now"
        accent="white"
        products={trendingNow}
      />

      <RecentlyViewedSection />

      <SearchContextSection products={products} />

      <Suspense fallback={<PersonalizedSectionSkeleton />}>
        <PersonalizedSection />
      </Suspense>

      <MarketplaceShelf
        title="Top picks in electronics"
        subtitle="Phones, laptops, tablets, and power gear moving now"
        accent="white"
        products={electronics}
      />

      <MarketplaceShelf
        title="Fashion, wearables & style"
        subtitle="High-velocity fashion picks with stronger conversion signals"
        accent="orange"
        products={fashionAndLifestyle}
      />

      <MarketplaceShelf
        title="Home decor & furnishing"
        subtitle="Utility, decor, and repeat-buy essentials in one lane"
        accent="navy"
        products={homeAndUtility}
      />
    </div>
  );
}
