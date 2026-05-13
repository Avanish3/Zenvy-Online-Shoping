import { OrderTrackingDetails } from "@/components/OrderTrackingDetails";

interface OrderTrackingPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function OrderTrackingPage({ params }: OrderTrackingPageProps) {
  const { id } = await params;

  return <OrderTrackingDetails orderId={id} />;
}
