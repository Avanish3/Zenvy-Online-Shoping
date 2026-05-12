"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="section-shell py-10">
      <div className="glass-panel rounded-[34px] p-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zenvy-rose">
          Something went wrong
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-zenvy-ink">
          This view hit an unexpected error.
        </h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          {error.message || "Please try the action again."}
        </p>
        <button className="btn-primary mt-6" onClick={reset}>
          Try again
        </button>
      </div>
    </div>
  );
}
