import { SectionHeading } from "@/components/SectionHeading";

export function PersonalizedSectionSkeleton() {
  return (
    <section className="section-shell space-y-8 py-6">
      <SectionHeading
        eyebrow="AI Feed"
        title="Loading your personalized storefront"
        description="ZENVY is preparing recommendation lanes from your browsing context and backend signals."
      />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="glass-panel animate-pulse rounded-[30px] p-4"
          >
            <div className="h-44 rounded-[28px] bg-slate-200/70" />
            <div className="mt-4 space-y-3 px-1">
              <div className="h-4 w-24 rounded-full bg-slate-200/80" />
              <div className="h-6 w-3/4 rounded-full bg-slate-200/80" />
              <div className="h-4 w-full rounded-full bg-slate-200/70" />
              <div className="h-4 w-2/3 rounded-full bg-slate-200/70" />
              <div className="flex items-center justify-between pt-2">
                <div className="h-7 w-28 rounded-full bg-slate-200/80" />
                <div className="h-10 w-20 rounded-full bg-slate-200/80" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
