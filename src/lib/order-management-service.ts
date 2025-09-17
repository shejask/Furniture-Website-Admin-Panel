import { Order } from '@/features/orders/utils/form-schema';
import { ShiprocketService, ShiprocketResponse } from './shiprocket-service';
import { StockService, StockUpdateResult } from './stock-service';
import { EmailService } from './email-service';
import { updateCustomerOrder } from './firebase-orders';
// import { InvoiceGenerator } from './invoice-generator'; // Temporarily disabled

export interface OrderConfirmationResult {
  success: boolean;
  stockReduced: boolean;
  shiprocketCreated: boolean;
  emailSent: boolean;
  errors: string[];
  warnings: string[];
  shiprocketData?: ShiprocketResponse;
  stockResult?: StockUpdateResult;
}

export class OrderManagementService {
  /**
   * Complete order confirmation workflow:
   * 1. Update order status to confirmed
   * 2. Reduce stock for all items
   * 3. Create Shiprocket order
   * 4. Send confirmation email with tracking
   */
  static async confirmOrder(order: Order): Promise<OrderConfirmationResult> {
    const result: OrderConfirmationResult = {
      success: false,
      stockReduced: false,
      shiprocketCreated: false,
      emailSent: false,
      errors: [],
      warnings: [],
    };

    try {
      // Step 1: Check stock availability before proceeding
      const stockCheck = await StockService.checkOrderStock(order);

      if (!stockCheck.canFulfill) {
        // If stock check fails, don't proceed with order confirmation
        if (stockCheck.insufficientStock.length > 0) {
          result.errors.push(`Cannot approve order - insufficient stock for: ${stockCheck.insufficientStock.map(s => `${s.productId} (need ${s.requested}, have ${s.available})`).join(', ')}`);
        }
        if (stockCheck.errors.length > 0) {
          result.errors.push(`Stock check errors: ${stockCheck.errors.map(e => e.error).join(', ')}`);
        }
        return result; // Exit early if stock is insufficient
      }

      // Step 2: Reduce stock for all items
      const stockResult = await StockService.reduceStockForOrder(order);
      result.stockResult = stockResult;

      if (!stockResult.success) {
        result.errors.push(`Stock reduction failed: ${stockResult.errors.map(e => e.error).join(', ')}`);
        if (stockResult.insufficientStock.length > 0) {
          result.errors.push(`Insufficient stock for: ${stockResult.insufficientStock.map(s => `${s.productId} (need ${s.requested}, have ${s.available})`).join(', ')}`);
        }
        return result;
      }

      // Step 3: Update order status to confirmed
      const updatedOrder = {
        ...order,
        orderStatus: 'confirmed' as const,
        updatedAt: new Date().toISOString(),
      };

      await updateCustomerOrder(order.userId, order.orderId, updatedOrder);

      // Stock has already been reduced in the check above
      result.stockReduced = true;

      // Step 4: Create Shiprocket order (always try - service has fallback credentials)
      try {
        const shiprocketResponse = await ShiprocketService.createOrder(updatedOrder);
        result.shiprocketData = shiprocketResponse;
        
        // Check if we got a valid response
        if (shiprocketResponse && (shiprocketResponse.order_id || shiprocketResponse.shipment_id)) {
          result.shiprocketCreated = true;

          // Update order with Shiprocket details
          const orderWithShipping = {
            ...updatedOrder,
            shiprocketOrderId: shiprocketResponse.order_id,
            shiprocketShipmentId: shiprocketResponse.shipment_id,
            awbCode: shiprocketResponse.awb_code,
            courierName: shiprocketResponse.courier_name,
            orderStatus: shiprocketResponse.awb_code ? 'shipped' as const : 'confirmed' as const,
          };

          await updateCustomerOrder(order.userId, order.orderId, orderWithShipping);
        } else {
          result.warnings.push('Shiprocket order created but response format is unexpected');
        }
      } catch (error) {
        result.warnings.push(`Shiprocket creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Step 5: Send confirmation email and vendor notification
      try {
        // Send vendor-style email to customer
        try {
          const emailUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3004'}/api/email`;
          
          const emailResponse = await fetch(emailUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'vendor-order-notification',
              to: updatedOrder.userEmail,
              data: {
                ...updatedOrder,
                // Override customer name for the email
                customerName: `${updatedOrder.address.firstName} ${updatedOrder.address.lastName}`,
                orderDate: updatedOrder.createdAt
              }
            })
          });

          
          if (!emailResponse.ok) {
            throw new Error(`Email API returned ${emailResponse.status}: ${emailResponse.statusText}`);
          }

          const emailResult = await emailResponse.json();
          result.emailSent = emailResult.success;

          if (emailResult.success) {
            // Email sent successfully
          } else {
            result.warnings.push(`Customer email failed: ${emailResult.error || 'Unknown error'}`);
            if (emailResult.details) {
              result.warnings.push(`Customer email error details: ${emailResult.details}`);
            }
          }
        } catch (emailError) {
          if (emailError instanceof TypeError && emailError.message.includes('fetch')) {
            result.warnings.push(`Customer email service error: Unable to connect to email API. Please check if the server is running.`);
          } else {
            result.warnings.push(`Customer email service error: ${emailError instanceof Error ? emailError.message : 'Unknown error'}`);
          }
        }

