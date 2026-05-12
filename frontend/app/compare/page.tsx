"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { Gift, Users } from "lucide-react";
import { useDailyStreak } from "@/hooks/useDailyStreak";
import { getSocialOffer } from "@/services/experienceService";
import { useCompareStore } from "@/store/compareStore";

export default function ComparePage() {
  const searchParams = useSearchParams();
  const comparedItems = useCompareStore((state) => state.items);
  const streak = useDailyStreak();

  const items = useMemo(() => {
    const ids = searchParams.get("ids")?.split(",").filter(Boolean) ?? [];
    if (!ids.length) {
      return comparedItems;
    }

    return comparedItems.filter((item) => ids.includes(item.id));
  }, [comparedItems, searchParams]);

  const socialOffer = items[0] ? getSocialOffer(items[0]) : null;

  return (
    <div className="section-shell py-10">
      <div className="glass-panel rounded-[34px] p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zenvy-rose">
          Compare
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-zenvy-ink">
          Side-by-side product comparison
        </h1>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-[24px] bg-[#f8fbff] p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#1d4ed8]">
              <Users className="h-4 w-4" />
              Social shopping
            </div>
            <p className="mt-2 text-sm text-slate-600">
              {socialOffer
                ? `${socialOffer.membersJoined} shoppers are currently watching similar picks.`
                : "Add products to unlock group-buy and social comparison signals."}
            </p>
          </div>
          <div className="rounded-[24px] bg-[#fffaf5] p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#c2410c]">
              <Gift className="h-4 w-4" />
              Daily streak
            </div>
            <p className="mt-2 text-sm text-slate-600">
              You are on a {streak}-day discovery streak. Keep comparing to unlock better picks.
            </p>
          </div>
        </div>

        {!items.length ? (
          <div className="mt-8 rounded-[28px] border border-dashed border-slate-200 bg-white p-10 text-center">
            <p className="text-lg font-semibold text-zenvy-ink">No products selected yet.</p>
            <p className="mt-2 text-sm text-slate-500">
              Add at least two products from the catalog compare bar.
            </p>
            <Link href="/products" className="btn-primary mt-6">
              Back to products
            </Link>
          </div>
        ) : (
          <div className="mt-8 overflow-x-auto">
            <div
              className="grid min-w-[780px] gap-4"
              style={{ gridTemplateColumns: `14rem repeat(${items.length}, minmax(0, 1fr))` }}
            >
              <div className="rounded-[24px] bg-slate-50 p-4 font-semibold text-zenvy-ink">
                Attribute
              </div>
              {items.map((item) => (
                <div key={item.id} className="rounded-[24px] bg-white p-4">
                  <p className="font-semibold text-zenvy-ink">{item.name}</p>
                  <p className="mt-1 text-sm text-slate-500">{item.brand ?? item.category}</p>
                </div>
              ))}

              {[
                { label: "Price", getter: (id: number) => `INR ${items[id].price.toLocaleString("en-IN")}` },
                { label: "Rating", getter: (id: number) => (items[id].rating ?? 0).toFixed(1) },
                { label: "Deal score", getter: (id: number) => `${items[id].dealScore ?? 0}/100` },
                {
                  label: "Delivery",
                  getter: (id: number) => items[id].deliveryLabel ?? "At checkout",
                },
              ].map((row) => (
                <div key={row.label} className="contents">
                  <div className="rounded-[24px] bg-slate-50 p-4 text-sm font-semibold text-zenvy-ink">
                    {row.label}
                  </div>
                  {items.map((item, index) => (
                    <div key={`${item.id}-${row.label}`} className="rounded-[24px] bg-white p-4 text-sm text-slate-600">
                      {row.getter(index)}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
