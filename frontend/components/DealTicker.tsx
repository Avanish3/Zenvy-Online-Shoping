"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bolt } from "lucide-react";
import { getDealTickerItems } from "@/services/experienceService";

export function DealTicker() {
  const items = getDealTickerItems();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % items.length);
    }, 3200);

    return () => window.clearInterval(timer);
  }, [items.length]);

  const active = items[index];

  return (
    <div className="border-b border-slate-200 bg-[#0f172a] text-white">
      <div className="section-shell flex items-center gap-3 py-2.5 text-sm">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
          <Bolt className="h-4 w-4 text-[#fbbf24]" />
          Live deals
        </span>
        <Link href={active.href} className="truncate text-white/90">
          <span className="font-semibold text-white">{active.label}:</span> {active.detail}
        </Link>
      </div>
    </div>
  );
}
