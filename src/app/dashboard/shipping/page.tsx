'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ShippingPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to countries page
    router.replace('/dashboard/shipping/countries');
  }, [router]);

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    </div>
  );
}
