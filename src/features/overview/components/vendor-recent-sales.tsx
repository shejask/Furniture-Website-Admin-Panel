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
import { Order } from '@/features/orders/utils/form-schema';

interface VendorRecentSalesProps {
  data: Order[];
}

export function VendorRecentSales({ data }: VendorRecentSalesProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-muted-foreground">
        No recent sales data available
      </div>
    );
  }

  const recentOrders = data
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 5)
    .map(order => {
      const customerName = `${order.address?.firstName || ''} ${order.address?.lastName || ''}`.trim() || 'Unknown Customer';
      const initials = customerName
        .split(' ')
        .map(name => name.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);

      return {
        id: order.orderId,
        customerName,
        initials,
        amount: order.total || 0,
        status: order.orderStatus,
        createdAt: order.createdAt
      };
    });

  return (
    <div className="space-y-4">
      {recentOrders.map((order) => (
        <div key={order.id} className="flex items-center space-x-4">
          <Avatar className="h-9 w-9">
            <AvatarFallback>{order.initials}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <p className="text-sm font-medium leading-none">
              {order.customerName}
            </p>
            <p className="text-sm text-muted-foreground">
              Order #{order.id}
            </p>
          </div>
          <div className="ml-auto font-medium">
            ₹{order.amount.toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}
