"use client";

import Script from "next/script";
import { useState } from "react";
import { CreditCard } from "lucide-react";
import { confirmPayment } from "@/services/orderService";
import { useUiStore } from "@/store/uiStore";
import type { PaymentIntent } from "@/types";

interface RazorpayCheckoutResponse {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

interface RazorpayButtonProps {
  paymentIntent: PaymentIntent;
  userInfo: {
    name: string;
    email: string;
    phone?: string;
  };
  onSuccess?: () => void;
}

export function RazorpayButton({
  paymentIntent,
  userInfo,
  onSuccess,
}: RazorpayButtonProps) {
  const addToast = useUiStore((state) => state.addToast);
  const [loading, setLoading] = useState(false);
  const payload = paymentIntent.providerPayload ?? {};
  const amount =
    typeof payload.amount === "number" ? payload.amount : Math.round(paymentIntent.amount * 100);
  const currency = typeof payload.currency === "string" ? payload.currency : paymentIntent.currency;
  const orderId =
    typeof payload.orderId === "string" ? payload.orderId : paymentIntent.providerReference;
  const keyId =
    typeof payload.keyId === "string"
      ? payload.keyId
      : process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_preview";

  async function handlePay() {
    setLoading(true);

    try {
      if (!window.Razorpay) {
        await confirmPayment(paymentIntent.id, `rzp_payment_${Date.now()}`);
        addToast("Razorpay SDK unavailable, local payment preview completed.");
        onSuccess?.();
        return;
      }

      const razorpay = new window.Razorpay({
        key: keyId,
        amount,
        currency,
        name: "ZENVY",
        description: `Order ${paymentIntent.orderId}`,
        order_id: orderId,
        prefill: {
          name: userInfo.name,
          email: userInfo.email,
          contact: userInfo.phone,
        },
        theme: { color: "#1d4ed8" },
        handler: async function (response: RazorpayCheckoutResponse) {
          await confirmPayment(paymentIntent.id, response.razorpay_payment_id, {
            signature: response.razorpay_signature,
            status: "succeeded",
          });
          addToast("Payment verified successfully.");
          onSuccess?.();
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
      });

      razorpay.open();
    } catch {
      addToast("Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <button
        onClick={() => void handlePay()}
        disabled={loading}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1d4ed8] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        <CreditCard className="h-4 w-4" />
        {loading ? "Opening payment..." : `Pay INR ${Math.round(amount / 100).toLocaleString("en-IN")}`}
      </button>
    </>
  );
}
