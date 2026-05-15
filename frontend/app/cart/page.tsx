"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Minus,
  Plus,
  ShoppingBag,
  TicketPercent,
  Trash2,
  Truck,
} from "lucide-react";
import { ProductVisual } from "@/components/ProductVisual";
import { formatCurrency } from "@/lib/formatters";
import { getDeliveryMessage } from "@/lib/productSignals";
import { getEmiPlans } from "@/services/experienceService";
import { useCartStore } from "@/store/cartStore";

export default function CartPage() {
  const { items, couponCode, updateQuantity, removeItem, applyCoupon, subtotal } =
    useCartStore();
  const [draftCoupon, setDraftCoupon] = useState(couponCode ?? "");
  const [showEmiPlans, setShowEmiPlans] = useState(false);

  const cartSubtotal = subtotal();
  const shipping = items.length ? 149 : 0;
  const discount = couponCode ? Math.round(cartSubtotal * 0.08) : 0;
  const total = Math.max(cartSubtotal - discount + shipping, 0);
  const emiPlans = useMemo(() => getEmiPlans(total), [total]);
  const groupedLabel = useMemo(
    () => Array.from(new Set(items.map((item) => item.product.sellerName).filter(Boolean))).join(", "),
    [items],
  );

  return (
    <div className="section-shell grid gap-8 py-10 lg:grid-cols-[1fr_24rem]">
      <section className="glass-panel rounded-[34px] p-6 sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zenvy-rose">
              Cart
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-zenvy-ink">
              Your current stack
            </h1>
            {groupedLabel ? (
              <p className="mt-2 text-sm text-slate-500">Sellers: {groupedLabel}</p>
            ) : null}
          </div>
          <span className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600">
            {items.length} items
          </span>
        </div>

        <div className="mt-8 space-y-4">
          {items.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-slate-200 bg-white p-10 text-center">
              <ShoppingBag className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-4 text-lg font-semibold text-zenvy-ink">
                Your cart is empty
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Add a few smart picks and the checkout flow will be ready.
              </p>
              <Link href="/products" className="btn-primary mt-6">
                Explore products
              </Link>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="grid gap-4 rounded-[28px] border border-slate-100 bg-white p-4 sm:grid-cols-[12rem_1fr]"
              >
                <ProductVisual
                  category={item.product.category}
                  name={item.product.name}
                  compact
                  imageUrl={item.product.media?.[0]?.url}
                />
                <div className="flex flex-col justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-zenvy-ink">
                      {item.product.name}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {item.product.brand ?? item.product.category}
                    </p>
                    <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                      <Truck className="h-3.5 w-3.5" />
                      {getDeliveryMessage(item.product)}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {item.product.description}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2">
                      <button
                        onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))}
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="min-w-8 text-center text-sm font-semibold">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-xl font-semibold text-zenvy-ink">
                        {formatCurrency(item.lineTotal, item.currency)}
                      </p>
                      <button
                        className="rounded-full border border-slate-200 p-2 text-slate-600"
                        onClick={() => removeItem(item.productId)}
                        aria-label="Remove from cart"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <aside className="glass-panel h-fit rounded-[34px] p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zenvy-rose">
          Summary
        </p>
        <div className="mt-5 rounded-[24px] border border-slate-100 bg-white p-4">
          <div className="flex items-center gap-2">
            <TicketPercent className="h-4 w-4 text-zenvy-rose" />
            <p className="text-sm font-semibold text-zenvy-ink">Coupon</p>
          </div>
          <div className="mt-3 flex gap-2">
            <input
              value={draftCoupon}
              onChange={(event) => setDraftCoupon(event.target.value)}
              className="input-field"
              placeholder="ZENVY8"
            />
            <button
              className="btn-secondary shrink-0"
              onClick={() => applyCoupon(draftCoupon.trim() || null)}
            >
              Apply
            </button>
          </div>
        </div>
        <div className="mt-6 space-y-4 text-sm text-slate-600">
          <div className="flex items-center justify-between">
            <span>Subtotal</span>
            <span className="font-semibold text-zenvy-ink">
              {formatCurrency(cartSubtotal)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Estimated shipping</span>
            <span className="font-semibold text-zenvy-ink">
              {formatCurrency(shipping)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Coupon savings</span>
            <span className="font-semibold text-emerald-600">
              -{formatCurrency(discount)}
            </span>
          </div>
        </div>
        <div className="mt-6 rounded-[28px] bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Estimated total
          </p>
          <p className="mt-2 text-3xl font-semibold text-zenvy-ink">
            {formatCurrency(total)}
          </p>
        </div>
        <div className="mt-6 rounded-[24px] border border-slate-100 bg-white p-4">
          <button
            className="flex w-full items-center justify-between gap-3 text-left"
            onClick={() => setShowEmiPlans((current) => !current)}
          >
            <div>
              <p className="text-sm font-semibold text-zenvy-ink">EMI breakdown</p>
              <p className="mt-1 text-xs text-slate-500">
                Expand monthly options before checkout
              </p>
            </div>
            {showEmiPlans ? (
              <ChevronUp className="h-4 w-4 text-slate-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-500" />
            )}
          </button>
          {showEmiPlans ? (
            <div className="mt-4 grid gap-2">
              {emiPlans.map((plan) => (
                <div key={plan.months} className="rounded-[18px] bg-slate-50 px-3 py-3 text-sm">
                  <p className="font-semibold text-zenvy-ink">{plan.months} months</p>
                  <p className="mt-1 text-slate-600">
                    {formatCurrency(plan.monthlyAmount)} / month
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Total {formatCurrency(plan.totalAmount)}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
        <Link href="/checkout" className="btn-primary mt-6 w-full">
          Proceed to checkout
        </Link>
      </aside>
    </div>
  );
}
