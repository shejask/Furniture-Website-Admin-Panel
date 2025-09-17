'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Coupon, CouponFormData, DiscountType } from '@/types/coupon';
import { couponFormSchema, validateCouponCodeUniqueness, formatCouponForFirebase } from '../utils/form-schema';
import { generateCouponCode } from '../utils/coupon-utils';
import { useFirebaseData } from '@/hooks/use-firebase-database';

interface CouponFormProps {
  coupon?: Coupon;
  // These function props are safe in this context as component is only used client-side
  onSubmit: (data: CouponFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function CouponForm({ coupon, onSubmit, onCancel, loading = false }: CouponFormProps) {
  const [codeError, setCodeError] = useState<string>('');
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);

  const { data: existingCoupons } = useFirebaseData('coupons');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset
  } = useForm<CouponFormData>({
    resolver: zodResolver(couponFormSchema),
    defaultValues: {
      code: '',
      discountType: 'percentage',
      discountValue: 0,
      minOrderAmount: undefined,
      totalQuantity: 1000,
      usageLimit: undefined,
      perUserLimit: undefined,
      validFrom: '',
      validTo: '',
      isActive: true
    }
  });

  const watchedDiscountType = watch('discountType');
  const watchedCode = watch('code');

  // Load existing coupon data for editing
  useEffect(() => {
    if (coupon) {
      reset({
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minOrderAmount: coupon.minOrderAmount,
        totalQuantity: coupon.totalQuantity,
        usageLimit: coupon.usageLimit,
        perUserLimit: coupon.perUserLimit,
        validFrom: coupon.validFrom,
        validTo: coupon.validTo,
        isActive: coupon.isActive
      });
    }
  }, [coupon, reset]);


  // Validate coupon code uniqueness
  useEffect(() => {
    const validateCode = async () => {
      if (watchedCode && watchedCode.length >= 3) {
        try {
          const isUnique = await validateCouponCodeUniqueness(
            watchedCode,
            coupon?.id,
            existingCoupons
          );
          if (!isUnique) {
            setCodeError('This coupon code already exists');
          } else {
            setCodeError('');
          }
        } catch (error) {
          setCodeError('Error validating coupon code');
        }
      } else {
        setCodeError('');
      }
    };

    const timeoutId = setTimeout(validateCode, 500);
    return () => clearTimeout(timeoutId);
  }, [watchedCode, coupon?.id, existingCoupons]);

  const handleGenerateCode = async () => {
    setIsGeneratingCode(true);
    try {
      const newCode = generateCouponCode();
      setValue('code', newCode);
    } finally {
      setIsGeneratingCode(false);
    }
  };


  const handleDateChange = (field: 'validFrom' | 'validTo', date: Date | undefined) => {
    if (date) {
      setValue(field, date.toISOString());
    }
  };

  const onFormSubmit = async (data: CouponFormData) => {
    if (codeError) return;
    
    const formattedData = formatCouponForFirebase(data);
    await onSubmit(formattedData);
  };

