"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Camera,
  Bell,
  BookOpen,
  Car,
  ChevronDown,
  Crown,
  Download,
  Gamepad2,
  Gift,
  Headphones,
  Heart,
  Home,
  Lamp,
  MapPin,
  Menu,
  Mic,
  MonitorSmartphone,
  Package2,
  Search,
  Shield,
  Shirt,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Store,
  Tv,
  UserCircle2,
  UtensilsCrossed,
  Wallet,
  X,
} from "lucide-react";
import clsx from "clsx";
import { Logo } from "@/components/Logo";
import { useVisualSearch } from "@/hooks/useVisualSearch";
import { useVoiceSearch } from "@/hooks/useVoiceSearch";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { useSearchStore } from "@/store/searchStore";
import { useUiStore } from "@/store/uiStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { getBudgetQuickLinks } from "@/services/experienceService";
import { getUserNotifications } from "@/services/commerceSignalsService";

const categoryLinks = [
  { href: "/products", label: "For You", icon: Sparkles },
  { href: "/products?category=fashion", label: "Fashion", icon: Shirt },
  { href: "/products?category=mobiles", label: "Mobiles", icon: MonitorSmartphone },
  { href: "/products?category=beauty", label: "Beauty", icon: Sparkles },
  { href: "/products?category=electronics", label: "Electronics", icon: Tv },
  { href: "/products?category=home", label: "Home", icon: Home },
  { href: "/products?category=appliances", label: "Appliances", icon: Lamp },
  { href: "/products?category=toys", label: "Toys", icon: Gamepad2 },
  { href: "/products?category=grocery", label: "Food & More", icon: UtensilsCrossed },
  { href: "/products?category=auto", label: "Auto", icon: Car },
  { href: "/products?category=sports", label: "Sports", icon: MonitorSmartphone },
  { href: "/products?category=furniture", label: "Furniture", icon: BookOpen },
];

const mobileLinks = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/search", label: "Search" },
  { href: "/orders", label: "Orders" },
  { href: "/admin", label: "Admin Panel" },
  { href: "/wishlist", label: "Wishlist" },
  { href: "/profile", label: "Account" },
];

const profileMenuItems = [
  { label: "My Profile", href: "/profile", icon: UserCircle2 },
  { label: "ZENVY Plus Zone", href: "/profile", icon: Crown },
  { label: "Orders", href: "/orders", icon: Package2 },
  { label: "Admin Panel", href: "/admin", icon: Shield },
  { label: "Wishlist", href: "/wishlist", icon: Heart },
  { label: "Become a Seller", href: "/seller/dashboard", icon: Store },
  { label: "Rewards", href: "/profile", icon: Wallet },
  { label: "Gift Cards", href: "/profile", icon: Gift },
  { label: "Notification Preferences", href: "/profile", icon: Bell },
  { label: "24x7 Customer Care", href: "/profile", icon: Headphones },
  { label: "Advertise", href: "/seller/dashboard", icon: ShoppingBag },
  { label: "Download App", href: "/", icon: Download },
];

const moreMenuItems = [
  { label: "Become a Seller", href: "/seller/dashboard", icon: Store },
  { label: "Admin Panel", href: "/admin", icon: Shield },
  { label: "Notification Settings", href: "/profile", icon: Bell },
  { label: "24x7 Customer Care", href: "/profile", icon: Headphones },
  { label: "Advertise on ZENVY", href: "/seller/dashboard", icon: ShoppingBag },
];

const megaMenuHighlights: Record<
  string,
  {
    title: string;
    links: Array<{ label: string; href: string }>;
    brands?: string[];
    deal?: {
      badge: string;
      title: string;
      href: string;
    };
  }
