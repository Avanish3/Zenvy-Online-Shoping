"use client";

import Link from "next/link";
import { Bell, Heart } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { getWishlistPriceAlertSeed } from "@/services/experienceService";
import { useWishlistStore } from "@/store/wishlistStore";

export default function WishlistPage() {
  const items = useWishlistStore((state) => state.items);
  const alerts = useWishlistStore((state) => state.alerts);
  const setPriceAlert = useWishlistStore((state) => state.setPriceAlert);
  const clearPriceAlert = useWishlistStore((state) => state.clearPriceAlert);

  return (
    <div className="section-shell py-10">
      <div className="glass-panel rounded-[34px] p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zenvy-rose">
          Wishlist
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-zenvy-ink">
          Saved for when the timing feels right
        </h1>
        {items.length === 0 ? (
          <div className="mt-8 rounded-[28px] border border-dashed border-slate-200 bg-white p-10 text-center">
            <Heart className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-4 text-lg font-semibold text-zenvy-ink">No saved products yet</p>
            <p className="mt-2 text-sm text-slate-500">
              Tap the heart on any product card to collect options here.
            </p>
            <Link href="/search" className="mt-6 inline-flex rounded-full bg-zenvy-ink px-5 py-3 text-sm font-semibold text-white">
              Explore search
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {items.map((product) => (
                <div key={product.id} className="space-y-3">
                  <ProductCard product={product} highlight="Saved pick" />
                  <div className="rounded-[22px] border border-slate-200 bg-white p-4 text-sm">
                    <div className="flex items-center gap-2 font-semibold text-zenvy-ink">
                      <Bell className="h-4 w-4 text-[#1d4ed8]" />
                      Price alert
                    </div>
                    {alerts[product.id] ? (
                      <>
                        <p className="mt-2 text-slate-600">
                          We will nudge you when this drops to INR {alerts[product.id].toLocaleString("en-IN")} or lower.
                        </p>
                        <button
                          className="mt-3 rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700"
                          onClick={() => clearPriceAlert(product.id)}
                        >
                          Remove alert
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="mt-2 text-slate-600">
                          Create a price alert at INR {getWishlistPriceAlertSeed(product.id).toLocaleString("en-IN")} for this item.
                        </p>
                        <button
                          className="mt-3 rounded-full bg-[#eef4ff] px-4 py-2 text-xs font-semibold text-[#1d4ed8]"
                          onClick={() => setPriceAlert(product.id, getWishlistPriceAlertSeed(product.id))}
                        >
                          Enable alert
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
