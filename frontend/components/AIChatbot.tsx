"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LoaderCircle, MessageCircleMore, SendHorizontal, Sparkles, X } from "lucide-react";
import { askAssistant, getAssistantStarterMessages } from "@/services/aiService";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { useUiStore } from "@/store/uiStore";
import type { AssistantMessage, Product } from "@/types";

const quickPrompts = [
  "Find best phone under Rs.20000",
  "Best earbuds under Rs.5000",
  "Gift ideas for fitness lovers",
];

export function AIChatbot() {
  const { chatbotOpen, setChatbotOpen } = useUiStore();
  const user = useAuthStore((state) => state.user);
  const cartCount = useCartStore((state) => state.itemCount());
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [suggestedProducts, setSuggestedProducts] = useState<Product[]>([]);

  useEffect(() => {
    getAssistantStarterMessages().then(setMessages);
  }, []);

  async function handleSend(promptOverride?: string) {
    const message = (promptOverride ?? input).trim();

    if (!message || busy) {
      return;
    }

    setMessages((current) => [
      ...current,
      { id: `user-${Date.now()}`, role: "user", content: message },
    ]);
    setInput("");
    setBusy(true);

    try {
      const response = await askAssistant(message, user?.id);
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: `Here are the best matches I found. ${response.message}`,
        },
      ]);
      setSuggestedProducts(response.suggestedProducts ?? []);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        className={`fixed right-6 z-50 inline-flex items-center gap-2 rounded-full bg-zenvy-ink px-5 py-4 text-sm font-semibold text-white shadow-glow ${
          cartCount > 0 ? "bottom-[5.5rem] md:bottom-6" : "bottom-6"
        }`}
        onClick={() => setChatbotOpen(!chatbotOpen)}
      >
        {chatbotOpen ? <X className="h-4 w-4" /> : <MessageCircleMore className="h-4 w-4" />}
        Ask AI deals
      </button>

      {chatbotOpen ? (
        <div className="fixed bottom-24 right-4 z-50 w-[min(95vw,27rem)] overflow-hidden rounded-[30px] border border-white/70 bg-white shadow-glow md:right-6">
          <div className="flex items-center justify-between bg-gradient-to-r from-zenvy-violet to-zenvy-rose px-5 py-4 text-white">
            <div>
              <p className="text-sm font-semibold">ZENVY AI</p>
              <p className="text-xs text-white/80">
                Conversational shopping help with inline product suggestions.
              </p>
            </div>
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="max-h-[26rem] space-y-3 overflow-y-auto px-4 py-4">
            <div className="flex flex-wrap gap-2">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                  onClick={() => void handleSend(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`max-w-[88%] rounded-3xl px-4 py-3 text-sm leading-6 ${
                  message.role === "assistant"
                    ? "bg-slate-50 text-slate-700"
                    : "ml-auto bg-zenvy-ink text-white"
                }`}
              >
                {message.content}
              </div>
            ))}
            {busy ? (
              <div className="inline-flex items-center gap-2 rounded-3xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Finding the best matches...
              </div>
            ) : null}
            {suggestedProducts.length ? (
              <div className="space-y-2">
                {suggestedProducts.slice(0, 3).map((product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.slug ?? product.id}`}
                    className="block rounded-3xl border border-slate-100 bg-white px-4 py-3 text-sm text-slate-700"
                  >
                    <span className="font-semibold text-zenvy-ink">{product.name}</span>
                    <span className="mt-1 block text-xs text-slate-500">
                      {product.brand ?? product.category} | {product.recommendationReason}
                    </span>
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
          <div className="border-t border-slate-100 p-3">
            <div className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    void handleSend();
                  }
                }}
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                placeholder="Find best phone under Rs.20000"
              />
              <button
                className="rounded-full bg-zenvy-ink p-2 text-white disabled:opacity-50"
                onClick={() => void handleSend()}
                disabled={busy}
              >
                <SendHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
