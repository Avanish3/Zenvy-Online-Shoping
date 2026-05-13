"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Boxes,
  Layers3,
  PackageCheck,
  ShieldCheck,
  Star,
  Store,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { ProductVisual } from "@/components/ProductVisual";
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
  const orderStatusBreakdown = useMemo(() => {
    const entries = Object.entries(
      orders.reduce<Record<string, number>>((accumulator, order) => {
        accumulator[order.status] = (accumulator[order.status] ?? 0) + 1;
        return accumulator;
      }, {}),
    );

    return entries
      .sort((left, right) => right[1] - left[1])
      .slice(0, 5);
  }, [orders]);
  const sellerPerformance = useMemo(() => {
    const maxScore = Math.max(...sellers.map((seller) => seller.fulfillmentScore), 1);

    return sellers
      .slice()
      .sort((left, right) => right.fulfillmentScore - left.fulfillmentScore)
      .slice(0, 5)
      .map((seller) => ({
        ...seller,
        scoreWidth: `${Math.max(12, Math.round((seller.fulfillmentScore / maxScore) * 100))}%`,
      }));
  }, [sellers]);
  const featuredCatalog = useMemo(
    () =>
      products
        .slice()
        .sort(
          (left, right) =>
            (right.dealScore ?? 0) + (right.rating ?? 0) * 10 - ((left.dealScore ?? 0) + (left.rating ?? 0) * 10),
        )
        .slice(0, 4),
    [products],
  );
  const categoryMix = useMemo(() => {
    return Object.entries(
      products.reduce<Record<string, { count: number; stock: number }>>((accumulator, product) => {
        const current = accumulator[product.category] ?? { count: 0, stock: 0 };
        current.count += 1;
        current.stock += product.availableQuantity ?? 0;
        accumulator[product.category] = current;
        return accumulator;
      }, {}),
    )
      .map(([category, metrics]) => ({ category, ...metrics }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 5);
  }, [products]);
  const sellerCatalogMix = useMemo(() => {
    return sellers
      .map((seller) => {
        const sellerProducts = products.filter((product) => product.sellerId === seller.id);
        return {
          ...seller,
          catalogCount: sellerProducts.length,
          stockUnits: sellerProducts.reduce((sum, product) => sum + (product.availableQuantity ?? 0), 0),
        };
      })
      .sort((left, right) => right.catalogCount - left.catalogCount)
      .slice(0, 4);
  }, [products, sellers]);

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

      <section className="grid gap-6 xl:grid-cols-[1.14fr_0.86fr]">
        <div className="glass-panel rounded-[32px] p-6 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Layers3 className="h-5 w-5 text-zenvy-rose" />
              <div>
                <h2 className="text-2xl font-semibold tracking-[-0.03em] text-zenvy-ink">
                  Catalog spotlight
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Featured products with price, seller, inventory, delivery, and trust details
                </p>
              </div>
            </div>
            <span className="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              {featuredCatalog.length} detailed listings
            </span>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {featuredCatalog.map((product) => {
              const discount =
                product.originalPrice && product.originalPrice > product.price
                  ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                  : 0;

              return (
                <div
                  key={product.id}
                  className="overflow-hidden rounded-[28px] border border-slate-200 bg-white p-3 shadow-[0_16px_42px_rgba(15,23,42,0.05)]"
                >
                  <ProductVisual
                    category={product.category}
                    name={product.name}
                    compact
                    imageUrl={product.media?.[0]?.url}
                  />
                  <div className="px-1 pb-2 pt-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                          {product.brand ?? product.category}
                        </p>
                        <p className="mt-1 text-lg font-semibold text-zenvy-ink">{product.name}</p>
                      </div>
                      <div className="rounded-[18px] bg-slate-50 px-3 py-2 text-right">
                        <div className="flex items-center gap-1 text-sm font-semibold text-amber-600">
                          <Star className="h-3.5 w-3.5 fill-current" />
                          {(product.rating ?? 0).toFixed(1)}
                        </div>
                        <p className="mt-1 text-xs text-slate-500">{product.reviewCount ?? 0} reviews</p>
                      </div>
                    </div>

                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                      {product.description}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <p className="text-xl font-semibold text-zenvy-ink">
                        {formatCurrency(product.price, product.currency)}
                      </p>
                      {product.originalPrice ? (
                        <span className="text-sm text-slate-400 line-through">
                          {formatCurrency(product.originalPrice, product.currency)}
                        </span>
                      ) : null}
                      {discount ? (
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                          {discount}% off
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-[18px] bg-slate-50 px-3 py-3">
                        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
                          Seller
                        </p>
                        <p className="mt-1 line-clamp-1 text-sm font-semibold text-zenvy-ink">
                          {product.sellerName ?? product.sellerId}
                        </p>
                      </div>
                      <div className="rounded-[18px] bg-slate-50 px-3 py-3">
                        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
                          Inventory
                        </p>
                        <p className="mt-1 text-sm font-semibold text-zenvy-ink">
                          {product.availableQuantity ?? 0} available
                        </p>
                      </div>
                      <div className="rounded-[18px] bg-slate-50 px-3 py-3">
                        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
                          Reserved
                        </p>
                        <p className="mt-1 text-sm font-semibold text-zenvy-ink">
                          {product.reservedQuantity ?? 0} units
                        </p>
                      </div>
                      <div className="rounded-[18px] bg-slate-50 px-3 py-3">
                        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
                          Warehouse
                        </p>
                        <p className="mt-1 text-sm font-semibold text-zenvy-ink">
                          {product.warehouseCode ?? "Assigned"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {(product.badges ?? []).slice(0, 3).map((badge) => (
                        <span
                          key={badge}
                          className="rounded-full bg-[#eef4ff] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#1d4ed8]"
                        >
                          {badge}
                        </span>
                      ))}
                      {product.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <p className="mt-4 text-sm text-slate-500">
                      {product.deliveryLabel ?? "Delivery promise available at checkout"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-panel rounded-[32px] p-6 sm:p-7">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-zenvy-rose" />
              <div>
                <h2 className="text-2xl font-semibold tracking-[-0.03em] text-zenvy-ink">
                  Category density
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Product count and visible units across major catalog categories
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {categoryMix.map((item) => {
                const width = `${Math.max(14, Math.round((item.count / Math.max(products.length, 1)) * 100))}%`;
                return (
                  <div key={item.category} className="rounded-[24px] border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold capitalize text-zenvy-ink">{item.category}</p>
                        <p className="mt-1 text-sm text-slate-500">{item.stock} units visible</p>
                      </div>
                      <span className="text-sm font-semibold text-slate-700">{item.count} SKUs</span>
                    </div>
                    <div className="mt-3 rounded-full bg-slate-100 p-1">
                      <div
                        className="h-2 rounded-full bg-[linear-gradient(90deg,#1d4ed8_0%,#60a5fa_100%)]"
                        style={{ width }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="glass-panel rounded-[32px] p-6 sm:p-7">
            <div className="flex items-center gap-3">
              <Store className="h-5 w-5 text-zenvy-rose" />
              <div>
                <h2 className="text-2xl font-semibold tracking-[-0.03em] text-zenvy-ink">
                  Seller catalog load
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Which sellers carry the deepest share of the visible catalog
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {sellerCatalogMix.map((seller) => (
                <div key={seller.id} className="rounded-[24px] border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-zenvy-ink">{seller.name}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {seller.catalogCount} products | {seller.stockUnits} stock units
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
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="glass-panel rounded-[32px] p-6 sm:p-7">
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-zenvy-ink">
            Order status mix
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            A quick read on which fulfillment states dominate the current snapshot.
          </p>
          <div className="mt-6 space-y-4">
            {orderStatusBreakdown.map(([status, count]) => {
              const width = `${Math.max(12, Math.round((count / Math.max(orders.length, 1)) * 100))}%`;
              return (
                <div key={status}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium capitalize text-slate-700">
                      {status.replace(/_/g, " ")}
                    </span>
                    <span className="text-slate-500">{count}</span>
                  </div>
                  <div className="mt-2 rounded-full bg-slate-100 p-1">
                    <div
                      className="h-2 rounded-full bg-[linear-gradient(90deg,#1d4ed8_0%,#60a5fa_100%)]"
                      style={{ width }}
                    />
                  </div>
                </div>
              );
            })}
            {!orderStatusBreakdown.length ? (
              <div className="rounded-[24px] border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                No order data available yet.
              </div>
            ) : null}
          </div>
        </div>

        <div className="glass-panel rounded-[32px] p-6 sm:p-7">
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-zenvy-ink">
            Seller performance board
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            High-level fulfillment confidence across the most visible sellers.
          </p>
          <div className="mt-6 space-y-4">
            {sellerPerformance.map((seller) => (
              <div key={seller.id} className="rounded-[24px] border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-zenvy-ink">{seller.name}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {seller.rating.toFixed(1)} stars | {seller.status}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-slate-700">
                    {Math.round(seller.fulfillmentScore)}
                  </span>
                </div>
                <div className="mt-3 rounded-full bg-slate-100 p-1">
                  <div
                    className="h-2 rounded-full bg-[linear-gradient(90deg,#10b981_0%,#34d399_100%)]"
                    style={{ width: seller.scoreWidth }}
                  />
                </div>
              </div>
            ))}
            {!sellerPerformance.length ? (
              <div className="rounded-[24px] border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                Seller metrics will appear here when the dataset is available.
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
