import Image from "next/image";
import {
  Headphones,
  Home,
  ShoppingBasket,
  Smartphone,
  Sparkles,
  Watch,
} from "lucide-react";

const categoryMeta = {
  electronics: {
    icon: Smartphone,
    gradient: "from-zenvy-violet/95 via-zenvy-rose/90 to-zenvy-orange/80",
  },
  wearables: {
    icon: Watch,
    gradient: "from-zenvy-ink via-zenvy-violet/90 to-zenvy-rose/80",
  },
  audio: {
    icon: Headphones,
    gradient: "from-zenvy-rose/90 via-zenvy-orange/90 to-amber-200",
  },
  fashion: {
    icon: Sparkles,
    gradient: "from-amber-200 via-zenvy-rose/75 to-zenvy-violet/75",
  },
  home: {
    icon: Home,
    gradient: "from-cyan-200 via-sky-100 to-zenvy-cloud",
  },
  grocery: {
    icon: ShoppingBasket,
    gradient: "from-lime-200 via-amber-100 to-zenvy-cloud",
  },
} as const;

interface ProductVisualProps {
  category: string;
  name: string;
  compact?: boolean;
  imageUrl?: string;
}

export function ProductVisual({
  category,
  name,
  compact = false,
  imageUrl,
}: ProductVisualProps) {
  const meta =
    categoryMeta[category as keyof typeof categoryMeta] ?? categoryMeta.electronics;
  const Icon = meta.icon;

  if (imageUrl) {
    return (
      <div
        className={`relative overflow-hidden rounded-[28px] bg-white ${
          compact ? "h-44" : "h-80"
        }`}
      >
        <Image
          src={imageUrl}
          alt={name}
          fill
          className="object-contain p-4"
          sizes={compact ? "(max-width: 768px) 50vw, 240px" : "(max-width: 768px) 100vw, 600px"}
        />
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-[28px] bg-gradient-to-br ${meta.gradient} ${
        compact ? "h-44" : "h-80"
      }`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.35),transparent_35%)]" />
      <div className="absolute -right-10 top-6 h-24 w-24 rounded-full bg-white/15 blur-2xl" />
      <div className="absolute left-6 top-6 inline-flex rounded-full border border-white/30 bg-white/15 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-white/90">
        {category}
      </div>
      <div className="absolute bottom-6 left-6 flex items-end gap-4">
        <div className="rounded-3xl border border-white/25 bg-white/15 p-4 backdrop-blur">
          <Icon className={`${compact ? "h-10 w-10" : "h-16 w-16"} text-white`} />
        </div>
        <p className="max-w-[16rem] text-sm font-medium text-white/90">{name}</p>
      </div>
    </div>
  );
}
