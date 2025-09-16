export { CouponsTable } from './components/coupons-table';
export { CouponForm } from './components/coupon-form';

// Export types
export type {
  Coupon,
  CouponFormData,
  DiscountType,
  CouponUsage,
  CouponValidation,
  CouponStats
} from '@/types/coupon';

// Export utilities
export {
  formatDiscountValue,
  getCouponStatusBadge,
  getCouponStatusText,
  calculateUsagePercentage,
  generateCouponCode,
  isValidCouponCode,
  calculateCouponStats,
  canUserUseCoupon,
  calculateDiscountAmount,
  sortCoupons,
  filterCoupons
} from './utils/coupon-utils';

export {
  couponFormSchema,
  validateCouponCodeUniqueness,
  formatCouponForFirebase,
  validateCouponDates,
  calculateRemainingUsage,
  isCouponExpired,
  isCouponValid
} from './utils/form-schema';
