/**
 * Commission calculation utilities for orders
 */

import { OrderItem } from './form-schema';

/**
 * Calculate commission for an order based on items
 * @param items - Array of order items
 * @param defaultCommissionRate - Default commission rate (percentage) if no item-specific rate
 * @returns Total commission amount
 */
export function calculateOrderCommission(
  items: OrderItem[], 
  defaultCommissionRate: number = 10
): number {
  if (!items || items.length === 0) return 0;

  let totalCommission = 0;

  items.forEach(item => {
    // Parse commission amount (handle string or number)
    let commissionAmount = 0;
    if (item.commissionAmount) {
      commissionAmount = typeof item.commissionAmount === 'string' 
        ? parseFloat(item.commissionAmount) || 0
        : item.commissionAmount;
    }
    
    // Debug logging for commission calculation
    if (process.env.NODE_ENV === 'development') {
      console.log('=== Commission Calculation Debug ===');
      console.log('Item:', item.name);
      console.log('Raw commission amount:', item.commissionAmount);
      console.log('Parsed commission amount:', commissionAmount);
      console.log('Item price:', item.price);
      console.log('Item quantity:', item.quantity);
    }
    
    // If item has valid commission amount, use it directly
    if (commissionAmount > 0) {
      const itemTotal = commissionAmount * item.quantity;
      totalCommission += itemTotal;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Using product commission:', commissionAmount, '× quantity:', item.quantity, '=', itemTotal);
      }
    } else {
      // Otherwise, calculate based on price and default rate
      const itemCommission = (item.price * defaultCommissionRate) / 100;
      const itemTotal = itemCommission * item.quantity;
      totalCommission += itemTotal;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Using default commission:', item.price, '×', defaultCommissionRate + '%', '×', item.quantity, '=', itemTotal);
      }
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Running total commission:', totalCommission);
      console.log('=====================================');
    }
  });

  return Math.round(totalCommission * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate commission rate as percentage of subtotal
 * @param commission - Commission amount
 * @param subtotal - Order subtotal
 * @returns Commission rate percentage
 */
export function calculateCommissionRate(commission: number, subtotal: number): number {
  if (subtotal === 0) return 0;
  return Math.round((commission / subtotal) * 100 * 100) / 100; // Round to 2 decimal places
}

/**
 * Get commission breakdown by vendor (if multiple vendors in order)
 * @param items - Array of order items
 * @returns Object with vendor commission breakdown
 */
export function getCommissionBreakdown(items: OrderItem[]): { [vendorId: string]: number } {
  const breakdown: { [vendorId: string]: number } = {};

  items.forEach(item => {
    const vendorId = item.vendor || 'default';
    
    // Parse commission amount (handle string or number)
    let commissionAmount = 0;
    if (item.commissionAmount) {
      commissionAmount = typeof item.commissionAmount === 'string' 
        ? parseFloat(item.commissionAmount) || 0
        : item.commissionAmount;
    }
    
    const itemCommission = commissionAmount > 0
      ? commissionAmount * item.quantity
      : (item.price * 10) / 100 * item.quantity; // Default 10% if no commission set

    breakdown[vendorId] = (breakdown[vendorId] || 0) + itemCommission;
  });

  return breakdown;
}
