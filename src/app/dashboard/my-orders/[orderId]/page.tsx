import { VendorOrderDetailsPage } from '@/features/orders/components/vendor-order-details-page';

interface VendorOrderDetailsProps {
  params: Promise<{
    orderId: string;
  }>;
}

export default async function VendorOrderDetails({ params }: VendorOrderDetailsProps) {
  const { orderId } = await params;
  return <VendorOrderDetailsPage orderId={orderId} />;
}
