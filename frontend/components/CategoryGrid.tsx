import Link from "next/link";
import {
  Gamepad2,
  Headphones,
  House,
  Shirt,
  ShoppingBasket,
  Smartphone,
  Sparkles,
  Truck,
  ShieldCheck,
} from "lucide-react";

const categories = [
  {
    name: "Mobiles",
    description: "5G, battery, camera",
    icon: Smartphone,
    href: "/products?category=electronics",
    accent: "from-[#e6f0ff] to-[#f8fbff] text-[#1d4ed8]",
  },
  {
    name: "Electronics",
    description: "Laptops and tablets",
    icon: Headphones,
    href: "/products?category=electronics",
    accent: "from-[#edfdf4] to-[#f8fffb] text-[#15803d]",
  },
  {
    name: "Fashion",
    description: "Sneakers and apparel",
    icon: Shirt,
    href: "/products?category=fashion",
    accent: "from-[#fff3eb] to-[#fffaf5] text-[#ea580c]",
  },
  {
    name: "Home",
    description: "Decor and utility",
    icon: House,
    href: "/products?category=home",
    accent: "from-[#eef2ff] to-[#fbfcff] text-[#4f46e5]",
  },
  {
    name: "Food & More",
    description: "Everyday pantry",
    icon: ShoppingBasket,
    href: "/products?category=grocery",
    accent: "from-[#fff7ed] to-[#fffbf5] text-[#c2410c]",
  },
  {
    name: "Toys",
    description: "Gifting picks",
    icon: Gamepad2,
    href: "/products?category=wearables",
    accent: "from-[#fdf2f8] to-[#fffafe] text-[#be185d]",
  },
];

const confidencePoints = [
  {
    icon: Sparkles,
    title: "Editorial quality",
    text: "Collections arranged like a premium storefront, not a cluttered feed.",
  },
  {
    icon: Truck,
    title: "Fast delivery cues",
    text: "Dispatch and arrival trust signals stay visible while browsing.",
  },
  {
    icon: ShieldCheck,
    title: "Verified selection",
    text: "Marketplace feel with cleaner trust layers built into each lane.",
  },
];

export function CategoryGrid() {
  return (
    <section className="section-shell py-3">
      <div className="grid gap-4 xl:grid-cols-[0.86fr_1.14fr]">
        <div className="rounded-[30px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)] sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Why ZENVY
          </p>
          <h2 className="mt-2 text-[1.8rem] font-semibold tracking-[-0.04em] text-slate-950">
            Marketplace scale, premium front-page discipline.
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            The goal is not to copy familiar storefronts. It is to take their speed and category clarity, then present them through a cleaner, sharper, more premium interface.
          </p>

          <div className="mt-5 grid gap-3">
            {confidencePoints.map((point) => (
              <div
                key={point.title}
                className="rounded-[22px] border border-slate-200 bg-white px-4 py-4"
              >
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#edf3ff] text-[#1d4ed8]">
                    <point.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-950">{point.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-500">{point.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)] sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Departments
              </p>
              <h2 className="mt-1 text-[1.8rem] font-semibold tracking-[-0.04em] text-slate-950">
                Explore the flagship lanes
              </h2>
            </div>
            <Link href="/products" className="text-sm font-semibold text-[#1d4ed8]">
              View all
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {categories.map((category) => (
              <Link
                key={category.name}
                href={category.href}
                className="group rounded-[22px] border border-slate-200 bg-white p-4 transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_34px_rgba(15,23,42,0.08)]"
              >
                <span
                  className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${category.accent}`}
                >
                  <category.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-slate-950">{category.name}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">{category.description}</p>
                <span className="mt-4 inline-flex rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
                  Open lane
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
