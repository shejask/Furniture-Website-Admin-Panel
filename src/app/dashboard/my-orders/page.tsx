import { VendorOrdersTable } from '@/features/orders/components/vendor-orders-table';

export default function MyOrdersPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Orders</h1>
            <p className="text-muted-foreground">
              View and manage all your orders
            </p>
          </div>
        </div>
        <VendorOrdersTable />
      </div>
    </div>
  );
}
