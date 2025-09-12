import { z } from 'zod';

// Updated schema to match new database structure
export const orderFormSchema = z.object({
  userId: z.string().min(1, 'User ID is required'), // Changed from customerId to userId
  userEmail: z.string().email('Invalid email address'),
  
  // Address (updated to match actual database structure)
  address: z.object({
    addressName: z.string().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    phone: z.string().optional(),
    streetAddress: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    country: z.string().min(1, 'Country is required'),
    zip: z.string().optional(),
    // Legacy fields for backward compatibility
    street: z.string().optional(),
    postalCode: z.string().optional(),
  }),
  
  // Items (updated to match new structure)
  items: z.array(z.object({
    productId: z.string().min(1, 'Product is required'),
    productName: z.string().min(1, 'Product name is required'),
    price: z.number().min(0, 'Price must be positive'),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
    total: z.number().min(0, 'Total must be positive'),
  })).min(1, 'At least one item is required'),
  
  // Payment Method (updated to match new structure)
  paymentMethod: z.enum(['razorpay', 'cash-delivery']),
  paymentStatus: z.enum(['pending', 'completed', 'failed']),
  
  // Order Status (updated to match new structure)
  orderStatus: z.enum(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']),
  
  // Order totals
  subtotal: z.number().min(0, 'Subtotal must be positive'),
  discount: z.number().min(0, 'Discount must be positive'),
  shipping: z.number().min(0, 'Shipping must be positive'),
  total: z.number().min(0, 'Total must be positive'),
  
  // Optional fields
  orderNote: z.string().optional(),
  couponCode: z.string().optional(),
  razorpayPaymentId: z.string().optional(),
  razorpayOrderId: z.string().optional(),
});

export type OrderFormData = z.infer<typeof orderFormSchema>;

// Order item interface - matches actual database structure
export interface OrderItem {
  id: string; // Product ID
  name: string; // Product name
  price: number; // Original price
  salePrice?: number; // Sale price (if applicable)
  quantity: number;
  thumbImage?: string | string[]; // Product thumbnail image(s)
  total?: number; // Calculated total (salePrice || price) * quantity
}

// Order address interface
export interface OrderAddress {
  // New structure fields
  addressName?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  streetAddress?: string;
  city: string;
  state: string;
  country: string;
  zip?: string;
  
  // Legacy fields for backward compatibility
  street?: string;
  postalCode?: string;
}

// Updated Order interface to match new database structure
export interface Order {
  id: string; // This will be the orderId
  orderId: string;
  userId: string;
  userEmail: string;
  items: OrderItem[];
  address: OrderAddress;
  paymentMethod: 'razorpay' | 'cash-delivery';
  paymentStatus: 'pending' | 'completed' | 'failed';
  orderStatus: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  orderNote?: string;
  couponCode?: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  
  // Shiprocket integration fields
  shiprocketOrderId?: number;
  shiprocketShipmentId?: number;
  awbCode?: string;
  courierName?: string;
  
  // Cancellation fields
  cancellationReason?: string;
  cancelledAt?: string;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface OrderSummary {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  topCustomer?: {
    customerId: string;
    customerName: string;
    orderCount: number;
    totalSpent: number;
  };
} 