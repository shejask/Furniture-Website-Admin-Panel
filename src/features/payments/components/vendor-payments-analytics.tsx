'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  TrendingUp, 
  CreditCard, 
  Users, 
  CheckCircle, 
  Clock, 
  Download,
  BarChart3,
  PieChart,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Search
} from 'lucide-react';
import { useFirebaseData } from '@/hooks/use-firebase-database';
import { useOrders } from '@/hooks/use-orders';
import { type Payment, type PaymentAnalytics } from '../utils/form-schema';
import { getCurrentUser } from '@/lib/auth';

export function VendorPaymentsAnalytics() {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('30d');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('INR');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('all');
  const [currentVendor, setCurrentVendor] = useState<any>(null);

  const { orders, loading: ordersLoading } = useOrders();
  const { data: customers } = useFirebaseData('customers');

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentVendor(user);
  }, []);

  const allPayments = useMemo(() => {
    if (!orders || orders.length === 0 || !currentVendor) return [];
    
    // Filter orders for current vendor only
    const vendorOrders = orders.filter(order => {
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
    
    return vendorOrders
      .filter(order => 
        order.paymentStatus && 
        order.razorpayPaymentId && 
        order.orderStatus === 'confirmed'
      ) // Only confirmed orders with Razorpay payments count for revenue
      .map(order => ({
        id: order.orderId,
        orderId: order.orderId,
        customerId: order.userId || '',
        customerName: `${order.address?.firstName || ''} ${order.address?.lastName || ''}`.trim() || 'Unknown Customer',
        customerEmail: order.userEmail || '',
        amount: order.total || 0,
        currency: 'INR',
        status: order.paymentStatus || 'pending',
        paymentMethod: order.paymentMethod || 'razorpay',
        transactionId: order.razorpayPaymentId || '',
        razorpayOrderId: order.razorpayOrderId || '',
        createdAt: order.createdAt || new Date().toISOString(),
        updatedAt: order.updatedAt || new Date().toISOString(),
        orderStatus: order.orderStatus || 'pending',
        vendorId: order.vendor || '',
        vendorName: order.vendorName || '',
        vendorEmail: order.vendorEmail || ''
      }));
  }, [orders, currentVendor]);

  const filteredPayments = useMemo(() => {
    if (!allPayments) return [];

    return allPayments.filter(payment => {
      const matchesSearch = 
        payment.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.transactionId.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = selectedStatus === 'all' || payment.status === selectedStatus;
      const matchesPaymentMethod = selectedPaymentMethod === 'all' || payment.paymentMethod === selectedPaymentMethod;

      return matchesSearch && matchesStatus && matchesPaymentMethod;
    });
  }, [allPayments, searchQuery, selectedStatus, selectedPaymentMethod]);

  const analytics: PaymentAnalytics = useMemo(() => {
    if (!allPayments || allPayments.length === 0) {
      return {
        totalRevenue: 0,
        totalTransactions: 0,
        averageTransactionValue: 0,
        successRate: 0,
        monthlyRevenue: [],
        paymentMethodBreakdown: [],
        recentTransactions: [],
        topCustomers: []
      };
    }

    const totalRevenue = allPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const totalTransactions = allPayments.length;
    const averageTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    
    const successfulPayments = allPayments.filter(p => p.status === 'completed');
    const successRate = totalTransactions > 0 ? (successfulPayments.length / totalTransactions) * 100 : 0;

    // Monthly revenue calculation
    const monthlyRevenue = allPayments.reduce((acc, payment) => {
      const date = new Date(payment.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      acc[monthKey] = (acc[monthKey] || 0) + payment.amount;
      return acc;
    }, {} as Record<string, number>);

    const monthlyRevenueArray = Object.entries(monthlyRevenue)
      .map(([month, revenue]) => ({ month, revenue }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12); // Last 12 months

    // Payment method breakdown
    const paymentMethodBreakdown = allPayments.reduce((acc, payment) => {
      const method = payment.paymentMethod || 'unknown';
      acc[method] = (acc[method] || 0) + payment.amount;
      return acc;
    }, {} as Record<string, number>);

    const paymentMethodArray = Object.entries(paymentMethodBreakdown)
      .map(([method, amount]) => ({ method, amount }))
      .sort((a, b) => b.amount - a.amount);

    // Top customers
    const customerSpending = allPayments.reduce((acc, payment) => {
      const customerKey = payment.customerEmail || payment.customerName;
      if (!acc[customerKey]) {
        acc[customerKey] = { name: payment.customerName, email: payment.customerEmail, totalSpent: 0, transactionCount: 0 };
      }
      acc[customerKey].totalSpent += payment.amount;
      acc[customerKey].transactionCount += 1;
      return acc;
    }, {} as Record<string, { name: string; email: string; totalSpent: number; transactionCount: number }>);

    const topCustomers = Object.values(customerSpending)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    return {
      totalRevenue,
      totalTransactions,
      averageTransactionValue,
      successRate,
      monthlyRevenue: monthlyRevenueArray,
      paymentMethodBreakdown: paymentMethodArray,
      recentTransactions: allPayments
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10),
      topCustomers
    };
  }, [allPayments]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { label: 'Completed', className: 'bg-green-100 text-green-800' },
      pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
      failed: { label: 'Failed', className: 'bg-red-100 text-red-800' },
      refunded: { label: 'Refunded', className: 'bg-gray-100 text-gray-800' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, className: 'bg-gray-100 text-gray-800' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  if (!currentVendor) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-muted-foreground">Please sign in to view your payment analytics</p>
        </div>
      </div>
    );
  }

  if (ordersLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 bg-muted rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded animate-pulse mb-2" />
                <div className="h-3 bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Your total earnings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalTransactions}</div>
            <p className="text-xs text-muted-foreground">
              Payment transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Transaction</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics.averageTransactionValue)}</div>
            <p className="text-xs text-muted-foreground">
              Per transaction
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.successRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Payment success rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="customers">Top Customers</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Revenue</CardTitle>
                <CardDescription>Your revenue over the last 12 months</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics.monthlyRevenue.slice(-6).map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{item.month}</span>
                      <span className="text-sm text-muted-foreground">{formatCurrency(item.revenue)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>Revenue breakdown by payment method</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics.paymentMethodBreakdown.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">{item.method}</span>
                      <span className="text-sm text-muted-foreground">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Your latest payment transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.recentTransactions.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">{payment.customerName}</p>
                      <p className="text-sm text-muted-foreground">{payment.orderId}</p>
                      <p className="text-xs text-muted-foreground">{payment.customerEmail}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="font-medium">{formatCurrency(payment.amount)}</p>
                      {getStatusBadge(payment.status)}
                      <p className="text-xs text-muted-foreground">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Customers</CardTitle>
              <CardDescription>Your highest spending customers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.topCustomers.map((customer, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">{customer.name}</p>
                      <p className="text-sm text-muted-foreground">{customer.email}</p>
                      <p className="text-xs text-muted-foreground">{customer.transactionCount} transactions</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(customer.totalSpent)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
