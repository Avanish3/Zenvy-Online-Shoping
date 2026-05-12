import { RecommendationSection } from "@/components/RecommendationSection";
import { getHomepageRecommendations } from "@/services/aiService";
import { getProducts } from "@/services/productService";

interface PersonalizedSectionProps {
  fallbackCategory?: string;
}

export async function PersonalizedSection({
  fallbackCategory = "electronics",
}: PersonalizedSectionProps) {
  const [recommendations, products] = await Promise.all([
    getHomepageRecommendations(fallbackCategory),
    getProducts({ category: fallbackCategory }),
  ]);

  const items = recommendations.length ? recommendations : products.slice(0, 4);

  return (
    <RecommendationSection
      eyebrow="AI-driven row"
      title="Recommended for YOU"
      description="This AI-driven row keeps the homepage tailored with shopper-specific picks after deals, trending, and search-led discovery."
      products={items}
      highlight="Why this?"
    />
  );
}
