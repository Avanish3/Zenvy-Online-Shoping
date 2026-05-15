"use client";

import { useEffect } from "react";
import { CheckCircle2, Info, XCircle } from "lucide-react";
import clsx from "clsx";
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
          className={clsx(
            "pointer-events-auto animate-[toast-in_220ms_ease-out] rounded-[22px] border bg-white px-4 py-3 text-sm text-slate-700 shadow-card",
            toast.tone === "success" && "border-emerald-200",
            toast.tone === "error" && "border-rose-200",
            (!toast.tone || toast.tone === "default") && "border-slate-200",
          )}
        >
          <div className="flex items-start gap-3">
            <span
              className={clsx(
                "mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                toast.tone === "success" && "bg-emerald-50 text-emerald-600",
                toast.tone === "error" && "bg-rose-50 text-rose-600",
                (!toast.tone || toast.tone === "default") && "bg-slate-100 text-slate-600",
              )}
            >
              {toast.tone === "success" ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : toast.tone === "error" ? (
                <XCircle className="h-4 w-4" />
              ) : (
                <Info className="h-4 w-4" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-900">{toast.title}</p>
              {toast.message ? <p className="mt-1 text-slate-500">{toast.message}</p> : null}
            </div>
            <button
              className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              onClick={() => removeToast(toast.id)}
              aria-label="Dismiss notification"
            >
              x
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
