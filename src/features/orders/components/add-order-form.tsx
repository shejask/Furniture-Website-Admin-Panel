'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { 
  Plus,
  Trash2,
  Save,
  Loader2
} from 'lucide-react';
import { useFirebaseData } from '@/hooks/use-firebase-database';
import { getShippingPrice } from '@/features/shipping/utils/shipping-utils';
import { calculateDiscountAmount } from '@/features/coupons/utils/coupon-utils';
import type { Coupon } from '@/types/coupon';
import { orderFormSchema, type OrderFormData } from '../utils/form-schema';
import { createCustomerOrder } from '@/lib/firebase-orders';
import { EmailService } from '@/lib/email-service';
import { InvoiceGenerator } from '@/lib/invoice-generator';
import { calculateOrderCommission } from '../utils/commission-utils';

interface Product {
  id: string;
  name: string;
  price: number;
  photo_url?: string;
  stock?: number;
  commissionAmount?: number | string;
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
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState<string>('');
  const [isCouponApplied, setIsCouponApplied] = useState(false);

  const { data: customers } = useFirebaseData('customers');
  const { data: products } = useFirebaseData('products');
  const { data: countries } = useFirebaseData('shipping_countries');
  const { data: states } = useFirebaseData('shipping_states');
  const { data: cities } = useFirebaseData('shipping_cities');
  const { data: coupons } = useFirebaseData('coupons');

  // Function to calculate shipping based on address
  const calculateShipping = useCallback((country: string, state: string, city: string, subtotal: number): number => {
    // If custom shipping is set, use that
    if (customShipping !== null) {
      return customShipping;
    }

    // If we have all shipping data and address info
    if (countries && states && cities && country && state && city) {
      const shippingCost = getShippingPrice(countries, states, cities, country, state, city);
      if (shippingCost !== null) {
        return shippingCost;
      }
    }

    // Fallback to default logic (free shipping over 1000, otherwise 100)
    return subtotal > 1000 ? 0 : 100;
  }, [customShipping, countries, states, cities]);

  // Function to validate and apply coupon
  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    if (!coupons) {
      setCouponError('Unable to load coupons. Please try again.');
      return;
    }

    // Find coupon by code
    const coupon = Object.values(coupons).find(
      (c: any) => c.code.toLowerCase() === couponCode.toLowerCase()
    ) as Coupon | undefined;

    if (!coupon) {
      setCouponError('Invalid coupon code');
      return;
    }

    // Check if coupon is valid
    if (!coupon.isActive) {
      setCouponError('This coupon is not active');
      return;
    }

