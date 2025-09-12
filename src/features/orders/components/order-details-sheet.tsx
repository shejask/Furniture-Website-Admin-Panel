import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Package, 
  DollarSign,
  Calendar,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Truck,
  History,
  ExternalLink
} from 'lucide-react';
import { Order } from '../utils/form-schema';
import Image from 'next/image';
import { useRouter } from 'next/navigation';


interface OrderDetailsSheetProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export function OrderDetailsSheet({ order, isOpen, onClose }: OrderDetailsSheetProps) {
  const router = useRouter();
  if (!order) return null;

  const getActionIcon = (action: string) => {
    if (action.includes('confirmed')) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (action.includes('cancelled')) return <XCircle className="h-4 w-4 text-red-600" />;
    if (action.includes('processing')) return <Package className="h-4 w-4 text-blue-600" />;
    if (action.includes('shipped')) return <Truck className="h-4 w-4 text-purple-600" />;
    return <Clock className="h-4 w-4 text-gray-600" />;
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

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[600px] sm:w-[900px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Order Details - {order.orderId}</SheetTitle>
          <SheetDescription>
            Complete information about order {order.orderId}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
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
                  <div className="font-semibold">₹{(order.total || 0).toFixed(2)}</div>
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
                <div className="text-sm space-y-1">
                  <div>{order.address.street || 'N/A'}</div>
                  <div>
                    {order.address.city || 'N/A'}, {order.address.state || 'N/A'}
                  </div>
                  <div>{order.address.postalCode || 'N/A'}</div>
                  <div>{order.address.country || 'N/A'}</div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No address information available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Items ({order.items?.length || 0})
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
                        className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => {
                          if (item.id) {
                            router.push(`/dashboard/product/${item.id}`);
                            onClose(); // Close the sheet when navigating
                          }
                        }}
                      >
                        {/* Product Image */}
                        <div className="w-12 h-12 relative flex-shrink-0 bg-muted rounded-md overflow-hidden">
                          {item.thumbImage && Array.isArray(item.thumbImage) && item.thumbImage.length > 0 ? (
                            <Image
                              src={item.thumbImage[0]}
                              alt={item.name || 'Product'}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          ) : item.thumbImage && typeof item.thumbImage === 'string' ? (
                            <Image
                              src={item.thumbImage}
                              alt={item.name || 'Product'}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        
                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="font-medium text-sm truncate">
                              {item.name || 'Unknown Product'}
                            </div>
                            <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            ID: {item.id}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            ₹{(item.salePrice || item.price || 0).toFixed(2)} × {item.quantity || 0}
                          </div>
                          {item.salePrice && item.price && item.salePrice < item.price && (
                            <div className="text-xs text-green-600 mt-1">
                              Sale: ₹{item.salePrice.toFixed(2)} (was ₹{item.price.toFixed(2)})
                            </div>
                          )}
                        </div>
                        
                        {/* Price */}
                        <div className="font-semibold text-sm flex-shrink-0">
                          ₹{itemTotal.toFixed(2)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
            <CardContent>
              <div className="space-y-2">
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
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
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
                    <div className="text-sm font-mono">{order.razorpayPaymentId}</div>
                  </div>
                )}
                {order.razorpayOrderId && (
                  <div>
                    <div className="text-sm text-muted-foreground">Razorpay Order ID</div>
                    <div className="text-sm font-mono">{order.razorpayOrderId}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Order History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Order History & Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <div>Order History</div>
                <div className="text-xs mt-2">
                  <div>Created: {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}</div>
                  <div>Last Updated: {order.updatedAt ? new Date(order.updatedAt).toLocaleString() : 'N/A'}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Details */}
          {order.orderNote && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Additional Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm text-muted-foreground">Order Note</div>
                  <div className="text-sm">{order.orderNote}</div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
