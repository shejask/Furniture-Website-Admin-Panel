
'use client';

import { useState, useMemo } from 'react';
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

export function PaymentsAnalytics() {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('30d');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('INR');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('all');

  const { orders, loading: ordersLoading } = useOrders();
  const { data: customers } = useFirebaseData('customers');

  const allPayments = useMemo(() => {
    if (!orders || orders.length === 0) return [];
    
    return orders
      .filter(order => 
        order.paymentStatus && 
        order.razorpayPaymentId && 
        order.orderStatus === 'confirmed'
      ) // Only confirmed orders with Razorpay payments
      .map(order => {
        // Find customer name
        let customerName = 'Unknown Customer';
        let customerEmail = 'unknown@example.com';
        
        if (customers && order.userId) {
          const customer = customers[order.userId];
          if (customer) {
            customerName = customer.name || customer.email || customer.userName || 'Unknown Customer';
            customerEmail = customer.email || customer.userEmail || 'unknown@example.com';
          }
        } else if (order.userEmail) {
          customerName = order.userEmail;
          customerEmail = order.userEmail;
        }

        return {
          id: order.id,
          transactionId: order.razorpayPaymentId || order.id,
          orderId: order.orderId || order.id,
          customerId: order.userId || 'unknown',
          customerName,
          customerEmail,
          amount: order.total || 0,
          currency: 'INR', // Razorpay default currency
          paymentMethod: 'razorpay' as const,
          status: order.paymentStatus === 'completed' ? 'completed' : 
                  order.paymentStatus === 'pending' ? 'pending' :
                  order.paymentStatus === 'failed' ? 'failed' : 'pending',
          gateway: 'razorpay',
          gatewayTransactionId: order.razorpayPaymentId,
          fees: 0, // Razorpay fees can be calculated separately
          tax: 0, // Tax from order
          description: `Payment for Order #${order.orderId || order.id}`,
          metadata: {
            razorpayOrderId: order.razorpayOrderId,
            razorpayPaymentId: order.razorpayPaymentId,
            orderStatus: order.orderStatus,
            items: order.items?.length || 0
          },
          createdAt: order.createdAt || new Date().toISOString(),
          updatedAt: order.updatedAt || order.createdAt || new Date().toISOString(),
          completedAt: order.paymentStatus === 'completed' ? order.createdAt : undefined
        } as Payment;
      });
  }, [orders, customers]);

  const filteredPayments = useMemo(() => {
    let filtered = allPayments;

    // Period filter
    const now = new Date();
    const periodDays = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    };
    
    if (selectedPeriod !== 'all') {
      const days = periodDays[selectedPeriod as keyof typeof periodDays] || 30;
      const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(payment => new Date(payment.createdAt) >= cutoffDate);
    }

    // Currency filter
    if (selectedCurrency !== 'all') {
      filtered = filtered.filter(payment => payment.currency === selectedCurrency);
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(payment => payment.status === selectedStatus);
    }

    // Payment method filter
    if (selectedPaymentMethod !== 'all') {
      filtered = filtered.filter(payment => payment.paymentMethod === selectedPaymentMethod);
    }

    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(payment => 
        payment.transactionId.toLowerCase().includes(searchLower) ||
        payment.customerName.toLowerCase().includes(searchLower) ||
        payment.orderId.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [allPayments, selectedPeriod, selectedCurrency, selectedStatus, selectedPaymentMethod, searchQuery]);

  const analytics: PaymentAnalytics = useMemo(() => {
    const totalRevenue = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const totalTransactions = filteredPayments.length;
    const averageTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    const successfulTransactions = filteredPayments.filter(p => p.status === 'completed').length;
    const successRate = totalTransactions > 0 ? (successfulTransactions / totalTransactions) * 100 : 0;
    const pendingAmount = filteredPayments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);
    const refundedAmount = filteredPayments.filter(p => p.status === 'refunded').reduce((sum, p) => sum + p.amount, 0);

    // Monthly revenue calculation
    const monthlyRevenue = Array.from({ length: 12 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const month = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      const monthPayments = filteredPayments.filter(p => {
        const paymentDate = new Date(p.createdAt);
        return paymentDate.getMonth() === date.getMonth() && paymentDate.getFullYear() === date.getFullYear();
      });
      return {
        month,
        revenue: monthPayments.reduce((sum, p) => sum + p.amount, 0),
        transactions: monthPayments.length
      };
    }).reverse();

    // Payment method breakdown
    const methodStats = filteredPayments.reduce((acc, payment) => {
      if (!acc[payment.paymentMethod]) {
        acc[payment.paymentMethod] = { count: 0, amount: 0 };
      }
      acc[payment.paymentMethod].count++;
      acc[payment.paymentMethod].amount += payment.amount;
      return acc;
    }, {} as Record<string, { count: number; amount: number }>);

    const paymentMethodBreakdown = Object.entries(methodStats).map(([method, stats]) => ({
      method: method.replace('_', ' ').toUpperCase(),
      count: stats.count,
      amount: stats.amount,
      percentage: totalTransactions > 0 ? (stats.count / totalTransactions) * 100 : 0
    }));

    // Top customers
    const customerStats = filteredPayments.reduce((acc, payment) => {
      if (!acc[payment.customerId]) {
        acc[payment.customerId] = {
          customerId: payment.customerId,
          customerName: payment.customerName,
          totalSpent: 0,
          transactionCount: 0
        };
      }
      acc[payment.customerId].totalSpent += payment.amount;
      acc[payment.customerId].transactionCount++;
      return acc;
    }, {} as Record<string, { customerId: string; customerName: string; totalSpent: number; transactionCount: number }>);

    const topCustomers = Object.values(customerStats)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5);

    // Recent transactions
    const recentTransactions = filteredPayments
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    // Revenue growth calculation
    const currentMonth = new Date().getMonth();
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const currentYear = new Date().getFullYear();
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const currentMonthRevenue = filteredPayments.filter(p => {
      const date = new Date(p.createdAt);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }).reduce((sum, p) => sum + p.amount, 0);

    const previousMonthRevenue = filteredPayments.filter(p => {
      const date = new Date(p.createdAt);
      return date.getMonth() === previousMonth && date.getFullYear() === previousYear;
    }).reduce((sum, p) => sum + p.amount, 0);

    const growthPercentage = previousMonthRevenue > 0 
      ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 
      : 0;

    // Transaction trends
    const daily = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayPayments = filteredPayments.filter(p => {
        const paymentDate = new Date(p.createdAt);
        return paymentDate.toDateString() === date.toDateString();
      });
      return {
        date: date.toLocaleDateString(),
        count: dayPayments.length,
        amount: dayPayments.reduce((sum, p) => sum + p.amount, 0)
      };
    }).reverse();

    const weekly = Array.from({ length: 12 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (i * 7));
      const weekStart = new Date(date);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      const weekPayments = filteredPayments.filter(p => {
        const paymentDate = new Date(p.createdAt);
        return paymentDate >= weekStart && paymentDate <= weekEnd;
      });
      
      return {
        week: `Week ${Math.ceil((date.getDate() + date.getDay()) / 7)}`,
        count: weekPayments.length,
        amount: weekPayments.reduce((sum, p) => sum + p.amount, 0)
      };
    }).reverse();

    const monthly = monthlyRevenue.map(item => ({
      month: item.month,
      count: item.transactions,
      amount: item.revenue
    }));

    return {
      totalRevenue,
      totalTransactions,
      averageTransactionValue,
      successRate,
      pendingAmount,
      refundedAmount,
      monthlyRevenue,
      paymentMethodBreakdown,
      topCustomers,
      recentTransactions,
      revenueGrowth: {
        currentMonth: currentMonthRevenue,
        previousMonth: previousMonthRevenue,
        growthPercentage
      },
      transactionTrends: {
        daily,
        weekly,
        monthly
      }
    };
  }, [filteredPayments]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: 'secondary',
      completed: 'default',
      failed: 'destructive',
      refunded: 'outline',
      cancelled: 'destructive',
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'credit_card':
        return <CreditCard className="h-4 w-4" />;
      case 'paypal':
        return <DollarSign className="h-4 w-4" />;
      case 'bank_transfer':
        return <Activity className="h-4 w-4" />;
      case 'cash_on_delivery':
        return <DollarSign className="h-4 w-4" />;
      case 'stripe':
        return <CreditCard className="h-4 w-4" />;
      case 'razorpay':
        return <CreditCard className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: number, currency: string = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  if (ordersLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Razorpay Payment Analytics</h2>
            <p className="text-muted-foreground">
              Loading payment data...
            </p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Loading...</CardTitle>
                <div className="h-4 w-4 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-20 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (allPayments.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Razorpay Payment Analytics</h2>
            <p className="text-muted-foreground">
              No Razorpay payments found. Payments will appear here once customers complete their orders.
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Payments Yet</h3>
            <p className="text-muted-foreground text-center">
              Razorpay payments will be displayed here once customers complete their orders.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="INR">INR</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              <SelectItem value="razorpay">Razorpay</SelectItem>
              <SelectItem value="credit_card">Credit Card</SelectItem>
              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              <SelectItem value="cash_on_delivery">Cash on Delivery</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics.totalRevenue)}</div>
            <div className="flex items-center gap-1 text-xs">
              {analytics.revenueGrowth.growthPercentage >= 0 ? (
                <ArrowUpRight className="h-3 w-3 text-green-500" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-red-500" />
              )}
              <span className={analytics.revenueGrowth.growthPercentage >= 0 ? 'text-green-500' : 'text-red-500'}>
                {Math.abs(analytics.revenueGrowth.growthPercentage).toFixed(1)}%
              </span>
              <span className="text-muted-foreground">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalTransactions}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.averageTransactionValue.toFixed(2)} avg per transaction
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
              {filteredPayments.filter(p => p.status === 'completed').length} successful
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics.pendingAmount)}</div>
            <p className="text-xs text-muted-foreground">
              {filteredPayments.filter(p => p.status === 'pending').length} pending transactions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analytics */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="customers">Top Customers</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Monthly Revenue Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Monthly Revenue
                </CardTitle>
                <CardDescription>
                  Revenue trends over the last 12 months
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Enhanced Monthly Revenue Display */}
                <div className="space-y-4">
                  {/* Current Month Highlight */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-4 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                          {analytics.monthlyRevenue[analytics.monthlyRevenue.length - 1]?.month || 'Current Month'}
                        </h3>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          Current month revenue
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                          {formatCurrency(analytics.monthlyRevenue[analytics.monthlyRevenue.length - 1]?.revenue || 0)}
                        </div>
                        <div className="text-sm text-blue-700 dark:text-blue-300">
                          {analytics.monthlyRevenue[analytics.monthlyRevenue.length - 1]?.transactions || 0} transactions
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Monthly Revenue List with Visual Bars */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground">Last 12 Months</h4>
                    {analytics.monthlyRevenue.slice(-12).reverse().map((item, index) => {
                      const maxRevenue = Math.max(...analytics.monthlyRevenue.map(m => m.revenue));
                      const percentage = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
                      const isCurrentMonth = index === 0;
                      
                      return (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className={`text-sm font-medium ${isCurrentMonth ? 'text-primary' : 'text-muted-foreground'}`}>
                              {item.month}
                            </span>
                            <div className="text-right">
                              <span className={`text-sm font-semibold ${isCurrentMonth ? 'text-primary' : ''}`}>
                                {formatCurrency(item.revenue)}
                              </span>
                              <span className="text-xs text-muted-foreground ml-2">
                                ({item.transactions} txns)
                              </span>
                            </div>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                isCurrentMonth 
                                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500' 
                                  : 'bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-500'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Revenue Growth Summary */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(analytics.monthlyRevenue.slice(-3).reduce((sum, m) => sum + m.revenue, 0))}
                      </div>
                      <div className="text-xs text-muted-foreground">Last 3 months</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {formatCurrency(analytics.monthlyRevenue.reduce((sum, m) => sum + m.revenue, 0))}
                      </div>
                      <div className="text-xs text-muted-foreground">Total (12 months)</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Payment Methods
                </CardTitle>
                <CardDescription>
                  Breakdown by payment method
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <PieChart className="h-12 w-12 mx-auto mb-2" />
                    <p>Pie chart would be here</p>
                    <p className="text-sm">Using a charting library like Recharts</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  {analytics.paymentMethodBreakdown.map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm">{item.method}</span>
                      <span className="text-sm font-medium">{item.percentage.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Revenue Analytics
              </CardTitle>
              <CardDescription>
                Detailed revenue analysis and trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Enhanced Revenue Growth Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-6 border rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {formatCurrency(analytics.revenueGrowth.currentMonth)}
                  </div>
                  <div className="text-sm text-muted-foreground mb-1">Current Month</div>
                  <div className="text-xs text-green-600 font-medium">
                    {analytics.monthlyRevenue[analytics.monthlyRevenue.length - 1]?.transactions || 0} transactions
                  </div>
                </div>
                <div className="text-center p-6 border rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {formatCurrency(analytics.revenueGrowth.previousMonth)}
                  </div>
                  <div className="text-sm text-muted-foreground mb-1">Previous Month</div>
                  <div className="text-xs text-blue-600 font-medium">
                    {analytics.monthlyRevenue[analytics.monthlyRevenue.length - 2]?.transactions || 0} transactions
                  </div>
                </div>
                <div className={`text-center p-6 border rounded-lg ${
                  analytics.revenueGrowth.growthPercentage >= 0 
                    ? 'bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20' 
                    : 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20'
                }`}>
                  <div className={`text-3xl font-bold mb-2 ${
                    analytics.revenueGrowth.growthPercentage >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {analytics.revenueGrowth.growthPercentage >= 0 ? '+' : ''}{analytics.revenueGrowth.growthPercentage.toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground mb-1">Month-over-Month</div>
                  <div className={`text-xs font-medium ${
                    analytics.revenueGrowth.growthPercentage >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {analytics.revenueGrowth.growthPercentage >= 0 ? 'Growth' : 'Decline'}
                  </div>
                </div>
              </div>

              {/* Monthly Revenue Breakdown Table */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Monthly Revenue Breakdown</h3>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Month</TableHead>
                        <TableHead>Revenue</TableHead>
                        <TableHead>Transactions</TableHead>
                        <TableHead>Avg. Transaction</TableHead>
                        <TableHead>Growth</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analytics.monthlyRevenue.slice(-12).reverse().map((item, index) => {
                        const previousMonth = analytics.monthlyRevenue[analytics.monthlyRevenue.length - 2 - index];
                        const growth = previousMonth && previousMonth.revenue > 0 
                          ? ((item.revenue - previousMonth.revenue) / previousMonth.revenue) * 100 
                          : 0;
                        const avgTransaction = item.transactions > 0 ? item.revenue / item.transactions : 0;
                        const isCurrentMonth = index === 0;
                        
                        return (
                          <TableRow key={index} className={isCurrentMonth ? 'bg-muted/50' : ''}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {item.month}
                                {isCurrentMonth && (
                                  <Badge variant="default" className="text-xs">Current</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-semibold">
                              {formatCurrency(item.revenue)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Activity className="h-4 w-4 text-muted-foreground" />
                                {item.transactions}
                              </div>
                            </TableCell>
                            <TableCell>
                              {formatCurrency(avgTransaction)}
                            </TableCell>
                            <TableCell>
                              <div className={`flex items-center gap-1 ${
                                growth >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {growth >= 0 ? (
                                  <ArrowUpRight className="h-4 w-4" />
                                ) : (
                                  <ArrowDownRight className="h-4 w-4" />
                                )}
                                <span className="text-sm font-medium">
                                  {growth >= 0 ? '+' : ''}{growth.toFixed(1)}%
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Revenue Insights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Best Performing Month</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const bestMonth = analytics.monthlyRevenue.reduce((max, month) => 
                        month.revenue > max.revenue ? month : max
                      );
                      return (
                        <div className="space-y-2">
                          <div className="text-2xl font-bold text-green-600">
                            {bestMonth.month}
                          </div>
                          <div className="text-lg font-semibold">
                            {formatCurrency(bestMonth.revenue)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {bestMonth.transactions} transactions
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Revenue Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Last 3 months:</span>
                        <span className="font-semibold">
                          {formatCurrency(analytics.monthlyRevenue.slice(-3).reduce((sum, m) => sum + m.revenue, 0))}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Last 6 months:</span>
                        <span className="font-semibold">
                          {formatCurrency(analytics.monthlyRevenue.slice(-6).reduce((sum, m) => sum + m.revenue, 0))}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total (12 months):</span>
                        <span className="font-semibold">
                          {formatCurrency(analytics.monthlyRevenue.reduce((sum, m) => sum + m.revenue, 0))}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Transactions
              </CardTitle>
              <CardDescription>
                Latest payment transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics.recentTransactions.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{payment.transactionId}</div>
                            <div className="text-sm text-muted-foreground">{payment.orderId}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{payment.customerName}</div>
                            <div className="text-sm text-muted-foreground">{payment.customerEmail}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{formatCurrency(payment.amount, payment.currency)}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getPaymentMethodIcon(payment.paymentMethod)}
                            <span className="text-sm">{payment.paymentMethod.replace('_', ' ')}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(payment.status)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {new Date(payment.createdAt).toLocaleDateString()}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Top Customers
              </CardTitle>
              <CardDescription>
                Customers with highest transaction values
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.topCustomers.map((customer, index) => (
                  <div key={customer.customerId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{customer.customerName}</div>
                        <div className="text-sm text-muted-foreground">
                          {customer.transactionCount} transactions
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(customer.totalSpent)}</div>
                      <div className="text-sm text-muted-foreground">
                        Avg: {formatCurrency(customer.totalSpent / customer.transactionCount)}
                      </div>
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