    if (new Date(coupon.validTo) <= new Date()) {
      setCouponError('This coupon has expired');
      return;
    }

    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      setCouponError('This coupon has reached its usage limit');
      return;
    }

    if (coupon.usageCount >= coupon.totalQuantity) {
      setCouponError('This coupon is no longer available');
      return;
    }

    const currentUserId = watch('userId');
    if (!currentUserId) {
      setCouponError('Please select a customer first');
      return;
    }

    // Calculate current subtotal
    const currentSubtotal = selectedItems.reduce((sum, item) => {
      return sum + (item.price || 0) * (item.quantity || 0);
    }, 0);

    // Check minimum order amount
    if (coupon.minOrderAmount && currentSubtotal < coupon.minOrderAmount) {
      setCouponError(`Minimum order amount of ₹${coupon.minOrderAmount} required for this coupon`);
      return;
    }

    // Apply coupon
    setAppliedCoupon(coupon);
    setIsCouponApplied(true);
    setCouponError('');
    setValue('couponCode', couponCode);
  };

  // Function to remove applied coupon
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setIsCouponApplied(false);
    setCouponCode('');
    setCouponError('');
    setValue('couponCode', '');
    
    // Force recalculation of totals by triggering the useEffect
    // This ensures shipping is recalculated when coupon is removed
    const subtotal = selectedItems.reduce((sum, item) => {
      const itemTotal = (item.price || 0) * (item.quantity || 0);
      return sum + itemTotal;
    }, 0);
    
    // Recalculate shipping without coupon
    const shipping = calculateShipping(
      currentAddress?.country || '',
      currentAddress?.state || '',
      currentAddress?.city || '',
      subtotal
    );
    
    setValue('shipping', shipping);
    setValue('discount', 0);
    setValue('total', subtotal + shipping);
  };

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
      commission: 0,
      totalCommission: 0,
      total: 0,
      paymentMethod: 'cash-delivery',
      paymentStatus: 'pending', // Default value, not user-editable
      orderStatus: 'pending',   // Default value, not user-editable
      orderNote: '',
      couponCode: '',
    },
  });

  // Watch address for dependency tracking
  const currentAddress = watch('address');
  
  // Calculate totals when items, shipping, or address change
  useEffect(() => {
    const roundToTwo = (num: number) => Math.round(num * 100) / 100;

    if (selectedItems.length > 0) {
      const subtotal = selectedItems.reduce((sum, item) => {
        const itemTotal = (item.price || 0) * (item.quantity || 0);
        return sum + itemTotal;
      }, 0);
      
      // Always calculate the base shipping cost first
      let shipping = calculateShipping(
        currentAddress?.country || '',
        currentAddress?.state || '',
        currentAddress?.city || '',
        subtotal
      );

      // Calculate coupon discount
      let couponDiscount = 0;
      if (appliedCoupon) {
        couponDiscount = calculateDiscountAmount(appliedCoupon, subtotal);
        
        // Handle free shipping coupon - override shipping to 0
        if (appliedCoupon.discountType === 'free_shipping') {
          shipping = 0;
        }
      }
      // If no coupon is applied, ensure shipping is properly calculated
      // (This handles the case when coupon is removed)

      // Calculate commission based on order items - get commission from products database
      let commission = 0;
      if (products && selectedItems.length > 0) {
        commission = calculateOrderCommission(selectedItems.map(item => {
          const product = products[item.productId];
          let commissionAmount = 0;
          
          // Get commission amount from product database
          if (product && product.commissionAmount !== undefined && product.commissionAmount !== null) {
            commissionAmount = typeof product.commissionAmount === 'string' 
              ? parseFloat(product.commissionAmount) || 0
              : Number(product.commissionAmount) || 0;
          }
          
          // Enhanced debug log to see what we're getting
          if (process.env.NODE_ENV === 'development') {
            console.log('=== Commission Debug ===');
            console.log('Product ID:', item.productId);
            console.log('Product Name:', item.productName);
            console.log('Products object exists:', !!products);
            console.log('Product found:', !!product);
            console.log('Raw commission from product DB:', product?.commissionAmount);
            console.log('Parsed commission amount:', commissionAmount);
            console.log('Commission amount type:', typeof product?.commissionAmount);
            if (product) {
              console.log('All product fields:', Object.keys(product));
              console.log('Product name from DB:', product.name);
              console.log('Product price from DB:', product.price);
            } else {
              console.log('Available product IDs:', Object.keys(products || {}));
              console.log('Looking for ID:', item.productId);
            }
            console.log('========================');
          }
          
          return {
            id: item.productId,
            name: item.productName,
            price: item.price,
            quantity: item.quantity,
            total: item.total,
            commissionAmount: commissionAmount
          };
        }));
      }

      const totalDiscount = roundToTwo(couponDiscount);
      const total = roundToTwo(subtotal + shipping - totalDiscount);

      setValue('subtotal', subtotal);
      setValue('shipping', shipping);
      setValue('discount', totalDiscount);
      setValue('commission', commission);
      setValue('totalCommission', commission); // Same as commission for display
      setValue('total', total);
    } else {
      // No items case
      const shipping = calculateShipping(
        currentAddress?.country || '',
        currentAddress?.state || '',
        currentAddress?.city || '',
        0
      );
      setValue('subtotal', 0);
      setValue('shipping', shipping);
      setValue('discount', 0);
      setValue('commission', 0);
      setValue('totalCommission', 0);
      setValue('total', shipping);
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
  }, [selectedItems, customShipping, setValue, appliedCoupon, watch, calculateShipping, countries, states, cities, currentAddress, products]);

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

    if (!data.address.city || !data.address.state || !data.address.country) {
      alert('Please fill in all required address information (City, State, Country).');
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
          
          if (!item.productName || item.productName.trim() === '') {
            throw new Error(`Invalid product name for product ID: ${item.productId}`);
          }
          
          if (item.price <= 0) {
            throw new Error(`Invalid price for product: ${item.productName}`);
          }
          
          if (item.quantity <= 0) {
            throw new Error(`Invalid quantity for product: ${item.productName}`);
          }
          
          // Get commission amount from products database
          const product = products?.[item.productId];
          let commissionAmount = 0;
          if (product && product.commissionAmount !== undefined && product.commissionAmount !== null) {
            commissionAmount = typeof product.commissionAmount === 'string' 
              ? parseFloat(product.commissionAmount) || 0
              : Number(product.commissionAmount) || 0;
          }
          
          return {
            id: item.productId, // Map productId to id
            name: item.productName,
            price: item.price,
            quantity: item.quantity,
            total: item.total,
            commissionAmount: commissionAmount, // Add commission to each item
          };
        }),
        couponCode: couponCode || undefined,
      };

      // Additional validation before saving
      if (!orderData.userId || !orderData.userEmail) {
        throw new Error('Customer information is missing');
      }
      
      if (!orderData.address.city || !orderData.address.state || !orderData.address.country) {
        throw new Error('Required address information is missing');
      }
      
      if (orderData.items.length === 0) {
        throw new Error('No items in the order');
      }

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
      // Log error for debugging (only in development)
      if (process.env.NODE_ENV === 'development') {
        console.error('Order creation error:', error);
      }
      
      // Provide more specific error messages
      let errorMessage = 'Failed to create order. ';
      
      if (error instanceof Error) {
        if (error.message.includes('Invalid product ID')) {
          errorMessage += 'Please ensure all products are selected properly.';
        } else if (error.message.includes('Firebase') || error.message.includes('database')) {
          errorMessage += 'Database connection issue. Please check your internet connection and try again.';
        } else if (error.message.includes('permission')) {
          errorMessage += 'You do not have permission to create orders. Please contact an administrator.';
        } else {
          errorMessage += error.message;
        }
      } else {
        errorMessage += 'An unexpected error occurred. Please try again.';
      }
      
      alert(errorMessage);
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
                        <SearchableSelect
                          value={item.productId}
                          onValueChange={(value) => handleItemChange(index, 'productId', value)}
                          placeholder="Select product"
                          searchPlaceholder="Search products..."
                          emptyText="No products found."
                          options={products ? Object.entries(products).map(([id, product]: [string, any]) => ({
                            value: id,
                            label: product.name,
                            description: `₹${product.price}`,
                            searchableText: `${product.name} ${product.price}`,
                          })) : []}
                        />
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

        {/* Payment Details */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
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
              <div className="flex gap-2">
                <Input 
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value);
                    setCouponError('');
                  }}
                  placeholder="Enter coupon code"
                  disabled={isCouponApplied}
                  className={couponError ? 'border-red-500' : ''}
                />
                {!isCouponApplied ? (
                  <Button 
                    type="button" 
                    onClick={handleApplyCoupon}
                    disabled={!couponCode.trim()}
                    variant="outline"
                  >
                    Apply
                  </Button>
                ) : (
                  <Button 
                    type="button" 
                    onClick={handleRemoveCoupon}
                    variant="outline"
                  >
                    Remove
                  </Button>
                )}
              </div>
              {couponError && (
                <p className="text-sm text-red-600">{couponError}</p>
              )}
              {isCouponApplied && appliedCoupon && (
                <div className="p-2 bg-green-50 border border-green-200 rounded text-sm text-green-800">
                  ✓ Coupon &quot;{appliedCoupon.code}&quot; applied successfully!
                  {appliedCoupon.discountType === 'percentage' && (
                    <span> ({appliedCoupon.discountValue}% discount)</span>
                  )}
                  {appliedCoupon.discountType === 'fixed' && (
                    <span> (₹{appliedCoupon.discountValue} discount)</span>
                  )}
                  {appliedCoupon.discountType === 'free_shipping' && (
                    <span> (Free shipping)</span>
                  )}
                </div>
              )}
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
              <div className="flex justify-between text-blue-600">
                <span>Commission:</span>
                <span>₹{watch('commission')?.toFixed(2) || '0.00'}</span>
              </div>
              <hr />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total:</span>
                <span>₹{watch('total')?.toFixed(2) || '0.00'}</span>
              </div>
            </div>
            
            {/* Debug Information - Remove this after fixing */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
                <strong>Debug Info:</strong>
                <div className="mt-2">
                  <div>Products loaded: {products ? 'Yes' : 'No'}</div>
                  <div>Products count: {products ? Object.keys(products).length : 0}</div>
                  <div>First few product IDs: {products ? Object.keys(products).slice(0, 3).join(', ') : 'None'}</div>
                  <div>Current Commission: ₹{watch('commission')?.toFixed(2) || '0.00'}</div>
                </div>
                
                {selectedItems.length > 0 && (
                  <div className="mt-2">
                    <strong>Selected Items:</strong>
                    {selectedItems.map((item, index) => {
                      const product = products?.[item.productId];
                      return (
                        <div key={index} className="mt-2 border-t pt-2">
                          <div>Item {index + 1}: {item.productName}</div>
                          <div>Product ID: {item.productId}</div>
                          <div>Product Found: {product ? 'Yes' : 'No'}</div>
                          {product && (
                            <>
                              <div>Commission Amount: {product.commissionAmount !== undefined ? product.commissionAmount : 'undefined'}</div>
                              <div>Commission Type: {typeof product.commissionAmount}</div>
                              <div>All Product Fields: {Object.keys(product).join(', ')}</div>
                              <div>Product Name in DB: {product.name}</div>
                              <div>Product Price in DB: {product.price}</div>
                            </>
                          )}
                          {!product && (
                            <div className="text-red-600">Product not found! Available IDs: {products ? Object.keys(products).slice(0, 5).join(', ') : 'None'}</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
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