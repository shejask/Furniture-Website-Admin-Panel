import { OrdersTable } from '@/features/orders/components/orders-table';

export default function OrdersPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        <OrdersTable />
      </div>
    </div>
  );
} 