        // Send vendor notification if vendor email exists
        if (updatedOrder.vendorEmail) {
          try {
            const vendorEmailSent = await EmailService.sendVendorOrderNotification(updatedOrder);
            if (vendorEmailSent) {
              // Vendor email sent successfully
            } else {
              result.warnings.push('Vendor notification email failed to send');
            }
          } catch (error) {
            result.warnings.push(`Vendor email error: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        } else {
          result.warnings.push('No vendor email found - vendor notification not sent');
        }

        // Send shipping confirmation if we have tracking info
        if (result.shiprocketCreated && result.shiprocketData?.awb_code && result.shiprocketData?.courier_name) {
          try {
            const shippingEmailSent = await EmailService.sendShippingConfirmation(updatedOrder, {
              awbCode: result.shiprocketData.awb_code,
              courierName: result.shiprocketData.courier_name,
            });

            if (shippingEmailSent) {
            } else {
              result.warnings.push('Shipping confirmation email failed to send');
            }
          } catch (error) {
            result.warnings.push(`Shipping email error: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      } catch (error) {
        result.errors.push(`Email service error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Determine overall success
      result.success = result.errors.length === 0;

      return result;
    } catch (error) {
      result.errors.push(`Order confirmation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }

  /**
   * Cancel an order and restore stock
   */
  static async cancelOrder(order: Order, reason: string): Promise<{
    success: boolean;
    stockRestored: boolean;
    emailSent: boolean;
    errors: string[];
  }> {
    const result: {
      success: boolean;
      stockRestored: boolean;
      emailSent: boolean;
      errors: string[];
    } = {
      success: false,
      stockRestored: false,
      emailSent: false,
      errors: [],
    };

    try {
      // Update order status to cancelled
      const cancelledOrder = {
        ...order,
        orderStatus: 'cancelled' as const,
        cancellationReason: reason,
        cancelledAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await updateCustomerOrder(order.userId, order.orderId, cancelledOrder);

      // Restore stock if order was confirmed (stock was reduced)
      if (order.orderStatus === 'confirmed' || order.orderStatus === 'shipped') {
        try {
          const stockResult = await StockService.restoreStockForOrder(order);
          result.stockRestored = stockResult.success;

          if (!stockResult.success) {
            result.errors.push(`Stock restoration failed: ${stockResult.errors.map(e => e.error).join(', ')}`);
          }
        } catch (error) {
          result.errors.push(`Stock restoration error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Cancel Shiprocket shipment if exists
      if (order.awbCode) {
        try {
          await ShiprocketService.cancelShipment(order.awbCode);
        } catch (error) {
          // Don't fail the entire operation for this
        }
      }

      // Send cancellation email
      try {
        const emailSent = await EmailService.sendOrderCancellationEmail(cancelledOrder, reason);
        result.emailSent = emailSent;

        if (!emailSent) {
          result.errors.push('Cancellation email failed to send');
        }
      } catch (error) {
        result.errors.push(`Email service error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      result.success = result.errors.length === 0;
      return result;
    } catch (error) {
      result.errors.push(`Order cancellation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }

  /**
   * Process order refund
   */
  static async processRefund(order: Order, refundReason: string): Promise<{
    success: boolean;
    stockRestored: boolean;
    emailSent: boolean;
    errors: string[];
  }> {
    const result: {
      success: boolean;
      stockRestored: boolean;
      emailSent: boolean;
      errors: string[];
    } = {
      success: false,
      stockRestored: false,
      emailSent: false,
      errors: [],
    };

    try {
      // Update order status to refunded
      const refundedOrder = {
        ...order,
        orderStatus: 'refunded' as const,
        refundReason: refundReason,
        refundedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await updateCustomerOrder(order.userId, order.orderId, refundedOrder);

      // Restore stock if order was confirmed/shipped (stock was reduced)
      if (order.orderStatus === 'confirmed' || order.orderStatus === 'shipped' || order.orderStatus === 'delivered') {
        try {
          const stockResult = await StockService.restoreStockForOrder(order);
          result.stockRestored = stockResult.success;

          if (!stockResult.success) {
            result.errors.push(`Stock restoration failed: ${stockResult.errors.map(e => e.error).join(', ')}`);
          }
        } catch (error) {
          result.errors.push(`Stock restoration error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Send refund confirmation email
      try {
        const emailSent = await EmailService.sendRefundConfirmationEmail(refundedOrder, refundReason);
        result.emailSent = emailSent;

        if (!emailSent) {
          result.errors.push('Refund confirmation email failed to send');
        }
      } catch (error) {
        result.errors.push(`Email service error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      result.success = result.errors.length === 0;
      return result;
    } catch (error) {
      result.errors.push(`Refund processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }

  /**
   * Get comprehensive order status with tracking information
   */
  static async getOrderStatus(order: Order): Promise<{
    order: Order;
    stockStatus: Array<{
      productId: string;
      currentStock: number;
      status: string;
    }>;
    trackingInfo?: any;
  }> {
    const result: {
      order: Order;
      stockStatus: Array<{
        productId: string;
        currentStock: number;
        status: string;
      }>;
      trackingInfo?: any;
    } = {
      order,
      stockStatus: [],
      trackingInfo: undefined,
    };

    try {
      // Get current stock status for all items
      const stockPromises = order.items.map(async (item) => {
        const stockInfo = await StockService.getProductStock(item.id);
        return {
          productId: item.id,
          currentStock: stockInfo.stock,
          status: stockInfo.status,
        };
      });

      result.stockStatus = await Promise.all(stockPromises);

      // Get tracking information if available
      if (order.awbCode) {
        try {
          result.trackingInfo = await ShiprocketService.getTracking(order.orderId);
        } catch (error) {
        }
      }

      return result;
    } catch (error) {
      return result;
    }
  }
}
