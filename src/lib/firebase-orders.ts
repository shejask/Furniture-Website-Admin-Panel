import { 
  ref, 
  set, 
  get, 
  push, 
  query, 
  orderByChild,
  type DatabaseReference 
} from 'firebase/database';
import { database } from './firebase';
import { Order, OrderFormData } from '@/features/orders/utils/form-schema';

// Helper function to create order under customer's orders collection
export const createCustomerOrder = async (userId: string, orderData: OrderFormData): Promise<string> => {
  try {
    // Generate order ID
    const orderId = `order-${Date.now()}`;
    const now = new Date().toISOString();
    
    // Create the complete order object (filter out undefined values)
    const order: any = {
      orderId,
      userId,
      userEmail: orderData.userEmail,
      items: orderData.items,
      address: orderData.address,
      paymentMethod: orderData.paymentMethod,
      paymentStatus: orderData.paymentStatus || 'pending', // Default to pending if not provided
      orderStatus: orderData.orderStatus || 'pending',     // Default to pending if not provided
      subtotal: orderData.subtotal,
      discount: orderData.discount,
      shipping: orderData.shipping,
      commission: orderData.commission || 0,
      totalCommission: orderData.totalCommission || orderData.commission || 0,
      total: orderData.total,
      createdAt: now,
      updatedAt: now,
    };

    // Only add optional fields if they have values (not undefined)
    if (orderData.orderNote !== undefined && orderData.orderNote !== null) {
      order.orderNote = orderData.orderNote;
    }
    
    if (orderData.couponCode !== undefined && orderData.couponCode !== null) {
      order.couponCode = orderData.couponCode;
    }
    
    if (orderData.razorpayPaymentId !== undefined && orderData.razorpayPaymentId !== null) {
      order.razorpayPaymentId = orderData.razorpayPaymentId;
    }
    
    if (orderData.razorpayOrderId !== undefined && orderData.razorpayOrderId !== null) {
      order.razorpayOrderId = orderData.razorpayOrderId;
    }

    // Save to customers/{userId}/orders/{orderId}
    const orderRef = ref(database, `customers/${userId}/orders/${orderId}`);
    await set(orderRef, order);
    
    return orderId;
  } catch (error) {
    console.error('Error creating customer order:', error);
    throw error;
  }
};

// Function to get all orders from all customers
export const getAllOrders = async (): Promise<Order[]> => {
  try {
    const customersRef = ref(database, 'customers');
    const snapshot = await get(customersRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const customers = snapshot.val();
    const allOrders: Order[] = [];
    
    // Iterate through all customers and collect their orders
    Object.keys(customers).forEach(userId => {
      const customer = customers[userId];
      if (customer.orders) {
        Object.keys(customer.orders).forEach(orderId => {
          const order = customer.orders[orderId];
          allOrders.push({
            ...order,
            id: orderId, // Add id field for compatibility
          });
        });
      }
    });
    
    // Sort by creation date (newest first)
    return allOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error('Error getting all orders:', error);
    throw error;
  }
};

// Function to get orders for a specific customer
export const getCustomerOrders = async (userId: string): Promise<Order[]> => {
  try {
    const ordersRef = ref(database, `customers/${userId}/orders`);
    const snapshot = await get(ordersRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const orders = snapshot.val();
    return Object.keys(orders).map(orderId => ({
      ...orders[orderId],
      id: orderId,
    }));
  } catch (error) {
    console.error('Error getting customer orders:', error);
    throw error;
  }
};

// Function to update an order
export const updateCustomerOrder = async (userId: string, orderId: string, updates: Partial<Order>): Promise<void> => {
  try {
    const orderRef = ref(database, `customers/${userId}/orders/${orderId}`);
    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    await set(orderRef, updateData);
  } catch (error) {
    console.error('Error updating customer order:', error);
    throw error;
  }
};

// Function to delete an order
export const deleteCustomerOrder = async (userId: string, orderId: string): Promise<void> => {
  try {
    const orderRef = ref(database, `customers/${userId}/orders/${orderId}`);
    await set(orderRef, null);
  } catch (error) {
    console.error('Error deleting customer order:', error);
    throw error;
  }
};

// Function to get order statistics
export const getOrderStatistics = async () => {
  try {
    const orders = await getAllOrders();
    
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    const pendingOrders = orders.filter(order => order.orderStatus === 'pending').length;
    const completedOrders = orders.filter(order => order.orderStatus === 'delivered').length;
    const cancelledOrders = orders.filter(order => order.orderStatus === 'cancelled').length;
    
    return {
      totalOrders,
      totalRevenue,
      averageOrderValue,
      pendingOrders,
      completedOrders,
      cancelledOrders,
    };
  } catch (error) {
    console.error('Error getting order statistics:', error);
    throw error;
  }
};
