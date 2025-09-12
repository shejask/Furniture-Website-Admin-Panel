'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardAnalytics } from '@/hooks/use-dashboard-analytics';

export function RecentSales() {
  const { data: analytics, loading } = useDashboardAnalytics();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <Card className='h-full'>
      <CardHeader>
        <CardTitle>Recent Sales</CardTitle>
        {loading ? (
          <Skeleton className="h-4 w-48" />
        ) : (
          <CardDescription>
            You made {analytics?.totalOrders || 0} sales this month.
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className='space-y-8'>
          {loading ? (
            // Loading skeletons
            Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className='flex items-center'>
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className='ml-4 space-y-1 flex-1'>
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
            ))
          ) : analytics?.recentOrders?.length ? (
            analytics.recentOrders.map((order) => (
              <div key={order.id} className='flex items-center'>
                <Avatar className='h-9 w-9'>
                  <AvatarFallback>{getInitials(order.customer)}</AvatarFallback>
                </Avatar>
                <div className='ml-4 space-y-1'>
                  <p className='text-sm leading-none font-medium'>{order.customer}</p>
                  <p className='text-muted-foreground text-sm'>
                    Order #{order.id.substring(0, 8)} • {order.status}
                  </p>
                </div>
                <div className='ml-auto font-medium text-green-600'>
                  +{formatCurrency(order.amount)}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <p>No recent sales found</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
