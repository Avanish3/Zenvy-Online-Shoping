"use client";

import { useMemo, useState } from "react";
import {
  CreditCard,
  QrCode,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";
import { RazorpayButton } from "@/components/RazorpayButton";
import { formatCurrency } from "@/lib/formatters";
import { unwrapAxiosError } from "@/services/api";
import {
  getEmiPlans,
  getPincodeSuggestions,
  getSecurePaymentBadges,
} from "@/services/experienceService";
import { mockAddresses, mockPaymentMethods } from "@/services/mockData";
import {
  confirmPayment,
  createOrder,
  createPaymentIntent,
  createShippingQuote,
} from "@/services/orderService";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import type { PaymentIntent } from "@/types";

const steps = ["Delivery", "Summary", "Payment"] as const;

export default function CheckoutPage() {
  const user = useAuthStore((state) => state.user);
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [step, setStep] = useState<(typeof steps)[number]>("Delivery");
  const [selectedAddressId, setSelectedAddressId] = useState(mockAddresses[0]?.id ?? "");
  const [paymentMethodId, setPaymentMethodId] = useState(mockPaymentMethods[0]?.id ?? "");
  const [pincode, setPincode] = useState(mockAddresses[0]?.pincode ?? "");
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntent | null>(null);

  const orderLines = useMemo(
    () =>
      items.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      })),
    [items],
  );

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.lineTotal, 0), [items]);
  const shipping = items.length ? 149 : 0;
  const total = subtotal + shipping;
  const emiPlans = useMemo(() => getEmiPlans(total), [total]);
  const pincodeSuggestions = useMemo(() => getPincodeSuggestions(pincode), [pincode]);
  const secureBadges = getSecurePaymentBadges();
  const selectedPayment =
    mockPaymentMethods.find((method) => method.id === paymentMethodId) ?? mockPaymentMethods[0];

  async function handleCheckoutPreview() {
    if (!user) {
      setMessage("Please log in from the profile page before checkout.");
      return;
    }

    if (items.length === 0) {
      setMessage("Your cart is empty.");
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      await createShippingQuote(user.id, orderLines);
      const order = await createOrder(user.id, orderLines);
      const intent =
        selectedPayment.type === "cod"
          ? null
          : await createPaymentIntent(order.id, "razorpay");

      if (intent) {
        setPaymentIntent(intent);
        setMessage(
          `Order ${order.orderNumber} is ready. Continue with the verified ${intent.provider} payment step below.`,
        );
      } else {
        clearCart();
        setMessage(`Order ${order.orderNumber} placed successfully using ${selectedPayment.label}.`);
      }

      setStep("Payment");
    } catch (error) {
      setMessage(unwrapAxiosError(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="section-shell grid gap-8 py-10 lg:grid-cols-[1fr_24rem]">
      <section className="glass-panel rounded-[34px] p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zenvy-rose">
          Checkout
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-zenvy-ink">
          Three-step checkout with trust, delivery, and payment clarity.
        </h1>

        <div className="mt-8 flex flex-wrap gap-3">
          {steps.map((item) => (
            <button
              key={item}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                step === item ? "bg-zenvy-ink text-white" : "bg-white text-slate-600"
              }`}
              onClick={() => setStep(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="mt-8 space-y-6">
          <div className="rounded-[28px] border border-slate-100 bg-white p-5">
            <p className="text-sm font-semibold text-zenvy-ink">Step 1 | Delivery address</p>
            <input
              value={pincode}
              onChange={(event) => setPincode(event.target.value)}
              className="input-field mt-4"
              placeholder="Enter pincode"
            />
            {pincodeSuggestions.length ? (
              <div className="mt-3 grid gap-2">
                {pincodeSuggestions.slice(0, 2).map((item) => (
                  <div key={item.code} className="rounded-[18px] bg-slate-50 px-3 py-2 text-sm text-slate-600">
                    {item.code} | {item.city}, {item.state} | {item.deliveryPromise}
                  </div>
                ))}
              </div>
            ) : null}

            <div className="mt-4 grid gap-3">
              {mockAddresses.map((address) => (
                <button
                  key={address.id}
                  className={`rounded-[24px] border p-4 text-left ${
                    selectedAddressId === address.id
                      ? "border-zenvy-ink bg-slate-50"
                      : "border-slate-100 bg-white"
                  }`}
                  onClick={() => {
                    setSelectedAddressId(address.id);
                    setPincode(address.pincode);
                    setStep("Summary");
                  }}
                >
                  <p className="text-sm font-semibold text-zenvy-ink">
                    {address.name} {address.isDefault ? "| Default" : ""}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    {address.line1}, {address.line2 ? `${address.line2}, ` : ""}
                    {address.city}, {address.state} {address.pincode}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-100 bg-white p-5">
            <p className="text-sm font-semibold text-zenvy-ink">Step 2 | Order summary</p>
            <div className="mt-4 space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-[22px] bg-slate-50 px-4 py-3 text-sm"
                >
                  <span className="text-slate-600">
                    {item.product.name} x {item.quantity}
                  </span>
                  <span className="font-semibold text-zenvy-ink">
                    {formatCurrency(item.lineTotal, item.currency)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-[24px] bg-[#f8fbff] p-4">
              <p className="text-sm font-semibold text-zenvy-ink">EMI calculator</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {emiPlans.map((plan) => (
                  <div key={plan.months} className="rounded-[18px] bg-white px-3 py-3 text-sm text-slate-600">
                    <p className="font-semibold text-zenvy-ink">{plan.months} months</p>
                    <p className="mt-1">{formatCurrency(plan.monthlyAmount)} / month</p>
                    <p className="mt-1 text-xs text-slate-400">Total {formatCurrency(plan.totalAmount)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-100 bg-white p-5">
            <p className="text-sm font-semibold text-zenvy-ink">Step 3 | Payment</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {mockPaymentMethods.map((method) => (
                <button
                  key={method.id}
                  className={`rounded-[24px] border px-4 py-4 text-left ${
                    paymentMethodId === method.id
                      ? "border-zenvy-ink bg-zenvy-ink text-white"
                      : "border-slate-100 bg-white text-slate-700"
                  }`}
                  onClick={() => {
                    setPaymentMethodId(method.id);
                    setStep("Payment");
                  }}
                >
                  <p className="font-semibold">{method.label}</p>
                  <p className="mt-1 text-sm opacity-80">{method.description}</p>
                </button>
              ))}
            </div>

            {selectedPayment.type === "upi" ? (
              <div className="mt-5 rounded-[24px] border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-zenvy-ink">
                  <QrCode className="h-4 w-4 text-[#1d4ed8]" />
                  UPI QR payment
                </div>
                <div className="mt-4 flex h-40 w-40 items-center justify-center rounded-[24px] bg-white text-slate-400 shadow-sm">
                  <div className="grid grid-cols-5 gap-1">
                    {Array.from({ length: 25 }).map((_, index) => (
                      <span
                        key={index}
                        className={`h-5 w-5 rounded-sm ${index % 2 === 0 ? "bg-slate-900" : "bg-slate-200"}`}
                      />
                    ))}
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-500">Scan using any UPI app to continue.</p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { icon: Truck, text: "Delivery promise updates stay visible until payment." },
            { icon: CreditCard, text: "Cards, UPI, and Razorpay-ready flows are supported." },
            { icon: ShieldCheck, text: "Secure payment icons and protected checkout trust cues." },
          ].map((item) => (
            <div key={item.text} className="rounded-[24px] border border-slate-100 bg-white p-5">
              <item.icon className="h-5 w-5 text-zenvy-rose" />
              <p className="mt-3 text-sm leading-6 text-slate-600">{item.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <button className="btn-primary" onClick={() => void handleCheckoutPreview()} disabled={busy}>
            <Sparkles className="h-4 w-4" />
            {busy ? "Preparing checkout..." : "Prepare order"}
          </button>
          {paymentIntent ? (
            <RazorpayButton
              paymentIntent={paymentIntent}
              userInfo={{
                name: user?.name ?? "ZENVY Shopper",
                email: user?.email ?? "shopper@zenvy.local",
              }}
              onSuccess={() => {
                clearCart();
                setMessage("Payment completed and verified successfully.");
                setPaymentIntent(null);
              }}
            />
          ) : null}
        </div>

        {message ? <p className="mt-4 text-sm text-slate-600">{message}</p> : null}
      </section>

      <aside className="glass-panel h-fit rounded-[34px] p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zenvy-rose">
          Order summary
        </p>
        <div className="mt-5 space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-[22px] border border-slate-100 bg-white px-4 py-3 text-sm"
            >
              <span className="text-slate-600">
                {item.product.name} x {item.quantity}
              </span>
              <span className="font-semibold text-zenvy-ink">
                {formatCurrency(item.lineTotal, item.currency)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-6 space-y-3 text-sm text-slate-600">
          <div className="flex items-center justify-between">
            <span>Products</span>
            <span className="font-semibold text-zenvy-ink">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Shipping</span>
            <span className="font-semibold text-zenvy-ink">{formatCurrency(shipping)}</span>
          </div>
        </div>
        <div className="mt-6 rounded-[26px] bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Final total</p>
          <p className="mt-2 text-3xl font-semibold text-zenvy-ink">{formatCurrency(total)}</p>
        </div>

        <div className="mt-6 space-y-3">
          {secureBadges.map((badge) => (
            <div key={badge.id} className="rounded-[20px] bg-white px-4 py-3 text-sm">
              <p className="font-semibold text-zenvy-ink">{badge.label}</p>
              <p className="mt-1 text-slate-500">{badge.description}</p>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
