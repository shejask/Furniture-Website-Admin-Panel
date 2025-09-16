# Coupon Management System

A comprehensive coupon management system for the admin panel that supports creating, editing, and deleting coupons with advanced features.

## Features

### Core Functionality
- ✅ Create, edit, and delete coupons
- ✅ Unique coupon code validation
- ✅ Multiple discount types (percentage, fixed amount, free shipping)
- ✅ Usage limits and tracking
- ✅ Date-based validity periods
- ✅ Real-time statistics and analytics
- ✅ Simple cart-wide discounts (no complex targeting)

### Advanced Features
- ✅ Form validation with Zod schema
- ✅ Real-time filtering and searching
- ✅ Usage percentage tracking with visual indicators
- ✅ Automatic coupon code generation
- ✅ Comprehensive status management
- ✅ Firebase Firestore integration
- ✅ Simplified design without complex targeting

## Schema

The coupon system uses the following simplified Firebase Firestore schema:

```json
{
  "code": "WELCOME10",
  "discountType": "percentage",
  "discountValue": 10,
  "minOrderAmount": 500,
  "totalQuantity": 1000,
  "usageCount": 0,
  "usageLimit": 100,
  "perUserLimit": 1,
  "validFrom": "2025-09-01T00:00:00Z",
  "validTo": "2025-09-30T23:59:59Z",
  "isActive": true
}
```

## Usage

### Basic Usage

```tsx
import { CouponsTable } from '@/features/coupons';

export default function CouponsPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Coupon Management</h1>
        <p className="text-muted-foreground">
          Manage discount coupons and promotional codes
        </p>
      </div>
      <CouponsTable />
    </div>
  );
}
```

### Using Individual Components

```tsx
import { CouponForm } from '@/features/coupons/components/coupon-form';
import { formatDiscountValue, calculateUsagePercentage } from '@/features/coupons/utils/coupon-utils';

// Use the form component
<CouponForm
  coupon={existingCoupon}
  onSubmit={handleSubmit}
  onCancel={handleCancel}
  loading={isLoading}
/>

// Use utility functions
const discountText = formatDiscountValue('percentage', 15); // "15%"
const usagePercent = calculateUsagePercentage(coupon); // 45
```

## Field Descriptions

### Required Fields
- **code**: Unique coupon code (3-20 characters, uppercase alphanumeric)
- **discountType**: Type of discount (`percentage`, `fixed`, `free_shipping`)
- **discountValue**: Discount amount (percentage 0-100, fixed amount, or 0 for free shipping)
- **totalQuantity**: Total number of times this coupon can be used
- **validFrom**: Coupon start date (ISO timestamp)
- **validTo**: Coupon expiry date (ISO timestamp)

### Optional Fields
- **minOrderAmount**: Minimum cart value required (₹)
- **usageLimit**: Additional usage limit (optional override of totalQuantity)
- **perUserLimit**: Maximum uses per customer
- **isActive**: Enable/disable coupon (default: true)

### System Fields
- **usageCount**: Automatically incremented on each use
- **createdAt**: Creation timestamp (auto-generated)
- **updatedAt**: Last update timestamp (auto-generated)

## Validation Rules

1. **Coupon Code**: Must be unique, 3-20 characters, uppercase alphanumeric with hyphens/underscores
2. **Discount Value**: Percentage cannot exceed 100%, fixed amounts must be positive
3. **Date Range**: Valid to date must be after valid from date
4. **Usage Limits**: Usage limit cannot exceed total quantity
5. **Total Quantity**: Must be at least 1 and represents maximum usage count

## Status Types

- **Active**: Coupon is active and within validity period
- **Inactive**: Manually disabled by admin
- **Expired**: Past the valid to date
- **Usage Limit Reached**: Hit the usage limit
- **Out of Stock**: Hit the total quantity limit

## Firebase Integration

The system integrates with Firebase Firestore using the existing hooks:

```tsx
import { useFirebaseData, useFirebaseOperations } from '@/hooks/use-firebase-database';

const { data: coupons, loading } = useFirebaseData('coupons');
const { createWithKey, update, remove } = useFirebaseOperations();
```

## Utilities

### Available Utility Functions

- `formatDiscountValue()` - Format discount for display
- `formatTargetType()` - Format target type for display
- `getCouponStatusBadge()` - Get appropriate badge variant
- `getCouponStatusText()` - Get status text
- `calculateUsagePercentage()` - Calculate usage percentage
- `generateCouponCode()` - Generate unique coupon codes
- `calculateCouponStats()` - Calculate overall statistics
- `filterCoupons()` - Filter coupons by criteria
- `sortCoupons()` - Sort coupons by various fields
- `isCouponValid()` - Check if coupon can be used
- `canUserUseCoupon()` - Check user-specific usage limits

## Example Coupons

### Percentage Discount
```json
{
  "code": "SAVE20",
  "discountType": "percentage",
  "discountValue": 20,
  "minOrderAmount": 1000,
  "totalQuantity": 500,
  "validFrom": "2025-01-01T00:00:00Z",
  "validTo": "2025-12-31T23:59:59Z",
  "isActive": true
}
```

### Fixed Amount Discount
```json
{
  "code": "FURNITURE50",
  "discountType": "fixed",
  "discountValue": 500,
  "minOrderAmount": 2000,
  "totalQuantity": 100,
  "usageLimit": 50,
  "perUserLimit": 2,
  "validFrom": "2025-01-01T00:00:00Z",
  "validTo": "2025-03-31T23:59:59Z",
  "isActive": true
}
```

### Free Shipping
```json
{
  "code": "FREESHIP",
  "discountType": "free_shipping",
  "discountValue": 0,
  "minOrderAmount": 500,
  "totalQuantity": 1000,
  "validFrom": "2025-01-01T00:00:00Z",
  "validTo": "2025-06-30T23:59:59Z",
  "isActive": true
}
```

## Testing

The system includes comprehensive validation and error handling. All forms are validated using Zod schemas, and the UI provides real-time feedback for validation errors.

## Future Enhancements

Potential future features:
- Bulk coupon operations
- Coupon usage analytics and reporting
- Automated coupon expiration notifications
- Integration with email marketing systems
- Advanced targeting rules (user segments, purchase history)
- Coupon code import/export functionality
