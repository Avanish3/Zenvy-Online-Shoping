import { CreditCard, RotateCcw, ShieldCheck, Truck } from "lucide-react";

const trustItems = [
  { icon: ShieldCheck, label: "Verified sellers" },
  { icon: Truck, label: "Delivery promises" },
  { icon: RotateCcw, label: "Easy returns" },
  { icon: CreditCard, label: "Secure payments" },
];

export function TrustBar() {
  return (
    <div className="border-b border-slate-200/80 bg-white/80 backdrop-blur">
      <div className="section-shell">
        <div className="flex gap-3 overflow-x-auto py-3 text-sm text-slate-600 scrollbar-none">
          {trustItems.map((item) => (
            <div
              key={item.label}
              className="inline-flex min-w-fit items-center gap-2 rounded-full bg-slate-50 px-3 py-2"
            >
              <item.icon className="h-4 w-4 text-[#1d4ed8]" />
              <span className="font-medium">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
