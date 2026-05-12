"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  PackageCheck,
  ShieldCheck,
  Store,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import {
  getAdminOrders,
  getAdminOverview,
  getAdminSellers,
  type AdminOverview,
  type AdminSeller,
} from "@/services/adminService";
import { getProducts } from "@/services/productService";
import { useAuthStore } from "@/store/authStore";
import type { Order, Product } from "@/types";

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default function AdminPage() {
  const user = useAuthStore((state) => state.user);
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [sellers, setSellers] = useState<AdminSeller[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    let isActive = true;

    Promise.all([
      getAdminOverview(),
      getAdminOrders(),
      getAdminSellers(),
      getProducts(),
    ]).then(([nextOverview, nextOrders, nextSellers, nextProducts]) => {
      if (!isActive) {
        return;
      }

      setOverview(nextOverview);
      setOrders(nextOrders);
      setSellers(nextSellers);
      setProducts(nextProducts);
    });

    return () => {
      isActive = false;
    };
  }, []);

  const lowStockProducts = useMemo(
    () =>
      products
        .filter(
          (product) =>
            (product.availableQuantity ?? 0) > 0 && (product.availableQuantity ?? 0) < 20,
        )
        .slice(0, 6),
    [products],
  );

  const orderValue = useMemo(
    () => orders.reduce((sum, order) => sum + order.totalAmount, 0),
    [orders],
  );

  const stats = [
    {
      label: "GMV snapshot",
      value: formatCurrency(overview?.gmvsnapshotInr ?? orderValue),
      text: "Revenue captured across visible orders",
    },
    {
      label: "Active catalog",
      value: String(overview?.activeProducts ?? products.length),
      text: "Products live inside the marketplace",
    },
    {
      label: "Active sellers",
      value: String(overview?.activeSellers ?? sellers.length),
      text: "Sellers contributing inventory and orders",
    },
    {
      label: "Low stock alerts",
      value: String(overview?.lowStockProducts ?? lowStockProducts.length),
      text: "Listings that may need replenishment soon",
    },
  ];

  return (
    <div className="section-shell space-y-6 py-8 sm:py-10">
      <section className="overflow-hidden rounded-[36px] bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_52%,#7c3aed_100%)] p-6 text-white shadow-[0_30px_80px_rgba(15,23,42,0.16)] sm:p-8">
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white/85">
              <ShieldCheck className="h-3.5 w-3.5" />
              Admin command center
            </div>
            <h1 className="mt-4 max-w-[32rem] text-[2.35rem] font-semibold tracking-[-0.05em] sm:text-[3.2rem]">
              Operate ZENVY from one premium control surface.
            </h1>
            <p className="mt-4 max-w-[35rem] text-sm leading-7 text-white/78 sm:text-base">
              Monitor GMV, catalog health, low stock, and seller quality from a dashboard that feels as polished as the storefront itself.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/products" className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950">
                Review live catalog
              </Link>
              <Link href="/seller/dashboard" className="rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white">
                Open seller view
              </Link>
            </div>

            {user?.role !== "admin" ? (
              <div className="mt-6 rounded-[24px] border border-amber-300/30 bg-amber-200/10 p-4 text-sm leading-6 text-amber-50">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-semibold">Admin preview mode</p>
                    <p className="mt-1 text-amber-50/85">
                      Live admin datasets unlock fully when you sign in as an admin. Until then, this view stays stable with safe preview data instead of breaking.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-[26px] border border-white/10 bg-white/10 p-5 backdrop-blur"
              >
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-white/65">
                  {stat.label}
                </p>
                <p className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-white">
                  {stat.value}
                </p>
                <p className="mt-2 text-sm leading-6 text-white/72">{stat.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="glass-panel rounded-[32px] p-6 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Wallet className="h-5 w-5 text-zenvy-rose" />
              <div>
                <h2 className="text-2xl font-semibold tracking-[-0.03em] text-zenvy-ink">
                  Order command center
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Value flow, fulfillment status, and recent activity
                </p>
              </div>
            </div>
            <span className="rounded-full bg-[#eff6ff] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#1d4ed8]">
              {orders.length} visible orders
            </span>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <div className="rounded-[22px] bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                Total orders
              </p>
              <p className="mt-2 text-2xl font-semibold text-zenvy-ink">
                {overview?.totalOrders ?? orders.length}
              </p>
            </div>
            <div className="rounded-[22px] bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                Confirmed
              </p>
              <p className="mt-2 text-2xl font-semibold text-emerald-600">
                {overview?.confirmedOrders ??
                  orders.filter((order) =>
                    ["confirmed", "packed", "shipped", "delivered"].includes(order.status),
                  ).length}
              </p>
            </div>
            <div className="rounded-[22px] bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                Pending
              </p>
              <p className="mt-2 text-2xl font-semibold text-amber-600">
                {overview?.pendingOrders ??
                  orders.filter((order) =>
                    ["pending", "pending_payment", "payment_created"].includes(order.status),
                  ).length}
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {orders.slice(0, 5).map((order) => (
              <div key={order.id} className="rounded-[24px] border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-zenvy-ink">{order.orderNumber}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {order.items.length} items | {dateFormatter.format(new Date(order.createdAt))}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-zenvy-rose">
                      {order.status}
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-700">
                      {formatCurrency(order.totalAmount, order.currency)}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {!orders.length ? (
              <div className="rounded-[24px] border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                Orders will appear here once admin or seller datasets are available.
              </div>
            ) : null}
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-panel rounded-[32px] p-6 sm:p-7">
            <div className="flex items-center gap-3">
              <Store className="h-5 w-5 text-zenvy-rose" />
              <div>
                <h2 className="text-2xl font-semibold tracking-[-0.03em] text-zenvy-ink">
                  Seller watch
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Ratings and fulfillment quality across active sellers
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {sellers.slice(0, 4).map((seller) => (
                <div key={seller.id} className="rounded-[24px] border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-zenvy-ink">{seller.name}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {seller.gstNumber ?? "GST record available"} | {seller.status}
                      </p>
                    </div>
                    <div className="rounded-[18px] bg-slate-50 px-3 py-2 text-right text-sm text-slate-600">
                      <p>{seller.rating.toFixed(1)} stars</p>
                      <p>{Math.round(seller.fulfillmentScore)} fulfillment</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-[32px] p-6 sm:p-7">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-zenvy-rose" />
              <div>
                <h2 className="text-2xl font-semibold tracking-[-0.03em] text-zenvy-ink">
                  Inventory alerts
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Products running low on available units
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {lowStockProducts.slice(0, 5).map((product) => (
                <div key={product.id} className="rounded-[24px] border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-zenvy-ink">{product.name}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {product.sellerName ?? product.sellerId}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-amber-600">
                        {product.availableQuantity ?? 0} left
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                        {product.category}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {!lowStockProducts.length ? (
                <div className="rounded-[24px] border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                  No low-stock warnings in the current dataset.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="glass-panel rounded-[32px] p-6 sm:p-7">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-zenvy-rose" />
            <div>
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-zenvy-ink">
                Operational highlights
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Fast signals for how the marketplace is behaving right now
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3">
            <div className="rounded-[24px] bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                Catalog readiness
              </p>
              <p className="mt-2 text-lg font-semibold text-zenvy-ink">
                {products.length} products available for browsing
              </p>
            </div>
            <div className="rounded-[24px] bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                Seller network
              </p>
              <p className="mt-2 text-lg font-semibold text-zenvy-ink">
                {sellers.length} sellers currently represented in the panel
              </p>
            </div>
            <div className="rounded-[24px] bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                Fulfillment pulse
              </p>
              <p className="mt-2 text-lg font-semibold text-zenvy-ink">
                {orders.filter((order) => order.status === "delivered").length} delivered orders visible
              </p>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-[32px] p-6 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Boxes className="h-5 w-5 text-zenvy-rose" />
              <div>
                <h2 className="text-2xl font-semibold tracking-[-0.03em] text-zenvy-ink">
                  Quick admin paths
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Jump into the main operational surfaces already present in the app
                </p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-slate-300" />
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link href="/products" className="rounded-[22px] border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-sm">
              <p className="text-sm font-semibold text-zenvy-ink">Catalog</p>
              <p className="mt-1 text-sm text-slate-500">Review live merchandising and product quality.</p>
            </Link>
            <Link href="/orders" className="rounded-[22px] border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-sm">
              <p className="text-sm font-semibold text-zenvy-ink">Orders</p>
              <p className="mt-1 text-sm text-slate-500">Track shipments and recent order movement.</p>
            </Link>
            <Link href="/seller/dashboard" className="rounded-[22px] border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-sm">
              <p className="text-sm font-semibold text-zenvy-ink">Seller view</p>
              <p className="mt-1 text-sm text-slate-500">Inspect inventory and seller-side performance surfaces.</p>
            </Link>
            <Link href="/profile" className="rounded-[22px] border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-sm">
              <p className="text-sm font-semibold text-zenvy-ink">Account and auth</p>
              <p className="mt-1 text-sm text-slate-500">Move into access, profile, and permissions controls.</p>
            </Link>
          </div>

          <div className="mt-6 rounded-[24px] bg-slate-50 p-5 text-sm leading-7 text-slate-600">
            <div className="flex items-start gap-3">
              <PackageCheck className="mt-0.5 h-5 w-5 shrink-0 text-zenvy-rose" />
              <p>
                The admin panel uses backend overview and seller endpoints directly, while protected datasets still fall back gracefully when an admin token is not active.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
