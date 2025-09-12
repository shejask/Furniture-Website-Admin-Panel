import { Metadata } from 'next';
import OverViewPage from '@/features/overview/components/overview';

export const metadata: Metadata = {
  title: 'Dashboard Overview',
  description: 'Dashboard overview with analytics and statistics'
};

export default function OverviewPage() {
  return <OverViewPage />;
}
