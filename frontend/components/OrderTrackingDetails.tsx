"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, PackageCheck, Radio, Truck } from "lucide-react";
import { useRealtimeChannel } from "@/hooks/useRealtimeChannel";
import { OrderTimeline } from "@/components/OrderTimeline";
import { getTracking, listOrders } from "@/services/orderService";
import { useAuthStore } from "@/store/authStore";
import type { Order, TrackingSummary } from "@/types";

const STEPS = ["confirmed", "packed", "shipped", "delivered"] as const;

function formatStatusLabel(status: string) {
  return status.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

interface OrderTrackingDetailsProps {
  orderId: string;
}

export function OrderTrackingDetails({ orderId }: OrderTrackingDetailsProps) {
  const user = useAuthStore((state) => state.user);
  const [order, setOrder] = useState<Order | null>(null);
  const [tracking, setTracking] = useState<TrackingSummary | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    listOrders(user.id).then((orders) => {
      setOrder(orders.find((item) => item.id === orderId) ?? null);
    });
    getTracking(orderId).then(setTracking);
  }, [orderId, user]);

  const currentStatus = tracking?.status ?? order?.status ?? "confirmed";
  const activeStep = useMemo(
    () => Math.max(0, STEPS.findIndex((step) => step === currentStatus)),
    [currentStatus],
  );
  const handleRealtimeMessage = useCallback(
    (message: { event?: string; payload?: Order | TrackingSummary }) => {
      if (message.event === "order.status.updated" && message.payload) {
        setOrder(message.payload as Order);
      }

      if (message.event === "order.tracking.updated" && message.payload) {
        setTracking(message.payload as TrackingSummary);
      }
    },
    [],
  );
  const realtimeStatus = useRealtimeChannel("/ws/orders", {
    room: orderId,
    enabled: Boolean(user),
    onMessage: handleRealtimeMessage,
  });

  if (!user) {
    return (
      <div className="section-shell py-10">
        <div className="glass-panel rounded-[34px] p-8 text-center">
          <PackageCheck className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-4 text-lg font-semibold text-zenvy-ink">Log in to track this order</p>
        </div>
      </div>
    );
  }

  if (!tracking || !order) {
    return (
      <div className="section-shell py-10">
        <div className="glass-panel rounded-[34px] p-8 text-center text-slate-600">
          Loading order tracking...
        </div>
      </div>
    );
  }

  return (
    <div className="section-shell space-y-6 py-10">
      <Link href="/orders" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500">
        <ArrowLeft className="h-4 w-4" />
        Back to orders
      </Link>

      <section className="glass-panel rounded-[34px] p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zenvy-rose">
          Order tracking
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-zenvy-ink">{tracking.orderNumber}</h1>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          <Radio className="h-3.5 w-3.5 text-[#1d4ed8]" />
          Order room {realtimeStatus}
        </div>
        <div className="mt-6 rounded-[24px] bg-slate-50 p-5">
          <div className="relative flex justify-between gap-3">
            <div className="absolute left-4 right-4 top-4 h-0.5 bg-slate-200">
              <div
                className="h-full bg-[#1d4ed8] transition-all duration-500"
                style={{ width: `${(activeStep / (STEPS.length - 1)) * 100}%` }}
              />
            </div>
            {STEPS.map((step, index) => (
              <div key={step} className="z-10 flex w-full flex-col items-center gap-2 text-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold ${
                    index <= activeStep
                      ? "border-[#1d4ed8] bg-[#1d4ed8] text-white"
                      : "border-slate-300 bg-white text-slate-500"
                  }`}
                >
                  {index < activeStep ? <Check className="h-4 w-4" /> : index + 1}
                </div>
                <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
                  {formatStatusLabel(step)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[0.42fr_0.58fr]">
          <div className="rounded-[24px] border border-slate-100 bg-white p-5">
            <div className="flex items-center gap-3">
              <Truck className="h-5 w-5 text-[#1d4ed8]" />
              <div>
                <p className="text-sm font-semibold text-zenvy-ink">
                  {tracking.carrier ?? "Carrier update pending"}
                </p>
                <p className="text-xs text-slate-400">
                  Tracking ID: {tracking.trackingId ?? "Assigned soon"}
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Current status: <span className="font-semibold text-zenvy-ink">{formatStatusLabel(currentStatus)}</span>
            </p>
          </div>

          <div className="rounded-[24px] border border-slate-100 bg-white p-5">
            <OrderTimeline timeline={tracking.timeline} />
          </div>
        </div>
      </section>
    </div>
  );
}
