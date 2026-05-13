export type UserRole = "user" | "seller" | "admin";
export type UserTier = "bronze" | "silver" | "gold" | "platinum";
export type ProductBadge =
  | "deal"
  | "new"
  | "bestseller"
  | "trending"
  | "limited"
  | "top-rated";
export type ProductCardVariant = "grid" | "list" | "compact" | "mini";

export interface ProductMedia {
  id: string;
  url: string;
  altText?: string;
  type?: "image" | "video";
}

export interface ProductVariant {
  id: string;
  label: string;
  type: "color" | "size" | "storage" | "finish";
  value: string;
  price?: number;
  imageHint?: string;
  inStock?: boolean;
}

export interface ProductSpecification {
  label: string;
  value: string;
}

export interface ProductQuestion {
  question: string;
  answer: string;
}

export interface Product {
  id: string;
  sku: string;
  slug?: string;
  name: string;
  brand?: string;
  description: string;
  category: string;
  price: number;
  originalPrice?: number;
  currency: string;
  sellerId: string;
  sellerName?: string;
  rating?: number;
  reviewCount?: number;
  dealScore?: number;
  availableQuantity?: number;
  reservedQuantity?: number;
  warehouseCode?: string | null;
  deliveryLabel?: string;
  badges?: ProductBadge[];
  tags: string[];
  colors?: string[];
  sizes?: string[];
  variants?: ProductVariant[];
  specifications?: ProductSpecification[];
  questions?: ProductQuestion[];
  recommendationReason?: string;
  reviewSummary?: string;
  media?: ProductMedia[];
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
  verified?: boolean;
}

export interface CartLine {
  id: string;
  productId: string;
  variantId?: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  currency: string;
  lineTotal: number;
}

export interface Cart {
  userId: string;
  currency: string;
  items: CartLine[];
  totalAmount: number;
  updatedAt: string;
}

export interface OrderTimelineEntry {
  status: string;
  note: string;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  status: string;
  paymentStatus: string;
  currency: string;
  totalAmount: number;
  createdAt: string;
  trackingId?: string | null;
  carrier?: string | null;
  packedAt?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  timeline?: OrderTimelineEntry[];
}

export interface TrackingSummary {
  orderId: string;
  orderNumber: string;
  status: string;
  trackingId?: string | null;
  carrier?: string | null;
  packedAt?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  timeline: OrderTimelineEntry[];
}

export interface PaymentIntent {
  id: string;
  orderId: string;
  provider: "razorpay" | "stripe";
  status: string;
  amount: number;
  currency: string;
  clientToken: string;
  providerReference: string;
  providerPayload?: Record<string, unknown>;
}

export interface PaymentConfirmationResult {
  paymentId: string;
  providerPaymentId: string;
  status: string;
}

export interface AssistantMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export interface AssistantReply {
  message: string;
  provider?: string;
  suggestedProducts?: Product[];
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tier?: UserTier;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  refreshExpiresIn: number;
  sessionId?: string;
  user: AuthUser;
}

export interface Address {
  id: string;
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  type: "home" | "work" | "other";
  isDefault?: boolean;
}

export interface PaymentMethodOption {
  id: string;
  label: string;
  type: "upi" | "card" | "netbanking" | "wallet" | "bnpl" | "cod";
  description: string;
}

export interface SearchFilters {
  category?: string;
  brand?: string;
  rating?: number;
  minPrice?: number;
  maxPrice?: number;
  sort?:
    | "relevance"
    | "price-asc"
    | "price-desc"
    | "rating"
    | "newest"
    | "discount";
  view?: "grid" | "list";
}

export interface SearchResponse {
  items: Product[];
  facets: {
    categories: string[];
    sellers: string[];
    brands: string[];
  };
  total: number;
  suggestedCorrection?: string | null;
}

export interface DealTickerItem {
  id: string;
  label: string;
  detail: string;
  href: string;
}

export interface SearchVisualSuggestion {
  id: string;
  text: string;
  imageUrl?: string;
  category?: string;
}

export interface ProductLiveSignal {
  productId: string;
  viewerCount: number;
  soldCount24h: number;
  priceDelta: number;
  stockDelta: number;
  lastUpdatedAt: string;
}

export interface InventorySnapshot {
  productId: string;
  availableQuantity: number;
  reservedQuantity: number;
  warehouseCode?: string | null;
}

export interface DynamicPriceSnapshot {
  variantId: string;
  productId: string;
  currentPrice: number;
  originalPrice: number;
  currency: string;
  reasons: string[];
}

export interface PriceHistoryPoint {
  date: string;
  amount: number;
  currency: string;
}

export interface PincodeSuggestion {
  code: string;
  city: string;
  state: string;
  deliveryPromise: string;
}

export interface EmiPlan {
  months: number;
  monthlyAmount: number;
  totalAmount: number;
}

export interface SecurePaymentBadge {
  id: string;
  label: string;
  description: string;
}

export interface SocialOffer {
  headline: string;
  membersJoined: number;
  pricePerBuyer: number;
  expiresAt: string;
}

export interface LiveCommerceSession {
  id: string;
  title: string;
  host: string;
  viewerCount: number;
  productIds: string[];
  status: "live" | "scheduled";
  createdAt?: string;
  streamId?: string;
}

export interface SellerAnalyticsSummary {
  revenue: number;
  conversionRate: number;
  repeatCustomers: number;
  lowStockCount: number;
}

export interface UserNotification {
  id: string;
  userId: string;
  channel: "push" | "email" | "sms" | "in_app";
  title: string;
  message: string;
  status: "read" | "unread";
  createdAt: string;
  readAt?: string | null;
}

export interface LoyaltySummary {
  userId: string;
  pointsBalance: number;
  tier: UserTier;
  nextTier: UserTier;
}

export type RealtimeChannel =
  | "/ws/orders"
  | "/ws/prices"
  | "/ws/notifications"
  | "/ws/live";

export interface RealtimeEventMessage<T = unknown> {
  type: string;
  event?: string;
  room?: string;
  channel?: RealtimeChannel;
  payload?: T;
  received?: unknown;
}
