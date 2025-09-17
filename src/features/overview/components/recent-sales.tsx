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
import { useFirebaseData } from '@/hooks/use-firebase-database';
import { useOrders } from '@/hooks/use-orders';
import { useMemo } from 'react';

export function RecentSales() {
  const { orders, loading: ordersLoading } = useOrders();
  const { data: customers, loading: customersLoading } = useFirebaseData('customers');

  const recentOrders = useMemo(() => {
    if (!orders || orders.length === 0) {
      return [];
    }

    return orders
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 5)
      .map(order => {
        // Find customer name
        let customerName = 'Unknown Customer';
        if (customers && order.userId) {
          const customer = customers[order.userId];
          if (customer) {
            customerName = customer.name || customer.email || customer.userName || 'Unknown Customer';
          }
        } else if (order.userEmail) {
          customerName = order.userEmail;
        }

        return {
          id: order.id,
          customer: customerName,
          amount: order.total || 0,
          status: order.orderStatus || 'pending',
          date: order.createdAt || new Date().toISOString()
        };
      });
  }, [orders, customers]);

  const totalOrders = useMemo(() => {
    if (!orders) return 0;
    return orders.length;
  }, [orders]);

  const loading = ordersLoading || customersLoading;

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
            You made {totalOrders} sales this month.
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
          ) : recentOrders.length ? (
            recentOrders.map((order) => (
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
