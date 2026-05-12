export default function Loading() {
  return (
    <div className="section-shell py-10">
      <div className="glass-panel rounded-[34px] p-6 sm:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-24 rounded-full bg-slate-200" />
          <div className="h-10 w-2/3 rounded-2xl bg-slate-200" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="rounded-[28px] bg-white p-4">
                <div className="h-40 rounded-[24px] bg-slate-200" />
                <div className="mt-4 h-4 w-2/3 rounded-full bg-slate-200" />
                <div className="mt-3 h-4 w-full rounded-full bg-slate-100" />
                <div className="mt-2 h-4 w-4/5 rounded-full bg-slate-100" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
