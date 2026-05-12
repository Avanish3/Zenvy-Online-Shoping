"use client";

import { useEffect } from "react";
import { useUiStore } from "@/store/uiStore";

export function ToastHost() {
  const toasts = useUiStore((state) => state.toasts);
  const removeToast = useUiStore((state) => state.removeToast);

  useEffect(() => {
    if (!toasts.length) {
      return;
    }

    const timers = toasts.map((toast) =>
      window.setTimeout(() => removeToast(toast.id), 2800),
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [removeToast, toasts]);

  return (
    <div className="pointer-events-none fixed right-4 top-20 z-[60] flex w-[min(92vw,22rem)] flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-card"
        >
          {toast.title}
        </div>
      ))}
    </div>
  );
}
