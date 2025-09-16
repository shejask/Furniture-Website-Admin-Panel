'use client';

import React from 'react';
import { useState, useMemo } from 'react';
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
  Download,
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
import { CancelOrderDialog } from './cancel-order-dialog';
import { ConfirmOrderDialog } from './confirm-order-dialog';
import { type Order, type OrderSummary } from '../utils/form-schema';
import { EmailService } from '@/lib/email-service';
import { InvoiceGenerator } from '@/lib/invoice-generator';
import { OrderActionManager } from '../utils/order-actions';


export function OrdersTable() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>('all');
  const [approvingOrder, setApprovingOrder] = useState<string | null>(null);
  const [rejectingOrder, setRejectingOrder] = useState<string | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedOrderForAction, setSelectedOrderForAction] = useState<Order | null>(null);

  const { orders: allOrders, loading, refetch } = useOrders();

  const filteredOrders = useMemo(() => {
    let filtered = allOrders;

    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter((order) => {
        return (
          order.orderId?.toLowerCase().includes(searchLower) ||
          order.userEmail?.toLowerCase().includes(searchLower) ||
          order.orderStatus?.toLowerCase().includes(searchLower) ||
          order.paymentStatus?.toLowerCase().includes(searchLower)
        );
      });
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter((order) => order.orderStatus === selectedStatus);
    }

    // Payment status filter
    if (selectedPaymentStatus !== 'all') {
      if (selectedPaymentStatus === 'failed') {
        // Filter for refunded orders when "Refund" is selected
        filtered = filtered.filter((order) => order.orderStatus === 'refunded');
      } else {
        filtered = filtered.filter((order) => order.paymentStatus === selectedPaymentStatus);
      }
    }

    // Sort by creation date (newest first)
    filtered.sort((a, b) => {
      const aDate = new Date(a.createdAt || 0);
      const bDate = new Date(b.createdAt || 0);
      return bDate.getTime() - aDate.getTime();
    });

    return filtered;
  }, [allOrders, searchQuery, selectedStatus, selectedPaymentStatus]);

  const orderSummary: OrderSummary = useMemo(() => {
    const totalOrders = allOrders.length;
    // Exclude refunded and cancelled orders from revenue calculation
    const validOrders = allOrders.filter(order => 
      order.orderStatus !== 'refunded' && order.orderStatus !== 'cancelled'
    );
    const totalRevenue = validOrders.reduce((sum, order) => sum + order.total, 0);
    const averageOrderValue = validOrders.length > 0 ? totalRevenue / validOrders.length : 0;
    const pendingOrders = allOrders.filter(order => order.orderStatus === 'pending').length;
    const completedOrders = allOrders.filter(order => order.orderStatus === 'delivered').length;
    const cancelledOrders = allOrders.filter(order => order.orderStatus === 'cancelled').length;

    // Find top customer (exclude refunded and cancelled orders)
    const customerStats = validOrders.reduce((acc, order) => {
      if (!acc[order.userId]) {
        acc[order.userId] = {
          customerId: order.userId,
          customerName: order.userEmail, // Using email as name for now
          orderCount: 0,
          totalSpent: 0,
        };
      }
      acc[order.userId].orderCount++;
      acc[order.userId].totalSpent += order.total;
      return acc;
    }, {} as Record<string, { customerId: string; customerName: string; orderCount: number; totalSpent: number }>);

    const topCustomer = Object.values(customerStats).sort((a, b) => b.totalSpent - a.totalSpent)[0];

    return {
      totalOrders,
      totalRevenue,
      averageOrderValue,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      topCustomer,
    };
  }, [allOrders]);



  const handleDelete = async (order: Order) => {
    if (confirm('Are you sure you want to delete this order?')) {
      try {
        await deleteCustomerOrder(order.userId, order.orderId);
        refetch(); // Refresh the orders list
      } catch (error) {
        // console.error('Error deleting order:', error);
        alert('Failed to delete order. Please try again.');
      }
    }
  };

  const handleViewDetails = (order: Order) => {
    router.push(`/dashboard/orders/${order.orderId}`);
  };

  const handleApproveOrder = async (order: Order) => {
    if (confirm('Are you sure you want to approve this order? This will confirm the order, reduce stock, and send confirmation email.')) {
      try {
        setApprovingOrder(order.id);
        const { OrderManagementService } = await import('@/lib/order-management-service');
        const result = await OrderManagementService.confirmOrder(order);
        
        if (result.success) {
          refetch(); // Refresh the orders list
          alert('Order approved successfully!');
        } else {
          alert(`Failed to approve order: ${result.errors.join(', ')}`);
        }
      } catch (error) {
        // console.error('Error approving order:', error);
        alert('Failed to approve order. Please try again.');
      } finally {
        setApprovingOrder(null);
      }
    }
  };

  const handleShowConfirmDialog = (order: Order) => {
    setSelectedOrderForAction(order);
    setConfirmDialogOpen(true);
  };

  const handleConfirmOrder = async (order: Order) => {
    if (!order) {
      alert('Invalid order data');
      return;
    }
    
    setApprovingOrder(order.id);
    try {
      // Use OrderActionManager to create the update
      // const orderUpdates = OrderActionManager.confirmOrder(order, {
      //   performedBy: 'admin', // In real app, get from auth context
      //   details: notes || 'Order confirmed and approved for processing'
      // });

      // Update order status to confirmed
      const updatedOrder = {
        ...order,
        orderStatus: 'confirmed' as const,
        updatedAt: new Date().toISOString()
      };

      // Update in Firebase using the new structure
      await updateCustomerOrder(order.userId, order.orderId, updatedOrder);
      
      // Refresh the orders list
      refetch();

      // Only proceed with email if customer email exists
      if (order.userEmail) {
        try {
          // Generate invoice HTML (simplified for now)
          const html = `<h1>Order Confirmed</h1><p>Your order ${order.orderId} has been confirmed.</p>`;
          
          // Try to send confirmation email
          const emailSent = await EmailService.sendCustomerOrderConfirmation(updatedOrder, Buffer.from(html));

          if (emailSent) {
            alert('Order confirmed successfully! Confirmation email sent to customer.');
          } else {
            alert('Order confirmed successfully! But failed to send confirmation email. Please check your SMTP settings in .env.local');
          }
        } catch (emailError) {
          alert('Order confirmed successfully! But failed to send confirmation email. Error: ' + (emailError instanceof Error ? emailError.message : 'Unknown error'));
        }
      } else {
        alert('Order confirmed successfully! No customer email available.');
      }
    } catch (error) {
      // More specific error message based on the error
      let errorMessage = 'Error confirming order. ';
      if (error instanceof Error) {
        if (error.message.includes('permission-denied')) {
          errorMessage += 'You do not have permission to perform this action.';
        } else if (error.message.includes('not-found')) {
          errorMessage += 'Order not found.';
        } else if (error.message.includes('network')) {
          errorMessage += 'Please check your internet connection.';
        } else {
          errorMessage += error.message;
        }
      } else {
        errorMessage += 'Please try again.';
      }
      
      alert(errorMessage);
    } finally {
      setApprovingOrder(null);
    }
  };

  const handleShowCancelDialog = (order: Order) => {
    setSelectedOrderForAction(order);
    setCancelDialogOpen(true);
  };

  const handleCancelOrder = async (order: Order, reason: string) => {
    if (!order) return;
    
    setRejectingOrder(order.id);
    try {
      // Use OrderActionManager to create the update
      // const orderUpdates = OrderActionManager.cancelOrder(order, {
      //   performedBy: 'admin', // In real app, get from auth context
      //   reason,
      //   details: additionalDetails
      // });

      // Update order status to cancelled
      const updatedOrder = {
        ...order,
        orderStatus: 'cancelled' as const,
        updatedAt: new Date().toISOString()
      };

      await updateCustomerOrder(order.userId, order.orderId, updatedOrder);
      
      // Refresh the orders list
      refetch();

      // Send cancellation email to customer
      if (order.userEmail) {
        try {
          const emailSent = await EmailService.sendOrderCancellationEmail(updatedOrder, reason);

          if (emailSent) {
            alert('Order cancelled successfully! Cancellation email sent to customer.');
          } else {
            alert('Order cancelled successfully! But failed to send cancellation email.');
          }
        } catch {
          alert('Order cancelled successfully! But failed to send cancellation email.');
        }
      } else {
        alert('Order cancelled successfully! No customer email available for notification.');
      }
    } catch {
      alert('Error cancelling order. Please try again.');
    } finally {
      setRejectingOrder(null);
    }
  };

  const handleDownloadInvoice = async (order: Order) => {
    try {
      // Convert Order to OrderData format
      const orderData = {
        orderNumber: order.orderId,
        customerName: order.address.firstName && order.address.lastName 
          ? `${order.address.firstName} ${order.address.lastName}` 
          : order.address.addressName || 'Customer',
        customerEmail: order.userEmail,
        customerPhone: order.address.phone || '',
        billingAddress: {
          street: order.address.streetAddress || '',
          city: order.address.city || '',
          state: order.address.state || '',
          country: order.address.country || '',
          postalCode: order.address.zip || '',
        },
        products: order.items.map(item => ({
          productName: item.name,
          price: item.salePrice || item.price,
          quantity: item.quantity,
          total: (item.salePrice || item.price) * item.quantity,
        })),
        subtotal: order.subtotal,
        tax: 0, // Add tax calculation if needed
        shipping: order.shipping,
        discount: order.discount,
        total: order.total,
        createdAt: order.createdAt,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
      };
      await InvoiceGenerator.downloadInvoice(orderData);
    } catch {
      alert('Failed to generate invoice. Please try again later.');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: 'secondary',
      confirmed: 'default',
      processing: 'default',
      shipped: 'default',
      delivered: 'default',
      cancelled: 'destructive',
      returned: 'destructive',
      refunded: 'destructive',
    };

    // Custom styling for pending (orange) and others (light blue)
    if (status === 'pending') {
      return (
        <Badge 
          variant="secondary" 
          className="bg-orange-500 text-white hover:bg-orange-600"
        >
          {status}
        </Badge>
      );
    } else if (status === 'cancelled' || status === 'returned' || status === 'refunded') {
      // Keep destructive styling for cancelled/returned/refunded
      return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
    } else {
      // Light blue for other statuses
      return (
        <Badge 
          variant="secondary" 
          className="bg-blue-100 text-blue-800 hover:bg-blue-200"
        >
          {status}
        </Badge>
      );
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: 'secondary',
      completed: 'default',
      failed: 'destructive',
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderSummary.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              +{orderSummary.pendingOrders} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{orderSummary.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Avg: ₹{orderSummary.averageOrderValue.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Orders</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderSummary.completedOrders}</div>
            <p className="text-xs text-muted-foreground">
              {orderSummary.cancelledOrders} cancelled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Customer</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {orderSummary.topCustomer?.customerName || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              ₹{orderSummary.topCustomer?.totalSpent.toFixed(2) || '0.00'} spent
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Actions Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
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
            </SelectContent>
          </Select>

          <Select value={selectedPaymentStatus} onValueChange={setSelectedPaymentStatus}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Payment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payment</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Refund</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={() => router.push('/dashboard/orders/add')}>
            <Plus className="mr-2 h-4 w-4" />
            Create Order
          </Button>
        </div>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
          <CardDescription>
            Manage customer orders and track their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading orders...</div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
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
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {searchQuery || selectedStatus !== 'all' || selectedPaymentStatus !== 'all' 
                          ? 'No orders found matching your filters.' 
                          : 'No orders found.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{order.orderId}</div>
                            <div className="text-sm text-muted-foreground">
                              {order.items.length} items
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{order.userEmail}</div>
                            <div className="text-sm text-muted-foreground">ID: {order.userId}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">₹{order.total.toFixed(2)}</div>
                          <div className="text-sm text-muted-foreground">
                            {order.paymentMethod.replace('-', ' ')}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(order.orderStatus)}
                        </TableCell>
                        <TableCell>
                          {getPaymentStatusBadge(order.paymentStatus)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(order.createdAt).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {OrderActionManager.canConfirmOrder(order) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleShowConfirmDialog(order)}
                                className="text-green-600 border-green-200 hover:bg-green-50"
                                disabled={approvingOrder === order.id}
                                title="Confirm Order"
                              >
                                {approvingOrder === order.id ? (
                                  <Clock className="h-4 w-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                            {OrderActionManager.canCancelOrder(order) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleShowCancelDialog(order)}
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                disabled={rejectingOrder === order.id}
                                title="Cancel Order"
                              >
                                {rejectingOrder === order.id ? (
                                  <Clock className="h-4 w-4 animate-spin" />
                                ) : (
                                  <XCircle className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(order)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                {OrderActionManager.canConfirmOrder(order) && (
                                  <DropdownMenuItem 
                                    onClick={() => handleShowConfirmDialog(order)}
                                    className="text-green-600"
                                  >
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Confirm Order
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => handleViewDetails(order)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleDownloadInvoice(order)}>
                                  <Download className="mr-2 h-4 w-4" />
                                  Download Invoice
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {order.orderStatus === 'pending' && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() => handleApproveOrder(order)}
                                      className="text-green-600"
                                    >
                                      <CheckCircle className="mr-2 h-4 w-4" />
                                      Approve Order
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleCancelOrder(order, 'Order cancelled by admin')}
                                      className="text-red-600"
                                    >
                                      <XCircle className="mr-2 h-4 w-4" />
                                      Cancel Order
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                  </>
                                )}
                                <DropdownMenuItem
                                  onClick={() => handleDelete(order)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Order
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Components */}
      <CancelOrderDialog
        order={selectedOrderForAction}
        isOpen={cancelDialogOpen}
        onClose={() => {
          setCancelDialogOpen(false);
          setSelectedOrderForAction(null);
        }}
        onConfirm={handleCancelOrder}
        isLoading={rejectingOrder === selectedOrderForAction?.id}
      />

      <ConfirmOrderDialog
        order={selectedOrderForAction}
        isOpen={confirmDialogOpen}
        onClose={() => {
          setConfirmDialogOpen(false);
          setSelectedOrderForAction(null);
        }}
        onConfirm={handleConfirmOrder}
        isLoading={approvingOrder === selectedOrderForAction?.id}
      />
    </div>
  );
} 