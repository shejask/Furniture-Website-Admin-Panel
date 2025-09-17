'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus,
  Trash2,
  Save,
  Loader2
} from 'lucide-react';
import { useFirebaseData } from '@/hooks/use-firebase-database';
import { orderFormSchema, type OrderFormData } from '../utils/form-schema';
import { createCustomerOrder } from '@/lib/firebase-orders';
import { EmailService } from '@/lib/email-service';
import { InvoiceGenerator } from '@/lib/invoice-generator';

interface Product {
  id: string;
  name: string;
  price: number;
  photo_url?: string;
  stock?: number;
}

interface Customer {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  addresses?: {
    [key: string]: {
      street: string;
      city: string;
      state: string;
      country: string;
      postalCode: string;
    };
  };
}

interface SelectedItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  total: number;
}

export function AddOrderForm() {
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        // Handle dropdown close logic here if needed
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customShipping] = useState<number | null>(null);
  const [couponCode, setCouponCode] = useState<string>('');
  const [couponDiscount] = useState<number>(0);

  const { data: customers } = useFirebaseData('customers');
  const { data: products } = useFirebaseData('products');

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      userId: '',
      userEmail: '',
      address: {
        street: '',
        city: '',
        state: '',
        country: '',
        postalCode: '',
      },
      items: [],
      subtotal: 0,
      discount: 0,
      shipping: 0,
      total: 0,
      paymentMethod: 'cash-delivery',
      paymentStatus: 'pending',
      orderStatus: 'pending',
      orderNote: '',
      couponCode: '',
    },
  });

  // Calculate totals when items or shipping change
  useEffect(() => {
    const roundToTwo = (num: number) => Math.round(num * 100) / 100;

    if (selectedItems.length > 0) {
      const subtotal = selectedItems.reduce((sum, item) => {
        const itemTotal = (item.price || 0) * (item.quantity || 0);
        return sum + itemTotal;
      }, 0);
      
      const shipping = customShipping !== null ? customShipping : (subtotal > 1000 ? 0 : 100);
      const totalDiscount = roundToTwo(couponDiscount);
      const total = roundToTwo(subtotal + shipping - totalDiscount);

      setValue('subtotal', subtotal);
      setValue('shipping', shipping);
      setValue('discount', totalDiscount);
      setValue('total', total);
    } else {
      setValue('subtotal', 0);
      setValue('shipping', customShipping !== null ? customShipping : 0);
      setValue('discount', 0);
      setValue('total', customShipping !== null ? customShipping : 0);
    }
    // Map selectedItems to OrderFormData items format
    const orderItems = selectedItems.map(item => ({
      id: item.productId,
      name: item.productName,
      price: item.price,
      quantity: item.quantity,
      total: item.total
    }));
    setValue('items', orderItems);
  }, [selectedItems, customShipping, setValue, couponDiscount]);

  const handleCustomerSelect = (customerId: string) => {
    if (customers && customers[customerId]) {
      const customer = customers[customerId] as Customer;
      setValue('userId', customerId);
      setValue('userEmail', customer.email);
      
      // If customer has addresses, use the first one as default
      if (customer.addresses) {
        const firstAddress = Object.values(customer.addresses)[0];
        if (firstAddress) {
          setValue('address.street', firstAddress.street);
          setValue('address.city', firstAddress.city);
          setValue('address.state', firstAddress.state);
          setValue('address.country', firstAddress.country);
          setValue('address.postalCode', firstAddress.postalCode);
        }
      }
    }
  };

  const handleAddItem = () => {
    setSelectedItems([
      ...selectedItems,
      {
        productId: '',
        productName: '',
        price: 0,
        quantity: 1,
        total: 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const updatedItems = [...selectedItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    // If product is selected, populate product details
    if (field === 'productId' && products && products[value as string]) {
      const product = products[value as string] as Product;
      updatedItems[index] = {
        ...updatedItems[index],
        productName: product.name,
        price: product.price,
        quantity: updatedItems[index].quantity || 1,
      };
      updatedItems[index].total = product.price * (updatedItems[index].quantity || 1);
    }

    // Calculate total when quantity or price changes
    if (field === 'quantity' || field === 'price') {
      const item = updatedItems[index];
      const price = parseFloat(item.price?.toString() || '0');
      const quantity = parseInt(item.quantity?.toString() || '1');
      updatedItems[index] = {
        ...item,
        total: price * quantity,
      };
    }

    setSelectedItems(updatedItems);
  };

  const handleSubmitForm = async (data: OrderFormData) => {
    if (selectedItems.length === 0) {
      alert('Please add at least one item to the order.');
      return;
    }

    // Validate that all items have required fields
    const invalidItems = selectedItems.filter(item => 
      !item.productId || item.productId === '' || item.productId === 'undefined' || 
      !item.productName || item.price <= 0 || item.quantity <= 0
    );
    
    if (invalidItems.length > 0) {
      alert('Please ensure all items have valid information (product, price, and quantity).');
      return;
    }

    // Validate required fields
    if (!data.userId || !data.userEmail) {
      alert('Please select a customer.');
      return;
    }

    if (!data.address.street || !data.address.city || !data.address.state || 
        !data.address.country || !data.address.postalCode) {
      alert('Please fill in all required address information.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Create order data with all required fields
        // Create order data with properly mapped items
        const orderData: OrderFormData = {
          ...data,
          items: selectedItems.map(item => {
            if (!item.productId || item.productId === '' || item.productId === 'undefined') {
              throw new Error(`Invalid product ID: ${item.productId}. Please select a valid product.`);
            }
            
            return {
              id: item.productId, // Map productId to id
              name: item.productName,
              price: item.price,
              quantity: item.quantity,
              total: item.total,
            };
          }),
          couponCode: couponCode || undefined,
        };

      // Save to Firebase using new structure
      const orderId = await createCustomerOrder(data.userId, orderData);

      // Try to generate invoice and send emails (optional services)
      try {
        // Generate invoice PDF
        const invoiceBuffer = await InvoiceGenerator.generateInvoicePDF({
          orderNumber: orderId,
          customerName: customers?.[data.userId]?.fullName || 'Customer',
          customerEmail: data.userEmail,
          customerPhone: customers?.[data.userId]?.phone || '',
          billingAddress: {
            street: data.address.street || '',
            city: data.address.city,
            state: data.address.state,
            country: data.address.country,
            postalCode: data.address.postalCode || '',
          },
          products: selectedItems.map(item => ({
            productName: item.productName,
            price: item.price,
            quantity: item.quantity,
            total: item.total,
          })),
          subtotal: data.subtotal,
          tax: 0, // Add tax calculation if needed
          shipping: data.shipping,
          discount: data.discount,
          total: data.total,
          createdAt: new Date().toLocaleDateString(),
          paymentMethod: data.paymentMethod,
          paymentStatus: data.paymentStatus,
        });

        // Create order object for email service
        const orderForEmail = {
          ...orderData,
          id: orderId,
          orderId: orderId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Send confirmation email to customer
        await EmailService.sendCustomerOrderConfirmation(orderForEmail, invoiceBuffer);
      } catch (emailError) {
        // Order created but email/invoice generation failed - this is non-critical
      }

      // Redirect to orders list
      router.push('/dashboard/orders');
    } catch (error) {
      alert('Failed to create order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(handleSubmitForm)} className="space-y-6">
        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
            <CardDescription>Select customer and delivery address</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="userId">Customer *</Label>
                <Controller
                  name="userId"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={(value) => {
                      field.onChange(value);
                      handleCustomerSelect(value);
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers && Object.entries(customers).map(([id, customer]: [string, any]) => (
                          <SelectItem key={id} value={id}>
                            {customer.fullName} - {customer.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.userId && <p className="text-sm text-red-600">{errors.userId.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="userEmail">Email *</Label>
                <Input 
                  {...register('userEmail')} 
                  type="email"
                  placeholder="customer@example.com"
                />
                {errors.userEmail && <p className="text-sm text-red-600">{errors.userEmail.message}</p>}
              </div>
            </div>

            {/* Address */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Delivery Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address.street">Street Address *</Label>
                  <Input {...register('address.street')} placeholder="123 Main St" />
                  {errors.address?.street && <p className="text-sm text-red-600">{errors.address.street.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address.city">City *</Label>
                  <Input {...register('address.city')} placeholder="City" />
                  {errors.address?.city && <p className="text-sm text-red-600">{errors.address.city.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address.state">State *</Label>
                  <Input {...register('address.state')} placeholder="State" />
                  {errors.address?.state && <p className="text-sm text-red-600">{errors.address.state.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address.country">Country *</Label>
                  <Input {...register('address.country')} placeholder="Country" />
                  {errors.address?.country && <p className="text-sm text-red-600">{errors.address.country.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address.postalCode">Postal Code *</Label>
                  <Input {...register('address.postalCode')} placeholder="12345" />
                  {errors.address?.postalCode && <p className="text-sm text-red-600">{errors.address.postalCode.message}</p>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Order Items
              <Button type="button" onClick={handleAddItem} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </CardTitle>
            <CardDescription>Add products to the order</CardDescription>
          </CardHeader>
          <CardContent>
            {selectedItems.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No items added yet. Click &quot;Add Item&quot; to get started.
              </p>
            ) : (
              <div className="space-y-4">
                {selectedItems.map((item, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Item {index + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div className="space-y-2">
                        <Label>Product *</Label>
                        <Select
                          value={item.productId}
                          onValueChange={(value) => handleItemChange(index, 'productId', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {products && Object.entries(products).map(([id, product]: [string, any]) => (
                              <SelectItem key={id} value={id}>
                                {product.name} - ₹{product.price}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Price *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.price}
                          onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Quantity *</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                          placeholder="1"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Total</Label>
                        <Input
                          type="number"
                          value={item.total}
                          disabled
                          className="bg-muted"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment & Order Details */}
        <Card>
          <CardHeader>
            <CardTitle>Payment & Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Controller
                  name="paymentMethod"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="razorpay">Razorpay</SelectItem>
                        <SelectItem value="cash-delivery">Cash on Delivery</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentStatus">Payment Status</Label>
                <Controller
                  name="paymentStatus"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="orderStatus">Order Status</Label>
                <Controller
                  name="orderStatus"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="orderNote">Order Note (Optional)</Label>
              <Textarea 
                {...register('orderNote')} 
                placeholder="Any special instructions or notes..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="couponCode">Coupon Code (Optional)</Label>
              <Input 
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="Enter coupon code"
              />
            </div>
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{watch('subtotal')?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping:</span>
                <span>₹{watch('shipping')?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between">
                <span>Discount:</span>
                <span>-₹{watch('discount')?.toFixed(2) || '0.00'}</span>
              </div>
              <hr />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total:</span>
                <span>₹{watch('total')?.toFixed(2) || '0.00'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/dashboard/orders')}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Order...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Create Order
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}