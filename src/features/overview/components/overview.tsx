'use client';

import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  CardAction
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { AreaGraph } from './area-graph';
import { BarGraph } from './bar-graph';
import { PieGraph } from './pie-graph';
import { RecentSales } from './recent-sales';
import { IconTrendingUp, IconTrendingDown } from '@tabler/icons-react';
import { Badge } from '@/components/ui/badge';
import { useDashboardAnalytics } from '@/hooks/use-dashboard-analytics';

export default function OverViewPage() {
  const { data: analytics, loading } = useDashboardAnalytics();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-2'>
        <div className='flex items-center justify-between space-y-2'>
          <h2 className='text-2xl font-bold tracking-tight'>
            Hi, Welcome back 👋
          </h2>
          <div className='hidden items-center space-x-2 md:flex'>
            <Button>Download</Button>
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
            <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4'>
              <Card className='@container/card'>
                <CardHeader>
                  <CardDescription>Total Revenue</CardDescription>
                  {loading ? (
                    <Skeleton className="h-8 w-32" />
                  ) : (
                    <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                      {analytics ? formatCurrency(analytics.totalRevenue) : '₹0.00'}
                    </CardTitle>
                  )}
                  <CardAction>
                    {loading ? (
                      <Skeleton className="h-6 w-16" />
                    ) : (
                      <Badge variant='outline'>
                        {analytics && analytics.revenueGrowth >= 0 ? <IconTrendingUp /> : <IconTrendingDown />}
                        {analytics ? `${analytics.revenueGrowth > 0 ? '+' : ''}${analytics.revenueGrowth.toFixed(1)}%` : '0%'}
                      </Badge>
                    )}
                  </CardAction>
                </CardHeader>
                <CardFooter className='flex-col items-start gap-1.5 text-sm'>
                  <div className='line-clamp-1 flex gap-2 font-medium'>
                    {analytics && analytics.revenueGrowth >= 0 ? 'Trending up this month' : 'Trending down this month'} 
                    {analytics && analytics.revenueGrowth >= 0 ? <IconTrendingUp className='size-4' /> : <IconTrendingDown className='size-4' />}
                  </div>
                  <div className='text-muted-foreground'>
                    Revenue for the last 6 months
                  </div>
                </CardFooter>
              </Card>
              <Card className='@container/card'>
                <CardHeader>
                  <CardDescription>Total Orders</CardDescription>
                  {loading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                      {analytics?.totalOrders?.toLocaleString('en-IN') || '0'}
                    </CardTitle>
                  )}
                  <CardAction>
                    {loading ? (
                      <Skeleton className="h-6 w-16" />
                    ) : (
                      <Badge variant='outline'>
                        {analytics && analytics.ordersGrowth >= 0 ? <IconTrendingUp /> : <IconTrendingDown />}
                        {analytics ? `${analytics.ordersGrowth > 0 ? '+' : ''}${analytics.ordersGrowth.toFixed(1)}%` : '0%'}
                      </Badge>
                    )}
                  </CardAction>
                </CardHeader>
                <CardFooter className='flex-col items-start gap-1.5 text-sm'>
                  <div className='line-clamp-1 flex gap-2 font-medium'>
                    {analytics && analytics.ordersGrowth >= 0 ? 'Orders increasing' : 'Orders decreasing'} 
                    {analytics && analytics.ordersGrowth >= 0 ? <IconTrendingUp className='size-4' /> : <IconTrendingDown className='size-4' />}
                  </div>
                  <div className='text-muted-foreground'>
                    Total orders this month
                  </div>
                </CardFooter>
              </Card>
              <Card className='@container/card'>
                <CardHeader>
                  <CardDescription>Total Products</CardDescription>
                  {loading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                      {analytics?.totalProducts?.toLocaleString('en-IN') || '0'}
                    </CardTitle>
                  )}
                  <CardAction>
                    {loading ? (
                      <Skeleton className="h-6 w-16" />
                    ) : (
                      <Badge variant='outline'>
                        {analytics && analytics.productsGrowth >= 0 ? <IconTrendingUp /> : <IconTrendingDown />}
                        {analytics ? `${analytics.productsGrowth > 0 ? '+' : ''}${analytics.productsGrowth.toFixed(1)}%` : '0%'}
                      </Badge>
                    )}
                  </CardAction>
                </CardHeader>
                <CardFooter className='flex-col items-start gap-1.5 text-sm'>
                  <div className='line-clamp-1 flex gap-2 font-medium'>
                    {analytics && analytics.productsGrowth >= 0 ? 'Catalog growing' : 'Catalog stable'} 
                    {analytics && analytics.productsGrowth >= 0 ? <IconTrendingUp className='size-4' /> : <IconTrendingDown className='size-4' />}
                  </div>
                  <div className='text-muted-foreground'>
                    Products in inventory
                  </div>
                </CardFooter>
              </Card>
              <Card className='@container/card'>
                <CardHeader>
                  <CardDescription>Total Customers</CardDescription>
                  {loading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                      {analytics?.totalCustomers?.toLocaleString('en-IN') || '0'}
                    </CardTitle>
                  )}
                  <CardAction>
                    {loading ? (
                      <Skeleton className="h-6 w-16" />
                    ) : (
                      <Badge variant='outline'>
                        {analytics && analytics.customersGrowth >= 0 ? <IconTrendingUp /> : <IconTrendingDown />}
                        {analytics ? `${analytics.customersGrowth > 0 ? '+' : ''}${analytics.customersGrowth.toFixed(1)}%` : '0%'}
                      </Badge>
                    )}
                  </CardAction>
                </CardHeader>
                <CardFooter className='flex-col items-start gap-1.5 text-sm'>
                  <div className='line-clamp-1 flex gap-2 font-medium'>
                    {analytics && analytics.customersGrowth >= 0 ? 'Customer base growing' : 'Customer acquisition needs attention'} 
                    {analytics && analytics.customersGrowth >= 0 ? <IconTrendingUp className='size-4' /> : <IconTrendingDown className='size-4' />}
                  </div>
                  <div className='text-muted-foreground'>
                    Registered customers
                  </div>
                </CardFooter>
              </Card>
            </div>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7'>
              <div className='col-span-4'>
                <BarGraph />
              </div>
              <Card className='col-span-4 md:col-span-3'>
                <RecentSales />
              </Card>
              <div className='col-span-4'>
                <AreaGraph />
              </div>
              <div className='col-span-4 md:col-span-3'>
                <PieGraph />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}
