"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bell,
  Heart,
  ShoppingBag,
  Sparkles,
  Star,
  Truck,
  Users,
} from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { ProductImageGallery } from "@/components/ProductImageGallery";
import { RecommendationSection } from "@/components/RecommendationSection";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { formatCurrency } from "@/lib/formatters";
import { triggerHaptic } from "@/lib/haptics";
import {
  getProduct,
  getReviews,
  getSimilarProducts,
} from "@/services/productService";
import {
  getAiSizeRecommendation,
  getCompleteTheLookProducts,
  getLiveCommerceSessions,
  getPincodeSuggestions,
  getProductLiveSignal,
  getSocialOffer,
  subscribeToLiveProduct,
} from "@/services/experienceService";
import { useCartStore } from "@/store/cartStore";
import { useUiStore } from "@/store/uiStore";
import { useWishlistStore } from "@/store/wishlistStore";
import type { Product, ProductLiveSignal, Review } from "@/types";

interface ProductDetailsPageProps {
  productId: string;
}

export function ProductDetailsPage({ productId }: ProductDetailsPageProps) {
  const addItem = useCartStore((state) => state.addItem);
  const addToast = useUiStore((state) => state.addToast);
  const toggleWishlist = useWishlistStore((state) => state.toggleWishlist);
  const isWishlisted = useWishlistStore((state) => state.isWishlisted(productId));
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [pincode, setPincode] = useState("");
  const [liveSignal, setLiveSignal] = useState<ProductLiveSignal | null>(null);
  const [reviewSummary, setReviewSummary] = useState("");
  const { recordProduct } = useRecentlyViewed();

  useEffect(() => {
    getProduct(productId).then((item) => {
      setProduct(item);
      setSelectedVariant(item.variants?.[0]?.id ?? null);
      setLiveSignal(getProductLiveSignal(item));
      recordProduct(item);
    });
    getReviews(productId).then((data) => {
      setReviews(data);
      if (data.length) {
        setReviewSummary(
          `Shoppers consistently praise ${data[0].title.toLowerCase()} and the overall ${(data.reduce((sum, review) => sum + review.rating, 0) / data.length).toFixed(1)} star experience.`,
        );
      }
    });
    getSimilarProducts(productId).then(setSimilarProducts);
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
    () =>
      getLiveCommerceSessions().find((session) =>
        session.productIds.includes(productId),
      ) ?? getLiveCommerceSessions()[0],
    [productId],
  );

  if (!product) {
    return (
      <div className="section-shell py-16">
        <div className="glass-panel rounded-[34px] p-10 text-center text-slate-600">
          Loading product...
        </div>
      </div>
    );
  }

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;
  const socialOffer = getSocialOffer(product);

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
          <p className="mt-4 text-base leading-8 text-slate-600">
            {product.description}
          </p>

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
          </div>

          <div className="mt-8 flex flex-wrap items-end justify-between gap-6 border-y border-slate-100 py-6">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Price</p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <p className="text-4xl font-semibold text-zenvy-ink">
                  {formatCurrency(product.price, product.currency)}
                </p>
                {product.originalPrice ? (
                  <>
                    <span className="text-lg text-slate-400 line-through">
                      {formatCurrency(product.originalPrice, product.currency)}
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
              <button
                className="btn-secondary"
                onClick={() => {
                  toggleWishlist(product);
                  triggerHaptic(10);
                }}
              >
                <Heart className={`h-4 w-4 ${isWishlisted ? "fill-current text-zenvy-rose" : ""}`} />
                Wishlist
              </button>
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
              <div className="flex items-center gap-2 text-sm font-semibold text-zenvy-ink">
                <Sparkles className="h-4 w-4 text-zenvy-rose" />
                AI summary
              </div>
              <p className="mt-2 text-sm text-slate-600">
                {reviewSummary || product.reviewSummary || "Reviews suggest dependable value, a strong feature-to-price balance, and a polished day-to-day experience."}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[24px] border border-slate-100 bg-[#f8fbff] p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#1d4ed8]">
                <Users className="h-4 w-4" />
                Group buy
              </div>
              <p className="mt-2 text-sm text-slate-600">{socialOffer.headline}</p>
              <p className="mt-2 text-sm font-semibold text-zenvy-ink">
                {socialOffer.membersJoined} shoppers joined | group price {formatCurrency(socialOffer.pricePerBuyer, product.currency)}
              </p>
            </div>
            <div className="rounded-[24px] border border-slate-100 bg-[#fffaf5] p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#c2410c]">
                <Bell className="h-4 w-4" />
                Live commerce
              </div>
              <p className="mt-2 text-sm text-slate-600">
                {liveSession.title} with {liveSession.host}
              </p>
              <p className="mt-2 text-sm font-semibold text-zenvy-ink">
                {liveSession.viewerCount} viewers | {liveSession.status}
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
                Recommended size: <span className="font-semibold text-zenvy-ink">{sizeRecommendation.recommendedSize}</span>
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
          <div className="mt-6 space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="rounded-[24px] border border-slate-100 bg-white p-5">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-semibold text-zenvy-ink">{review.userName}</p>
                  <p className="text-xs text-slate-400">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <p className="mt-2 text-sm font-semibold text-zenvy-rose">
                  {"★".repeat(review.rating)}
                </p>
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
