"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { ArrowRight, Bot, SendHorizontal, Sparkles, User } from "lucide-react";
import { askAssistant } from "@/services/aiService";
import { useSearchStore } from "@/store/searchStore";
import type { AssistantMessage, Product } from "@/types";

const starterPrompts = [
  "Find best phone under Rs.20000",
  "Show trending earbuds under Rs.5000",
  "Suggest gifts for a fitness lover",
  "Best home decor under Rs.3000",
];

export function InlineAiAssistantSection() {
  const addRecentSearch = useSearchStore((state) => state.addRecentSearch);
  const setStoredQuery = useSearchStore((state) => state.setQuery);
  const [input, setInput] = useState(starterPrompts[0]);
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: "assistant-welcome",
      role: "assistant",
      content:
        "Tell me your budget, category, or use case and I will turn the catalog into a shortlist.",
    },
  ]);
  const [products, setProducts] = useState<Product[]>([]);

  async function runPrompt(prompt: string) {
    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt || busy) {
      return;
    }

    setMessages((current) => [
      ...current,
      {
        id: `user-${Date.now()}`,
        role: "user",
        content: trimmedPrompt,
      },
    ]);
    setStoredQuery(trimmedPrompt);
    addRecentSearch(trimmedPrompt);
    setInput("");
    setBusy(true);

    try {
      const response = await askAssistant(trimmedPrompt);
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: `Here are the best matches I found. ${response.message}`,
        },
      ]);
      setProducts(response.suggestedProducts ?? []);
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runPrompt(input);
  }

  const latestAssistantResponse = useMemo(
    () => [...messages].reverse().find((message) => message.role === "assistant"),
    [messages],
  );

  return (
    <section className="section-shell py-2.5">
      <div className="rounded-[22px] border border-slate-200 bg-white p-4 sm:p-5 lg:p-6">
        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#eaf2ff] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#2874f0]">
              <Sparkles className="h-3.5 w-3.5" />
              AI-first shopping
            </div>
            <h2 className="mt-4 text-2xl font-semibold text-slate-950 sm:text-3xl">
              Chat with AI and get answers inline
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
              This turns the AI from a passive input into an active shopping guide with visible replies, prompt shortcuts, and product suggestions in the same section.
            </p>

            <div className="mt-5 rounded-[22px] bg-slate-50 p-4">
              <div className="max-h-[22rem] space-y-3 overflow-y-auto pr-1">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {message.role === "assistant" ? (
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2874f0] text-white">
                        <Bot className="h-4 w-4" />
                      </span>
                    ) : null}
                    <div
                      className={`max-w-[85%] rounded-[20px] px-4 py-3 text-sm leading-6 ${
                        message.role === "assistant"
                          ? "bg-white text-slate-700"
                          : "bg-zenvy-ink text-white"
                      }`}
                    >
                      {message.content}
                    </div>
                    {message.role === "user" ? (
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white">
                        <User className="h-4 w-4" />
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="mt-4">
                <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2">
                  <input
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    className="w-full bg-transparent px-1 py-1.5 text-sm outline-none placeholder:text-slate-400"
                    placeholder="Ask AI for the best products..."
                  />
                  <button
                    type="submit"
                    className="rounded-full bg-zenvy-ink p-2.5 text-white disabled:opacity-50"
                    disabled={busy}
                  >
                    <SendHorizontal className="h-4 w-4" />
                  </button>
                </div>
              </form>

              <div className="mt-4 flex flex-wrap gap-2">
                {starterPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
                    onClick={() => void runPrompt(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[22px] border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Latest AI answer
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-700">
                {latestAssistantResponse?.content ??
                  "Ask a question to see AI recommendations appear here."}
              </p>
            </div>

            <div className="rounded-[22px] border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    AI picks
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-slate-950">
                    Suggested products
                  </h3>
                </div>
                <Link href="/search" className="text-sm font-semibold text-[#2874f0]">
                  Open full search
                </Link>
              </div>

              <div className="mt-4 grid gap-3">
                {products.length ? (
                  products.slice(0, 3).map((product) => (
                    <Link
                      key={product.id}
                      href={`/products/${product.slug ?? product.id}`}
                      className="rounded-[18px] border border-slate-200 bg-slate-50 p-3 transition hover:bg-slate-100"
                    >
                      <p className="text-sm font-semibold text-slate-900">{product.name}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {product.brand ?? product.category}
                      </p>
                      <p className="mt-2 text-xs leading-6 text-slate-600">
                        {product.recommendationReason ?? "Good value pick for this request."}
                      </p>
                    </Link>
                  ))
                ) : (
                  <div className="rounded-[18px] border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                    Send a prompt and the AI shortlist will appear inline.
                  </div>
                )}
              </div>

              <Link
                href="/products"
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#2874f0]"
              >
                Browse all products
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
