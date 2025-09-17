import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

export default async function Dashboard() {
  // Check user role and redirect accordingly
  const user = getCurrentUser();
  
  if (user?.role === 'vendor') {
    redirect('/dashboard/vendor-dashboard');
  } else {
    redirect('/dashboard/overview');
  }
}
