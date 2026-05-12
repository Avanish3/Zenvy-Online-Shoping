import Link from "next/link";
import { Logo } from "@/components/Logo";

export function Footer() {
  return (
    <footer className="section-shell pb-10 pt-14">
      <div className="glass-panel grid gap-8 rounded-[36px] px-6 py-8 sm:px-8 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-md text-sm leading-7 text-slate-600">
            ZENVY is built for shoppers who want signal over noise: faster
            discovery, cleaner decisions, and AI that helps instead of distracts.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-zenvy-ink">
            Explore
          </p>
          <div className="mt-4 grid gap-3 text-sm text-slate-600">
            <Link href="/products" prefetch={false}>Product grid</Link>
            <Link href="/search" prefetch={false}>AI Search</Link>
            <Link href="/orders" prefetch={false}>Track Orders</Link>
            <Link href="/wishlist" prefetch={false}>Wishlist</Link>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-zenvy-ink">
            Experience
          </p>
          <div className="mt-4 grid gap-3 text-sm text-slate-600">
            <Link href="/checkout" prefetch={false}>Checkout</Link>
            <Link href="/profile" prefetch={false}>Account</Link>
            <Link href="/search" prefetch={false}>Voice Search</Link>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-zenvy-ink">
            Signature
          </p>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            Shop more. Enjoy more. Move from browsing to deciding with less
            friction and better taste.
          </p>
        </div>
      </div>
    </footer>
  );
}
