'use client';

import { useState, useMemo, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  TrendingUp, 
  CreditCard, 
  CheckCircle,
  Download,
  Calendar as CalendarIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useOrders } from '@/hooks/use-orders';
import { type PaymentAnalytics } from '../utils/form-schema';
import { getCurrentUser } from '@/lib/auth';

export function VendorPaymentsAnalytics() {
  const [currentVendor, setCurrentVendor] = useState<any>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('30d');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const { orders, loading: ordersLoading } = useOrders();

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
    
    let filteredOrders = vendorOrders.filter(order => 
      order.paymentStatus && 
      order.razorpayPaymentId && 
      order.orderStatus === 'confirmed'
    ); // Only confirmed orders with Razorpay payments count for revenue

    // Apply date filtering
    if (selectedPeriod === 'custom' && startDate && endDate) {
      // Custom date range filter
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Include the entire end date
      filteredOrders = filteredOrders.filter(order => {
        const orderDate = new Date(order.createdAt || order.updatedAt || new Date());
        return orderDate >= start && orderDate <= end;
      });
    } else if (selectedPeriod !== 'all' && selectedPeriod !== 'custom') {
      // Preset period filter
      const now = new Date();
      const periodDays = {
        '7d': 7,
        '30d': 30,
        '90d': 90,
        '1y': 365
      };
      const days = periodDays[selectedPeriod as keyof typeof periodDays] || 30;
      const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      filteredOrders = filteredOrders.filter(order => {
        const orderDate = new Date(order.createdAt || order.updatedAt || new Date());
        return orderDate >= cutoffDate;
      });
    }
    
    return filteredOrders.map(order => ({
      id: order.orderId,
      transactionId: order.razorpayPaymentId || '',
      orderId: order.orderId,
      customerId: order.userId || '',
      customerName: `${order.address?.firstName || ''} ${order.address?.lastName || ''}`.trim() || 'Unknown Customer',
      customerEmail: order.userEmail || '',
      amount: (order.total || 0) - (order.shipping || 0) - (order.totalCommission || order.commission || 0), // Vendor earnings = total - shipping - commission
      currency: 'INR',
      paymentMethod: (order.paymentMethod || 'razorpay') as 'credit_card' | 'paypal' | 'bank_transfer' | 'cash_on_delivery' | 'stripe' | 'razorpay',
      status: (order.paymentStatus || 'pending') as 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled',
      gateway: 'razorpay',
      gatewayTransactionId: order.razorpayPaymentId || '',
      fees: 0,
      tax: 0,
      description: `Payment for order ${order.orderId}`,
      metadata: {
        razorpayOrderId: order.razorpayOrderId || '',
        orderStatus: order.orderStatus || 'pending',
        vendorId: order.vendor || '',
        vendorName: order.vendorName || '',
        vendorEmail: order.vendorEmail || ''
      },
      createdAt: order.createdAt || new Date().toISOString(),
      updatedAt: order.updatedAt || new Date().toISOString()
    }));
  }, [orders, currentVendor, selectedPeriod, startDate, endDate]);


  const analytics: PaymentAnalytics = useMemo(() => {
    if (!allPayments || allPayments.length === 0) {
      return {
        totalRevenue: 0,
        totalTransactions: 0,
        averageTransactionValue: 0,
        successRate: 0,
        pendingAmount: 0,
        refundedAmount: 0,
        monthlyRevenue: [],
        paymentMethodBreakdown: [],
        recentTransactions: [],
        topCustomers: [],
        revenueGrowth: {
          currentMonth: 0,
          previousMonth: 0,
          growthPercentage: 0
        },
        transactionTrends: {
          daily: [],
          weekly: [],
          monthly: []
        }
      };
    }

    const totalRevenue = allPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const totalTransactions = allPayments.length;
    const averageTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    
    const successfulPayments = allPayments.filter(p => p.status === 'completed');
    const pendingPayments = allPayments.filter(p => p.status === 'pending');
    const refundedPayments = allPayments.filter(p => p.status === 'refunded' || p.status === 'cancelled');
    
    const successRate = totalTransactions > 0 ? (successfulPayments.length / totalTransactions) * 100 : 0;
    const pendingAmount = pendingPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const refundedAmount = refundedPayments.reduce((sum, payment) => sum + payment.amount, 0);

    // Monthly revenue calculation with transactions count
    const monthlyData = allPayments.reduce((acc, payment) => {
      const date = new Date(payment.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!acc[monthKey]) {
        acc[monthKey] = { revenue: 0, transactions: 0 };
      }
      acc[monthKey].revenue += payment.amount;
      acc[monthKey].transactions += 1;
      return acc;
    }, {} as Record<string, { revenue: number; transactions: number }>);

    const monthlyRevenueArray = Object.entries(monthlyData)
      .map(([month, data]) => ({ month, revenue: data.revenue, transactions: data.transactions }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12); // Last 12 months

    // Payment method breakdown with all required fields
    const paymentMethodData = allPayments.reduce((acc, payment) => {
      const method = payment.paymentMethod || 'unknown';
      if (!acc[method]) {
        acc[method] = { count: 0, amount: 0 };
      }
      acc[method].count += 1;
      acc[method].amount += payment.amount;
      return acc;
    }, {} as Record<string, { count: number; amount: number }>);

    const paymentMethodArray = Object.entries(paymentMethodData)
      .map(([method, data]) => ({
        method,
        count: data.count,
        amount: data.amount,
        percentage: totalRevenue > 0 ? (data.amount / totalRevenue) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount);

    // Top customers with correct property names
    const customerSpending = allPayments.reduce((acc, payment) => {
      const customerKey = payment.customerEmail || payment.customerName;
      if (!acc[customerKey]) {
        acc[customerKey] = { 
          customerId: payment.customerId, 
          customerName: payment.customerName, 
          totalSpent: 0, 
          transactionCount: 0 
        };
      }
      acc[customerKey].totalSpent += payment.amount;
      acc[customerKey].transactionCount += 1;
      return acc;
    }, {} as Record<string, { customerId: string; customerName: string; totalSpent: number; transactionCount: number }>);

    const topCustomers = Object.values(customerSpending)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    // Calculate revenue growth
    const currentDate = new Date();
    const currentMonthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    const previousMonthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth()).padStart(2, '0')}`;
    
    const currentMonth = monthlyData[currentMonthKey]?.revenue || 0;
    const previousMonth = monthlyData[previousMonthKey]?.revenue || 0;
    const growthPercentage = previousMonth > 0 ? ((currentMonth - previousMonth) / previousMonth) * 100 : 0;

    // Transaction trends (simplified implementation)
    const transactionTrends = {
      daily: [],
      weekly: [],
      monthly: monthlyRevenueArray.map(item => ({
        month: item.month,
        count: item.transactions,
        amount: item.revenue
      }))
    };

    return {
      totalRevenue,
      totalTransactions,
      averageTransactionValue,
      successRate,
      pendingAmount,
      refundedAmount,
      monthlyRevenue: monthlyRevenueArray,
      paymentMethodBreakdown: paymentMethodArray,
      recentTransactions: allPayments
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10),
      topCustomers,
      revenueGrowth: {
        currentMonth,
        previousMonth,
        growthPercentage
      },
      transactionTrends
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

  const exportToCSV = () => {
    const headers = [
      'Transaction ID',
      'Order ID', 
      'Customer Name',
      'Customer Email',
      'Amount (Earnings)',
      'Currency',
      'Payment Method',
      'Status',
      'Gateway',
      'Gateway Transaction ID',
      'Description',
      'Created At',
      'Updated At'
    ];

    const csvData = allPayments.map(payment => [
      payment.transactionId,
      payment.orderId,
      payment.customerName,
      payment.customerEmail,
      payment.amount,
      payment.currency,
      payment.paymentMethod,
      payment.status,
      payment.gateway,
      payment.gatewayTransactionId || '',
      payment.description,
      new Date(payment.createdAt).toLocaleString(),
      new Date(payment.updatedAt).toLocaleString()
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      
      // Generate filename with date range info
      let filename = 'vendor_earnings_export';
      if (selectedPeriod === 'custom' && startDate && endDate) {
        filename += `_${format(startDate, 'yyyy-MM-dd')}_to_${format(endDate, 'yyyy-MM-dd')}`;
      } else if (selectedPeriod !== 'all') {
        filename += `_${selectedPeriod}`;
      }
      filename += `_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.csv`;
      
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
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
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Vendor Payment Analytics</h2>
          <p className="text-muted-foreground">
            Your earnings and transaction analytics
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={(value) => {
            setSelectedPeriod(value);
            if (value !== 'custom') {
              setStartDate(undefined);
              setEndDate(undefined);
            }
          }}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>

          {selectedPeriod === 'custom' && (
            <>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[140px] justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[140px] justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "End date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) => startDate ? date < startDate : false}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </>
          )}

          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              After commission deduction
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
            <CardTitle className="text-sm font-medium">Avg. Earnings per Order</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics.averageTransactionValue)}</div>
            <p className="text-xs text-muted-foreground">
              After commission deduction
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
                      <p className="font-medium">{customer.customerName}</p>
                      <p className="text-sm text-muted-foreground">{customer.customerId}</p>
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
