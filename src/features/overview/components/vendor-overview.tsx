'use client';

import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  CardAction
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { VendorBarGraph } from './vendor-bar-graph';
import { VendorRecentSales } from './vendor-recent-sales';
import { VendorRecentOrdersTable } from './vendor-recent-orders-table';
import { IconTrendingUp, IconTrendingDown } from '@tabler/icons-react';
import { Badge } from '@/components/ui/badge';
import { useDashboardAnalytics } from '@/hooks/use-dashboard-analytics';
import { getCurrentUser } from '@/lib/auth';
import { useEffect, useState } from 'react';
import { useOrders } from '@/hooks/use-orders';
import { DollarSign, Users, CreditCard, TrendingUp } from 'lucide-react';

export default function VendorOverViewPage() {
  const { data: analytics, loading } = useDashboardAnalytics();
  const { orders: allOrders } = useOrders();
  const [currentVendor, setCurrentVendor] = useState<any>(null);
  const [vendorAnalytics, setVendorAnalytics] = useState<any>(null);

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentVendor(user);
  }, []);

  // Filter orders for current vendor only
  useEffect(() => {
    if (!currentVendor || !allOrders) return;

    const vendorOrders = allOrders.filter(order => {
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

    // Calculate vendor-specific analytics - only confirmed orders count for revenue
    const validOrders = vendorOrders.filter(order => 
      order.orderStatus === 'confirmed'
    );

    const totalRevenue = validOrders.reduce((sum, order) => sum + (order.total || 0), 0);
    const totalOrders = vendorOrders.length;
    const averageOrderValue = validOrders.length > 0 ? totalRevenue / validOrders.length : 0;

    // Calculate monthly revenue
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const currentMonthOrders = validOrders.filter(order => {
      const orderDate = new Date(order.createdAt || Date.now());
      return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
    });
    const currentMonthRevenue = currentMonthOrders.reduce((sum, order) => sum + (order.total || 0), 0);

    // Calculate previous month revenue
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const previousMonthOrders = validOrders.filter(order => {
      const orderDate = new Date(order.createdAt || Date.now());
      return orderDate.getMonth() === previousMonth && orderDate.getFullYear() === previousYear;
    });
    const previousMonthRevenue = previousMonthOrders.reduce((sum, order) => sum + (order.total || 0), 0);

    // Calculate growth percentage
    const growthPercentage = previousMonthRevenue > 0 
      ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 
      : 0;

    // Top products for this vendor
    const productRevenue = validOrders.reduce((acc, order) => {
      order.items?.forEach(item => {
        if (item.vendor === currentVendor.uniqueId) {
          const productKey = item.name;
          acc[productKey] = (acc[productKey] || 0) + (item.total || (item.price * item.quantity));
        }
      });
      return acc;
    }, {} as Record<string, number>);

    const topProducts = Object.entries(productRevenue)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, revenue]) => ({ 
        name: name.length > 15 ? `${name.slice(0, 15)}...` : name, 
        revenue: Math.round(revenue) 
      }));

    setVendorAnalytics({
      totalRevenue,
      totalOrders,
      averageOrderValue,
      currentMonthRevenue,
      previousMonthRevenue,
      growthPercentage,
      topProducts,
      recentOrders: vendorOrders.slice(0, 5)
    });
  }, [allOrders, currentVendor]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  if (!currentVendor) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-muted-foreground">Please sign in to view your dashboard</p>
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
            Hi, {currentVendor.name || currentVendor.storeName || 'Vendor'} 👋
          </h2>
          <div className='hidden items-center space-x-2 md:flex'>
            <Button>Download Report</Button>
          </div>
        </div>
        <Tabs defaultValue='overview' className='space-y-4'>
          <TabsList>
            <TabsTrigger value='overview'>Overview</TabsTrigger>
            <TabsTrigger value='analytics' disabled>
              Analytics
            </TabsTrigger>
          </TabsList>
          <TabsContent value='overview' className='space-y-4'>
            <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    Total Revenue
                  </CardTitle>
                  <DollarSign className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>
                    {vendorAnalytics ? formatCurrency(vendorAnalytics.totalRevenue) : '₹0.00'}
                  </div>
                  <p className='text-xs text-muted-foreground'>
                    +{vendorAnalytics?.growthPercentage?.toFixed(1) || 0}% from last month
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    Total Orders
                  </CardTitle>
                  <Users className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>
                    {vendorAnalytics?.totalOrders || 0}
                  </div>
                  <p className='text-xs text-muted-foreground'>
                    Your total orders
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    Average Order Value
                  </CardTitle>
                  <CreditCard className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>
                    {vendorAnalytics ? formatCurrency(vendorAnalytics.averageOrderValue) : '₹0.00'}
                  </div>
                  <p className='text-xs text-muted-foreground'>
                    Per order average
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    This Month
                  </CardTitle>
                  <TrendingUp className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>
                    {vendorAnalytics ? formatCurrency(vendorAnalytics.currentMonthRevenue) : '₹0.00'}
                  </div>
                  <p className='text-xs text-muted-foreground'>
                    Current month revenue
                  </p>
                </CardContent>
              </Card>
            </div>
            <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-7'>
              <Card className='col-span-4'>
                <CardHeader>
                  <CardTitle>Revenue Overview</CardTitle>
                </CardHeader>
                <CardContent className='pl-2'>
                  {loading ? (
                    <Skeleton className='h-[200px] w-full' />
                  ) : (
                    <VendorBarGraph data={vendorAnalytics?.topProducts || []} />
                  )}
                </CardContent>
              </Card>
              <Card className='col-span-3'>
                <CardHeader>
                  <CardTitle>Recent Sales</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className='space-y-2'>
                      <Skeleton className='h-4 w-full' />
                      <Skeleton className='h-4 w-full' />
                      <Skeleton className='h-4 w-full' />
                    </div>
                  ) : (
                    <VendorRecentSales data={vendorAnalytics?.recentOrders || []} />
                  )}
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>
                  Your latest orders and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className='space-y-2'>
                    <Skeleton className='h-4 w-full' />
                    <Skeleton className='h-4 w-full' />
                    <Skeleton className='h-4 w-full' />
                  </div>
                ) : (
                  <VendorRecentOrdersTable data={vendorAnalytics?.recentOrders || []} />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}
