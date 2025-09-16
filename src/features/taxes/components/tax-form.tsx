'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { taxFormSchema, type TaxFormData } from '../utils/form-schema';
import type { Tax } from '@/types/tax';

interface TaxFormProps {
  tax?: Tax;
  onSubmit: (data: TaxFormData) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function TaxForm({ tax, onSubmit, onCancel, loading = false }: TaxFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TaxFormData>({
    resolver: zodResolver(taxFormSchema),
    defaultValues: {
      name: tax?.name || '',
      rate: tax?.rate || 0,
      description: tax?.description || '',
      isActive: tax?.isActive ?? true,
    },
  });

  const handleSubmit = async (data: TaxFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tax Name *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., VAT, Sales Tax, GST"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="rate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tax Rate (%) *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    placeholder="e.g., 10.5"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Optional description for this tax..."
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Active Status</FormLabel>
                <div className="text-sm text-muted-foreground">
                  Enable or disable this tax
                </div>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading || isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading || isSubmitting}
          >
            {loading || isSubmitting ? 'Saving...' : tax ? 'Update Tax' : 'Create Tax'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
