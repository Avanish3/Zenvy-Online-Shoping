"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Grid3X3,
  Home,
  Search,
  ShoppingCart,
  UserCircle2,
} from "lucide-react";
import clsx from "clsx";
import { triggerHaptic } from "@/lib/haptics";
import { useCartStore } from "@/store/cartStore";

const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/search", label: "Search", icon: Search },
  { href: "/categories", label: "Categories", icon: Grid3X3 },
  { href: "/cart", label: "Cart", icon: ShoppingCart, showBadge: true },
  { href: "/profile", label: "Account", icon: UserCircle2 },
];

export function BottomNav() {
  const pathname = usePathname();
  const itemCount = useCartStore((state) =>
    state.items.reduce((total, item) => total + item.quantity, 0),
  );

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
              <span className="relative">
                <link.icon className={clsx("h-4 w-4", isActive && "scale-110")} />
                {link.showBadge && itemCount > 0 ? (
                  <span className="absolute -right-2 -top-2 inline-flex min-w-4 items-center justify-center rounded-full bg-[#dc2626] px-1 text-[9px] font-bold text-white">
                    {itemCount > 99 ? "99+" : itemCount}
                  </span>
                ) : null}
              </span>
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
