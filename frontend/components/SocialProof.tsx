import { AlertCircle, ShieldCheck, TrendingUp } from "lucide-react";

export function SoldCounter({ soldCount }: { soldCount: number }) {
  if (soldCount < 25) {
    return null;
  }

  const display = soldCount >= 1000 ? `${(soldCount / 1000).toFixed(1)}k` : soldCount.toString();

  return (
    <div className="flex items-center gap-1 text-[11px] text-slate-500">
      <TrendingUp className="h-3 w-3 text-emerald-600" />
      <span>{display} sold in the last 24 hours</span>
    </div>
  );
}

export function VerifiedSellerBadge({
  tier,
}: {
  tier: "verified" | "assured" | "preferred";
}) {
  const config = {
    verified: {
      label: "ZENVY Verified",
      className: "bg-[#eef4ff] text-[#1d4ed8]",
    },
    assured: {
      label: "ZENVY Assured",
      className: "bg-emerald-50 text-emerald-700",
    },
    preferred: {
      label: "Preferred Seller",
      className: "bg-amber-50 text-amber-700",
    },
  }[tier];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${config.className}`}
    >
      <ShieldCheck className="h-3 w-3" />
      {config.label}
    </span>
  );
}

export function LowStockBadge({ quantity }: { quantity: number }) {
  if (quantity <= 0 || quantity > 5) {
    return null;
  }

  return (
    <p className="flex items-center gap-1 text-xs font-semibold text-amber-700">
      <AlertCircle className="h-3.5 w-3.5" />
      Only {quantity} left in stock
    </p>
  );
}
