import Link from "next/link";

export default function NotFound() {
  return (
    <div className="section-shell py-10">
      <div className="glass-panel rounded-[34px] p-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zenvy-rose">
          404
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-zenvy-ink">
          We could not find that page.
        </h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          The route may have moved, or it may not exist in this frontend build yet.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/" className="btn-primary">
            Go home
          </Link>
          <Link href="/products" className="btn-secondary">
            Browse products
          </Link>
        </div>
      </div>
    </div>
  );
}
