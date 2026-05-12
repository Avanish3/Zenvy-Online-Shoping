import { Suspense } from "react";
import { ProductsPageClient } from "@/components/ProductsPageClient";

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="section-shell py-10 text-sm text-slate-500">Loading products...</div>}>
      <ProductsPageClient />
    </Suspense>
  );
}
