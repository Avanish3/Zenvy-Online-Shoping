import { Suspense } from "react";
import type { Metadata } from "next";
import "./globals.css";
import { AIChatbot } from "@/components/AIChatbot";
import { BottomNav } from "@/components/BottomNav";
import { Footer } from "@/components/Footer";
import { FloatingCartBar } from "@/components/FloatingCartBar";
import { Navbar } from "@/components/Navbar";
import { PWARegistrar } from "@/components/PWARegistrar";
import { PullToRefreshShell } from "@/components/PullToRefreshShell";
import { DealTicker } from "@/components/DealTicker";
import { ThemeController } from "@/components/ThemeController";
import { ToastHost } from "@/components/ToastHost";
import { TrustBar } from "@/components/TrustBar";

export const metadata: Metadata = {
  title: "ZENVY | AI-First Shopping",
  description:
    "ZENVY is an AI-first shopping experience with smart search, personal recommendations, realtime order tracking, and delightfully fast checkout.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ThemeController />
        <PWARegistrar />
        <ToastHost />
        <Suspense fallback={<div className="h-[88px] border-b border-slate-200 bg-white" />}>
          <Navbar />
        </Suspense>
        <TrustBar />
        <DealTicker />
        <PullToRefreshShell>
          <main className="pb-20 md:pb-0">{children}</main>
        </PullToRefreshShell>
        <Footer />
        <FloatingCartBar />
        <BottomNav />
        <AIChatbot />
      </body>
    </html>
  );
}
