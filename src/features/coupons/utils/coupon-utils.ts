import type { Coupon, CouponFormData, DiscountType, CouponStats } from '@/types/coupon';

// Format discount value for display
export const formatDiscountValue = (discountType: DiscountType, discountValue: number): string => {
  switch (discountType) {
    case 'percentage':
      return `${discountValue}%`;
    case 'fixed':
      return `₹${discountValue}`;
    case 'free_shipping':
      return 'Free Shipping';
    default:
      return `${discountValue}`;
  }
};

// Get status badge variant based on coupon status
export const getCouponStatusBadge = (coupon: Coupon): 'default' | 'secondary' | 'destructive' | 'outline' => {
  if (!coupon.isActive) return 'secondary';
  if (new Date(coupon.validTo) <= new Date()) return 'destructive';
  if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) return 'destructive';
  if (coupon.usageCount >= coupon.totalQuantity) return 'destructive';
  return 'default';
};

// Get status text for display
export const getCouponStatusText = (coupon: Coupon): string => {
  if (!coupon.isActive) return 'Inactive';
  if (new Date(coupon.validTo) <= new Date()) return 'Expired';
  if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) return 'Usage Limit Reached';
  if (coupon.usageCount >= coupon.totalQuantity) return 'Out of Stock';
  return 'Active';
};

// Calculate usage percentage
export const calculateUsagePercentage = (coupon: Coupon): number => {
  const maxUsage = coupon.usageLimit || coupon.totalQuantity;
  return Math.round((coupon.usageCount / maxUsage) * 100);
};

// Generate a unique coupon code
export const generateCouponCode = (prefix: string = 'COUPON'): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${timestamp}${random}`;
};

// Validate coupon code format
export const isValidCouponCode = (code: string): boolean => {
  const couponCodeRegex = /^[A-Z0-9_-]+$/;
  return couponCodeRegex.test(code) && code.length >= 3 && code.length <= 20;
};

// Calculate coupon statistics
export const calculateCouponStats = (coupons: Record<string, Coupon>): CouponStats => {
  const couponList = Object.values(coupons);
  const now = new Date();
  
  return {
    totalCoupons: couponList.length,
    activeCoupons: couponList.filter(c => c.isActive && new Date(c.validTo) > now).length,
    expiredCoupons: couponList.filter(c => new Date(c.validTo) <= now).length,
    totalUsage: couponList.reduce((sum, c) => sum + c.usageCount, 0),
    totalDiscount: couponList.reduce((sum, c) => {
      // This is a rough estimate - actual discount would depend on order values
      return sum + (c.discountType === 'fixed' ? c.discountValue * c.usageCount : 0);
    }, 0)
  };
};


// Check if coupon can be used by a specific user
export const canUserUseCoupon = (
  coupon: Coupon,
  userId: string,
  userUsageHistory?: Record<string, number>
): boolean => {
  if (!coupon.isActive) return false;
  if (new Date(coupon.validTo) <= new Date()) return false;
  if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) return false;
  if (coupon.usageCount >= coupon.totalQuantity) return false;
  
  // Check per-user limit
  if (coupon.perUserLimit && userUsageHistory) {
    const userUsage = userUsageHistory[userId] || 0;
    if (userUsage >= coupon.perUserLimit) return false;
  }
  
  return true;
};

// Calculate discount amount for an order
export const calculateDiscountAmount = (
  coupon: Coupon,
  orderAmount: number
): number => {
  // Check minimum order amount
  if (coupon.minOrderAmount && orderAmount < coupon.minOrderAmount) {
    return 0;
  }
  
  switch (coupon.discountType) {
    case 'percentage':
      return (orderAmount * coupon.discountValue) / 100;
    case 'fixed':
      return Math.min(coupon.discountValue, orderAmount);
    case 'free_shipping':
      return 0; // Free shipping is handled separately
    default:
      return 0;
  }
};

// Sort coupons by various criteria
export const sortCoupons = (
  coupons: Record<string, Coupon>,
  sortBy: 'createdAt' | 'updatedAt' | 'code' | 'usageCount' | 'validTo' = 'createdAt',
  order: 'asc' | 'desc' = 'desc'
): Array<{ id: string; coupon: Coupon }> => {
  return Object.entries(coupons)
    .map(([id, coupon]) => ({ id, coupon }))
    .sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'createdAt':
        case 'updatedAt':
        case 'validTo':
          aValue = new Date(a.coupon[sortBy] || 0);
          bValue = new Date(b.coupon[sortBy] || 0);
          break;
        case 'code':
          aValue = a.coupon.code.toLowerCase();
          bValue = b.coupon.code.toLowerCase();
          break;
        case 'usageCount':
          aValue = a.coupon.usageCount;
          bValue = b.coupon.usageCount;
          break;
        default:
          aValue = a.coupon.createdAt || '';
          bValue = b.coupon.createdAt || '';
      }
      
      if (order === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
};

// Filter coupons by various criteria
export const filterCoupons = (
  coupons: Record<string, Coupon>,
  filters: {
    status?: 'active' | 'inactive' | 'expired' | 'all';
    discountType?: DiscountType;
    searchTerm?: string;
  }
): Record<string, Coupon> => {
  let filteredCoupons = { ...coupons };
  
  if (filters.status && filters.status !== 'all') {
    filteredCoupons = Object.fromEntries(
      Object.entries(filteredCoupons).filter(([_, coupon]) => {
        switch (filters.status) {
          case 'active':
            return coupon.isActive && new Date(coupon.validTo) > new Date();
          case 'inactive':
            return !coupon.isActive;
          case 'expired':
            return new Date(coupon.validTo) <= new Date();
          default:
            return true;
        }
      })
    );
  }
  
  if (filters.discountType) {
    filteredCoupons = Object.fromEntries(
      Object.entries(filteredCoupons).filter(([_, coupon]) => 
        coupon.discountType === filters.discountType
      )
    );
  }
  
  if (filters.searchTerm) {
    const searchLower = filters.searchTerm.toLowerCase();
    filteredCoupons = Object.fromEntries(
      Object.entries(filteredCoupons).filter(([_, coupon]) => 
        coupon.code.toLowerCase().includes(searchLower)
      )
    );
  }
  
  return filteredCoupons;
};
