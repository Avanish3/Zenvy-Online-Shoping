import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Star, Truck } from "lucide-react";
import { ProductVisual } from "@/components/ProductVisual";
import { formatCurrency } from "@/lib/formatters";
import {
  getDeliveryMessage,
  getDiscountPercent,
  getPrimaryBadges,
  getReviewSummary,
} from "@/lib/productSignals";
import type { Product } from "@/types";

interface MarketplaceShelfProps {
  title: string;
  subtitle?: string;
  accent?: "blue" | "orange" | "white" | "navy";
  products: Product[];
}

const accentClasses = {
  blue: {
    shell: "bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_52%,#60a5fa_100%)] text-white",
    chip: "bg-white/12 text-white border-white/10",
  },
  orange: {
    shell: "bg-[linear-gradient(135deg,#3f1d11_0%,#f97316_42%,#fb7185_100%)] text-white",
    chip: "bg-white/12 text-white border-white/10",
  },
  white: {
    shell: "border border-slate-200 bg-white text-slate-900",
    chip: "border-slate-200 bg-slate-50 text-slate-700",
  },
  navy: {
    shell: "bg-[linear-gradient(135deg,#111827_0%,#1e3a8a_45%,#0f766e_100%)] text-white",
    chip: "bg-white/12 text-white border-white/10",
  },
};

export function MarketplaceShelf({
  title,
  subtitle,
  accent = "white",
  products,
}: MarketplaceShelfProps) {
  const accents = accentClasses[accent];

  return (
    <section className="section-shell py-3">
      <div className={`overflow-hidden rounded-[30px] shadow-[0_24px_70px_rgba(15,23,42,0.08)] ${accents.shell}`}>
        <div className="relative overflow-hidden px-5 py-5 sm:px-6 sm:py-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_24%)]" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.22em] ${accents.chip}`}
              >
                ZENVY edit
              </div>
              <h2 className="mt-3 text-[1.65rem] font-semibold tracking-[-0.04em] sm:text-[2rem]">
                {title}
              </h2>
              {subtitle ? (
                <p className={`mt-2 max-w-[38rem] text-sm leading-7 ${accent === "white" ? "text-slate-500" : "text-white/76"}`}>
                  {subtitle}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div
                className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${accents.chip}`}
              >
                Curated
              </div>
              <Link
                href="/products"
                prefetch={false}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold ${
                  accent === "white" ? "bg-slate-900 text-white" : "bg-white text-slate-900"
                }`}
              >
                Explore all
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        <div className={`px-3 pb-3 sm:px-4 sm:pb-4 ${accent === "white" ? "bg-white" : "bg-transparent"}`}>
          <div className="overflow-x-auto scrollbar-none">
            <div className="flex gap-4 pb-1">
              {products.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.slug ?? product.id}`}
                  className="group w-[16.25rem] shrink-0 overflow-hidden rounded-[26px] border border-slate-200/90 bg-white p-3 shadow-[0_14px_36px_rgba(15,23,42,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_50px_rgba(15,23,42,0.09)] sm:w-[16.75rem]"
                >
                  <div className="overflow-hidden rounded-[20px] bg-[linear-gradient(180deg,#f8fafc_0%,#eef4ff_100%)]">
                    {product.media?.[0]?.url ? (
                      <div className="relative h-48">
                        <Image
                          src={product.media[0].url}
                          alt={product.media[0].altText ?? product.name}
                          fill
                          className="object-contain p-5 transition duration-300 group-hover:scale-[1.03]"
                          sizes="(max-width: 768px) 70vw, 18vw"
                        />
                      </div>
                    ) : (
                      <ProductVisual category={product.category} name={product.name} compact />
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {getPrimaryBadges(product).slice(0, 2).map((badge) => (
                      <span
                        key={badge}
                        className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-700"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>

                  <p className="mt-3 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-slate-400">
                    {product.brand ?? product.category}
                  </p>
                  <p className="mt-1 line-clamp-2 min-h-[3.25rem] text-base font-semibold text-slate-950">
                    {product.name}
                  </p>

                  <div className="mt-3 flex items-center gap-2 text-[12px] text-slate-600">
                    <span className="inline-flex items-center gap-1 rounded-md bg-[#0f9d58] px-1.5 py-1 font-semibold text-white">
                      <Star className="h-3 w-3 fill-current" />
                      {(product.rating ?? 4.5).toFixed(1)}
                    </span>
                    <span>{getReviewSummary(product)}</span>
                  </div>

                  <div className="mt-3 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-[1.4rem] font-semibold tracking-[-0.03em] text-slate-950">
                        {formatCurrency(product.price, product.currency)}
                      </p>
                      {product.originalPrice ? (
                        <div className="mt-1 flex items-center gap-2 text-sm">
                          <span className="text-slate-400 line-through">
                            {formatCurrency(product.originalPrice, product.currency)}
                          </span>
                          <span className="font-semibold text-emerald-600">
                            {getDiscountPercent(product)}% OFF
                          </span>
                        </div>
                      ) : null}
                    </div>
                    <span className="rounded-full bg-slate-900 px-3 py-2 text-xs font-semibold text-white">
                      Open
                    </span>
                  </div>

                  <div className="mt-3 rounded-[18px] bg-slate-50 px-3 py-2.5 text-[12px] text-slate-700">
                    <div className="flex items-start gap-2">
                      <Truck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      <span className="line-clamp-2 font-medium">{getDeliveryMessage(product)}</span>
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