> = {
  "For You": {
    title: "Fast-entry lanes",
    links: getBudgetQuickLinks(),
    brands: ["ZENVY Select", "Nova", "Echo", "PureFlow", "UrbanWeave", "Drift"],
    deal: {
      badge: "AI pick",
      title: "Daily shortlist built from budget-first intent",
      href: "/products?sort=discount",
    },
  },
  Electronics: {
    title: "Premium tech lanes",
    links: [
      { label: "Flagship phones", href: "/products?q=flagship%20phone" },
      { label: "Work laptops", href: "/products?q=laptop" },
      { label: "Creator cameras", href: "/products?q=camera" },
    ],
    brands: ["Apple", "Samsung", "OnePlus", "Sony", "Canon", "ASUS"],
    deal: {
      badge: "Hot drop",
      title: "Live price movers across phones, audio, and creator gear",
      href: "/products?category=electronics&sort=discount",
    },
  },
  Fashion: {
    title: "Style edits",
    links: [
      { label: "Sneakers", href: "/products?q=sneakers" },
      { label: "Festive looks", href: "/products?q=festive%20fashion" },
      { label: "Everyday carry", href: "/products?q=backpack" },
    ],
    brands: ["Levi's", "Puma", "Nike", "Biba", "Roadster", "H&M"],
    deal: {
      badge: "Style edit",
      title: "Complete-the-look pairings and fast-moving festive picks",
      href: "/products?category=fashion",
    },
  },
};

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const cartCount = useCartStore((state) =>
    state.items.reduce((total, item) => total + item.quantity, 0),
  );
  const wishlistCount = useWishlistStore((state) => state.items.length);
  const addRecentSearch = useSearchStore((state) => state.addRecentSearch);
  const setStoredQuery = useSearchStore((state) => state.setQuery);
  const { mobileMenuOpen, setChatbotOpen, setMobileMenuOpen, addToast } = useUiStore();
  const user = useAuthStore((state) => state.user);
  const [moreOpen, setMoreOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [activeMegaMenu, setActiveMegaMenu] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState(searchParams.get("q") ?? "");
  const [notificationCount, setNotificationCount] = useState(0);
  const {
    inputRef: visualInputRef,
    handleFileChange,
    isLoading: visualSearchLoading,
    openPicker,
  } = useVisualSearch({
    onResults: (_, inferredLabel) => {
      setSearchInput(inferredLabel);
      setStoredQuery(inferredLabel);
      addRecentSearch(inferredLabel);
      setMobileMenuOpen(false);
      router.push(`/search?q=${encodeURIComponent(inferredLabel)}&mode=visual`);
    },
  });
  const { isListening, start: startVoiceSearch } = useVoiceSearch((transcript) => {
    setSearchInput(transcript);
    setStoredQuery(transcript);
    addRecentSearch(transcript);
    setMobileMenuOpen(false);
    router.push(`/search?q=${encodeURIComponent(transcript)}`);
  });

  const activeCategory = useMemo(
    () => searchParams.get("category")?.toLowerCase() ?? "for-you",
    [searchParams],
  );

  useEffect(() => {
    if (!user) {
      setNotificationCount(0);
      return;
    }

    getUserNotifications(user.id).then((items) => {
      setNotificationCount(items.filter((item) => item.status === "unread").length);
    });
  }, [user]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = searchInput.trim();

    if (!value) {
      return;
    }

    setStoredQuery(value);
    addRecentSearch(value);
    setMobileMenuOpen(false);
    router.push(`/search?q=${encodeURIComponent(value)}`);
  }

  function handleVoiceSearch() {
    if (!startVoiceSearch()) {
      addToast("Voice search is not available in this browser.");
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-[rgba(248,250,252,0.92)] backdrop-blur-xl">
      <div className="section-shell py-3">
        <div className="rounded-[30px] border border-white/80 bg-white/90 px-4 py-4 shadow-[0_18px_55px_rgba(15,23,42,0.08)] sm:px-5 lg:px-6">
          <div className="hidden items-center justify-between gap-4 border-b border-slate-100 pb-3 lg:flex">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              <span className="rounded-full bg-[#eef4ff] px-3 py-1.5 text-[#1d4ed8]">
                Premium marketplace
              </span>
              <span>AI-led search</span>
              <span className="text-slate-300">/</span>
              <span>Trusted sellers</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="h-4 w-4 text-slate-600" />
              <span className="font-semibold text-slate-900">Location not set</span>
              <Link href="/profile" prefetch={false} className="font-semibold text-[#1d4ed8]">
                Select delivery location
              </Link>
            </div>
          </div>

          <div className="mt-0 flex flex-col gap-4 lg:mt-4 lg:flex-row lg:items-center">
            <div className="flex items-center justify-between gap-3 lg:min-w-[18rem]">
              <div className="flex items-center gap-3">
                <button
                  className="rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-700 shadow-sm lg:hidden"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  aria-label="Toggle menu"
                >
                  {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>

                <Link
                  href="/"
                  prefetch={false}
                  className="rounded-[22px] bg-white px-1 py-1"
                >
                  <Logo compact className="sm:hidden" />
                  <Logo withTagline className="hidden sm:flex" />
                </Link>
              </div>

              <button
                className="inline-flex items-center gap-2 rounded-full bg-zenvy-ink px-4 py-2.5 text-sm font-semibold text-white lg:hidden"
                onClick={() => setChatbotOpen(true)}
              >
                <Sparkles className="h-4 w-4" />
                Ask AI
              </button>
            </div>

            <form onSubmit={submitSearch} className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-3 rounded-[24px] border border-[#c8d7ff] bg-[#fbfdff] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                <Search className="h-5 w-5 text-slate-400" />
                <input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  className="w-full bg-transparent text-base outline-none placeholder:text-slate-400"
                  placeholder="Search products, brands and smarter picks"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Voice search"
                    className={clsx(
                      "rounded-full p-2 text-slate-500 transition hover:bg-slate-100",
                      isListening && "bg-red-50 text-red-600",
                    )}
                    onClick={handleVoiceSearch}
                  >
                    <Mic className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Search by image"
                    className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100"
                    onClick={openPicker}
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                  <input
                    ref={visualInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
                <div className="hidden items-center gap-2 xl:flex">
                  <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {visualSearchLoading ? "Scanning" : isListening ? "Listening" : "AI ready"}
                  </span>
                  <button
                    type="submit"
                    className="rounded-full bg-[#1d4ed8] px-5 py-2.5 text-sm font-semibold text-white"
                  >
                    Search
                  </button>
                </div>
              </div>
              <div className="mt-2 hidden items-center gap-2 text-xs text-slate-500 xl:flex">
                <span className="font-semibold text-[#1d4ed8]">Popular:</span>
                <button
                  type="button"
                  className="rounded-full bg-slate-100 px-3 py-1.5 transition hover:bg-slate-200"
                  onClick={() => {
                    const prompt = "Best flagship phone under INR 70,000";
                    setSearchInput(prompt);
                    setStoredQuery(prompt);
                    addRecentSearch(prompt);
                    router.push(`/search?q=${encodeURIComponent(prompt)}`);
                  }}
                >
                  Best flagship phone under INR 70,000
                </button>
              </div>
            </form>

            <div className="hidden items-center gap-3 lg:flex">
              <button
                className="inline-flex items-center gap-2 rounded-full bg-zenvy-ink px-4 py-3 text-sm font-semibold text-white shadow-sm"
                onClick={() => setChatbotOpen(true)}
              >
                <Sparkles className="h-4 w-4" />
                Ask AI
              </button>

              <div className="relative">
                <button
                  className="inline-flex items-center gap-2 rounded-full px-3 py-2.5 text-slate-900 transition hover:bg-slate-50"
                  onClick={() => {
                    setProfileOpen((value) => !value);
                    setMoreOpen(false);
                  }}
                >
                  <UserCircle2 className="h-5 w-5" />
                  <span className="font-medium">{user ? user.name.split(" ")[0] : "Login"}</span>
                  <ChevronDown className={`h-4 w-4 transition ${profileOpen ? "rotate-180" : ""}`} />
                </button>
                {profileOpen ? (
                  <div className="absolute right-0 top-14 w-[19rem] rounded-[22px] border border-slate-200 bg-white p-3 shadow-[0_24px_70px_rgba(15,23,42,0.12)]">
                    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-3">
                      <span className="text-sm text-slate-600">New customer?</span>
                      <Link
                        href="/profile"
                        prefetch={false}
                        className="text-base font-semibold text-[#1d4ed8]"
                      >
                        Sign Up
                      </Link>
                    </div>
                    <div className="mt-3 border-t border-slate-100 pt-3">
                      {profileMenuItems.map((item) => (
                        <Link
                          key={item.label}
                          href={item.href}
                          prefetch={false}
                          className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm text-slate-700 transition hover:bg-slate-50"
                        >
                          <item.icon className="h-4 w-4 text-slate-500" />
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="relative">
                <button
                  className="inline-flex items-center gap-2 rounded-full px-3 py-2.5 text-slate-900 transition hover:bg-slate-50"
                  onClick={() => {
                    setMoreOpen((value) => !value);
                    setProfileOpen(false);
                  }}
                >
                  <span className="font-medium">More</span>
                  <ChevronDown className={`h-4 w-4 transition ${moreOpen ? "rotate-180" : ""}`} />
                </button>
                {moreOpen ? (
                  <div className="absolute right-0 top-14 w-64 rounded-[22px] border border-slate-200 bg-white p-3 shadow-[0_24px_70px_rgba(15,23,42,0.12)]">
                    <div className="px-3 py-2 text-lg font-semibold text-slate-800">More</div>
                    {moreMenuItems.map((item) => (
                      <Link
                        key={item.label}
                        href={item.href}
                        prefetch={false}
                        className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm text-slate-700 transition hover:bg-slate-50"
                      >
                        <item.icon className="h-4 w-4 text-slate-500" />
                        {item.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>

              <Link
                href="/wishlist"
                prefetch={false}
                className="relative inline-flex items-center gap-2 rounded-full px-3 py-2.5 text-slate-900 transition hover:bg-slate-50"
              >
                <Heart className="h-5 w-5" />
                <span className="font-medium">Saved</span>
                {wishlistCount > 0 ? (
                  <span className="absolute right-1 top-1 rounded-full bg-[#1d4ed8] px-1.5 text-[10px] font-semibold text-white">
                    {wishlistCount}
                  </span>
                ) : null}
              </Link>
              <Link
                href="/profile"
                prefetch={false}
                className="relative inline-flex items-center gap-2 rounded-full px-3 py-2.5 text-slate-900 transition hover:bg-slate-50"
              >
                <Bell className="h-5 w-5" />
                <span className="font-medium">Alerts</span>
                {notificationCount > 0 ? (
                  <span className="absolute right-1 top-1 rounded-full bg-[#1d4ed8] px-1.5 text-[10px] font-semibold text-white">
                    {notificationCount}
                  </span>
                ) : null}
              </Link>
              <Link
                href="/cart"
                prefetch={false}
                className="relative inline-flex items-center gap-2 rounded-full px-3 py-2.5 text-slate-900 transition hover:bg-slate-50"
              >
                <ShoppingCart className="h-5 w-5" />
                <span className="font-medium">Cart</span>
                {cartCount > 0 ? (
                  <span className="absolute right-1 top-1 rounded-full bg-[#1d4ed8] px-1.5 text-[10px] font-semibold text-white">
                    {cartCount}
                  </span>
                ) : null}
              </Link>
            </div>
          </div>

          <div className="mt-4 hidden lg:block">
            <div className="rounded-[28px] border border-slate-200 bg-[#fbfcff] px-3 py-3">
              <div
                className="relative"
                onMouseLeave={() => setActiveMegaMenu(null)}
              >
                <div className="flex items-center gap-3 overflow-x-auto whitespace-nowrap scrollbar-none">
                {categoryLinks.map((link) => {
                  const categoryKey = link.href.split("category=")[1] ?? "for-you";
                  const isActive =
                    activeCategory === categoryKey || (pathname === "/" && link.label === "For You");

                  return (
                    <Link
                      key={link.label}
                      href={link.href}
                      prefetch={false}
                      onMouseEnter={() =>
                        setActiveMegaMenu(
                          megaMenuHighlights[link.label] ? link.label : null,
                        )
                      }
                      className={clsx(
                        "flex min-w-fit items-center gap-3 rounded-[20px] px-3 py-2.5 text-sm text-slate-700 transition",
                        isActive
                          ? "bg-white text-slate-950 shadow-sm ring-1 ring-[#dce7ff]"
                          : "hover:bg-white/80",
                      )}
                    >
                      <span
                        className={clsx(
                          "inline-flex h-10 w-10 items-center justify-center rounded-2xl",
                          isActive ? "bg-[#edf3ff] text-[#1d4ed8]" : "bg-white text-slate-600",
                        )}
                      >
                        <link.icon className="h-5 w-5" />
                      </span>
                      <div className="flex flex-col leading-none">
                        <span className={clsx("font-semibold", isActive && "text-[#1d4ed8]")}>
                          {link.label}
                        </span>
                        <span className="mt-1 text-[11px] uppercase tracking-[0.14em] text-slate-400">
                          Explore
                        </span>
                      </div>
                    </Link>
                  );
                })}
                </div>
                {activeMegaMenu && megaMenuHighlights[activeMegaMenu] ? (
                  <div className="absolute left-0 top-[calc(100%+0.85rem)] z-20 w-[56rem] max-w-[calc(100vw-4rem)] rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.12)] transition-all duration-200">
                    <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr_0.8fr]">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                          {megaMenuHighlights[activeMegaMenu].title}
                        </p>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          {megaMenuHighlights[activeMegaMenu].links.map((item) => (
                            <Link
                              key={item.label}
                              href={item.href}
                              prefetch={false}
                              className="rounded-[18px] bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-[#eef4ff] hover:text-[#1d4ed8]"
                            >
                              {item.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                          Top brands
                        </p>
                        <div className="mt-4 grid grid-cols-2 gap-3">
                          {(megaMenuHighlights[activeMegaMenu].brands ?? []).map((brand) => (
                            <Link
                              key={brand}
                              href={`/products?brand=${encodeURIComponent(brand)}`}
                              prefetch={false}
                              className="rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-[#bfd1ff] hover:text-[#1d4ed8]"
                            >
                              {brand}
                            </Link>
                          ))}
                        </div>
                      </div>
                      {megaMenuHighlights[activeMegaMenu].deal ? (
                        <Link
                          href={megaMenuHighlights[activeMegaMenu].deal.href}
                          prefetch={false}
                          className="rounded-[24px] bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_55%,#f97316_100%)] p-5 text-white transition hover:-translate-y-0.5"
                        >
                          <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/85">
                            {megaMenuHighlights[activeMegaMenu].deal.badge}
                          </span>
                          <p className="mt-4 text-lg font-semibold leading-7">
                            {megaMenuHighlights[activeMegaMenu].deal.title}
                          </p>
                          <p className="mt-3 text-sm text-white/80">
                            Open a cleaner curated lane with stronger trust and deal cues.
                          </p>
                        </Link>
                      ) : (
                        <div />
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      {mobileMenuOpen ? (
        <div className="section-shell pb-4 lg:hidden">
          <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_20px_60px_rgba(15,23,42,0.1)]">
            <div className="mb-4 rounded-[20px] bg-slate-50 p-3 text-sm text-slate-600">
              <div className="flex items-center gap-2 font-semibold text-slate-900">
                <MapPin className="h-4 w-4" />
                Location not set
              </div>
              <Link href="/profile" prefetch={false} className="mt-2 block font-semibold text-[#1d4ed8]">
                Select delivery location
              </Link>
            </div>

            <form onSubmit={submitSearch}>
              <div className="mb-4 flex items-center gap-3 rounded-[20px] border border-slate-200 px-4 py-3">
                <Search className="h-5 w-5 text-slate-400" />
                <input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                  placeholder="Search products and brands"
                />
                <button
                  type="button"
                  aria-label="Voice search"
                  className={clsx(
                    "rounded-full p-2 text-slate-500 transition hover:bg-slate-100",
                    isListening && "bg-red-50 text-red-600",
                  )}
                  onClick={handleVoiceSearch}
                >
                  <Mic className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Search by image"
                  className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100"
                  onClick={openPicker}
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>
            </form>

            <button
              className="mb-4 inline-flex w-full items-center justify-center gap-2 rounded-[18px] bg-zenvy-ink px-4 py-3 text-sm font-semibold text-white"
              onClick={() => {
                setChatbotOpen(true);
                setMobileMenuOpen(false);
              }}
            >
              <Sparkles className="h-4 w-4" />
              Ask AI for recommendations
            </button>

            <div className="mb-4 grid grid-cols-2 gap-2">
              {categoryLinks.slice(0, 6).map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  prefetch={false}
                  className="rounded-[18px] border border-slate-200 bg-[#fbfcff] px-3 py-3 text-sm font-medium text-slate-700"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="grid gap-2">
              {mobileLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  prefetch={false}
                  className="rounded-[18px] px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
