"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCircle2,
  Radio,
  ShoppingBag,
  Sparkles,
  Star,
  Truck,
  Users,
  XCircle,
} from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { ProductImageGallery } from "@/components/ProductImageGallery";
import { RecommendationSection } from "@/components/RecommendationSection";
import { LowStockBadge, SoldCounter, VerifiedSellerBadge } from "@/components/SocialProof";
import { ViewerCount } from "@/components/ViewerCount";
import { WishlistButton } from "@/components/WishlistButton";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { useRealtimeChannel } from "@/hooks/useRealtimeChannel";
import { formatCurrency } from "@/lib/formatters";
import { triggerHaptic } from "@/lib/haptics";
import {
  getDynamicPrice,
  getInventorySnapshot,
  getLiveEvents,
  getPriceHistory,
} from "@/services/commerceSignalsService";
import { getProduct, getReviews, getSimilarProducts } from "@/services/productService";
import {
  getAiSizeRecommendation,
  getCompleteTheLookProducts,
  getPincodeSuggestions,
  getProductLiveSignal,
  getSocialOffer,
  subscribeToLiveProduct,
} from "@/services/experienceService";
import { useCartStore } from "@/store/cartStore";
import { useUiStore } from "@/store/uiStore";
import type {
  DynamicPriceSnapshot,
  InventorySnapshot,
  LiveCommerceSession,
  PriceHistoryPoint,
  Product,
  ProductLiveSignal,
  RealtimeEventMessage,
  Review,
} from "@/types";

interface ProductDetailsPageProps {
  productId: string;
}

