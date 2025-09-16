export type DiscountType = 'percentage' | 'fixed' | 'free_shipping';

export interface Coupon {
  id?: string;
  code: string;
  discountType: DiscountType;
  discountValue: number; // percentage, fixed amount, or 0 for free_shipping
  minOrderAmount?: number;
  totalQuantity: number; // total number of times this coupon can be used
  usageCount: number; // incremented each time coupon is used
  usageLimit?: number; // max total uses allowed (optional override)
  perUserLimit?: number; // max times one customer can use it
  validFrom: string; // ISO timestamp
  validTo: string; // ISO timestamp
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CouponFormData {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount?: number;
  totalQuantity: number;
  usageLimit?: number;
  perUserLimit?: number;
  validFrom: string;
  validTo: string;
  isActive: boolean;
}

export interface CouponUsage {
  couponId: string;
  userId: string;
  orderId: string;
  usedAt: string;
  discountAmount: number;
}

// Validation rules
export interface CouponValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Coupon statistics
export interface CouponStats {
  totalCoupons: number;
  activeCoupons: number;
  expiredCoupons: number;
  totalUsage: number;
  totalDiscount: number;
}
