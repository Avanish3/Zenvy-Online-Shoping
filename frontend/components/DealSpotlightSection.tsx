import Link from "next/link";
import { ArrowRight, Clock3, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { DealCountdown } from "@/components/DealCountdown";
import { ProductVisual } from "@/components/ProductVisual";
import { formatCurrency } from "@/lib/formatters";
import { getDeliveryMessage, getDiscountPercent } from "@/lib/productSignals";
import { getProductLiveSignal } from "@/services/experienceService";
import type { Product } from "@/types";

interface DealSpotlightSectionProps {
  products: Product[];
}

export function DealSpotlightSection({ products }: DealSpotlightSectionProps) {
  if (!products.length) {
    return null;
  }

  const featured = products.slice(0, 3);

  return (
    <section className="section-shell py-3">
      <div className="overflow-hidden rounded-[30px] bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_48%,#f97316_100%)] text-white shadow-[0_24px_70px_rgba(15,23,42,0.12)]">
        <div className="grid gap-5 p-5 sm:p-6 xl:grid-cols-[0.92fr_1.08fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white/85">
              <Sparkles className="h-3.5 w-3.5" />
              Deal spotlight
            </div>
            <h2 className="mt-4 max-w-[28rem] text-[2rem] font-semibold tracking-[-0.04em] sm:text-[2.5rem]">
              Flash urgency without sacrificing trust.
            </h2>
            <p className="mt-4 max-w-[32rem] text-sm leading-7 text-white/80 sm:text-base">
              Put the strongest offers in one high-signal lane with countdown pressure,
              delivery reassurance, and seller confidence all visible above the fold.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[22px] border border-white/10 bg-white/10 p-4 backdrop-blur">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Clock3 className="h-4 w-4 text-amber-300" />
                  Ends soon
                </div>
                <p className="mt-2 text-sm font-semibold text-amber-100">
                  <DealCountdown seed="home-deal-spotlight" prefix="Deal closes in" />
                </p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/10 p-4 backdrop-blur">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Truck className="h-4 w-4 text-emerald-300" />
                  Delivery
                </div>
                <p className="mt-2 text-sm text-white/80">Fast-delivery inventory prioritized.</p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/10 p-4 backdrop-blur">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <ShieldCheck className="h-4 w-4 text-sky-300" />
                  Trust
                </div>
                <p className="mt-2 text-sm text-white/80">Verified sellers with return-ready flows.</p>
              </div>
            </div>

            <Link
              href="/products?sort=discount"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950"
            >
              Explore hottest deals
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {featured.map((product) => {
              const liveSignal = getProductLiveSignal(product);
              const discount = getDiscountPercent(product);

              return (
                <Link
                  key={product.id}
                  href={`/products/${product.slug ?? product.id}`}
                  className="rounded-[26px] border border-white/10 bg-white/95 p-4 text-slate-900 shadow-[0_18px_45px_rgba(15,23,42,0.12)] transition hover:-translate-y-1"
                >
                  <ProductVisual
                    category={product.category}
                    name={product.name}
                    compact
                    imageUrl={product.media?.[0]?.url}
                  />
                  <div className="mt-4 flex flex-wrap gap-2">
                    {discount > 0 ? (
                      <span className="rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-red-600">
                        {discount}% off
                      </span>
                    ) : null}
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                      {liveSignal.viewerCount} viewing
                    </span>
                  </div>
                  <p className="mt-3 line-clamp-2 text-base font-semibold text-slate-950">
                    {product.name}
                  </p>
                  <p className="mt-2 text-xl font-semibold text-slate-950">
                    {formatCurrency(product.price, product.currency)}
                  </p>
                  <p className="mt-1 text-xs font-medium text-emerald-700">
                    {getDeliveryMessage(product)}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
