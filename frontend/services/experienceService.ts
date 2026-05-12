import { mockAddresses, mockOrders, mockProducts } from "@/services/mockData";
import type {
  DealTickerItem,
  EmiPlan,
  LiveCommerceSession,
  PincodeSuggestion,
  Product,
  ProductLiveSignal,
  SearchVisualSuggestion,
  SecurePaymentBadge,
  SellerAnalyticsSummary,
  SocialOffer,
} from "@/types";

const priceAlertSeed = [64999, 79999, 1299, 3499];

export function getDealTickerItems(): DealTickerItem[] {
  return [
    {
      id: "ticker-1",
      label: "Live deal",
      detail: "Zenvy Nova X dropped by INR 2,000 in the last hour",
      href: "/products/zenvy-nova-x",
    },
    {
      id: "ticker-2",
      label: "Trending",
      detail: "EchoBuds Air crossed 2,000 recent ratings",
      href: "/products/echobuds-air",
    },
    {
      id: "ticker-3",
      label: "Fast delivery",
      detail: "PureFlow Air 360 is available for tomorrow delivery",
      href: "/products/pureflow-air-360",
    },
  ];
}

export function getTrendingSearches(): string[] {
  return [
    "best camera phone under INR 70,000",
    "commute earbuds with ANC",
    "smart home upgrade",
    "festive fashion picks",
    "work from home setup",
  ];
}

export function getDidYouMean(query: string): string | null {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  const aliases: Record<string, string> = {
    mobile: "mobiles",
    earbud: "earbuds",
    headpone: "headphone",
    laptops: "laptop",
    sareees: "sarees",
    "power bank": "powerbank",
  };

  return aliases[normalized] ?? null;
}

export function getVisualSuggestions(query: string): SearchVisualSuggestion[] {
  const normalized = query.trim().toLowerCase();
  return mockProducts
    .filter((product) =>
      !normalized
        ? true
        : `${product.name} ${product.category} ${product.tags.join(" ")}`
            .toLowerCase()
            .includes(normalized),
    )
    .slice(0, 5)
    .map((product) => ({
      id: product.id,
      text: product.name,
      imageUrl: product.media?.[0]?.url,
      category: product.category,
    }));
}

export function getCategoryQuickLinks() {
  return [
    { label: "Under INR 2,000", href: "/products?q=under%20INR%202000" },
    { label: "Premium tech", href: "/products?category=electronics" },
    { label: "Fast delivery", href: "/products?q=delivery" },
    { label: "Trending fashion", href: "/products?category=fashion" },
  ];
}

export function getBudgetQuickLinks() {
  return [
    { label: "Under INR 1,000", href: "/products?q=under%20INR%201000" },
    { label: "Under INR 5,000", href: "/products?q=under%20INR%205000" },
    { label: "Under INR 20,000", href: "/products?q=under%20INR%2020000" },
    { label: "New arrivals", href: "/products?sort=newest" },
  ];
}

export function getProductLiveSignal(product: Product): ProductLiveSignal {
  const reviewCount = product.reviewCount ?? 100;
  const available = product.availableQuantity ?? 40;
  return {
    productId: product.id,
    viewerCount: Math.max(12, Math.round(reviewCount / 6)),
    soldCount24h: Math.max(8, Math.round(reviewCount / 18)),
    priceDelta: product.originalPrice ? product.originalPrice - product.price : 0,
    stockDelta: Math.max(1, Math.round(available / 10)),
    lastUpdatedAt: new Date().toISOString(),
  };
}

export function subscribeToLiveProduct(
  product: Product,
  onChange: (signal: ProductLiveSignal) => void,
) {
  let viewerCount = getProductLiveSignal(product).viewerCount;
  let stockDelta = getProductLiveSignal(product).stockDelta;

  const timer = window.setInterval(() => {
    viewerCount = Math.max(8, viewerCount + (Math.random() > 0.45 ? 1 : -1));
    stockDelta = Math.max(1, stockDelta + (Math.random() > 0.6 ? 1 : 0));

    onChange({
      ...getProductLiveSignal(product),
      viewerCount,
      stockDelta,
      lastUpdatedAt: new Date().toISOString(),
    });
  }, 4500);

  return () => window.clearInterval(timer);
}

export function getPincodeSuggestions(query: string): PincodeSuggestion[] {
  const seeds = mockAddresses.map((address) => ({
    code: address.pincode,
    city: address.city,
    state: address.state,
    deliveryPromise: "Delivery by tomorrow",
  }));

  return seeds.filter((item) => item.code.includes(query) || item.city.toLowerCase().includes(query.toLowerCase()));
}

export function getEmiPlans(amount: number): EmiPlan[] {
  return [3, 6, 9, 12].map((months) => ({
    months,
    monthlyAmount: Math.round((amount * (1 + months * 0.01)) / months),
    totalAmount: Math.round(amount * (1 + months * 0.01)),
  }));
}

export function getSecurePaymentBadges(): SecurePaymentBadge[] {
  return [
    { id: "badge-upi", label: "UPI secured", description: "Verified UPI, QR, and bank rails" },
    { id: "badge-pci", label: "PCI aligned", description: "Card checkout handled with protected flows" },
    { id: "badge-returns", label: "Easy refunds", description: "Refunds map back to your original payment method" },
  ];
}

export function getSocialOffer(product: Product): SocialOffer {
  return {
    headline: `Group buy unlocks a better ${product.brand ?? "market"} price`,
    membersJoined: Math.max(3, Math.round((product.reviewCount ?? 120) / 90)),
    pricePerBuyer: Math.max(99, product.price - Math.round(product.price * 0.05)),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 8).toISOString(),
  };
}

export function getLiveCommerceSessions(): LiveCommerceSession[] {
  return [
    {
      id: "live-session-1",
      title: "Evening gadget drop",
      host: "Naina from ZENVY Live",
      viewerCount: 284,
      productIds: ["prd_phone_1", "prd_audio_1", "prd_camera_1"],
      status: "live",
    },
    {
      id: "live-session-2",
      title: "Festive fashion edit",
      host: "Mira Studio",
      viewerCount: 112,
      productIds: ["prd_style_1", "prd_style_3", "prd_bags_1"],
      status: "scheduled",
    },
  ];
}

export function getAiSizeRecommendation(product: Product) {
  if (product.category !== "fashion") {
    return null;
  }

  return {
    recommendedSize: product.sizes?.[1] ?? product.sizes?.[0] ?? "M",
    confidence: "Based on fit patterns from similar shoppers.",
  };
}

export function getCompleteTheLookProducts(productId: string): Product[] {
  const current = mockProducts.find((item) => item.id === productId);
  if (!current) {
    return mockProducts.slice(0, 3);
  }

  return mockProducts
    .filter((item) => item.id !== current.id && item.category === current.category)
    .slice(0, 3);
}

export function getSellerAnalyticsSummary(): SellerAnalyticsSummary {
  return {
    revenue: mockOrders.reduce((sum, order) => sum + order.totalAmount, 0),
    conversionRate: 4.9,
    repeatCustomers: 38,
    lowStockCount: mockProducts.filter((product) => (product.availableQuantity ?? 0) < 20).length,
  };
}

export function getWishlistPriceAlertSeed(productId: string) {
  const index = mockProducts.findIndex((product) => product.id === productId);
  const base = priceAlertSeed[index % priceAlertSeed.length] ?? 999;
  return base;
}
