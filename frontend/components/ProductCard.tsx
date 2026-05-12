"use client";

import Link from "next/link";
import {
  Clock3,
  Heart,
  RotateCcw,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  Truck,
} from "lucide-react";
import clsx from "clsx";
import { DealCountdown } from "@/components/DealCountdown";
import { ProductVisual } from "@/components/ProductVisual";
import { formatCurrency } from "@/lib/formatters";
import { triggerHaptic } from "@/lib/haptics";
import {
  getDeliveryMessage,
  getDiscountPercent,
  getPrimaryBadges,
  getReturnPolicy,
  getReviewSummary,
  getSellerTrust,
  getStockMessage,
  getStockTone,
} from "@/lib/productSignals";
import { getProductLiveSignal } from "@/services/experienceService";
import { useCartStore } from "@/store/cartStore";
import { useCompareStore } from "@/store/compareStore";
import { useUiStore } from "@/store/uiStore";
import { useWishlistStore } from "@/store/wishlistStore";
import type { Product, ProductCardVariant } from "@/types";

interface ProductCardProps {
  product: Product;
  variant?: ProductCardVariant;
  highlight?: string;
  showCompare?: boolean;
}

const layoutClasses: Record<ProductCardVariant, string> = {
  grid: "p-3.5",
  list: "grid gap-4 p-4 md:grid-cols-[15rem_1fr]",
  compact: "p-3",
  mini: "p-2.5",
};

