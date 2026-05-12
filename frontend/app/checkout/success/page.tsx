import Link from "next/link";

export default function CheckoutSuccessPage() {
  return (
    <div className="section-shell py-10">
      <div className="glass-panel rounded-[34px] p-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zenvy-rose">
          Success
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-zenvy-ink">
          Your order is confirmed.
        </h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          This success page is ready for post-payment confirmation and can link into the live order timeline flow.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/orders" className="btn-primary">
            Track order
          </Link>
          <Link href="/products" className="btn-secondary">
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
