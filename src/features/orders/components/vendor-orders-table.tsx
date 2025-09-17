'use client';

import React from 'react';
import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Trash2,
  ShoppingCart,
  User,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useOrders } from '@/hooks/use-orders';
import { updateCustomerOrder, deleteCustomerOrder } from '@/lib/firebase-orders';
import { VendorCancelOrderDialog } from './vendor-cancel-order-dialog';
import { VendorConfirmOrderDialog } from './vendor-confirm-order-dialog';
import { type Order, type OrderSummary } from '../utils/form-schema';
import { EmailService } from '@/lib/email-service';
import { OrderActionManager } from '../utils/order-actions';
import { getCurrentUser } from '@/lib/auth';

export function VendorOrdersTable() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>('all');
  const [approvingOrder, setApprovingOrder] = useState<string | null>(null);
  const [rejectingOrder, setRejectingOrder] = useState<string | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedOrderForAction, setSelectedOrderForAction] = useState<Order | null>(null);
  const [currentVendor, setCurrentVendor] = useState<any>(null);

  const { orders: allOrders, loading, refetch } = useOrders();

  // Get current vendor from localStorage
  useEffect(() => {
    const user = getCurrentUser();
    setCurrentVendor(user);
  }, []);

  // Filter orders for current vendor only
  const orders = useMemo(() => {
    if (!currentVendor || !allOrders) return [];
    
    return allOrders.filter(order => {
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
  }, [allOrders, currentVendor]);

  const filteredOrders = useMemo(() => {
    if (!orders) return [];

    return orders.filter(order => {
      const matchesSearch = 
        order.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.address?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.address?.lastName?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = selectedStatus === 'all' || order.orderStatus === selectedStatus;
      const matchesPaymentStatus = selectedPaymentStatus === 'all' || 
        (selectedPaymentStatus === 'refund' ? order.orderStatus === 'refunded' : order.paymentStatus === selectedPaymentStatus);

      return matchesSearch && matchesStatus && matchesPaymentStatus;
    });
  }, [orders, searchQuery, selectedStatus, selectedPaymentStatus]);

  const orderSummary: OrderSummary = useMemo(() => {
    if (!orders) return { totalOrders: 0, totalRevenue: 0, averageOrderValue: 0, customerStats: { topCustomer: '', totalSpent: 0 } };

    const validOrders = orders.filter(order => 
      order.orderStatus === 'confirmed'
    );

    const totalOrders = orders.length;
    const totalRevenue = validOrders.reduce((sum, order) => sum + (order.total || 0), 0);
    const averageOrderValue = validOrders.length > 0 ? totalRevenue / validOrders.length : 0;

    // Find top customer
    const customerSpending = validOrders.reduce((acc, order) => {
      const customerKey = order.userEmail || 'Unknown';
      acc[customerKey] = (acc[customerKey] || 0) + (order.total || 0);
      return acc;
    }, {} as Record<string, number>);

    const topCustomer = Object.entries(customerSpending).reduce((max, [customer, spent]) => 
      spent > max.spent ? { customer, spent } : max, 
      { customer: '', spent: 0 }
    );

    return {
      totalOrders,
      totalRevenue,
      averageOrderValue,
      customerStats: {
        topCustomer: topCustomer.customer,
        totalSpent: topCustomer.spent
      }
    };
  }, [orders]);

  const handleViewOrder = (order: Order) => {
    router.push(`/dashboard/my-orders/${order.orderId}`);
  };

  const handleDeleteOrder = async (order: Order) => {
    if (!confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteCustomerOrder(order.orderId);
      refetch();
    } catch (error) {
      // console.error('Error deleting order:', error);
    }
  };

  const handleApproveOrder = async (order: Order) => {
    setApprovingOrder(order.orderId);
    try {
      await OrderActionManager.confirmOrder(order);
      refetch();
    } catch (error) {
      // console.error('Error approving order:', error);
    } finally {
      setApprovingOrder(null);
    }
  };

  const handleCancelOrder = async (order: Order, reason: string) => {
    try {
      await OrderActionManager.cancelOrder(order, reason);
      refetch();
    } catch (error) {
      // console.error('Error cancelling order:', error);
    }
  };

  const handleRefundOrder = async (order: Order) => {
    try {
      await OrderActionManager.processRefund(order);
      refetch();
    } catch (error) {
      // console.error('Error processing refund:', error);
    }
  };


  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pending', className: 'bg-orange-500 text-white hover:bg-orange-600' },
      confirmed: { label: 'Confirmed', className: 'bg-blue-100 text-blue-800 hover:bg-blue-200' },
      processing: { label: 'Processing', className: 'bg-blue-100 text-blue-800 hover:bg-blue-200' },
      shipped: { label: 'Shipped', className: 'bg-blue-100 text-blue-800 hover:bg-blue-200' },
      delivered: { label: 'Delivered', className: 'bg-blue-100 text-blue-800 hover:bg-blue-200' },
      cancelled: { label: 'Cancelled', className: 'destructive' },
      returned: { label: 'Returned', className: 'destructive' },
      refunded: { label: 'Refunded', className: 'destructive' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, className: 'secondary' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
      completed: { label: 'Completed', className: 'bg-green-100 text-green-800' },
      failed: { label: 'Failed', className: 'destructive' },
      refunded: { label: 'Refunded', className: 'destructive' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, className: 'secondary' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (!currentVendor) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-muted-foreground">Please sign in to view your orders</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderSummary.totalOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{orderSummary.totalRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{orderSummary.averageOrderValue.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Customer</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">{orderSummary.customerStats.topCustomer || 'N/A'}</div>
            <p className="text-xs text-muted-foreground">
              ₹{orderSummary.customerStats.totalSpent.toLocaleString()} spent
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
          <CardDescription>
            Manage and track all your orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Order Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="returned">Returned</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedPaymentStatus} onValueChange={setSelectedPaymentStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="refund">Refund</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Orders Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex flex-col items-center space-y-2">
                        <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">No orders found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order.orderId}>
                      <TableCell className="font-medium">{order.orderId}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {order.address?.firstName} {order.address?.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">{order.userEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {order.items?.length || 0} item(s)
                        </div>
                      </TableCell>
                      <TableCell>₹{order.total?.toLocaleString() || '0'}</TableCell>
                      <TableCell>{getStatusBadge(order.orderStatus)}</TableCell>
                      <TableCell>{getPaymentStatusBadge(order.paymentStatus)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleViewOrder(order)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {order.orderStatus === 'pending' && (
                              <DropdownMenuItem onClick={() => handleApproveOrder(order)}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Approve Order
                              </DropdownMenuItem>
                            )}
                            {(order.orderStatus === 'pending' || order.orderStatus === 'confirmed' || order.orderStatus === 'shipped' || order.orderStatus === 'delivered') && (
                              <DropdownMenuItem onClick={() => handleCancelOrder(order, 'Order cancelled by admin')}>
                                <XCircle className="mr-2 h-4 w-4" />
                                Cancel Order
                              </DropdownMenuItem>
                            )}
                            {(order.orderStatus === 'pending' || order.orderStatus === 'confirmed' || order.orderStatus === 'shipped' || order.orderStatus === 'delivered') && (
                              <DropdownMenuItem onClick={() => handleRefundOrder(order)}>
                                <XCircle className="mr-2 h-4 w-4" />
                                Refund
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDeleteOrder(order)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <VendorCancelOrderDialog
        isOpen={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        order={selectedOrderForAction}
        onConfirm={handleCancelOrder}
      />
      <VendorConfirmOrderDialog
        isOpen={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        order={selectedOrderForAction}
        onConfirm={handleApproveOrder}
      />
    </div>
  );
}