export function ProductCard({
  product,
  variant = "grid",
  highlight,
  showCompare = false,
}: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const toggleWishlist = useWishlistStore((state) => state.toggleWishlist);
  const isWishlisted = useWishlistStore((state) => state.isWishlisted(product.id));
  const toggleCompare = useCompareStore((state) => state.toggleCompare);
  const isCompared = useCompareStore((state) => state.isCompared(product.id));
  const addToast = useUiStore((state) => state.addToast);
  const priceDelta = getDiscountPercent(product);
  const primaryBadges = getPrimaryBadges(product);
  const stockMessage = getStockMessage(product);
  const stockTone = getStockTone(product);
  const compactCard = variant === "compact" || variant === "mini";
  const listCard = variant === "list";
  const liveSignal = getProductLiveSignal(product);

  return (
    <article
      data-testid="product-card"
      className={clsx(
        "glass-panel group overflow-hidden rounded-[22px] border border-slate-200 transition duration-300 hover:-translate-y-1 hover:shadow-md",
        layoutClasses[variant],
      )}
    >
      <div className="relative">
        <ProductVisual
          category={product.category}
          name={product.name}
          compact={compactCard}
          imageUrl={product.media?.[0]?.url}
        />
        <button
          className={clsx(
            "absolute right-2 top-2 rounded-full p-2 shadow-sm transition",
            isWishlisted ? "bg-zenvy-rose text-white" : "bg-white/90 text-zenvy-ink",
          )}
          onClick={() => {
            toggleWishlist(product);
            triggerHaptic(10);
            addToast(
              isWishlisted
                ? `${product.name} removed from wishlist`
                : `${product.name} saved to wishlist`,
            );
          }}
          aria-label="Toggle wishlist"
        >
          <Heart className="h-4 w-4" />
        </button>
        <div className="absolute left-2 top-2 flex max-w-[78%] flex-wrap gap-1.5">
          {primaryBadges.map((badge) => (
            <span
              key={badge}
              className="rounded-full bg-white/92 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-zenvy-ink"
            >
              {badge}
            </span>
          ))}
        </div>
        {priceDelta > 0 ? (
          <span className="absolute bottom-2 left-2 rounded-full bg-[#dc2626] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white">
            {priceDelta}% off
          </span>
        ) : null}
      </div>

      <div className={clsx("space-y-3 px-1 pt-3", listCard ? "pb-1" : "pb-2")}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              {product.brand ?? product.category}
            </p>
            <Link
              href={`/products/${product.slug ?? product.id}`}
              className={clsx(
                "mt-1 line-clamp-2 font-semibold text-zenvy-ink",
                compactCard ? "text-base" : "text-lg",
              )}
            >
              {product.name}
            </Link>
          </div>
          {highlight ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#fff1f2] px-2 py-1 text-[11px] font-semibold text-zenvy-rose">
              <Sparkles className="h-3.5 w-3.5" />
              {highlight}
            </span>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[12px] text-slate-600">
          <span className="inline-flex items-center gap-1 rounded-md bg-[#0f9d58] px-2 py-1 font-semibold text-white">
            <Star className="h-3.5 w-3.5 fill-current" />
            {(product.rating ?? 4.5).toFixed(1)}
          </span>
          <span>{getReviewSummary(product)}</span>
          <span className="text-slate-400">|</span>
          <span className="font-medium text-slate-700">
            {new Intl.NumberFormat("en-IN").format(product.reviewCount ?? 0)} reviews
          </span>
        </div>

        {!compactCard ? (
          <p className="line-clamp-2 text-sm leading-6 text-slate-600">{product.description}</p>
        ) : null}

        <div className="flex flex-wrap gap-2 text-[11px] font-medium text-slate-500">
          <span className="rounded-full bg-slate-100 px-2.5 py-1">
            {liveSignal.viewerCount} viewing now
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1">
            {liveSignal.soldCount24h}+ bought today
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p
                className={clsx(
                  "font-semibold text-zenvy-ink",
                  compactCard ? "text-xl" : "text-2xl",
                )}
              >
                {formatCurrency(product.price, product.currency)}
              </p>
              {product.originalPrice ? (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-400 line-through">
                    {formatCurrency(product.originalPrice, product.currency)}
                  </span>
                  <span className="font-semibold text-emerald-600">{priceDelta}% OFF</span>
                </div>
              ) : null}
              {priceDelta > 0 ? (
                <p className="mt-1 text-xs font-medium text-emerald-700">
                  Save{" "}
                  {formatCurrency(
                    (product.originalPrice ?? product.price) - product.price,
                    product.currency,
                  )}
                </p>
              ) : null}
            </div>
            <button
              className="inline-flex items-center gap-2 rounded-full bg-zenvy-ink px-4 py-2.5 text-sm font-semibold text-white"
              onClick={() => {
                addItem(product);
                triggerHaptic(12);
                addToast(`${product.name} added to cart`);
              }}
            >
              <ShoppingBag className="h-4 w-4" />
              Add
            </button>
          </div>

          <div className="grid gap-2 text-[12px] text-slate-600">
            <div className="flex items-center gap-2">
              <Truck className="h-3.5 w-3.5 text-emerald-600" />
              <span className="line-clamp-1 font-medium text-slate-700">
                {getDeliveryMessage(product)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Store className="h-3.5 w-3.5 text-slate-500" />
              <span className="line-clamp-1">{getSellerTrust(product)}</span>
            </div>
            <div className="flex items-center gap-2">
              <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
              <span>{getReturnPolicy(product)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock3 className="h-3.5 w-3.5 text-[#dc2626]" />
              <DealCountdown seed={product.id} className="font-semibold text-[#dc2626]" />
            </div>
          </div>

          <div
            className={clsx(
              "rounded-xl border px-3 py-2 text-xs font-semibold",
              stockTone === "critical"
                ? "border-red-200 bg-red-50 text-red-700"
                : stockTone === "warning"
                  ? "border-amber-200 bg-amber-50 text-amber-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700",
            )}
          >
            {stockMessage}
          </div>

          <div className="rounded-full bg-slate-100 p-1">
            <div
              className={clsx(
                "h-2 rounded-full",
                (product.dealScore ?? 0) >= 80
                  ? "bg-emerald-500"
                  : (product.dealScore ?? 0) >= 60
                    ? "bg-amber-500"
                    : "bg-slate-400",
              )}
              style={{ width: `${Math.max(16, product.dealScore ?? 40)}%` }}
            />
          </div>
          <p className="text-xs text-slate-500">
            Deal score {product.dealScore ?? 40}/100
            {product.recommendationReason ? ` | ${product.recommendationReason}` : ""}
          </p>

          {showCompare ? (
            <button
              className={clsx(
                "rounded-full px-4 py-2 text-xs font-semibold transition",
                isCompared
                  ? "bg-zenvy-ink text-white"
                  : "border border-slate-200 bg-white text-slate-600",
              )}
              onClick={() => {
                toggleCompare(product);
                triggerHaptic(10);
                addToast(
                  isCompared
                    ? `${product.name} removed from compare`
                    : `${product.name} added to compare`,
                );
              }}
            >
              {isCompared ? "Added to compare" : "Add to compare"}
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
