"use client";

import { useParams } from "next/navigation";
import { ProductDetailsPage } from "@/components/ProductDetailsPage";

export default function ProductPage() {
  const params = useParams<{ slug: string }>();

  if (!params?.slug) {
    return null;
  }

  return <ProductDetailsPage productId={params.slug} />;
}
