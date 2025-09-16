import { z } from 'zod';
import type { CouponFormData, DiscountType } from '@/types/coupon';

export const couponFormSchema = z.object({
  code: z.string()
    .min(3, 'Coupon code must be at least 3 characters')
    .max(20, 'Coupon code must be less than 20 characters')
    .regex(/^[A-Z0-9_-]+$/, 'Coupon code can only contain uppercase letters, numbers, hyphens, and underscores'),
  
  discountType: z.enum(['percentage', 'fixed', 'free_shipping'], {
    required_error: 'Please select a discount type'
  }),
  
  discountValue: z.number()
    .min(0, 'Discount value must be positive'),
  
  minOrderAmount: z.number()
    .min(0, 'Minimum order amount must be positive')
    .optional(),
  
  totalQuantity: z.number()
    .min(1, 'Total quantity must be at least 1')
    .int('Total quantity must be a whole number'),
  
  usageLimit: z.number()
    .min(1, 'Usage limit must be at least 1')
    .int('Usage limit must be a whole number')
    .optional(),
  
  perUserLimit: z.number()
    .min(1, 'Per user limit must be at least 1')
    .int('Per user limit must be a whole number')
    .optional(),
  
  validFrom: z.string()
    .min(1, 'Valid from date is required'),
  
  validTo: z.string()
    .min(1, 'Valid to date is required'),
  
  isActive: z.boolean().default(true)
}).refine((data) => {
  // Validate percentage discount
  if (data.discountType === 'percentage' && data.discountValue > 100) {
    return false;
  }
  return true;
}, {
  message: 'Percentage discount cannot exceed 100%',
  path: ['discountValue']
}).refine((data) => {
  // Validate date range
  const validFrom = new Date(data.validFrom);
  const validTo = new Date(data.validTo);
  
  if (validFrom >= validTo) {
    return false;
  }
  return true;
}, {
  message: 'Valid to date must be after valid from date',
  path: ['validTo']
}).refine((data) => {
  // Validate usage limits
  if (data.usageLimit && data.usageLimit > data.totalQuantity) {
    return false;
  }
  return true;
}, {
  message: 'Usage limit cannot exceed total quantity',
  path: ['usageLimit']
});

export type CouponFormSchema = z.infer<typeof couponFormSchema>;

// Helper function to validate coupon code uniqueness
export const validateCouponCodeUniqueness = async (
  code: string, 
  excludeId?: string,
  existingCoupons?: Record<string, any>
): Promise<boolean> => {
  if (!existingCoupons) return true;
  
  const normalizedCode = code.toUpperCase();
  const existingCodes = Object.values(existingCoupons)
    .filter((coupon: any) => !excludeId || coupon.id !== excludeId)
    .map((coupon: any) => coupon.code?.toUpperCase());
  
  return !existingCodes.includes(normalizedCode);
};

// Helper function to format form data for Firebase
export const formatCouponForFirebase = (formData: CouponFormData): any => {
  return {
    ...formData,
    code: formData.code.toUpperCase(),
    usageCount: 0, // Always start with 0 usage
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

// Helper function to validate coupon dates
export const validateCouponDates = (validFrom: string, validTo: string): string[] => {
  const errors: string[] = [];
  const now = new Date();
  const fromDate = new Date(validFrom);
  const toDate = new Date(validTo);
  
  if (fromDate >= toDate) {
    errors.push('Valid to date must be after valid from date');
  }
  
  if (toDate <= now) {
    errors.push('Coupon cannot expire in the past');
  }
  
  return errors;
};

// Helper function to calculate remaining usage
export const calculateRemainingUsage = (
  totalQuantity: number,
  usageCount: number,
  usageLimit?: number
): number => {
  if (usageLimit) {
    return Math.max(0, usageLimit - usageCount);
  }
  return Math.max(0, totalQuantity - usageCount);
};

// Helper function to check if coupon is expired
export const isCouponExpired = (validTo: string): boolean => {
  return new Date(validTo) <= new Date();
};

// Helper function to check if coupon is active and valid
export const isCouponValid = (coupon: any): boolean => {
  if (!coupon.isActive) return false;
  if (isCouponExpired(coupon.validTo)) return false;
  if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) return false;
  if (coupon.usageCount >= coupon.totalQuantity) return false;
  
  return true;
};
