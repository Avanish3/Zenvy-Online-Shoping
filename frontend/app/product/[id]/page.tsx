"use client";

import { useParams } from "next/navigation";
import { ProductDetailsPage } from "@/components/ProductDetailsPage";

export default function LegacyProductPage() {
  const params = useParams<{ id: string }>();

  if (!params?.id) {
    return null;
  }

  return <ProductDetailsPage productId={params.id} />;
}
