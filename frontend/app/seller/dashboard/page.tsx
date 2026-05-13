import { BarChart3, Package, ShieldCheck, Sparkles, Star, TrendingUp, Truck, Wallet } from "lucide-react";
import { ProductVisual } from "@/components/ProductVisual";
import { SellerAnalytics } from "@/components/seller/AnalyticsCharts";
import { formatCurrency } from "@/lib/formatters";
import { getLiveCommerceSessions, getSellerAnalyticsSummary } from "@/services/experienceService";
import { mockProducts } from "@/services/mockData";

export default function SellerDashboardPage() {
  const sellerProducts = mockProducts.slice(0, 6);
  const totalInventory = sellerProducts.reduce(
    (sum, product) => sum + (product.availableQuantity ?? 0),
    0,
  );
  const averageRating =
    sellerProducts.reduce((sum, product) => sum + (product.rating ?? 0), 0) /
    sellerProducts.length;
  const averageDealScore =
    sellerProducts.reduce((sum, product) => sum + (product.dealScore ?? 0), 0) /
    sellerProducts.length;
  const analytics = getSellerAnalyticsSummary();
  const liveSession = getLiveCommerceSessions()[0];
  const lowInventoryProducts = sellerProducts.filter((product) => (product.availableQuantity ?? 0) < 20);

  return (
    <div className="section-shell space-y-6 py-8 sm:py-10">
      <section className="overflow-hidden rounded-[36px] bg-[linear-gradient(135deg,#111827_0%,#1d4ed8_48%,#f97316_100%)] p-6 text-white shadow-[0_30px_80px_rgba(15,23,42,0.16)] sm:p-8">
        <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white/85">
              <Sparkles className="h-3.5 w-3.5" />
              Seller dashboard
            </div>
            <h1 className="mt-4 max-w-[30rem] text-[2.35rem] font-semibold tracking-[-0.05em] sm:text-[3rem]">
              Run your storefront like a premium brand.
            </h1>
            <p className="mt-4 max-w-[34rem] text-sm leading-7 text-white/78 sm:text-base">
              Keep product quality, inventory confidence, and revenue signals together in one cleaner dashboard built for serious marketplace sellers.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[24px] border border-white/10 bg-white/10 p-4 backdrop-blur">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-white/65">
                Visible products
              </p>
              <p className="mt-2 text-3xl font-semibold">{sellerProducts.length}</p>
              <p className="mt-1 text-sm text-white/72">Listings currently showcased</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/10 p-4 backdrop-blur">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-white/65">
                Inventory
              </p>
              <p className="mt-2 text-3xl font-semibold">{totalInventory}</p>
              <p className="mt-1 text-sm text-white/72">Units available across key listings</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/10 p-4 backdrop-blur">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-white/65">
                Avg rating
              </p>
              <p className="mt-2 text-3xl font-semibold">{averageRating.toFixed(1)}</p>
              <p className="mt-1 text-sm text-white/72">Buyer trust across featured items</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/10 p-4 backdrop-blur">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-white/65">
                Deal score
              </p>
              <p className="mt-2 text-3xl font-semibold">{Math.round(averageDealScore)}</p>
              <p className="mt-1 text-sm text-white/72">Marketplace momentum indicator</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="glass-panel rounded-[32px] p-6 sm:p-7">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-5 w-5 text-zenvy-rose" />
            <div>
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-zenvy-ink">
                Performance snapshot
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Quick pulse on catalog performance and revenue quality
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3">
            <div className="rounded-[24px] bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Wallet className="h-4 w-4 text-emerald-600" />
                Revenue-ready mix
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Featured listings average {Math.round(averageDealScore)} on deal score and maintain a strong rating profile for premium merchandising lanes.
              </p>
            </div>
            <div className="rounded-[24px] bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Package className="h-4 w-4 text-[#1d4ed8]" />
                Inventory health
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {analytics.lowStockCount} listings need closer replenishment attention.
              </p>
            </div>
            <div className="rounded-[24px] bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <TrendingUp className="h-4 w-4 text-amber-600" />
                Conversion posture
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {analytics.conversionRate}% conversion with {analytics.repeatCustomers}% repeat customers in the current seller analytics snapshot.
              </p>
            </div>
            <div className="rounded-[24px] bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Sparkles className="h-4 w-4 text-zenvy-rose" />
                Live commerce
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {liveSession.title} is {liveSession.status} with {liveSession.viewerCount} current viewers.
              </p>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-[32px] p-6 sm:p-7">
          <div className="flex items-center gap-3">
            <Package className="h-5 w-5 text-zenvy-rose" />
            <div>
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-zenvy-ink">
                Product performance
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Listing quality, price, stock, and marketplace confidence in one view
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {sellerProducts.map((product) => (
              <div key={product.id} className="overflow-hidden rounded-[26px] border border-slate-200 bg-white p-3 shadow-[0_14px_38px_rgba(15,23,42,0.05)]">
                <ProductVisual
                  category={product.category}
                  name={product.name}
                  compact
                  imageUrl={product.media?.[0]?.url}
                />
                <div className="px-1 pb-1 pt-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                        {product.brand ?? product.category}
                      </p>
                      <p className="mt-1 text-lg font-semibold text-zenvy-ink">{product.name}</p>
                    </div>
                    <span className="rounded-full bg-[#eef4ff] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#1d4ed8]">
                      {product.category}
                    </span>
                  </div>

                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                    {product.description}
                  </p>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xl font-semibold text-zenvy-ink">
                        {formatCurrency(product.price, product.currency)}
                      </p>
                      <p className="mt-1 text-xs font-medium text-slate-500">
                        Deal score {product.dealScore ?? 0} | {(product.rating ?? 0).toFixed(1)} stars
                      </p>
                    </div>
                    <div className="rounded-[18px] bg-slate-50 px-3 py-2 text-right">
                      <div className="flex items-center gap-1 text-sm font-semibold text-emerald-600">
                        <Star className="h-3.5 w-3.5 fill-current" />
                        {(product.rating ?? 0).toFixed(1)}
                      </div>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                        Rated
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-[18px] bg-slate-50 px-3 py-3">
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Inventory
                      </p>
                      <p className="mt-1 text-base font-semibold text-zenvy-ink">
                        {product.availableQuantity ?? 0} units
                      </p>
                    </div>
                    <div className="rounded-[18px] bg-slate-50 px-3 py-3">
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Seller
                      </p>
                      <p className="mt-1 line-clamp-1 text-base font-semibold text-zenvy-ink">
                        {product.sellerName ?? "ZENVY seller"}
                      </p>
                    </div>
                    <div className="rounded-[18px] bg-slate-50 px-3 py-3">
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Reserved
                      </p>
                      <p className="mt-1 text-base font-semibold text-zenvy-ink">
                        {product.reservedQuantity ?? 0} units
                      </p>
                    </div>
                    <div className="rounded-[18px] bg-slate-50 px-3 py-3">
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Delivery
                      </p>
                      <p className="mt-1 line-clamp-2 text-sm font-semibold text-zenvy-ink">
                        {product.deliveryLabel ?? "At checkout"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {(product.badges ?? []).slice(0, 3).map((badge) => (
                      <span
                        key={badge}
                        className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600"
                      >
                        {badge}
                      </span>
                    ))}
                    {product.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-[#fff4eb] px-3 py-1.5 text-xs font-medium text-[#c2410c]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.06fr_0.94fr]">
        <div className="glass-panel rounded-[32px] p-6 sm:p-7">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-zenvy-rose" />
            <div>
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-zenvy-ink">
                Listing detail board
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Deep product details so the seller dashboard feels complete instead of sparse
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            {sellerProducts.slice(0, 3).map((product) => (
              <div key={product.id} className="rounded-[26px] border border-slate-200 bg-white p-5">
                <div className="grid gap-4 lg:grid-cols-[0.34fr_0.66fr]">
                  <ProductVisual
                    category={product.category}
                    name={product.name}
                    compact
                    imageUrl={product.media?.[0]?.url}
                  />
                  <div>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                          {product.brand ?? product.category}
                        </p>
                        <p className="mt-1 text-xl font-semibold text-zenvy-ink">{product.name}</p>
                      </div>
                      <div className="rounded-[18px] bg-slate-50 px-3 py-2 text-right text-sm text-slate-600">
                        <p>{formatCurrency(product.price, product.currency)}</p>
                        <p className="mt-1">{(product.rating ?? 0).toFixed(1)} stars</p>
                      </div>
                    </div>

                    <p className="mt-3 text-sm leading-7 text-slate-600">{product.description}</p>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-[18px] bg-slate-50 px-4 py-3">
                        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
                          Product specs
                        </p>
                        <p className="mt-1 text-sm font-semibold text-zenvy-ink">
                          {(product.specifications ?? []).slice(0, 2).map((item) => item.value).join(" | ") || "Spec sheet attached"}
                        </p>
                      </div>
                      <div className="rounded-[18px] bg-slate-50 px-4 py-3">
                        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
                          Delivery promise
                        </p>
                        <p className="mt-1 text-sm font-semibold text-zenvy-ink">
                          {product.deliveryLabel ?? "Promise available at checkout"}
                        </p>
                      </div>
                      <div className="rounded-[18px] bg-slate-50 px-4 py-3">
                        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
                          Stock posture
                        </p>
                        <p className="mt-1 text-sm font-semibold text-zenvy-ink">
                          {product.availableQuantity ?? 0} available | {product.reservedQuantity ?? 0} reserved
                        </p>
                      </div>
                      <div className="rounded-[18px] bg-slate-50 px-4 py-3">
                        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
                          Variant mix
                        </p>
                        <p className="mt-1 text-sm font-semibold text-zenvy-ink">
                          {(product.variants ?? []).map((item) => item.label).slice(0, 2).join(" | ") || "Single SKU setup"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {product.tags.slice(0, 4).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-[#eef4ff] px-3 py-1.5 text-xs font-medium text-[#1d4ed8]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-panel rounded-[32px] p-6 sm:p-7">
            <div className="flex items-center gap-3">
              <Truck className="h-5 w-5 text-zenvy-rose" />
              <div>
                <h2 className="text-2xl font-semibold tracking-[-0.03em] text-zenvy-ink">
                  Replenishment queue
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Priority listings that need the fastest stock attention
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {(lowInventoryProducts.length ? lowInventoryProducts : sellerProducts.slice(0, 3)).map((product) => (
                <div key={product.id} className="rounded-[24px] border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-zenvy-ink">{product.name}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {product.deliveryLabel ?? "Delivery promise pending"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-amber-600">
                        {product.availableQuantity ?? 0} left
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                        {product.warehouseCode ?? "warehouse"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-[32px] p-6 sm:p-7">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-zenvy-rose" />
              <div>
                <h2 className="text-2xl font-semibold tracking-[-0.03em] text-zenvy-ink">
                  Merchandising notes
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Quick detail blocks that keep the seller workspace informative
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              {sellerProducts.slice(0, 4).map((product) => (
                <div key={product.id} className="rounded-[24px] bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-zenvy-ink">{product.name}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {product.recommendationReason ?? "Ready for premium placement and high-intent traffic."}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <SellerAnalytics />
    </div>
  );
}
