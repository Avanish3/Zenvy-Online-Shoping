"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown } from "lucide-react";

export function PullToRefreshShell({ children }: { children: React.ReactNode }) {
  const startYRef = useRef<number | null>(null);
  const [pullDistance, setPullDistance] = useState(0);

  useEffect(() => {
    function handleTouchStart(event: TouchEvent) {
      if (window.scrollY > 0) {
        startYRef.current = null;
        return;
      }

      startYRef.current = event.touches[0]?.clientY ?? null;
    }

    function handleTouchMove(event: TouchEvent) {
      if (startYRef.current === null) {
        return;
      }

      const next = Math.max(0, (event.touches[0]?.clientY ?? 0) - startYRef.current);
      setPullDistance(Math.min(next, 80));
    }

    function handleTouchEnd() {
      if (pullDistance > 72) {
        window.location.reload();
      }

      startYRef.current = null;
      setPullDistance(0);
    }

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [pullDistance]);

  return (
    <div>
      <div
        className="fixed inset-x-0 top-[5.75rem] z-30 flex justify-center transition md:hidden"
        style={{ transform: `translateY(${Math.max(-46, pullDistance - 46)}px)` }}
      >
        <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm">
          <ArrowDown className="h-3.5 w-3.5" />
          {pullDistance > 72 ? "Release to refresh" : "Pull to refresh"}
        </div>
      </div>
      {children}
    </div>
  );
}
