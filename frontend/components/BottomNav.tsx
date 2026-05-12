"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Home, Search, ShoppingBag, UserCircle2 } from "lucide-react";
import clsx from "clsx";
import { triggerHaptic } from "@/lib/haptics";

const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/search", label: "Search", icon: Search },
  { href: "/products", label: "Shop", icon: ShoppingBag },
  { href: "/wishlist", label: "Saved", icon: Heart },
  { href: "/profile", label: "Account", icon: UserCircle2 },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 px-2 py-2 backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-xl grid-cols-5 gap-1">
        {links.map((link) => {
          const isActive =
            pathname === link.href ||
            (link.href !== "/" && pathname?.startsWith(link.href));

          return (
            <Link
              key={link.href}
              href={link.href}
              prefetch={false}
              onClick={() => triggerHaptic(10)}
              className={clsx(
                "flex min-h-[60px] flex-col items-center justify-center gap-1 rounded-2xl px-2 py-3 text-[11px] font-medium transition",
                isActive ? "bg-slate-100 text-zenvy-ink" : "text-slate-500",
              )}
            >
              <link.icon className={clsx("h-4 w-4", isActive && "scale-110")} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
