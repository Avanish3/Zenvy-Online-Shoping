import Link from "next/link";
import { CategoryGrid } from "@/components/CategoryGrid";

export default function CategoriesPage() {
  return (
    <div className="section-shell space-y-8 py-10">
      <section className="glass-panel rounded-[34px] p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zenvy-rose">
          Categories
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-zenvy-ink">
          Browse the full category map
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
          Jump into top departments, then refine by price, rating, and delivery speed from the
          product listing page.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/products?sort=popularity" className="pill-chip">
            Popular picks
          </Link>
          <Link href="/products?sort=newest" className="pill-chip">
            New arrivals
          </Link>
          <Link href="/products?view=list" className="pill-chip">
            Browse in list view
          </Link>
        </div>
      </section>

      <CategoryGrid />
    </div>
  );
}
