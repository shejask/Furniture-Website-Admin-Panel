'use client';

import { useMemo } from 'react';
import { useFirebaseData } from './use-firebase-database';
import { useOrders } from './use-orders';

export interface DashboardAnalytics {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  revenueGrowth: number;
  ordersGrowth: number;
  productsGrowth: number;
  customersGrowth: number;
  topProducts: Array<{
    id: string;
    name: string;
    revenue: number;
    quantity: number;
  }>;
  recentOrders: Array<{
    id: string;
    customer: string;
    amount: number;
    status: string;
    date: string;
  }>;
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
    orders: number;
  }>;
}

export function useDashboardAnalytics(): {
  data: DashboardAnalytics | null;
  loading: boolean;
  error: any;
} {
  const { data: products, loading: productsLoading, error: productsError } = useFirebaseData('products');
  const { orders, loading: ordersLoading, error: ordersError } = useOrders();
  const { data: customers, loading: customersLoading, error: customersError } = useFirebaseData('customers');

  const analytics = useMemo((): DashboardAnalytics | null => {
    if (!products || !orders || !customers) return null;

    // Convert Firebase objects to arrays
    const productsArray = Object.entries(products || {}).map(([id, product]) => ({
      id,
      ...(product as any)
    }));

    const ordersArray = orders || [];

    const customersArray = Object.entries(customers || {}).map(([id, customer]) => ({
      id,
      ...(customer as any)
    }));

    // Calculate analytics - exclude cancelled and refunded orders
    const validOrders = ordersArray.filter(order => 
      order.orderStatus !== 'cancelled' && order.orderStatus !== 'refunded'
    );
    
    const totalRevenue = validOrders.reduce((sum, order) => {
      return sum + (order.total || order.amount || 0);
    }, 0);

    const totalOrders = ordersArray.length;
    const totalProducts = productsArray.length;
    const totalCustomers = customersArray.length;

    // Calculate growth (mock data for now - you can implement real growth calculation)
    const revenueGrowth = 12.5;
    const ordersGrowth = 8.2;
    const productsGrowth = 5.1;
    const customersGrowth = 15.3;

    // Top products by revenue - use valid orders only
    const productRevenue = new Map();
    validOrders.forEach(order => {
      if (order.items) {
        order.items.forEach((item: any) => {
          const revenue = productRevenue.get(item.productId) || 0;
          productRevenue.set(item.productId, revenue + (item.total || item.price * item.quantity));
        });
      }
    });

    const topProducts = Array.from(productRevenue.entries())
      .map(([productId, revenue]) => {
        const product = productsArray.find(p => p.id === productId);
        return {
          id: productId,
          name: product?.name || 'Unknown Product',
          revenue: revenue as number,
          quantity: 0 // You can calculate this similarly
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Recent orders
    const recentOrders = ordersArray
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 10)
      .map(order => ({
        id: order.id,
        customer: order.userEmail || 'Unknown Customer',
        amount: order.total || 0,
        status: order.orderStatus || 'pending',
        date: order.createdAt || new Date().toISOString()
      }));

    // Monthly revenue (last 6 months)
    const monthlyRevenue = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
      const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
      
      const monthOrders = validOrders.filter(order => {
        const orderDate = new Date(order.createdAt || 0);
        return orderDate >= monthStart && orderDate <= monthEnd;
      });

      const monthRevenue = monthOrders.reduce((sum, order) => sum + (order.total || order.amount || 0), 0);

      monthlyRevenue.push({
        month: month.toLocaleDateString('en-US', { month: 'long' }),
        revenue: monthRevenue,
        orders: monthOrders.length
      });
    }

    return {
      totalRevenue,
      totalOrders,
      totalProducts,
      totalCustomers,
      revenueGrowth,
      ordersGrowth,
      productsGrowth,
      customersGrowth,
      topProducts,
      recentOrders,
      monthlyRevenue
    };
  }, [products, orders, customers]);

  const loading = productsLoading || ordersLoading || customersLoading;
  const error = productsError || ordersError || customersError;

  return { data: analytics, loading, error };
}