export function ProductDetailsPage({ productId }: ProductDetailsPageProps) {
  const addItem = useCartStore((state) => state.addItem);
  const addToast = useUiStore((state) => state.addToast);
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [pincode, setPincode] = useState("");
  const [liveSignal, setLiveSignal] = useState<ProductLiveSignal | null>(null);
  const [reviewSummary, setReviewSummary] = useState("");
  const [dynamicPrice, setDynamicPrice] = useState<DynamicPriceSnapshot | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceHistoryPoint[]>([]);
  const [inventory, setInventory] = useState<InventorySnapshot | null>(null);
  const [liveEvents, setLiveEvents] = useState<LiveCommerceSession[]>([]);
  const { recordProduct } = useRecentlyViewed();

  useEffect(() => {
    let active = true;

    getProduct(productId).then((item) => {
      if (!active) {
        return;
      }

      setProduct(item);
      setSelectedVariant(item.variants?.[0]?.id ?? null);
      setLiveSignal(getProductLiveSignal(item));
      recordProduct(item);
    });
    getReviews(productId).then((data) => {
      if (!active) {
        return;
      }

      setReviews(data);
      if (data.length) {
        setReviewSummary(
          `Shoppers consistently praise ${data[0].title.toLowerCase()} and the overall ${(
            data.reduce((sum, review) => sum + review.rating, 0) / data.length
          ).toFixed(1)} star experience.`,
        );
      }
    });
    getSimilarProducts(productId).then((data) => {
      if (active) {
        setSimilarProducts(data);
      }
    });
    getDynamicPrice(productId).then((data) => {
      if (active) {
        setDynamicPrice(data);
      }
    });
    getPriceHistory(productId).then((data) => {
      if (active) {
        setPriceHistory(data);
      }
    });
    getInventorySnapshot(productId).then((data) => {
      if (active) {
        setInventory(data);
      }
    });
    getLiveEvents().then((data) => {
      if (active) {
        setLiveEvents(data);
      }
    });

    return () => {
      active = false;
    };
  }, [productId, recordProduct]);

  useEffect(() => {
    if (!product) {
      return;
    }

    const unsubscribe = subscribeToLiveProduct(product, setLiveSignal);
    return unsubscribe;
  }, [product]);

  const selectedVariantLabel = useMemo(() => {
    if (!product?.variants?.length || !selectedVariant) {
      return null;
    }

    return product.variants.find((variant) => variant.id === selectedVariant)?.label ?? null;
  }, [product?.variants, selectedVariant]);

  const sizeRecommendation = useMemo(
    () => (product ? getAiSizeRecommendation(product) : null),
    [product],
  );
  const pincodeSuggestions = useMemo(() => getPincodeSuggestions(pincode), [pincode]);
  const dealScoreWidth = Math.min(100, Math.max(18, product?.dealScore ?? 40));
  const completeTheLook = useMemo(
    () => (product ? getCompleteTheLookProducts(product.id) : []),
    [product],
  );
  const liveSession = useMemo(
    () => liveEvents.find((session) => session.productIds.includes(productId)) ?? liveEvents[0] ?? null,
    [liveEvents, productId],
  );
  const reviewInsights = useMemo(() => {
    const aspectSeeds = [
      { label: "Camera", keywords: ["camera", "photo", "video"], base: 4.4 },
      { label: "Battery", keywords: ["battery", "charge", "power"], base: 4.3 },
      { label: "Design", keywords: ["display", "design", "fit", "look"], base: 4.2 },
      { label: "Value", keywords: ["value", "price", "worth"], base: 4.1 },
    ];
    const pros = new Set<string>();
    const cons = new Set<string>();

    reviews.forEach((review) => {
      const text = `${review.title} ${review.comment}`.toLowerCase();

      if (review.rating >= 4) {
        if (text.includes("camera")) pros.add("Strong camera quality");
        if (text.includes("battery")) pros.add("Reliable battery life");
        if (text.includes("display")) pros.add("Bright display");
        if (text.includes("comfort") || text.includes("fit")) pros.add("Comfortable everyday use");
        if (text.includes("value") || text.includes("price")) pros.add("Good value for money");
      }

      if (review.rating <= 3) {
        if (text.includes("box")) cons.add("Packaging could be better");
        if (text.includes("wish")) cons.add("A few premium extras are still missing");
        if (text.includes("battery")) cons.add("Battery consistency can vary");
      }
    });

    if (!pros.size && reviews.length) {
      pros.add("Well-rated by recent shoppers");
      pros.add("Consistent day-to-day performance");
    }

    const aspects = aspectSeeds.map((aspect) => {
      const hits = reviews.filter((review) =>
        aspect.keywords.some((keyword) =>
          `${review.title} ${review.comment}`.toLowerCase().includes(keyword),
        ),
      );

      return {
        label: aspect.label,
        score:
          hits.length > 0
            ? Math.min(
                5,
                Number(
                  (
                    hits.reduce((sum, review) => sum + review.rating, 0) / hits.length
                  ).toFixed(1),
                ),
              )
            : aspect.base,
      };
    });

    return {
      aspects,
      cons: Array.from(cons).slice(0, 3),
      pros: Array.from(pros).slice(0, 4),
    };
  }, [reviews]);
  const priceChannelMessage = useCallback(
    (
      message: RealtimeEventMessage<
        Partial<DynamicPriceSnapshot> & Partial<InventorySnapshot>
      >,
    ) => {
      if (message.type === "connected" || message.type === "subscribed") {
        return;
      }

      if (message.payload?.productId && message.payload.productId !== productId) {
        return;
      }

      if (typeof message.payload?.currentPrice === "number" && product) {
        setDynamicPrice((current) => ({
          variantId: product.id,
          productId: product.id,
          currentPrice: message.payload?.currentPrice ?? current?.currentPrice ?? product.price,
          originalPrice: current?.originalPrice ?? product.price,
          currency: current?.currency ?? product.currency,
          reasons: current?.reasons ?? [],
        }));
      }

      if (typeof message.payload?.availableQuantity === "number") {
        setInventory((current) => ({
          productId,
          availableQuantity: message.payload?.availableQuantity ?? current?.availableQuantity ?? 0,
          reservedQuantity: message.payload?.reservedQuantity ?? current?.reservedQuantity ?? 0,
          warehouseCode: current?.warehouseCode ?? null,
        }));
      }
    },
    [product, productId],
  );
  const priceRealtimeStatus = useRealtimeChannel("/ws/prices", {
    room: productId,
    enabled: Boolean(product),
    onMessage: priceChannelMessage,
  });

  if (!product) {
    return (
      <div className="section-shell py-16">
        <div className="glass-panel rounded-[34px] p-10 text-center text-slate-600">
          Loading product...
        </div>
      </div>
    );
  }

  const socialOffer = getSocialOffer(product);
  const effectivePrice = dynamicPrice?.currentPrice ?? product.price;
  const effectiveOriginalPrice = dynamicPrice?.originalPrice ?? product.originalPrice ?? product.price;
  const discount =
    effectiveOriginalPrice > effectivePrice
      ? Math.round(((effectiveOriginalPrice - effectivePrice) / effectiveOriginalPrice) * 100)
      : 0;
  const sellerTier =
    (product.dealScore ?? 0) >= 85
      ? "verified"
      : (product.rating ?? 0) >= 4.5
        ? "assured"
        : "preferred";

  return (
    <div className="section-shell space-y-10 py-10">
      <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-4">
          <ProductImageGallery product={product} />
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="glass-panel rounded-[24px] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Live viewers</p>
              <p className="mt-2 text-2xl font-semibold text-zenvy-ink">
                {liveSignal?.viewerCount ?? 0}
              </p>
            </div>
            <div className="glass-panel rounded-[24px] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Bought today</p>
              <p className="mt-2 text-2xl font-semibold text-zenvy-ink">
                {liveSignal?.soldCount24h ?? 0}
              </p>
            </div>
            <div className="glass-panel rounded-[24px] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Stock pulse</p>
              <p className="mt-2 text-2xl font-semibold text-zenvy-ink">
                -{liveSignal?.stockDelta ?? 1}
              </p>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-[34px] p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zenvy-rose">
            {product.brand ?? product.category}
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-zenvy-ink">
            {product.name}
          </h1>
          <p className="mt-4 text-base leading-8 text-slate-600">{product.description}</p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700">
              <Star className="h-4 w-4 fill-current" />
              {(product.rating ?? 4.8).toFixed(1)} rating
            </div>
            <div className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600">
              {product.reviewCount ?? 0} reviews
            </div>
            <div className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
              {product.deliveryLabel ?? "Delivery estimate available"}
            </div>
            <VerifiedSellerBadge tier={sellerTier} />
            <SoldCounter soldCount={liveSignal?.soldCount24h ?? 0} />
          </div>

          <div className="mt-8 flex flex-wrap items-end justify-between gap-6 border-y border-slate-100 py-6">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Price</p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <p className="text-4xl font-semibold text-zenvy-ink">
                  {formatCurrency(effectivePrice, product.currency)}
                </p>
                {effectiveOriginalPrice > effectivePrice ? (
                  <>
                    <span className="text-lg text-slate-400 line-through">
                      {formatCurrency(effectiveOriginalPrice, product.currency)}
                    </span>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                      {discount}% off
                    </span>
                  </>
                ) : null}
              </div>
              <div className="mt-3 rounded-full bg-slate-100 p-1">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-emerald-500 via-sky-500 to-[#1d4ed8]"
                  style={{ width: `${dealScoreWidth}%` }}
                />
              </div>
              <p className="mt-2 text-sm text-slate-500">Deal score {product.dealScore ?? 40}/100</p>
              {dynamicPrice?.reasons.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {dynamicPrice.reasons.map((reason) => (
                    <span
                      key={reason}
                      className="rounded-full bg-[#eef4ff] px-3 py-1.5 text-xs font-medium text-[#1d4ed8]"
                    >
                      {reason}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                className="btn-primary"
                onClick={() => {
                  addItem(product);
                  addToast(`${product.name} added to cart`);
                  triggerHaptic(12);
                }}
              >
                <ShoppingBag className="h-4 w-4" />
                Add to Cart
              </button>
              <Link href="/checkout" className="btn-secondary">
                Buy Now
              </Link>
              <WishlistButton product={product} className="btn-secondary shadow-none" size={14} />
            </div>
          </div>

          {product.variants?.length ? (
            <div className="mt-8">
              <p className="text-sm font-semibold text-zenvy-ink">Variants</p>
              <div className="mt-3 flex flex-wrap gap-3">
                {product.variants.map((variant) => (
                  <button
                    key={variant.id}
                    className={`rounded-full px-4 py-2 text-sm ${
                      selectedVariant === variant.id
                        ? "bg-zenvy-ink text-white"
                        : variant.inStock === false
                          ? "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400"
                          : "border border-slate-200 bg-white text-slate-700"
                    }`}
                    disabled={variant.inStock === false}
                    onClick={() => setSelectedVariant(variant.id)}
                  >
                    {variant.label}
                  </button>
                ))}
              </div>
              {selectedVariantLabel ? (
                <p className="mt-3 text-sm text-slate-500">Selected: {selectedVariantLabel}</p>
              ) : null}
            </div>
          ) : null}

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[24px] border border-slate-100 bg-white p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-zenvy-ink">
                <Truck className="h-4 w-4 text-zenvy-rose" />
                Delivery promise
              </div>
              <p className="mt-2 text-sm text-slate-600">
                {product.deliveryLabel ?? "Standard delivery estimate at checkout"}
              </p>
              <input
                value={pincode}
                onChange={(event) => setPincode(event.target.value)}
                className="input-field mt-3"
                placeholder="Check pincode"
              />
              {pincodeSuggestions.length ? (
                <div className="mt-3 space-y-2">
                  {pincodeSuggestions.slice(0, 2).map((item) => (
                    <div key={item.code} className="rounded-[18px] bg-slate-50 px-3 py-2 text-sm text-slate-600">
                      {item.code} | {item.city}, {item.state} | {item.deliveryPromise}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="rounded-[24px] border border-slate-100 bg-white p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-zenvy-ink">
                  <Sparkles className="h-4 w-4 text-zenvy-rose" />
                  AI summary
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  {priceRealtimeStatus}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                {reviewSummary ||
                  product.reviewSummary ||
                  "Reviews suggest dependable value, a strong feature-to-price balance, and a polished day-to-day experience."}
              </p>
              {priceHistory.length ? (
                <div className="mt-4 flex items-end gap-2">
                  {priceHistory.map((point) => {
                    const min = Math.min(...priceHistory.map((entry) => entry.amount));
                    const max = Math.max(...priceHistory.map((entry) => entry.amount));
                    const denominator = Math.max(1, max - min);
                    const height = 24 + ((point.amount - min) / denominator) * 40;

                    return (
                      <div key={point.date} className="flex-1 text-center">
                        <div
                          className="mx-auto w-full rounded-full bg-[linear-gradient(180deg,#93c5fd_0%,#1d4ed8_100%)]"
                          style={{ height }}
                        />
                        <p className="mt-2 text-[10px] uppercase tracking-[0.14em] text-slate-400">
                          {point.date.slice(5)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <ViewerCount productId={product.id} />
            <LowStockBadge quantity={inventory?.availableQuantity ?? product.availableQuantity ?? 0} />
            {liveSignal?.priceDelta ? (
              <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                Live price advantage {formatCurrency(liveSignal.priceDelta, product.currency)}
              </span>
            ) : null}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[24px] border border-slate-100 bg-[#f8fbff] p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#1d4ed8]">
                <Users className="h-4 w-4" />
                Group buy
              </div>
              <p className="mt-2 text-sm text-slate-600">{socialOffer.headline}</p>
              <p className="mt-2 text-sm font-semibold text-zenvy-ink">
                {socialOffer.membersJoined} shoppers joined | group price{" "}
                {formatCurrency(socialOffer.pricePerBuyer, product.currency)}
              </p>
            </div>
            <div className="rounded-[24px] border border-slate-100 bg-[#fffaf5] p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#c2410c]">
                <Bell className="h-4 w-4" />
                Live commerce
              </div>
              <p className="mt-2 text-sm text-slate-600">
                {liveSession ? `${liveSession.title} with ${liveSession.host}` : "Next stream announcement is loading."}
              </p>
              <p className="mt-2 text-sm font-semibold text-zenvy-ink">
                {liveSession ? `${liveSession.viewerCount} viewers | ${liveSession.status}` : "Stream schedule pending"}
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[24px] border border-slate-100 bg-white p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-zenvy-ink">
                <Radio className="h-4 w-4 text-[#1d4ed8]" />
                Inventory snapshot
              </div>
              <p className="mt-2 text-sm text-slate-600">
                {inventory?.availableQuantity ?? product.availableQuantity ?? 0} units available
                {inventory?.reservedQuantity ? ` | ${inventory.reservedQuantity} reserved` : ""}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {inventory?.warehouseCode ? `Warehouse ${inventory.warehouseCode}` : "Warehouse assignment updating"}
              </p>
            </div>
            <div className="rounded-[24px] border border-slate-100 bg-white p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-zenvy-ink">
                <Sparkles className="h-4 w-4 text-zenvy-rose" />
                Pricing engine
              </div>
              <p className="mt-2 text-sm text-slate-600">
                Current computed price: {formatCurrency(effectivePrice, product.currency)}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Live price room: {priceRealtimeStatus}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
        <div className="glass-panel rounded-[34px] p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zenvy-rose">
            Overview + specs
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-zenvy-ink">
            The important details are surfaced without hiding behind tabs.
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {(product.specifications ?? []).map((specification) => (
              <div key={specification.label} className="rounded-[24px] border border-slate-100 bg-white p-5">
                <p className="text-sm font-semibold text-zenvy-ink">{specification.label}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{specification.value}</p>
              </div>
            ))}
          </div>
          {sizeRecommendation ? (
            <div className="mt-8 rounded-[24px] border border-slate-100 bg-[#f8fbff] p-5">
              <p className="text-sm font-semibold text-zenvy-ink">AI size recommendation</p>
              <p className="mt-2 text-sm text-slate-600">
                Recommended size:{" "}
                <span className="font-semibold text-zenvy-ink">{sizeRecommendation.recommendedSize}</span>
              </p>
              <p className="mt-1 text-sm text-slate-500">{sizeRecommendation.confidence}</p>
            </div>
          ) : null}
          {product.questions?.length ? (
            <div className="mt-8 space-y-3">
              <p className="text-sm font-semibold text-zenvy-ink">Top questions</p>
              {product.questions.map((question) => (
                <div key={question.question} className="rounded-[24px] border border-slate-100 bg-white p-4">
                  <p className="text-sm font-semibold text-zenvy-ink">{question.question}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{question.answer}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="glass-panel rounded-[34px] p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zenvy-rose">
            Reviews
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[24px] border border-slate-100 bg-white p-5">
              <p className="text-sm font-semibold text-zenvy-ink">Pros shoppers repeat</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {reviewInsights.pros.map((pro) => (
                  <span
                    key={pro}
                    className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {pro}
                  </span>
                ))}
              </div>
              {reviewInsights.cons.length ? (
                <>
                  <p className="mt-5 text-sm font-semibold text-zenvy-ink">A few callouts</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {reviewInsights.cons.map((con) => (
                      <span
                        key={con}
                        className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        {con}
                      </span>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
            <div className="rounded-[24px] border border-slate-100 bg-white p-5">
              <p className="text-sm font-semibold text-zenvy-ink">Aspect ratings</p>
              <div className="mt-4 space-y-4">
                {reviewInsights.aspects.map((aspect) => (
                  <div key={aspect.label}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium text-slate-700">{aspect.label}</span>
                      <span className="font-semibold text-zenvy-ink">{aspect.score.toFixed(1)}/5</span>
                    </div>
                    <div className="mt-2 rounded-full bg-slate-100 p-1">
                      <div
                        className="h-2 rounded-full bg-[linear-gradient(90deg,#f59e0b_0%,#10b981_100%)]"
                        style={{ width: `${Math.max(16, aspect.score * 20)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-6 space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="rounded-[24px] border border-slate-100 bg-white p-5">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-semibold text-zenvy-ink">{review.userName}</p>
                  <p className="text-xs text-slate-400">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="mt-2 flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star
                      key={`${review.id}-star-${index + 1}`}
                      className={`h-4 w-4 ${
                        index < review.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"
                      }`}
                    />
                  ))}
                </div>
                <p className="mt-2 text-sm font-semibold text-zenvy-ink">{review.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{review.comment}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {completeTheLook.length ? (
        <section className="space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zenvy-rose">
              Complete the look
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-zenvy-ink">
              Complementary picks for the same shopping mission
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {completeTheLook.map((item) => (
              <ProductCard key={item.id} product={item} variant="compact" highlight="Pairs well" />
            ))}
          </div>
        </section>
      ) : null}

      <RecommendationSection
        eyebrow="You may also like"
        title="Similar products"
        description="Mapped directly to the similar-product search lane so the PDP feels complete."
        products={similarProducts}
        highlight="Smart match"
      />
    </div>
  );
}
