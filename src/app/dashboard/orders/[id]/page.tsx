import { OrderDetailsPage } from '@/features/orders/components/order-details-page';

interface OrderDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function OrderDetails({ params }: OrderDetailsPageProps) {
  const { id } = await params;
  
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-6 h-[calc(100vh-120px)] overflow-y-auto pb-24">
        <OrderDetailsPage orderId={id} />
      </div>
    </div>
  );
}
