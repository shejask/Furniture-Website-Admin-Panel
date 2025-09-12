'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Calculator, 
  DollarSign, 
  Percent, 
  User,
  Store,
  AlertCircle
} from 'lucide-react';
import { useFirebaseData } from '@/hooks/use-firebase-database';
import { commissionFormSchema, type CommissionFormData, type Commission } from '../utils/commission-schema';

interface CommissionFormProps {
  initialData?: Commission;
  onSubmit: (data: CommissionFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  isEditing?: boolean;
}

export function CommissionForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isLoading = false, 
  isEditing = false 
}: CommissionFormProps) {
  const [calculatedCommission, setCalculatedCommission] = useState(0);
  const { data: vendors } = useFirebaseData('vendors');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid }
  } = useForm<CommissionFormData>({
    resolver: zodResolver(commissionFormSchema),
    defaultValues: initialData ? {
      vendorId: initialData.vendorId,
      commissionRate: initialData.commissionRate,
      totalSales: initialData.totalSales,
      commissionEarned: initialData.commissionEarned,
      period: initialData.period,
      status: initialData.status,
      notes: initialData.notes,
      paymentDate: initialData.paymentDate,
      transactionId: initialData.transactionId
    } : {
      commissionRate: 10,
      totalSales: 0,
      commissionEarned: 0,
      period: 'monthly',
      status: 'pending'
    }
  });

  const watchedCommissionRate = watch('commissionRate');
  const watchedTotalSales = watch('totalSales');

  // Calculate commission when rate or sales change
  useEffect(() => {
    const rate = watchedCommissionRate || 0;
    const sales = watchedTotalSales || 0;
    const calculated = (sales * rate) / 100;
    setCalculatedCommission(calculated);
    setValue('commissionEarned', calculated);
  }, [watchedCommissionRate, watchedTotalSales, setValue]);

  const handleFormSubmit = (data: CommissionFormData) => {
    onSubmit({
      ...data,
      commissionEarned: calculatedCommission
    });
  };

  const getVendorName = (vendorId: string) => {
    if (!vendors || !vendorId) return '';
    const vendor = vendors[vendorId] as any;
    return vendor?.storeName || vendor?.name || 'Unknown Vendor';
  };

  const getVendorStore = (vendorId: string) => {
    if (!vendors || !vendorId) return '';
    const vendor = vendors[vendorId] as any;
    return vendor?.slug || '';
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Vendor Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Vendor Information
            </CardTitle>
            <CardDescription>
              Select the vendor for this commission record
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="vendorId">Vendor *</Label>
              <Select 
                value={watch('vendorId')} 
                onValueChange={(value) => setValue('vendorId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a vendor" />
                </SelectTrigger>
                <SelectContent>
                  {vendors && Object.entries(vendors).map(([id, vendor]) => {
                    const vendorData = vendor as any;
                    return (
                      <SelectItem key={id} value={id}>
                        <div className="flex items-center gap-2">
                          <Store className="h-4 w-4" />
                          <span>{vendorData.storeName}</span>
                          <Badge variant="outline" className="ml-auto">
                            {vendorData.status}
                          </Badge>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {errors.vendorId && (
                <p className="text-sm text-red-500 mt-1">{errors.vendorId.message}</p>
              )}
            </div>

            {watch('vendorId') && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Store className="h-4 w-4" />
                  <span className="font-medium">{getVendorName(watch('vendorId'))}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Store: {getVendorStore(watch('vendorId'))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Commission Calculator */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Commission Calculator
            </CardTitle>
            <CardDescription>
              Calculate commission based on sales and rate
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="commissionRate">Commission Rate (%) *</Label>
              <div className="relative">
                <Input
                  id="commissionRate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  {...register('commissionRate', { valueAsNumber: true })}
                  className="pl-8"
                />
                <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              {errors.commissionRate && (
                <p className="text-sm text-red-500 mt-1">{errors.commissionRate.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="totalSales">Total Sales (₹) *</Label>
              <div className="relative">
                <Input
                  id="totalSales"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('totalSales', { valueAsNumber: true })}
                  className="pl-8"
                />
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              {errors.totalSales && (
                <p className="text-sm text-red-500 mt-1">{errors.totalSales.message}</p>
              )}
            </div>

            <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Commission Earned:</span>
                <span className="text-lg font-bold text-primary">
                  ₹{calculatedCommission.toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Commission Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Commission Details
          </CardTitle>
          <CardDescription>
            Additional information about the commission
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="period">Period</Label>
              <Select value={watch('period')} onValueChange={(value) => setValue('period', value as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={watch('status')} onValueChange={(value) => setValue('status', value as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="paymentDate">Payment Date</Label>
              <Input
                id="paymentDate"
                type="date"
                {...register('paymentDate')}
              />
            </div>

            <div>
              <Label htmlFor="transactionId">Transaction ID</Label>
              <Input
                id="transactionId"
                placeholder="Enter transaction ID"
                {...register('transactionId')}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes..."
              {...register('notes')}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Summary Card */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Commission Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {watchedCommissionRate || 0}%
              </div>
              <div className="text-sm text-muted-foreground">Commission Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                ${watchedTotalSales?.toLocaleString() || 0}
              </div>
              <div className="text-sm text-muted-foreground">Total Sales</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                ${calculatedCommission.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">Commission Earned</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {watch('period')?.charAt(0).toUpperCase() + watch('period')?.slice(1)}
              </div>
              <div className="text-sm text-muted-foreground">Period</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-4 pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!isValid || isLoading}
        >
          {isLoading ? 'Saving...' : isEditing ? 'Update Commission' : 'Create Commission'}
        </Button>
      </div>
    </form>
  );
} 