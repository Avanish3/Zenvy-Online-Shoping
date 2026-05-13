"use client";

import { useViewerCount } from "@/hooks/useViewerCount";

export function ViewerCount({ productId }: { productId: string }) {
  const count = useViewerCount(productId);

  if (!count || count < 10) {
    return null;
  }

  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-700">
      <span className="h-2 w-2 animate-pulse rounded-full bg-orange-500" />
      <span>{count} people viewing this right now</span>
    </div>
  );
}
