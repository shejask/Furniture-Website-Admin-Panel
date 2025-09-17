'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrders } from '@/hooks/use-orders';
import { useMemo, useState, useEffect } from 'react';
import { format } from 'date-fns';
import { getCurrentUser } from '@/lib/auth';
import { Order } from '@/features/orders/utils/form-schema';

interface VendorRecentOrdersTableProps {
  data?: Order[];
}

export function VendorRecentOrdersTable({ data }: VendorRecentOrdersTableProps) {
  const { orders: allOrders, loading: ordersLoading } = useOrders();
  const [currentVendor, setCurrentVendor] = useState<any>(null);

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentVendor(user);
  }, []);

  const recentOrders = useMemo(() => {
    if (!currentVendor) return [];

    // Use provided data or filter from all orders
    const ordersToUse = data || allOrders || [];
    
    // Filter orders for current vendor only
    const vendorOrders = ordersToUse.filter(order => {
      // Check if order has vendor information
      if (order.vendor && order.vendor === currentVendor.uniqueId) {
        return true;
      }
      
      // Check if any item in the order belongs to this vendor
      if (order.items && order.items.some(item => item.vendor === currentVendor.uniqueId)) {
        return true;
      }
      
      return false;
    });

    if (vendorOrders.length === 0) {
      return [];
    }

    const sortedOrders = vendorOrders
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 10);

    return sortedOrders.map(order => {
      // Get customer name from order address
      const customerName = `${order.address?.firstName || ''} ${order.address?.lastName || ''}`.trim() || 
                          order.userEmail || 
                          'Unknown Customer';

      return {
        id: order.orderId,
        customer: customerName,
        amount: order.total || 0,
        status: order.orderStatus || 'pending',
        date: order.createdAt || new Date().toISOString()
      };
    });
  }, [allOrders, currentVendor, data]);

  const loading = ordersLoading;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'pending':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'shipped':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'refunded':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  if (!currentVendor) {
    return (
      <Card className='h-full'>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>
            Your recent orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <p>Please sign in to view your orders</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='h-full'>
      <CardHeader>
        <CardTitle>Recent Orders</CardTitle>
        <CardDescription>
          Your recent orders
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center space-x-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        ) : recentOrders.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      #{order.id.substring(0, 8)}...
                    </TableCell>
                    <TableCell>{order.customer}</TableCell>
                    <TableCell>{formatCurrency(order.amount)}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(order.date), 'MMM dd, yyyy')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            <p>No recent orders found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
