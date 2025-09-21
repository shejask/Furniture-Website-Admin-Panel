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
            // Shiprocket tracking details
            awbCode: order.awbCode,
            courierName: order.courierName,
            shiprocketOrderId: order.shiprocketOrderId,
            shiprocketShipmentId: order.shiprocketShipmentId,
            // Invoice attachment
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
          to: order.userEmail, // Add the 'to' parameter
          data: {
            customerName: order.address.firstName && order.address.lastName 
              ? `${order.address.firstName} ${order.address.lastName}` 
              : order.address.addressName || 'Customer',
            customerEmail: order.userEmail,
            userEmail: order.userEmail, // Add userEmail for API compatibility
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

  // Send order notification to vendor
  static async sendVendorOrderNotification(order: Order): Promise<boolean> {
    try {
      // Determine vendor email - check order level first, then item level
      let vendorEmail = order.vendorEmail;
      let vendorName = order.vendorName;
      
      if (!vendorEmail || !vendorName) {
        // Try to get vendor info from first item with vendor details
        const itemWithVendor = order.items.find(item => item.vendorEmail && item.vendorName);
        if (itemWithVendor) {
          vendorEmail = itemWithVendor.vendorEmail;
          vendorName = itemWithVendor.vendorName;
        }
      }

      if (!vendorEmail || !vendorName) {
        console.warn('No vendor email or name found for order:', order.orderId);
        return false;
      }

      const response = await fetch('/api/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'vendor-order-notification',
          data: {
            vendorName: vendorName,
            vendorEmail: vendorEmail,
            orderId: order.orderId,
            orderDate: order.createdAt,
            totalAmount: order.total,
            customerName: order.address.firstName && order.address.lastName 
              ? `${order.address.firstName} ${order.address.lastName}` 
              : order.address.addressName || 'Customer',
            customerEmail: order.userEmail,
            items: order.items.map(item => ({
              productName: item.name,
              price: item.salePrice || item.price,
              quantity: item.quantity,
              total: (item.salePrice || item.price) * item.quantity,
              vendorName: item.vendorName,
              vendorEmail: item.vendorEmail,
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
          }
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API Error: ${errorData.error || 'Failed to send vendor notification'}`);
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Email service error:', error);
      return false;
    }
  }

  // Send refund confirmation email
  static async sendRefundConfirmationEmail(order: Order, refundReason: string): Promise<boolean> {
    try {
      const response = await fetch('/api/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'refund-confirmation',
          to: order.userEmail, // Add the 'to' parameter
          data: {
            customerName: order.address.firstName && order.address.lastName 
              ? `${order.address.firstName} ${order.address.lastName}` 
              : order.address.addressName || 'Customer',
            customerEmail: order.userEmail,
            userEmail: order.userEmail, // Add userEmail for API compatibility
            orderId: order.orderId,
            orderDate: order.createdAt,
            refundDate: order.refundedAt || new Date().toISOString(),
            totalAmount: order.total,
            refundReason: refundReason,
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
          }
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API Error: ${errorData.error || 'Failed to send refund confirmation'}`);
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Email service error:', error);
      return false;
    }
  }
}