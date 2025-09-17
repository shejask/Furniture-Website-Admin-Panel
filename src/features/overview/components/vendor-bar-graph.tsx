'use client';

import * as React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';

export const description = 'Vendor Revenue bar chart';

const chartConfig = {
  revenue: {
    label: 'Revenue',
    color: 'var(--primary)'
  }
} satisfies ChartConfig;

interface VendorBarGraphProps {
  data: Array<{ name: string; revenue: number }>;
}

export function VendorBarGraph({ data }: VendorBarGraphProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-muted-foreground">
        No revenue data available
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig}>
      <BarChart
        accessibilityLayer
        data={data}
        margin={{
          left: 12,
          right: 12
        }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="name"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => value.length > 10 ? `${value.slice(0, 10)}...` : value}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel />}
        />
        <Bar dataKey="revenue" fill="var(--primary)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
