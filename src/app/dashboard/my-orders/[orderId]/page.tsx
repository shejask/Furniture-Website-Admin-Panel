import { VendorOrderDetailsPage } from '@/features/orders/components/vendor-order-details-page';

interface VendorOrderDetailsProps {
  params: {
    orderId: string;
  };
}

export default function VendorOrderDetails({ params }: VendorOrderDetailsProps) {
  return <VendorOrderDetailsPage orderId={params.orderId} />;
}
