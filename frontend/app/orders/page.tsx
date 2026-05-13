"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PackageCheck, RotateCcw, Truck } from "lucide-react";
import { OrderTimeline } from "@/components/OrderTimeline";
import { formatCurrency } from "@/lib/formatters";
import { getTracking, listOrders } from "@/services/orderService";
import { mockProducts } from "@/services/mockData";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { useUiStore } from "@/store/uiStore";
import type { Order, TrackingSummary } from "@/types";

export default function OrdersPage() {
  const user = useAuthStore((state) => state.user);
  const addItem = useCartStore((state) => state.addItem);
  const addToast = useUiStore((state) => state.addToast);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tracking, setTracking] = useState<Record<string, TrackingSummary>>({});

  useEffect(() => {
    if (!user) {
      return;
    }

    listOrders(user.id).then((data) => {
      setOrders(data);
      data.forEach((order) => {
        getTracking(order.id).then((result) => {
          setTracking((current) => ({
            ...current,
            [order.id]: result,
          }));
        });
      });
    });
  }, [user]);

  return (
    <div className="section-shell py-10">
      <div className="glass-panel rounded-[34px] p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zenvy-rose">
          Orders
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-zenvy-ink">
          Track every fulfillment step
        </h1>

        {!user ? (
          <div className="mt-8 rounded-[28px] border border-dashed border-slate-200 bg-white p-8 text-center">
            <PackageCheck className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-4 text-lg font-semibold text-zenvy-ink">
              Log in to view your live orders
            </p>
            <p className="mt-2 text-sm text-slate-500">
              The page is already wired to your protected order and tracking endpoints.
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="grid gap-6 rounded-[30px] border border-slate-100 bg-white p-5 lg:grid-cols-[0.42fr_0.58fr]"
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zenvy-rose">
                    {order.status}
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-zenvy-ink">
                    {order.orderNumber}
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    {order.items.length} items | {formatCurrency(order.totalAmount, order.currency)}
                  </p>
                  <div className="mt-5 rounded-[22px] bg-slate-50 p-4 text-sm text-slate-600">
                    <p>Payment: {order.paymentStatus}</p>
                    <p className="mt-2">
                      Carrier: {tracking[order.id]?.carrier ?? order.carrier ?? "Preparing"}
                    </p>
                    <p className="mt-2">
                      Tracking ID: {tracking[order.id]?.trackingId ?? "Assigned soon"}
                    </p>
                    <p className="mt-2">
                      ETA: {tracking[order.id]?.status === "shipped" ? "Out for delivery soon" : "Timeline updating"}
                    </p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link href={`/orders/${order.id}`} className="btn-secondary px-4 py-2">
                      View tracking
                    </Link>
                    <button
                      className="btn-secondary px-4 py-2"
                      onClick={() => {
                        order.items.forEach((item) => {
                          const product = mockProducts.find((candidate) => candidate.id === item.productId);
                          if (product) {
                            for (let count = 0; count < item.quantity; count += 1) {
                              addItem(product);
                            }
                          }
                        });
                        addToast(`Reordered items from ${order.orderNumber}`);
                      }}
                    >
                      <RotateCcw className="h-4 w-4" />
                      Reorder
                    </button>
                    <span className="inline-flex items-center gap-2 rounded-full bg-[#eefbf3] px-4 py-2 text-sm font-medium text-emerald-700">
                      <Truck className="h-4 w-4" />
                      One-click reorder ready
                    </span>
                  </div>
                </div>

                <div>
                  <OrderTimeline timeline={tracking[order.id]?.timeline ?? order.timeline ?? []} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
