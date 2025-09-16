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
import { useFirebaseData } from '@/hooks/use-firebase-database';
import { useOrders } from '@/hooks/use-orders';
import { useMemo } from 'react';
import { format } from 'date-fns';

export function RecentOrdersTable() {
  const { orders, loading: ordersLoading } = useOrders();
  const { data: customers, loading: customersLoading } = useFirebaseData('customers');

  const recentOrders = useMemo(() => {
    if (!orders || orders.length === 0) {
      return [];
    }

    const sortedOrders = orders
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 10);

    return sortedOrders.map(order => {
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
        amount: order.totalAmount || order.total || 0,
        status: order.orderStatus || order.status || 'pending',
        date: order.createdAt || new Date().toISOString()
      };
    });
  }, [orders, customers]);

  const loading = ordersLoading || customersLoading;

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
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <Card className='h-full'>
      <CardHeader>
        <CardTitle>Recent Orders</CardTitle>
        <CardDescription>
          Latest orders from your customers
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
