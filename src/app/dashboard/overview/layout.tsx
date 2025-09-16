'use client';

import PageContainer from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardFooter
} from '@/components/ui/card';
import { IconTrendingDown, IconTrendingUp } from '@tabler/icons-react';
import React, { useMemo } from 'react';
import { useFirebaseData } from '@/hooks/use-firebase-database';
import { useOrders } from '@/hooks/use-orders';

export default function OverViewLayout({
  bar_stats
}: {
  bar_stats: React.ReactNode;
}) {
  const { orders, loading: ordersLoading } = useOrders();
  const { data: customers, loading: customersLoading } = useFirebaseData('customers');
  const { data: products, loading: productsLoading } = useFirebaseData('products');
  const { data: coupons, loading: couponsLoading } = useFirebaseData('coupons');

  const dashboardStats = useMemo(() => {
    if (!orders || !customers || !products || !coupons) {
      return {
        totalRevenue: 0,
        newCustomers: 0,
        activeProducts: 0,
        activeCoupons: 0,
        revenueChange: 0,
        customersChange: 0,
        productsChange: 0,
        couponsChange: 0
      };
    }

    // Calculate total revenue from orders - exclude cancelled and refunded orders
    const validOrders = orders.filter((order: any) => 
      order.orderStatus !== 'cancelled' && order.orderStatus !== 'refunded'
    );
    
    const totalRevenue = validOrders.reduce((sum: number, order: any) => {
      return sum + (order.totalAmount || order.total || 0);
    }, 0);

    // Calculate new customers (this month)
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const newCustomers = Object.values(customers).filter((customer: any) => {
      if (!customer.createdAt) return false;
      const customerDate = new Date(customer.createdAt);
      return customerDate.getMonth() === currentMonth && customerDate.getFullYear() === currentYear;
    }).length;

    // Calculate total products (all products, not just active)
    const totalProducts = Object.keys(products).length;

    // Calculate total coupons (all coupons, not just active)
    const totalCoupons = Object.keys(coupons).length;

    // Calculate previous month data for comparison
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const previousMonthRevenue = validOrders.reduce((sum: number, order: any) => {
      if (!order.createdAt) return sum;
      const orderDate = new Date(order.createdAt);
      if (orderDate.getMonth() === previousMonth && orderDate.getFullYear() === previousYear) {
        return sum + (order.totalAmount || order.total || 0);
      }
      return sum;
    }, 0);

    const previousMonthCustomers = Object.values(customers).filter((customer: any) => {
      if (!customer.createdAt) return false;
      const customerDate = new Date(customer.createdAt);
      return customerDate.getMonth() === previousMonth && customerDate.getFullYear() === previousYear;
    }).length;

    // Calculate percentage changes
    const revenueChange = previousMonthRevenue > 0 
      ? ((totalRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 
      : 0;
    
    const customersChange = previousMonthCustomers > 0 
      ? ((newCustomers - previousMonthCustomers) / previousMonthCustomers) * 100 
      : 0;

    return {
      totalRevenue,
      newCustomers,
      totalProducts,
      totalCoupons,
      revenueChange: Math.round(revenueChange * 10) / 10,
      customersChange: Math.round(customersChange * 10) / 10,
      productsChange: 0, // Could be calculated based on product creation dates
      couponsChange: 0   // Could be calculated based on coupon creation dates
    };
  }, [orders, customers, products, coupons]);

  if (ordersLoading || customersLoading || productsLoading || couponsLoading) {
    return (
      <PageContainer>
        <div className='flex flex-1 flex-col space-y-2'>
          <div className='flex items-center justify-between space-y-2'>
            <h2 className='text-2xl font-bold tracking-tight'>
              Hi, Welcome back 👋
            </h2>
          </div>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
            {[...Array(4)].map((_, i) => (
              <Card key={i} className='animate-pulse'>
                <CardHeader>
                  <div className='h-4 bg-muted rounded w-24'></div>
                  <div className='h-8 bg-muted rounded w-32'></div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-2'>
        <div className='flex items-center justify-between space-y-2'>
          <h2 className='text-2xl font-bold tracking-tight'>
            Hi, Welcome back 👋
          </h2>
        </div>

        <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid-cols-2 lg:grid-cols-4'>
          <Card className='@container/card'>
            <CardHeader>
              <CardDescription>Total Revenue</CardDescription>
              <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                ₹{dashboardStats.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </CardTitle>
              <CardAction>
                <Badge variant='outline'>
                  {dashboardStats.revenueChange >= 0 ? <IconTrendingUp /> : <IconTrendingDown />}
                  {dashboardStats.revenueChange >= 0 ? '+' : ''}{dashboardStats.revenueChange}%
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1.5 text-sm'>
              <div className='line-clamp-1 flex gap-2 font-medium'>
                {dashboardStats.revenueChange >= 0 ? 'Revenue up this month' : 'Revenue down this month'} 
                {dashboardStats.revenueChange >= 0 ? <IconTrendingUp className='size-4' /> : <IconTrendingDown className='size-4' />}
              </div>
              <div className='text-muted-foreground'>
                Total from all orders
              </div>
            </CardFooter>
          </Card>
          <Card className='@container/card'>
            <CardHeader>
              <CardDescription>New Customers</CardDescription>
              <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                {dashboardStats.newCustomers.toLocaleString()}
              </CardTitle>
              <CardAction>
                <Badge variant='outline'>
                  {dashboardStats.customersChange >= 0 ? <IconTrendingUp /> : <IconTrendingDown />}
                  {dashboardStats.customersChange >= 0 ? '+' : ''}{dashboardStats.customersChange}%
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1.5 text-sm'>
              <div className='line-clamp-1 flex gap-2 font-medium'>
                {dashboardStats.customersChange >= 0 ? 'Customer growth this month' : 'Customer decline this month'} 
                {dashboardStats.customersChange >= 0 ? <IconTrendingUp className='size-4' /> : <IconTrendingDown className='size-4' />}
              </div>
              <div className='text-muted-foreground'>
                New registrations this month
              </div>
            </CardFooter>
          </Card>
          <Card className='@container/card'>
            <CardHeader>
              <CardDescription>Products</CardDescription>
              <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                {dashboardStats.totalProducts?.toLocaleString() || '0'}
              </CardTitle>
              <CardAction>
                <Badge variant='outline'>
                  <IconTrendingUp />
                  Total
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1.5 text-sm'>
              <div className='line-clamp-1 flex gap-2 font-medium'>
                All products in catalog <IconTrendingUp className='size-4' />
              </div>
              <div className='text-muted-foreground'>
                Total product count
              </div>
            </CardFooter>
          </Card>
          <Card className='@container/card'>
            <CardHeader>
              <CardDescription>Coupons</CardDescription>
              <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                {dashboardStats.totalCoupons?.toLocaleString() || '0'}
              </CardTitle>
              <CardAction>
                <Badge variant='outline'>
                  <IconTrendingUp />
                  Total
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1.5 text-sm'>
              <div className='line-clamp-1 flex gap-2 font-medium'>
                All promotional offers <IconTrendingUp className='size-4' />
              </div>
              <div className='text-muted-foreground'>
                Total coupon count
              </div>
            </CardFooter>
          </Card>
        </div>
        <div className='grid grid-cols-1 gap-4'>
          <div className='col-span-full'>{bar_stats}</div>
        </div>
      </div>
    </PageContainer>
  );
}
