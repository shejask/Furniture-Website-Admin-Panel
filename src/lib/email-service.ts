import { Order } from '@/features/orders/utils/form-schema';

export class EmailService {
  static async sendCustomerOrderConfirmation(order: Order, invoiceHtml?: Buffer): Promise<boolean> {
    try {
      // Use the enhanced email API with proper order structure
      const response = await fetch('/api/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'customer-order-confirmation',
          data: {
            customerName: order.address.firstName && order.address.lastName 
              ? `${order.address.firstName} ${order.address.lastName}` 
              : order.address.addressName || 'Customer',
            customerEmail: order.userEmail,
            orderId: order.orderId,
            orderDate: order.createdAt,
            totalAmount: order.total,
            items: order.items.map(item => ({
              productName: item.name,
              price: item.salePrice || item.price,
              quantity: item.quantity,
              total: (item.salePrice || item.price) * item.quantity,
            })),
            subtotal: order.subtotal,
            shipping: order.shipping,
            discount: order.discount,
            shippingAddress: {
              name: order.address.firstName && order.address.lastName 
                ? `${order.address.firstName} ${order.address.lastName}` 
                : order.address.addressName || 'Customer',
              address: order.address.streetAddress || order.address.street || '',
              city: order.address.city,
              state: order.address.state,
              country: order.address.country,
              zip: order.address.zip || order.address.postalCode || '',
              phone: order.address.phone || '',
            },
            invoiceBuffer: invoiceHtml ? invoiceHtml.toString('base64') : null
          }
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API Error: ${errorData.error || 'Failed to send email'}`);
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Email service error:', error);
      return false;
    }
  }


  // Send order cancellation email
  static async sendOrderCancellationEmail(order: Order, cancellationReason: string): Promise<boolean> {
    try {
      const response = await fetch('/api/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'order-cancellation',
          data: {
            customerName: order.address.firstName && order.address.lastName 
              ? `${order.address.firstName} ${order.address.lastName}` 
              : order.address.addressName || 'Customer',
            customerEmail: order.userEmail,
            orderId: order.orderId,
            orderDate: order.createdAt,
            totalAmount: order.total,
            cancellationReason: cancellationReason,
            items: order.items.map(item => ({
              productName: item.name,
              price: item.salePrice || item.price,
              quantity: item.quantity,
              total: (item.salePrice || item.price) * item.quantity,
            })),
            cancelledAt: new Date().toISOString()
          }
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API Error: ${errorData.error || 'Failed to send cancellation email'}`);
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Email service error:', error);
      return false;
    }
  }

  // Send shipping confirmation email with tracking details
  static async sendShippingConfirmation(order: Order, trackingDetails: {
    awbCode: string;
    courierName: string;
    expectedDelivery?: string;
  }): Promise<boolean> {
    try {
      const response = await fetch('/api/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'shipping-confirmation',
          data: {
            customerName: order.address.firstName && order.address.lastName 
              ? `${order.address.firstName} ${order.address.lastName}` 
              : order.address.addressName || 'Customer',
            customerEmail: order.userEmail,
            orderId: order.orderId,
            trackingNumber: trackingDetails.awbCode,
            courierName: trackingDetails.courierName,
            expectedDelivery: trackingDetails.expectedDelivery,
            shippingAddress: {
              name: order.address.firstName && order.address.lastName 
                ? `${order.address.firstName} ${order.address.lastName}` 
                : order.address.addressName || 'Customer',
              address: order.address.streetAddress || order.address.street || '',
              city: order.address.city,
              state: order.address.state,
              country: order.address.country,
              zip: order.address.zip || order.address.postalCode || '',
            },
            items: order.items.map(item => ({
              productName: item.name,
              quantity: item.quantity,
            })),
          }
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API Error: ${errorData.error || 'Failed to send shipping email'}`);
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Email service error:', error);
      return false;
    }
  }
}