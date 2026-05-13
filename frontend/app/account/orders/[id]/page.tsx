import { OrderTrackingDetails } from "@/components/OrderTrackingDetails";

interface AccountOrderTrackingPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AccountOrderTrackingPage({
  params,
}: AccountOrderTrackingPageProps) {
  const { id } = await params;

  return <OrderTrackingDetails orderId={id} />;
}
