import { VendorPaymentsAnalytics } from '@/features/payments/components/vendor-payments-analytics';

export default function VendorPaymentsPage() {
  return (
    <div className="space-y-6 container mx-auto p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vendor Payments</h1>
          <p className="text-muted-foreground">
            View and manage your payment analytics
          </p>
        </div>
      </div>
      <VendorPaymentsAnalytics />
    </div>
  );
}
