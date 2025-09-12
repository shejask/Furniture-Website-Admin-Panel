'use client';

import { IconTrendingUp } from '@tabler/icons-react';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';

import { useDashboardAnalytics } from '@/hooks/use-dashboard-analytics';

const chartConfig = {
  revenue: {
    label: 'Revenue'
  },
  orders: {
    label: 'Orders',
    color: 'var(--primary)'
  }
} satisfies ChartConfig;

export function AreaGraph() {
  const { data: analytics, loading } = useDashboardAnalytics();

  // Use analytics data or fallback to default
  const chartData = analytics?.monthlyRevenue?.map(item => ({
    month: item.month,
    orders: item.orders,
    revenue: item.revenue / 1000 // Convert to thousands for better visualization
  })) || [
    { month: 'January', orders: 186, revenue: 80 },
    { month: 'February', orders: 305, revenue: 200 },
    { month: 'March', orders: 237, revenue: 120 },
    { month: 'April', orders: 73, revenue: 190 },
    { month: 'May', orders: 209, revenue: 130 },
    { month: 'June', orders: 214, revenue: 140 }
  ];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Area Chart - Stacked</CardTitle>
          <CardDescription>
            Showing total orders and revenue for the last 6 months
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full bg-muted/20 animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='@container/card'>
      <CardHeader>
        <CardTitle>Area Chart - Stacked</CardTitle>
        <CardDescription>
          Showing total visitors for the last 6 months
        </CardDescription>
      </CardHeader>
      <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
        <ChartContainer
          config={chartConfig}
          className='aspect-auto h-[250px] w-full'
        >
          <AreaChart
            data={chartData}
            margin={{
              left: 12,
              right: 12
            }}
          >
            <defs>
              <linearGradient id='fillDesktop' x1='0' y1='0' x2='0' y2='1'>
                <stop
                  offset='5%'
                  stopColor='var(--color-desktop)'
                  stopOpacity={1.0}
                />
                <stop
                  offset='95%'
                  stopColor='var(--color-desktop)'
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id='fillMobile' x1='0' y1='0' x2='0' y2='1'>
                <stop
                  offset='5%'
                  stopColor='var(--color-mobile)'
                  stopOpacity={0.8}
                />
                <stop
                  offset='95%'
                  stopColor='var(--color-mobile)'
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey='month'
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator='dot' />}
            />
            <Area
              dataKey='mobile'
              type='natural'
              fill='url(#fillMobile)'
              stroke='var(--color-mobile)'
              stackId='a'
            />
            <Area
              dataKey='desktop'
              type='natural'
              fill='url(#fillDesktop)'
              stroke='var(--color-desktop)'
              stackId='a'
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className='flex w-full items-start gap-2 text-sm'>
          <div className='grid gap-2'>
            <div className='flex items-center gap-2 leading-none font-medium'>
              Trending up by 5.2% this month{' '}
              <IconTrendingUp className='h-4 w-4' />
            </div>
            <div className='text-muted-foreground flex items-center gap-2 leading-none'>
              January - June 2024
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
