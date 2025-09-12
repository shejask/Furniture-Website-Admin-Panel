'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { 
  User, 
  Package, 
  DollarSign, 
  Plus, 
  Minus, 
  Trash2,
  ShoppingCart,
  CreditCard,
  Truck,
  Calendar
} from 'lucide-react';
import { useFirebaseData } from '@/hooks/use-firebase-database';
import { orderFormSchema, type OrderFormData, type Order } from '../utils/form-schema';
import { EmailService } from '@/lib/email-service';
import { InvoiceGenerator } from '@/lib/invoice-generator';

interface OrderFormProps {
  initialData?: Order;
  onSubmit: (data: OrderFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  isEditing?: boolean;
}

interface Product {
  id: string;
  name: string;
  price: number;
  photo_url?: string;
  stock?: number;
  vendorId?: string;
  vendorName?: string;
}

interface Customer {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export function OrderForm({ initialData, onSubmit, onCancel, isLoading, isEditing }: OrderFormProps) {
  const [selectedProducts, setSelectedProducts] = useState<Array<{
    productId: string;
    productName: string;
    vendorId?: string | null;
    vendorName?: string | null;
    price: number;
    quantity: number;
    total: number;
  }>>(initialData?.products || []);

  const { data: customers } = useFirebaseData('customers');
  const { data: products } = useFirebaseData('products');
  const { data: vendors } = useFirebaseData('vendors');

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: initialData || {
      customerId: '',
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      billingAddress: {
        street: '',
        city: '',
        state: '',
        country: '',
        postalCode: '',
      },
      shippingAddress: {
        street: '',
        city: '',
        state: '',
        country: '',
        postalCode: '',
      },
      products: [],
      subtotal: 0,
      tax: 0,
      shipping: 0,
      discount: 0,
      total: 0,
      paymentMethod: 'credit_card',
      paymentStatus: 'pending',
      status: 'pending',
      notes: '',
      trackingNumber: '',
      estimatedDelivery: '',
    },
  });

  const watchedCustomerId = watch('customerId');

  // Auto-fill customer details when customer is selected
  useEffect(() => {
    if (watchedCustomerId && customers) {
      const customer = customers[watchedCustomerId] as Customer;
      if (customer) {
        setValue('customerName', customer.fullName);
        setValue('customerEmail', customer.email);
        setValue('customerPhone', customer.phone);
        setValue('billingAddress', {
          street: customer.address,
          city: customer.city,
          state: customer.state,
          country: customer.country,
          postalCode: customer.postalCode,
        });
        setValue('shippingAddress', {
          street: customer.address,
          city: customer.city,
          state: customer.state,
          country: customer.country,
          postalCode: customer.postalCode,
        });
      }
    }
  }, [watchedCustomerId, customers, setValue]);

  // Calculate totals when products change
  useEffect(() => {
    const subtotal = selectedProducts.reduce((sum, product) => sum + product.total, 0);
    const tax = subtotal * 0.1; // 10% tax
    const shipping = subtotal > 100 ? 0 : 10; // Free shipping over $100
    const total = subtotal + tax + shipping - (watch('discount') || 0);

    setValue('subtotal', subtotal);
    setValue('tax', tax);
    setValue('shipping', shipping);
    setValue('total', total);
    setValue('products', selectedProducts);
  }, [selectedProducts, setValue, watch]);

  const handleAddProduct = () => {
    const newProduct = {
      productId: '',
      productName: '',
      price: 0,
      quantity: 1,
      total: 0,
    };
    setSelectedProducts([...selectedProducts, newProduct]);
  };

  const handleRemoveProduct = (index: number) => {
    setSelectedProducts(selectedProducts.filter((_, i) => i !== index));
  };

  const handleProductChange = (index: number, field: string, value: string | number) => {
    const updatedProducts = [...selectedProducts];
    updatedProducts[index] = { ...updatedProducts[index], [field]: value };

    // Auto-fill product details when product is selected
    if (field === 'productId' && products) {
      const product = products[value as string] as Product;
      if (product) {
        updatedProducts[index].productName = product.name;
        updatedProducts[index].price = product.price;
        updatedProducts[index].total = product.price * updatedProducts[index].quantity;
        
        // Get vendor information if available
        if (product.vendorId && vendors) {
          const vendor = vendors[product.vendorId] as any;
          if (vendor) {
            updatedProducts[index].vendorId = product.vendorId;
            updatedProducts[index].vendorName = vendor.storeName || vendor.name;
          }
        }
      }
    }

    // Recalculate total when quantity changes
    if (field === 'quantity') {
      updatedProducts[index].total = updatedProducts[index].price * (value as number);
    }

    setSelectedProducts(updatedProducts);
  };

