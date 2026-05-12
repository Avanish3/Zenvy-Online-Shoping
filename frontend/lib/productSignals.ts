import type { Product, ProductBadge } from "@/types";

const badgeLabels: Record<ProductBadge, string> = {
  deal: "Deal",
  new: "New",
  bestseller: "Bestseller",
  trending: "Trending",
  limited: "Limited",
  "top-rated": "Top rated",
};

export function getDiscountPercent(product: Product) {
  if (!product.originalPrice || product.originalPrice <= product.price) {
    return 0;
  }

  return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
}

export function getPrimaryBadges(product: Product) {
  const badges = (product.badges ?? []).map((badge) => badgeLabels[badge]);

  if ((product.availableQuantity ?? 0) > 0 && (product.availableQuantity ?? 0) <= 5) {
    badges.unshift("Only a few left");
  }

  return Array.from(new Set(badges)).slice(0, 3);
}

export function getStockMessage(product: Product) {
  const available = product.availableQuantity ?? 0;
  const reserved = product.reservedQuantity ?? 0;

  if (available <= 0) {
    return "Out of stock";
  }

  if (available <= 5) {
    return `Only ${available} left!`;
  }

  if (available <= 20) {
    return `${available} left in stock`;
  }

  if (reserved >= 8) {
    return `${reserved}+ added to carts`;
  }

  return "In stock";
}

export function getStockTone(product: Product) {
  const available = product.availableQuantity ?? 0;

  if (available <= 5) {
    return "critical";
  }

  if (available <= 20) {
    return "warning";
  }

  return "normal";
}

export function getReturnPolicy(product: Product) {
  switch (product.category) {
    case "fashion":
      return "10 day returns";
    case "grocery":
      return "Freshness guarantee";
    case "electronics":
    case "audio":
      return "7 day replacement";
    default:
      return "Easy 7 day returns";
  }
}

export function getDeliveryMessage(product: Product) {
  return product.deliveryLabel ?? "Free delivery on eligible orders";
}

export function getSellerTrust(product: Product) {
  return product.sellerName ? `Sold by ${product.sellerName}` : "Trusted ZENVY seller";
}

export function getReviewSummary(product: Product) {
  const count = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(product.reviewCount ?? 0);

  return `${count} ratings`;
}
