import type { OrderTimelineEntry } from "@/types";

interface OrderTimelineProps {
  timeline: OrderTimelineEntry[];
}

export function OrderTimeline({ timeline }: OrderTimelineProps) {
  return (
    <div className="space-y-5">
      {timeline.map((entry, index) => (
        <div key={`${entry.status}-${entry.createdAt}`} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="h-3.5 w-3.5 rounded-full bg-zenvy-rose" />
            {index !== timeline.length - 1 ? (
              <div className="mt-2 h-full w-px bg-slate-200" />
            ) : null}
          </div>
          <div className="pb-5">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-zenvy-ink">
              {entry.status}
            </p>
            <p className="mt-1 text-sm text-slate-600">{entry.note}</p>
            <p className="mt-2 text-xs text-slate-400">
              {new Date(entry.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
