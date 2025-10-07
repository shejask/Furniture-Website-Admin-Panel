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
  History,
  XCircle,
  AlertTriangle,
  Trash2,
  CheckCircle,
  Truck,
  Clock
} from 'lucide-react';
import { Order } from '../utils/form-schema';
import { getAllOrders, deleteCustomerOrder } from '@/lib/firebase-orders';
import { OrderManagementService } from '@/lib/order-management-service';
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
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [trackingInfo, setTrackingInfo] = useState<{
    status?: string;
    statusCode?: number | string;
    courierName?: string;
    awbCode?: string | null;
    expectedDelivery?: string | null;
    checkpoints?: any[];
  } | null>(null);

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
      } finally {
        setLoading(false);
      }
    };

    if (currentVendor) {
      fetchOrder();
    }
  }, [orderId, currentVendor]);

  // Fetch Shiprocket tracking when identifiers exist
  useEffect(() => {
    const fetchTracking = async () => {
      if (!order) return;
      const shipmentId = (order as any).shiprocketShipmentId || undefined;
      const awb = (order as any).awbCode || undefined;
      if (!shipmentId && !awb) return;
      try {
        setTrackingLoading(true);
        setTrackingError(null);
        const params = new URLSearchParams();
        if (shipmentId) params.set('shipmentId', String(shipmentId));
        if (!shipmentId && awb) params.set('awb', String(awb));
        const res = await fetch(`/api/track-shiprocket?${params.toString()}`, { cache: 'no-store' });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Failed to fetch tracking');
        }
        setTrackingInfo(json.data || null);
      } catch (e) {
        setTrackingError(e instanceof Error ? e.message : 'Unknown error');
        setTrackingInfo(null);
      } finally {
        setTrackingLoading(false);
      }
    };
    fetchTracking();
  }, [order]);

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
      setError('Failed to approve order');
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
      setError('Failed to cancel order');
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
      // Use cancel order with refund reason since processRefund doesn't exist
      await OrderManagementService.cancelOrder(order, 'Order refunded by vendor');
      // Refresh the order data
      const orders = await getAllOrders();
      const updatedOrder = orders.find(o => o.orderId === orderId);
      if (updatedOrder) {
        setOrder(updatedOrder);
      }
    } catch (error) {
      setError('Failed to process refund');
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
      await deleteCustomerOrder(order.userId, order.orderId);
      router.push('/dashboard/my-orders');
    } catch (error) {
      setError('Failed to delete order');
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
          <p className="text-muted-foreground mb-4">The order you&apos;re looking for doesn&apos;t exist.</p>
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
        <div className="flex items-center space-x-6">
          <div className="text-right">
            <span className="text-xs text-muted-foreground">Order Status</span>
            <div className="mt-1">
              {getStatusBadge(order.orderStatus)}
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-muted-foreground">Payment Status</span>
            <div className="mt-1">
              {getPaymentStatusBadge(order.paymentStatus)}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-2">
        {/* {order.orderStatus === 'pending' && (
          <Button
            onClick={handleApproveOrder}
            disabled={approvingOrder}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            {approvingOrder ? 'Approving...' : 'Approve Order'}
          </Button>
        )}
         */}

         
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
            <div className="flex justify-between text-blue-600">
              <span className="text-sm text-muted-foreground">Commission:</span>
              <span className="text-sm">₹{(order.totalCommission || order.commission || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold pt-2 border-t">
              <span>Total:</span>
              <span>₹{order.total?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex justify-between text-green-600 font-medium mt-2 pt-2 border-t border-green-200 bg-green-50 px-3 py-2 rounded">
              <span>You will earn:</span>
              <span>₹{((order.total || 0) - (order.shipping || 0) - (order.totalCommission || order.commission || 0)).toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shipping & Tracking */}
      {(order.orderStatus === 'shipped' || order.orderStatus === 'confirmed' || (order as any).awbCode || (order as any).shiprocketOrderId) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Shipping & Tracking
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {trackingLoading && (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <div className="mr-1 h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                <span>Fetching live tracking status…</span>
              </div>
            )}
            {trackingError && (
              <div className="text-sm text-red-600">Failed to load tracking: {trackingError}</div>
            )}
            {trackingInfo && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="text-sm text-muted-foreground">Status</div>
                  <div className="text-sm font-semibold">{trackingInfo.status || 'N/A'}</div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Courier Partner</div>
                    <div className="font-medium">{trackingInfo.courierName || (order as any).courierName || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">AWB Code</div>
                    <div className="font-mono font-semibold text-primary">{trackingInfo.awbCode || (order as any).awbCode || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Expected Delivery</div>
                    <div className="font-medium">{trackingInfo.expectedDelivery ? new Date(trackingInfo.expectedDelivery).toLocaleDateString() : '—'}</div>
                  </div>
                </div>

                {/* Enhanced 5-step progress */}
                <div className="pt-2">
                  {(() => {
                    const steps = [
                      { key: 'placed', label: 'Order Placed', icon: Package },
                      { key: 'confirmed', label: 'Order Confirmed', icon: CheckCircle },
                      { key: 'shipped', label: 'Shipped', icon: Truck },
                      { key: 'out_for', label: 'Out for Delivery', icon: Truck },
                      { key: 'delivered', label: 'Delivered', icon: CheckCircle },
                    ];
                    const statusText = (trackingInfo.status || order.orderStatus || '').toLowerCase();
                    let currentStep = 1;
                    if (statusText.includes('delivered')) currentStep = 5;
                    else if (statusText.includes('out for delivery') || statusText.includes('out for')) currentStep = 4;
                    else if (statusText.includes('shipped') || statusText.includes('in transit') || statusText.includes('in-transit')) currentStep = 3;
                    else if (statusText.includes('confirmed') || statusText.includes('packed') || statusText.includes('ready to ship')) currentStep = 2;
                    else currentStep = 1;

                    const checkpoints = Array.isArray(trackingInfo.checkpoints) ? trackingInfo.checkpoints : [];
                    const findTime = (matchers: string[]) => {
                      const cp = checkpoints.find((c: any) => {
                        const t = `${c?.current_status || c?.status || c?.remark || ''}`.toLowerCase();
                        return matchers.some(m => t.includes(m));
                      });
                      const time = cp?.updated_at || cp?.date || cp?.time || cp?.scan_date_time;
                      return time ? new Date(time).toLocaleString() : null;
                    };
                    const stepTimes: Array<string | null> = [
                      order.createdAt ? new Date(order.createdAt).toLocaleString() : null,
                      findTime(['confirmed', 'packed', 'ready to ship']) || (order.updatedAt ? new Date(order.updatedAt).toLocaleString() : null),
                      findTime(['shipped', 'in transit', 'in-transit']),
                      findTime(['out for delivery', 'out for']),
                      findTime(['delivered']),
                    ];

                    return (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          {steps.map((s, idx) => {
                            const IconComp = s.icon;
                            const stepIndex = idx + 1;
                            const active = stepIndex <= currentStep;
                            const completed = stepIndex < currentStep;
                            return (
                              <div key={s.key} className="flex-1 flex items-center">
                                <div className={`relative flex items-center justify-center h-8 w-8 rounded-full border text-[10px] sm:text-xs font-bold 
                                  ${active ? 'bg-primary text-primary-foreground border-primary shadow-sm' : 'bg-background text-muted-foreground border-muted'}
                                `}>
                                  <IconComp className={`h-4 w-4 ${completed ? 'opacity-100' : 'opacity-80'}`} />
                                  {completed && (
                                    <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-primary/90 border border-background" />
                                  )}
                                </div>
                                {idx < steps.length - 1 && (
                                  <div className={`h-1 flex-1 mx-2 rounded-full overflow-hidden`}>
                                    <div className={`h-full w-full ${stepIndex < currentStep ? 'bg-primary' : 'bg-muted'}`} />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        <div className="grid grid-cols-5 gap-2 text-[10px] sm:text-xs">
                          {steps.map((s) => (
                            <div key={s.key} className="text-center text-muted-foreground">{s.label}</div>
                          ))}
                        </div>
                        <div className="grid grid-cols-5 gap-2 text-[10px] sm:text-xs">
                          {stepTimes.map((t, i) => (
                            <div key={i} className="text-center text-muted-foreground">{t || ''}</div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Recent checkpoints */}
                {Array.isArray(trackingInfo.checkpoints) && trackingInfo.checkpoints.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Recent Updates</div>
                    <div className="space-y-2 max-h-44 overflow-auto pr-1">
                      {trackingInfo.checkpoints.slice(0, 5).map((cp: any, i: number) => {
                        const desc = cp?.current_status || cp?.status || cp?.remark || cp?.activity || 'Update';
                        const loc = cp?.location || cp?.location_city || cp?.scan_location || '';
                        const time = cp?.updated_at || cp?.date || cp?.time || cp?.scan_date_time;
                        return (
                          <div key={i} className="text-xs border rounded p-2">
                            <div className="font-medium">{desc}</div>
                            <div className="text-muted-foreground">{loc}</div>
                            <div className="text-muted-foreground">{time ? new Date(time).toLocaleString() : ''}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!(trackingInfo) && !(trackingLoading) && !(trackingError) && (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Clock className="h-4 w-4" />
                <span>Shipping label will be generated soon</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Shipping Address */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Shipping Address
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
                  {item.salePrice && item.salePrice !== item.price && (
                    <p className="text-xs text-muted-foreground">Sale Price: ₹{item.salePrice.toFixed(2)}</p>
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
