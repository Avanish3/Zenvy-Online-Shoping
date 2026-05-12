import { ProductCard } from "@/components/ProductCard";
import { SectionHeading } from "@/components/SectionHeading";
import type { Product } from "@/types";

interface RecommendationSectionProps {
  eyebrow: string;
  title: string;
  description: string;
  products: Product[];
  highlight?: string;
}

export function RecommendationSection({
  eyebrow,
  title,
  description,
  products,
  highlight,
}: RecommendationSectionProps) {
  return (
    <section className="section-shell space-y-6 py-4">
      <SectionHeading eyebrow={eyebrow} title={title} description={description} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} highlight={highlight} />
        ))}
      </div>
    </section>
  );
}
