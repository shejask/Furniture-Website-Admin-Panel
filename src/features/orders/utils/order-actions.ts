import { Order } from './form-schema';

export interface OrderActionOptions {
  performedBy?: string;
  reason?: string;
  details?: string;
}

export class OrderActionManager {
  
  /**
   * Creates an action history entry
   */
  private static createActionEntry(
    action: string,
    previousStatus: string,
    newStatus: string,
    options: OrderActionOptions = {}
  ) {
    return {
      action,
      timestamp: new Date().toISOString(),
      performedBy: options.performedBy || 'system',
      details: options.details,
      previousStatus,
      newStatus,
    };
  }

  /**
   * Confirms an order with full tracking
   */
  static confirmOrder(order: Order, options: OrderActionOptions = {}): Partial<Order> {
    const now = new Date().toISOString();
    
    return {
      orderStatus: 'confirmed',
      updatedAt: now
    };
  }

  /**
   * Cancels an order with full tracking
   */
  static cancelOrder(order: Order, options: OrderActionOptions = {}): Partial<Order> {
    const now = new Date().toISOString();
    
    return {
      orderStatus: 'cancelled',
      cancellationReason: options.reason,
      cancelledAt: now,
      updatedAt: now
    };
  }

  /**
   * Updates order status with tracking
   */
  static updateOrderStatus(
    order: Order, 
    newStatus: Order['orderStatus'], 
    options: OrderActionOptions = {}
  ): Partial<Order> {
    const now = new Date().toISOString();

    const updates: Partial<Order> = {
      orderStatus: newStatus,
      updatedAt: now
    };

    // Add specific fields based on status
    switch (newStatus) {
      case 'cancelled':
        updates.cancelledAt = now;
        updates.cancellationReason = options.reason;
        break;
      case 'refunded':
        updates.refundedAt = now;
        updates.refundReason = options.reason;
        break;
    }

    return updates;
  }

  /**
   * Gets the latest action from order history (simplified - returns order status)
   */
  static getLatestAction(order: Order) {
    return {
      action: `order_${order.orderStatus}`,
      timestamp: order.updatedAt,
      status: order.orderStatus
    };
  }

  /**
   * Gets all actions of a specific type (simplified implementation)
   */
  static getActionsByType(order: Order, actionType: string): any[] {
    // Simplified implementation since actionHistory doesn't exist in current Order interface
    return [];
  }

  /**
   * Checks if an order can be cancelled
   */
  static canCancelOrder(order: Order): boolean {
    const cancelableStatuses = ['pending', 'confirmed'];
    return cancelableStatuses.includes(order.orderStatus);
  }

  /**
   * Checks if an order can be confirmed
   */
  static canConfirmOrder(order: Order): boolean {
    return order.orderStatus === 'pending';
  }

  /**
   * Gets human readable status description
   */
  static getStatusDescription(status: Order['orderStatus']): string {
    const descriptions: Record<Order['orderStatus'], string> = {
      pending: 'Waiting for confirmation',
      confirmed: 'Confirmed and ready for processing',
      shipped: 'On the way to customer',
      delivered: 'Successfully delivered',
      cancelled: 'Order has been cancelled',
      refunded: 'Order has been refunded'
    };
    return descriptions[status] || status;
  }

  /**
   * Gets cancellation reasons
   */
  static getCancellationReasons(): string[] {
    return [
      'Customer requested cancellation',
      'Payment failed',
      'Out of stock',
      'Duplicate order',
      'Fraud detection',
      'Shipping address invalid',
      'Customer not reachable',
      'Other'
    ];
  }
}
