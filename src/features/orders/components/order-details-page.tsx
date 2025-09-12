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
  Calendar,
  CreditCard,
  History,
  XCircle,
  AlertTriangle,
  Edit,
  Trash2,
  Download,
  CheckCircle,
  XCircle,
  ExternalLink,
  Truck,
  MapPinIcon,
  Clock,
  Info
} from 'lucide-react';
import { Order } from '../utils/form-schema';
import { getAllOrders, deleteCustomerOrder, updateCustomerOrder } from '@/lib/firebase-orders';
import { OrderManagementService } from '@/lib/order-management-service';
import Image from 'next/image';

interface OrderDetailsPageProps {
  orderId: string;
}

export function OrderDetailsPage({ orderId }: OrderDetailsPageProps) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approvingOrder, setApprovingOrder] = useState(false);
  const [cancellingOrder, setCancellingOrder] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const orders = await getAllOrders();
        const foundOrder = orders.find(o => o.orderId === orderId || o.id === orderId);
        
        if (foundOrder) {
          setOrder(foundOrder);
        } else {
          setError('Order not found');
        }
      } catch (err) {
        setError('Failed to fetch order details');
        console.error('Error fetching order:', err);
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const handleDelete = async () => {
    if (!order) return;
    
    if (confirm('Are you sure you want to delete this order?')) {
      try {
        await deleteCustomerOrder(order.userId, order.orderId);
        router.push('/dashboard/orders');
      } catch (error) {
        console.error('Error deleting order:', error);
        alert('Failed to delete order. Please try again.');
      }
    }
  };

  const handleDownloadInvoice = async () => {
    // TODO: Implement invoice download functionality
    alert('Invoice download functionality will be implemented soon.');
  };

  const handleApproveOrder = async () => {
    if (!order) return;
    
    if (confirm('Are you sure you want to approve this order? This will:\n\n• Confirm the order\n• Reduce product stock\n• Create shipping label (if Shiprocket is configured)\n• Send confirmation email to customer')) {
      try {
        setApprovingOrder(true);
        
        // Use the comprehensive order management service
        const result = await OrderManagementService.confirmOrder(order);
        
        if (result.success) {
          // Refresh the order data
          const orders = await getAllOrders();
          const updatedOrder = orders.find(o => o.orderId === order.orderId || o.id === order.orderId);
          if (updatedOrder) {
            setOrder(updatedOrder);
          }
          
          // Show detailed success message
          let successMessage = 'Order approved successfully!';
          const details = [];
          
          if (result.stockReduced) {
            details.push(`✓ Stock reduced for ${result.stockResult?.updatedProducts.length || 0} products`);
          }
          if (result.shiprocketCreated) {
            details.push(`✓ Shipping label created (AWB: ${result.shiprocketData?.awb_code || 'N/A'})`);
          }
          if (result.emailSent) {
            details.push('✓ Confirmation email sent to customer');
          }
          
          if (details.length > 0) {
            successMessage += '\n\n' + details.join('\n');
          }
          
          if (result.warnings.length > 0) {
            successMessage += '\n\nWarnings:\n' + result.warnings.map(w => `⚠ ${w}`).join('\n');
          }
          
          alert(successMessage);
        } else {
          // Show error details
          let errorMessage = 'Order approval failed:';
          errorMessage += '\n\n' + result.errors.map(e => `✗ ${e}`).join('\n');
          
          if (result.warnings.length > 0) {
            errorMessage += '\n\nWarnings:\n' + result.warnings.map(w => `⚠ ${w}`).join('\n');
          }
          
          alert(errorMessage);
        }
      } catch (error) {
        console.error('Error approving order:', error);
        alert('Failed to approve order. Please try again.\n\nError: ' + (error instanceof Error ? error.message : 'Unknown error'));
      } finally {
        setApprovingOrder(false);
      }
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;
    
    if (!confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
      return;
    }
    
    setCancellingOrder(true);
    try {
      // Update order status to cancelled in Firebase
      const { updateCustomerOrder } = await import('@/lib/firebase-orders');
      
      const cancelledOrder = {
        ...order,
        orderStatus: 'cancelled' as const,
        updatedAt: new Date().toISOString(),
        cancellationReason: 'Cancelled by admin',
        cancelledAt: new Date().toISOString()
      };
      
      await updateCustomerOrder(order.userId, order.orderId, cancelledOrder);
      
      // Update local state
      setOrder(cancelledOrder);
      
      alert('Order cancelled successfully!');
    } catch (error) {
      console.error('Failed to cancel order:', error);
      alert('Failed to cancel order. Please try again.');
    } finally {
      setCancellingOrder(false);
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
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const getPaymentStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: 'secondary',
      completed: 'default',
      failed: 'destructive',
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-32 bg-muted animate-pulse rounded" />
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-48 w-full bg-muted animate-pulse rounded" />
            <div className="h-32 w-full bg-muted animate-pulse rounded" />
            <div className="h-64 w-full bg-muted animate-pulse rounded" />
          </div>
          <div className="space-y-6">
            <div className="h-32 w-full bg-muted animate-pulse rounded" />
            <div className="h-48 w-full bg-muted animate-pulse rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div>
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/orders')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Button>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <XCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Order Not Found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {error || 'The order you are looking for does not exist or may have been deleted.'}
            </p>
            <Button onClick={() => router.push('/dashboard/orders')}>
              Return to Orders
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/orders')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Order Details</h1>
            <p className="text-muted-foreground">Order ID: {order.orderId}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {order.orderStatus === 'pending' && (
            <>
              <Button 
                onClick={handleApproveOrder}
                disabled={approvingOrder}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {approvingOrder ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Approving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve Order
                  </>
                )}
              </Button>
              <Button 
                onClick={handleCancelOrder}
                disabled={cancellingOrder}
                variant="destructive"
              >
                {cancellingOrder ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Cancelling...
                  </>
                ) : (
                  <>
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancel Order
                  </>
                )}
              </Button>
            </>
          )}
          <Button variant="outline" onClick={handleDownloadInvoice}>
            <Download className="mr-2 h-4 w-4" />
            Download Invoice
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6 min-h-0">
          {/* Order Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Status</div>
                  <div className="mt-1">{getStatusBadge(order.orderStatus || 'pending')}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Payment Status</div>
                  <div className="mt-1">{getPaymentStatusBadge(order.paymentStatus || 'pending')}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Total</div>
                  <div className="font-semibold text-lg">₹{(order.total || 0).toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Created</div>
                  <div className="text-sm">
                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{order.userEmail || 'N/A'}</span>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-2">User ID</div>
                  <div className="text-sm font-mono">{order.userId || 'N/A'}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Delivery Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              {order.address ? (
                <div className="text-sm space-y-2">
                  <div className="font-medium">
                    {order.address.firstName && order.address.lastName 
                      ? `${order.address.firstName} ${order.address.lastName}`
                      : order.address.addressName || 'N/A'
                    }
                  </div>
                  {order.address.phone && (
                    <div className="text-muted-foreground">
                      Phone: {order.address.phone}
                    </div>
                  )}
                  <div>
                    {order.address.streetAddress || order.address.street || 'N/A'}
                  </div>
                  <div>
                    {order.address.city || 'N/A'}, {order.address.state || 'N/A'}
                  </div>
                  <div>
                    {order.address.zip || order.address.postalCode || 'N/A'}
                  </div>
                  <div>{order.address.country || 'N/A'}</div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No address information available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Items ({order.items?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!order.items || order.items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <div>No items found</div>
                </div>
              ) : (
                <div className="space-y-4">
                  {order.items.map((item, index) => {
                    // The item already contains all the product details from the database
                    // item structure: { id, name, price, salePrice, quantity, thumbImage }
                    const itemTotal = (item.salePrice || item.price || 0) * (item.quantity || 0);
                    
                    return (
                      <div 
                        key={index} 
                        className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => {
                          if (item.id) {
                            router.push(`/dashboard/product/${item.id}`);
                          }
                        }}
                      >
                        {/* Product Image */}
                        <div className="w-16 h-16 relative flex-shrink-0 bg-muted rounded-md overflow-hidden">
                          {item.thumbImage && Array.isArray(item.thumbImage) && item.thumbImage.length > 0 ? (
                            <Image
                              src={item.thumbImage[0]}
                              alt={item.name || 'Product'}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          ) : item.thumbImage && typeof item.thumbImage === 'string' ? (
                            <Image
                              src={item.thumbImage}
                              alt={item.name || 'Product'}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        
                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="font-medium truncate">
                              {item.name || 'Unknown Product'}
                            </div>
                            <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            Product ID: {item.id}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            ₹{(item.salePrice || item.price || 0).toFixed(2)} × {item.quantity || 0}
                          </div>
                          {item.salePrice && item.price && item.salePrice < item.price && (
                            <div className="text-xs text-green-600 mt-1">
                              Sale Price: ₹{item.salePrice.toFixed(2)} (was ₹{item.price.toFixed(2)})
                            </div>
                          )}
                        </div>
                        
                        {/* Price */}
                        <div className="font-semibold text-lg flex-shrink-0">
                          ₹{itemTotal.toFixed(2)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6 min-h-0">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{(order.subtotal || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>₹{(order.shipping || 0).toFixed(2)}</span>
                </div>
                {(order.discount || 0) > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-₹{(order.discount || 0).toFixed(2)}</span>
                  </div>
                )}
                {order.couponCode && (
                  <div className="flex justify-between text-blue-600">
                    <span>Coupon ({order.couponCode})</span>
                    <span>Applied</span>
                  </div>
                )}
                <hr />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>₹{(order.total || 0).toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Payment Method</div>
                <div className="font-medium capitalize">
                  {order.paymentMethod ? order.paymentMethod.replace('-', ' ') : 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Payment Status</div>
                <div className="mt-1">{getPaymentStatusBadge(order.paymentStatus || 'pending')}</div>
              </div>
              {order.razorpayPaymentId && (
                <div>
                  <div className="text-sm text-muted-foreground">Razorpay Payment ID</div>
                  <div className="text-sm font-mono break-all">{order.razorpayPaymentId}</div>
                </div>
              )}
              {order.razorpayOrderId && (
                <div>
                  <div className="text-sm text-muted-foreground">Razorpay Order ID</div>
                  <div className="text-sm font-mono break-all">{order.razorpayOrderId}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Shipping & Tracking Information */}
          {(order.orderStatus === 'shipped' || order.orderStatus === 'confirmed' || order.awbCode || order.shiprocketOrderId) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Shipping & Tracking
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.awbCode && (
                  <div>
                    <div className="text-sm text-muted-foreground">AWB Code</div>
                    <div className="font-mono text-lg font-semibold text-primary">{order.awbCode}</div>
                  </div>
                )}
                
                {order.courierName && (
                  <div>
                    <div className="text-sm text-muted-foreground">Courier Partner</div>
                    <div className="font-medium">{order.courierName}</div>
                  </div>
                )}
                
                {order.shiprocketOrderId && (
                  <div>
                    <div className="text-sm text-muted-foreground">Shiprocket Order ID</div>
                    <div className="font-mono text-sm">{order.shiprocketOrderId}</div>
                  </div>
                )}
                
                {order.shiprocketShipmentId && (
                  <div>
                    <div className="text-sm text-muted-foreground">Shipment ID</div>
                    <div className="font-mono text-sm">{order.shiprocketShipmentId}</div>
                  </div>
                )}
                
                {order.awbCode && (
                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`https://shiprocket.co/tracking/${order.awbCode}`, '_blank')}
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Track Package
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(order.awbCode || '');
                        // You could add a toast notification here
                      }}
                      className="flex items-center gap-2"
                    >
                      <Info className="h-4 w-4" />
                      Copy AWB
                    </Button>
                  </div>
                )}
                
                {!order.awbCode && (order.orderStatus === 'confirmed' || order.shiprocketOrderId) && (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Clock className="h-4 w-4" />
                    <span>Shipping label will be generated soon</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

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
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <div className="flex-1">
                    <div className="font-medium">Order Created</div>
                    <div className="text-sm text-muted-foreground">
                      {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-muted rounded-full mt-2"></div>
                  <div className="flex-1">
                    <div className="font-medium">Last Updated</div>
                    <div className="text-sm text-muted-foreground">
                      {order.updatedAt ? new Date(order.updatedAt).toLocaleString() : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          {order.orderNote && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Order Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{order.orderNote}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
