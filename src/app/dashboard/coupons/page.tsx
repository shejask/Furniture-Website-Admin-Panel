import { CouponsTable } from '@/features/coupons/components/coupons-table';

export default function CouponsPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Coupon Management</h1>
        <p className="text-muted-foreground">
          Manage discount coupons and promotional codes
        </p>
      </div>
      <CouponsTable />
    </div>
  );
} 