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
    const actionEntry = this.createActionEntry(
      'order_confirmed',
      order.status,
      'confirmed',
      {
        ...options,
        details: options.details || 'Order confirmed and approved for processing'
      }
    );

    return {
      status: 'confirmed',
      isApproved: true,
      confirmedAt: now,
      confirmedBy: options.performedBy || 'admin',
      updatedAt: now,
      actionHistory: [
        ...(order.actionHistory || []),
        actionEntry
      ]
    };
  }

  /**
   * Cancels an order with full tracking
   */
  static cancelOrder(order: Order, options: OrderActionOptions = {}): Partial<Order> {
    const now = new Date().toISOString();
    const actionEntry = this.createActionEntry(
      'order_cancelled',
      order.status,
      'cancelled',
      {
        ...options,
        details: options.details || options.reason || 'Order cancelled'
      }
    );

    return {
      status: 'cancelled',
      isApproved: false,
      cancelledAt: now,
      cancelledBy: options.performedBy || 'admin',
      cancellationReason: options.reason,
      updatedAt: now,
      actionHistory: [
        ...(order.actionHistory || []),
        actionEntry
      ]
    };
  }

  /**
   * Updates order status with tracking
   */
  static updateOrderStatus(
    order: Order, 
    newStatus: Order['status'], 
    options: OrderActionOptions = {}
  ): Partial<Order> {
    const now = new Date().toISOString();
    const actionEntry = this.createActionEntry(
      `status_changed_to_${newStatus}`,
      order.status,
      newStatus,
      options
    );

    const updates: Partial<Order> = {
      status: newStatus,
      updatedAt: now,
      actionHistory: [
        ...(order.actionHistory || []),
        actionEntry
      ]
    };

    // Add specific fields based on status
    switch (newStatus) {
      case 'confirmed':
        updates.isApproved = true;
        updates.confirmedAt = now;
        updates.confirmedBy = options.performedBy || 'admin';
        break;
      case 'cancelled':
        updates.isApproved = false;
        updates.cancelledAt = now;
        updates.cancelledBy = options.performedBy || 'admin';
        updates.cancellationReason = options.reason;
        break;
      case 'processing':
        updates.isApproved = true;
        break;
    }

    return updates;
  }

  /**
   * Gets the latest action from order history
   */
  static getLatestAction(order: Order) {
    if (!order.actionHistory || order.actionHistory.length === 0) {
      return null;
    }
    return order.actionHistory[order.actionHistory.length - 1];
  }

  /**
   * Gets all actions of a specific type
   */
  static getActionsByType(order: Order, actionType: string) {
    if (!order.actionHistory) return [];
    return order.actionHistory.filter(action => action.action === actionType);
  }

  /**
   * Checks if an order can be cancelled
   */
  static canCancelOrder(order: Order): boolean {
    const cancelableStatuses = ['pending', 'confirmed'];
    return cancelableStatuses.includes(order.status);
  }

  /**
   * Checks if an order can be confirmed
   */
  static canConfirmOrder(order: Order): boolean {
    return order.status === 'pending';
  }

  /**
   * Gets human readable status description
   */
  static getStatusDescription(status: Order['status']): string {
    const descriptions = {
      pending: 'Waiting for confirmation',
      confirmed: 'Confirmed and ready for processing',
      processing: 'Being prepared for shipment',
      shipped: 'On the way to customer',
      delivered: 'Successfully delivered',
      cancelled: 'Order has been cancelled',
      returned: 'Order has been returned'
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
