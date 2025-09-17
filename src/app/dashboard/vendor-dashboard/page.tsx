import { Metadata } from 'next';
import VendorOverViewPage from '@/features/overview/components/vendor-overview';

export const metadata: Metadata = {
  title: 'Vendor Dashboard',
  description: 'Vendor dashboard with analytics and statistics'
};

export default function VendorDashboardPage() {
  return <VendorOverViewPage />;
}
