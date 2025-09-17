'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  User, 
  Mail, 
  MapPin, 
  Package, 
  DollarSign,
  CreditCard,
  History,
  XCircle,
  AlertTriangle,
  Trash2,
  CheckCircle,
  ExternalLink,
  Truck,
  Clock,
  Info,
  Store
} from 'lucide-react';
import { Order } from '../utils/form-schema';
import { getAllOrders, deleteCustomerOrder } from '@/lib/firebase-orders';
import { OrderManagementService } from '@/lib/order-management-service';
import { StockService } from '@/lib/stock-service';
import { getCurrentUser } from '@/lib/auth';
import Image from 'next/image';

interface VendorOrderDetailsPageProps {
  orderId: string;
}

export function VendorOrderDetailsPage({ orderId }: VendorOrderDetailsPageProps) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approvingOrder, setApprovingOrder] = useState(false);
  const [cancellingOrder, setCancellingOrder] = useState(false);
  const [refundingOrder, setRefundingOrder] = useState(false);
  const [currentVendor, setCurrentVendor] = useState<any>(null);

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentVendor(user);
  }, []);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const orders = await getAllOrders();
        const foundOrder = orders.find(o => o.orderId === orderId);
        
        if (!foundOrder) {
          setError('Order not found');
          return;
        }

        // Check if this order belongs to the current vendor
        const belongsToVendor = foundOrder.vendor === currentVendor?.uniqueId || 
          foundOrder.items?.some(item => item.vendor === currentVendor?.uniqueId);

        if (!belongsToVendor) {
          setError('You do not have permission to view this order');
          return;
        }

        setOrder(foundOrder);
      } catch (err) {
        setError('Failed to fetch order details');
        console.error('Error fetching order:', err);
      } finally {
        setLoading(false);
      }
    };

    if (currentVendor) {
      fetchOrder();
    }
  }, [orderId, currentVendor]);

  const handleApproveOrder = async () => {
    if (!order) return;
    
    setApprovingOrder(true);
    try {
      await OrderManagementService.confirmOrder(order);
      // Refresh the order data
      const orders = await getAllOrders();
      const updatedOrder = orders.find(o => o.orderId === orderId);
      if (updatedOrder) {
        setOrder(updatedOrder);
      }
    } catch (error) {
      console.error('Error approving order:', error);
    } finally {
      setApprovingOrder(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;
    
    const reason = prompt('Please enter the reason for cancellation:');
    if (!reason) return;
    
    setCancellingOrder(true);
    try {
      await OrderManagementService.cancelOrder(order, reason);
      // Refresh the order data
      const orders = await getAllOrders();
      const updatedOrder = orders.find(o => o.orderId === orderId);
      if (updatedOrder) {
        setOrder(updatedOrder);
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
    } finally {
      setCancellingOrder(false);
    }
  };

  const handleRefundOrder = async () => {
    if (!order) return;
    
    if (!confirm('Are you sure you want to process a refund for this order?')) {
      return;
    }
    
    setRefundingOrder(true);
    try {
      await OrderManagementService.processRefund(order);
      // Refresh the order data
      const orders = await getAllOrders();
      const updatedOrder = orders.find(o => o.orderId === orderId);
      if (updatedOrder) {
        setOrder(updatedOrder);
      }
    } catch (error) {
      console.error('Error processing refund:', error);
    } finally {
      setRefundingOrder(false);
    }
  };

  const handleDeleteOrder = async () => {
    if (!order) return;
    
    if (!confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      return;
    }
    
    try {
      await deleteCustomerOrder(order.orderId);
      router.push('/dashboard/my-orders');
    } catch (error) {
      console.error('Error deleting order:', error);
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
          <p className="text-muted-foreground">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => router.push('/dashboard/my-orders')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Order Not Found</h3>
          <p className="text-muted-foreground mb-4">The order you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/dashboard/my-orders')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/my-orders')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Order Details</h1>
            <p className="text-muted-foreground">Order ID: {order.orderId}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusBadge(order.orderStatus)}
          {getPaymentStatusBadge(order.paymentStatus)}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-2">
        {order.orderStatus === 'pending' && (
          <Button
            onClick={handleApproveOrder}
            disabled={approvingOrder}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            {approvingOrder ? 'Approving...' : 'Approve Order'}
          </Button>
        )}
        
        {(order.orderStatus === 'pending' || order.orderStatus === 'confirmed' || order.orderStatus === 'shipped' || order.orderStatus === 'delivered') && (
          <Button
            onClick={handleCancelOrder}
            disabled={cancellingOrder}
            variant="destructive"
          >
            <XCircle className="mr-2 h-4 w-4" />
            {cancellingOrder ? 'Cancelling...' : 'Cancel Order'}
          </Button>
        )}

        {(order.orderStatus === 'pending' || order.orderStatus === 'confirmed' || order.orderStatus === 'shipped' || order.orderStatus === 'delivered') && (
          <Button
            onClick={handleRefundOrder}
            disabled={refundingOrder}
            className="bg-orange-800 hover:bg-orange-900 text-white"
          >
            <XCircle className="mr-2 h-4 w-4" />
            {refundingOrder ? 'Refunding...' : 'Refund'}
          </Button>
        )}

        {order.orderStatus === 'refunded' && (
          <Button
            onClick={handleCancelOrder}
            disabled={cancellingOrder}
            variant="destructive"
          >
            <XCircle className="mr-2 h-4 w-4" />
            {cancellingOrder ? 'Cancelling...' : 'Cancel Order'}
          </Button>
        )}

        <Button
          onClick={handleDeleteOrder}
          variant="destructive"
          size="sm"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{order.userEmail}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {order.address?.firstName} {order.address?.lastName}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{order.address?.phone}</span>
            </div>
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Order Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Subtotal:</span>
              <span className="text-sm">₹{order.subtotal?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Discount:</span>
              <span className="text-sm">₹{order.discount?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Shipping:</span>
              <span className="text-sm">₹{order.shipping?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex justify-between font-semibold pt-2 border-t">
              <span>Total:</span>
              <span>₹{order.total?.toFixed(2) || '0.00'}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shipping Address */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Shipping Address
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-1">
            <div>{order.address?.firstName} {order.address?.lastName}</div>
            <div>{order.address?.streetAddress}</div>
            <div>{order.address?.city}, {order.address?.state} {order.address?.zip}</div>
            <div>{order.address?.country}</div>
            <div>Phone: {order.address?.phone}</div>
          </div>
        </CardContent>
      </Card>

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Order Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {order.items?.map((item, index) => (
              <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                <div className="flex-shrink-0">
                  {item.thumbImage && item.thumbImage.length > 0 ? (
                    <Image
                      src={item.thumbImage[0]}
                      alt={item.name}
                      width={60}
                      height={60}
                      className="rounded-md object-cover"
                    />
                  ) : (
                    <div className="w-15 h-15 bg-muted rounded-md flex items-center justify-center">
                      <Package className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm">{item.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    Price: ₹{item.price?.toFixed(2) || '0.00'} | 
                    Quantity: {item.quantity} | 
                    Total: ₹{(item.total || (item.price * item.quantity))?.toFixed(2) || '0.00'}
                  </p>
                  {item.selectedSize && (
                    <p className="text-xs text-muted-foreground">Size: {item.selectedSize}</p>
                  )}
                  {item.selectedColor && (
                    <p className="text-xs text-muted-foreground">Color: {item.selectedColor}</p>
                  )}
                </div>
              </div>
            )) || []}
          </div>
        </CardContent>
      </Card>

      {/* Order Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Order Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium">Order Placed</p>
                <p className="text-xs text-muted-foreground">
                  {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}
                </p>
              </div>
            </div>
            {order.orderStatus !== 'pending' && (
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium">Order Confirmed</p>
                  <p className="text-xs text-muted-foreground">
                    {order.updatedAt ? new Date(order.updatedAt).toLocaleString() : 'N/A'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