  const handleSubmitForm = async (data: OrderFormData) => {
    // Generate order number
    const orderNumber = `ORD-${Date.now()}`;
    const now = new Date().toISOString();
    const orderData = {
      ...data,
      orderNumber,
      isApproved: false,
      createdAt: now,
      updatedAt: now,
      actionHistory: isEditing ? undefined : [{
        action: 'order_created',
        timestamp: now,
        performedBy: 'admin',
        details: 'Order created by admin',
        previousStatus: undefined,
        newStatus: data.status || 'pending'
      }]
    };
    
    // Submit the order
    onSubmit(orderData);
    
    // If this is a new order (not editing), send emails and generate invoice
    if (!isEditing) {
      try {
        // Generate invoice
        const invoiceBuffer = await InvoiceGenerator.generateInvoiceBuffer(orderData as Order);
        
        // Send customer confirmation email with invoice
        await EmailService.sendCustomerOrderConfirmation(orderData as Order, invoiceBuffer);
        
        // Send vendor notifications
        const vendorEmails = new Set<string>();
        orderData.products.forEach(product => {
          if (product.vendorId && vendors && vendors[product.vendorId]) {
            const vendor = vendors[product.vendorId] as any;
            if (vendor.email) {
              vendorEmails.add(vendor.email);
            }
          }
        });

        // TODO: Implement vendor notification emails
        // for (const vendorEmail of Array.from(vendorEmails)) {
        //   await EmailService.sendVendorOrderNotification(orderData as Order, vendorEmail);
        // }

        // TODO: Implement admin notification emails
        // await EmailService.sendAdminOrderNotification(orderData as Order);
        
        alert('Order created successfully!');
      } catch {
        // Log error for debugging but don't expose to client
        alert('Order created successfully, but there was an issue sending emails.');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(handleSubmitForm)} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer Information
            </CardTitle>
            <CardDescription>Select customer and verify contact details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="customerId">Customer</Label>
              <Controller
                name="customerId"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers && Object.entries(customers).map(([id, customer]) => (
                        <SelectItem key={id} value={id}>
                          {(customer as Customer).fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.customerId && (
                <p className="text-sm text-red-500">{errors.customerId.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerName">Name</Label>
                <Input
                  {...register('customerName')}
                  placeholder="Customer name"
                />
                {errors.customerName && (
                  <p className="text-sm text-red-500">{errors.customerName.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="customerEmail">Email</Label>
                <Input
                  {...register('customerEmail')}
                  type="email"
                  placeholder="customer@example.com"
                />
                {errors.customerEmail && (
                  <p className="text-sm text-red-500">{errors.customerEmail.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="customerPhone">Phone</Label>
              <Input
                {...register('customerPhone')}
                placeholder="+1 (555) 123-4567"
              />
              {errors.customerPhone && (
                <p className="text-sm text-red-500">{errors.customerPhone.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Order Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Order Status
            </CardTitle>
            <CardDescription>Set order and payment status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Order Status</Label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="returned">Returned</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.status && (
                  <p className="text-sm text-red-500">{errors.status.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="paymentStatus">Payment Status</Label>
                <Controller
                  name="paymentStatus"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                        <SelectItem value="refunded">Refunded</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.paymentStatus && (
                  <p className="text-sm text-red-500">{errors.paymentStatus.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Controller
                name="paymentMethod"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="credit_card">Credit Card</SelectItem>
                      <SelectItem value="paypal">PayPal</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="cash_on_delivery">Cash on Delivery</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.paymentMethod && (
                <p className="text-sm text-red-500">{errors.paymentMethod.message}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Products
          </CardTitle>
          <CardDescription>Add products to the order</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedProducts.map((product, index) => (
            <div key={index} className="grid grid-cols-12 gap-4 items-center p-4 border rounded-lg">
              <div className="col-span-3">
                <Label>Product</Label>
                <Select
                  value={product.productId}
                  onValueChange={(value) => handleProductChange(index, 'productId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products && Object.entries(products).map(([id, productData]) => (
                      <SelectItem key={id} value={id}>
                        {(productData as Product).name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2">
                <Label>Price</Label>
                <Input
                  type="number"
                  value={product.price}
                  onChange={(e) => handleProductChange(index, 'price', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>

              <div className="col-span-2">
                <Label>Quantity</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleProductChange(index, 'quantity', Math.max(1, product.quantity - 1))}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <Input
                    type="number"
                    value={product.quantity}
                    onChange={(e) => handleProductChange(index, 'quantity', parseInt(e.target.value) || 1)}
                    className="w-16 text-center"
                    min="1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleProductChange(index, 'quantity', product.quantity + 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="col-span-2">
                <Label>Total</Label>
                <Input
                  type="number"
                  value={product.total}
                  readOnly
                  placeholder="0.00"
                />
              </div>

              <div className="col-span-2">
                <Label>Actions</Label>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => handleRemoveProduct(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          <Button type="button" variant="outline" onClick={handleAddProduct}>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </CardContent>
      </Card>

      {/* Addresses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Billing Address */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Billing Address
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="billingAddress.street">Street Address</Label>
              <Input
                {...register('billingAddress.street')}
                placeholder="123 Main St"
              />
              {errors.billingAddress?.street && (
                <p className="text-sm text-red-500">{errors.billingAddress.street.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="billingAddress.city">City</Label>
                <Input
                  {...register('billingAddress.city')}
                  placeholder="City"
                />
                {errors.billingAddress?.city && (
                  <p className="text-sm text-red-500">{errors.billingAddress.city.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="billingAddress.state">State</Label>
                <Input
                  {...register('billingAddress.state')}
                  placeholder="State"
                />
                {errors.billingAddress?.state && (
                  <p className="text-sm text-red-500">{errors.billingAddress.state.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="billingAddress.country">Country</Label>
                <Input
                  {...register('billingAddress.country')}
                  placeholder="Country"
                />
                {errors.billingAddress?.country && (
                  <p className="text-sm text-red-500">{errors.billingAddress.country.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="billingAddress.postalCode">Postal Code</Label>
                <Input
                  {...register('billingAddress.postalCode')}
                  placeholder="12345"
                />
                {errors.billingAddress?.postalCode && (
                  <p className="text-sm text-red-500">{errors.billingAddress.postalCode.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shipping Address */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Shipping Address
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="shippingAddress.street">Street Address</Label>
              <Input
                {...register('shippingAddress.street')}
                placeholder="123 Main St"
              />
              {errors.shippingAddress?.street && (
                <p className="text-sm text-red-500">{errors.shippingAddress.street.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="shippingAddress.city">City</Label>
                <Input
                  {...register('shippingAddress.city')}
                  placeholder="City"
                />
                {errors.shippingAddress?.city && (
                  <p className="text-sm text-red-500">{errors.shippingAddress.city.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="shippingAddress.state">State</Label>
                <Input
                  {...register('shippingAddress.state')}
                  placeholder="State"
                />
                {errors.shippingAddress?.state && (
                  <p className="text-sm text-red-500">{errors.shippingAddress.state.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="shippingAddress.country">Country</Label>
                <Input
                  {...register('shippingAddress.country')}
                  placeholder="Country"
                />
                {errors.shippingAddress?.country && (
                  <p className="text-sm text-red-500">{errors.shippingAddress.country.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="shippingAddress.postalCode">Postal Code</Label>
                <Input
                  {...register('shippingAddress.postalCode')}
                  placeholder="12345"
                />
                {errors.shippingAddress?.postalCode && (
                  <p className="text-sm text-red-500">{errors.shippingAddress.postalCode.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Order Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="subtotal">Subtotal</Label>
              <Input
                {...register('subtotal')}
                type="number"
                readOnly
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="tax">Tax (10%)</Label>
              <Input
                {...register('tax')}
                type="number"
                readOnly
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="shipping">Shipping</Label>
              <Input
                {...register('shipping')}
                type="number"
                readOnly
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="discount">Discount</Label>
              <Input
                {...register('discount')}
                type="number"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Total</span>
              <span>₹{watch('total')?.toFixed(2) || '0.00'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Additional Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="notes">Order Notes</Label>
            <Textarea
              {...register('notes')}
              placeholder="Add any special instructions or notes..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="trackingNumber">Tracking Number</Label>
              <Input
                {...register('trackingNumber')}
                placeholder="Enter tracking number"
              />
            </div>
            <div>
              <Label htmlFor="estimatedDelivery">Estimated Delivery</Label>
              <Input
                {...register('estimatedDelivery')}
                type="date"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : isEditing ? 'Update Order' : 'Create Order'}
        </Button>
      </div>
    </form>
  );
} 