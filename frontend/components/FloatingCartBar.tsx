"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowRight, ShoppingCart } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { useCartStore } from "@/store/cartStore";

const hiddenRoutes = ["/cart", "/checkout"];

export function FloatingCartBar() {
  const pathname = usePathname();
  const items = useCartStore((state) => state.items);
  const itemCount = useCartStore((state) => state.itemCount());
  const subtotal = useCartStore((state) => state.subtotal());
  const [showCheckoutBar, setShowCheckoutBar] = useState(false);

  useEffect(() => {
    function onScroll() {
      setShowCheckoutBar(window.scrollY > 280);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!items.length || hiddenRoutes.some((route) => pathname?.startsWith(route))) {
    return null;
  }

  return (
    <>
      <Link
        href="/cart"
        className="fixed bottom-[5.5rem] left-4 z-50 inline-flex items-center gap-2 rounded-full bg-zenvy-ink px-4 py-3 text-sm font-semibold text-white shadow-glow md:bottom-6"
      >
        <ShoppingCart className="h-4 w-4" />
        Cart
        <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">{itemCount}</span>
      </Link>

      <div
        className={`fixed left-1/2 z-50 w-[min(92vw,34rem)] -translate-x-1/2 transition-all ${
          showCheckoutBar
            ? "bottom-20 opacity-100 md:bottom-6"
            : "pointer-events-none bottom-12 opacity-0 md:bottom-2"
        }`}
      >
        <div className="flex items-center justify-between gap-3 rounded-full border border-slate-200 bg-white px-4 py-3 shadow-glow">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Ready to checkout
            </p>
            <p className="truncate text-sm font-semibold text-slate-900">
              {itemCount} items | {formatCurrency(subtotal)}
            </p>
          </div>
          <Link
            href="/checkout"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-zenvy-ink px-4 py-2.5 text-sm font-semibold text-white"
          >
            Checkout
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </>
  );
}
