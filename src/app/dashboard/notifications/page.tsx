import { Metadata } from 'next';
import NotificationsPage from '@/features/notifications/components/notifications-page';

export const metadata: Metadata = {
  title: 'Notifications',
  description: 'Manage system notifications and announcements'
};

export default function Page() {
  return <NotificationsPage />;
}
