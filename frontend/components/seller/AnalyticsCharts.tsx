"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { getSellerAnalyticsSummary } from "@/services/experienceService";

const RANGE_OPTIONS = [
  { id: "7d", label: "7 days" },
  { id: "30d", label: "30 days" },
  { id: "90d", label: "90 days" },
] as const;

const SERIES_BY_RANGE = {
  "7d": [58, 64, 71, 69, 78, 83, 88],
  "30d": [36, 42, 49, 57, 61, 66, 70],
  "90d": [22, 31, 37, 44, 56, 63, 72],
} as const;

export function SellerAnalytics() {
  const [range, setRange] = useState<(typeof RANGE_OPTIONS)[number]["id"]>("30d");
  const analytics = getSellerAnalyticsSummary();
  const series = useMemo(() => SERIES_BY_RANGE[range], [range]);

  return (
    <section className="glass-panel rounded-[32px] p-6 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-zenvy-ink">
            Seller analytics
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Revenue trend, repeat buyers, and conversion posture in one snapshot.
          </p>
        </div>
        <div className="flex gap-2">
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option.id}
              className={clsx(
                "rounded-full px-4 py-2 text-sm font-semibold transition",
                range === option.id
                  ? "bg-zenvy-ink text-white"
                  : "bg-white text-slate-600",
              )}
              onClick={() => setRange(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-4">
        <div className="rounded-[22px] bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Revenue</p>
          <p className="mt-2 text-xl font-semibold text-zenvy-ink">
            INR {analytics.revenue.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="rounded-[22px] bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Conversion</p>
          <p className="mt-2 text-xl font-semibold text-zenvy-ink">{analytics.conversionRate}%</p>
        </div>
        <div className="rounded-[22px] bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Repeat buyers</p>
          <p className="mt-2 text-xl font-semibold text-zenvy-ink">{analytics.repeatCustomers}%</p>
        </div>
        <div className="rounded-[22px] bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Low stock</p>
          <p className="mt-2 text-xl font-semibold text-zenvy-ink">{analytics.lowStockCount}</p>
        </div>
      </div>

      <div className="mt-6 rounded-[28px] border border-slate-100 bg-white p-5">
        <div className="flex items-end gap-3">
          {series.map((value, index) => (
            <div key={`${range}-${index}`} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex h-44 w-full items-end rounded-[18px] bg-slate-50 p-2">
                <div
                  className="w-full rounded-[14px] bg-[linear-gradient(180deg,#60a5fa_0%,#1d4ed8_100%)]"
                  style={{ height: `${value}%` }}
                />
              </div>
              <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
                {index + 1}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
