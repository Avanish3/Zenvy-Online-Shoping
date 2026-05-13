export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-white p-3">
      <div className="aspect-square animate-pulse rounded-[18px] bg-slate-100" />
      <div className="mt-4 h-3 w-24 animate-pulse rounded-full bg-slate-100" />
      <div className="mt-3 h-5 w-4/5 animate-pulse rounded-full bg-slate-100" />
      <div className="mt-2 h-5 w-2/3 animate-pulse rounded-full bg-slate-100" />
      <div className="mt-4 h-4 w-28 animate-pulse rounded-full bg-slate-100" />
      <div className="mt-4 h-8 w-32 animate-pulse rounded-full bg-slate-100" />
      <div className="mt-4 h-10 w-full animate-pulse rounded-[16px] bg-slate-100" />
    </div>
  );
}