  // Check if form is ready to submit
  const isFormValid = () => {
    const hasCode = watch('code') && watch('code').length >= 3;
    const discountType = watch('discountType');
    const discountValue = watch('discountValue');
    const hasDiscountValue = discountType === 'free_shipping' ? true : discountValue > 0;
    const hasValidFrom = watch('validFrom');
    const hasValidTo = watch('validTo');
    const hasTotalQuantity = watch('totalQuantity') > 0;
    const noCodeError = !codeError;
    
    return hasCode && hasDiscountValue && hasValidFrom && hasValidTo && hasTotalQuantity && noCodeError;
  };


  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            Configure the basic coupon details and discount settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Coupon Code *</Label>
              <div className="flex gap-2">
                <Input
                  id="code"
                  {...register('code')}
                  placeholder="e.g., WELCOME10"
                  className={cn(codeError && 'border-red-500')}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateCode}
                  disabled={isGeneratingCode}
                >
                  <RefreshCw className={cn("h-4 w-4", isGeneratingCode && "animate-spin")} />
                </Button>
              </div>
              {errors.code && <p className="text-sm text-red-500">{errors.code.message}</p>}
              {codeError && <p className="text-sm text-red-500">{codeError}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="discountType">Discount Type *</Label>
              <Select
                value={watch('discountType')}
                onValueChange={(value: DiscountType) => setValue('discountType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select discount type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                  <SelectItem value="free_shipping">Free Shipping</SelectItem>
                </SelectContent>
              </Select>
              {errors.discountType && <p className="text-sm text-red-500">{errors.discountType.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="discountValue">
                {watchedDiscountType === 'percentage' ? 'Discount Percentage *' : 
                 watchedDiscountType === 'fixed' ? 'Discount Amount (₹) *' : 'Value'}
              </Label>
              <div className="relative">
                {watchedDiscountType === 'fixed' && (
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">₹</span>
                )}
                <Input
                  id="discountValue"
                  type="number"
                  {...register('discountValue', { valueAsNumber: true })}
                  placeholder={
                    watchedDiscountType === 'percentage' ? 'Enter percentage' :
                    watchedDiscountType === 'fixed' ? 'Enter amount' : '0'
                  }
                  className={watchedDiscountType === 'fixed' ? 'pl-8' : ''}
                  disabled={watchedDiscountType === 'free_shipping'}
                />
                {watchedDiscountType === 'percentage' && (
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">%</span>
                )}
              </div>
              {errors.discountValue && <p className="text-sm text-red-500">{errors.discountValue.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalQuantity">Total Usage Limit *</Label>
              <Input
                id="totalQuantity"
                type="number"
                {...register('totalQuantity', { valueAsNumber: true })}
                placeholder="Enter total usage limit"
              />
              <p className="text-xs text-muted-foreground">
                Maximum number of times this coupon can be used in total
              </p>
              {errors.totalQuantity && <p className="text-sm text-red-500">{errors.totalQuantity.message}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Order Requirements</CardTitle>
          <CardDescription>
            Set minimum order requirements for this coupon
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="minOrderAmount">Minimum Order Amount (₹)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">₹</span>
              <Input
                id="minOrderAmount"
                type="number"
                {...register('minOrderAmount', { valueAsNumber: true })}
                placeholder="Enter minimum order amount"
                className="pl-8"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Leave empty if no minimum order amount is required
            </p>
            {errors.minOrderAmount && <p className="text-sm text-red-500">{errors.minOrderAmount.message}</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usage Limits</CardTitle>
          <CardDescription>
            Configure how many times this coupon can be used
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="usageLimit">Additional Usage Limit</Label>
              <Input
                id="usageLimit"
                type="number"
                {...register('usageLimit', { valueAsNumber: true })}
                placeholder="Leave empty to use total usage limit"
              />
              <p className="text-xs text-muted-foreground">
                Optional: Set a lower limit than total usage limit for special campaigns
              </p>
              {errors.usageLimit && <p className="text-sm text-red-500">{errors.usageLimit.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="perUserLimit">Per Customer Limit</Label>
              <Input
                id="perUserLimit"
                type="number"
                {...register('perUserLimit', { valueAsNumber: true })}
                placeholder="Leave empty for unlimited"
              />
              <p className="text-xs text-muted-foreground">
                Maximum number of times one customer can use this coupon (optional)
              </p>
              {errors.perUserLimit && <p className="text-sm text-red-500">{errors.perUserLimit.message}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Validity Period</CardTitle>
          <CardDescription>
            Set when this coupon is valid
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valid From *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !watch('validFrom') && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {watch('validFrom') ? format(new Date(watch('validFrom')), 'PPP') : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={watch('validFrom') ? new Date(watch('validFrom')) : undefined}
                    onSelect={(date: Date | undefined) => handleDateChange('validFrom', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.validFrom && <p className="text-sm text-red-500">{errors.validFrom.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Valid To *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !watch('validTo') && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {watch('validTo') ? format(new Date(watch('validTo')), 'PPP') : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={watch('validTo') ? new Date(watch('validTo')) : undefined}
                    onSelect={(date: Date | undefined) => handleDateChange('validTo', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.validTo && <p className="text-sm text-red-500">{errors.validTo.message}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
          <CardDescription>
            Control the active state of this coupon
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={watch('isActive')}
              onCheckedChange={(checked: boolean) => setValue('isActive', checked)}
            />
            <Label htmlFor="isActive">Active</Label>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Inactive coupons cannot be used by customers
          </p>
        </CardContent>
      </Card>


      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading || !isFormValid()}>
          {loading ? 'Saving...' : (coupon ? 'Update Coupon' : 'Create Coupon')}
        </Button>
      </div>
    </form>
  );
}
