'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { customerFormSchema, addressSchema, type CustomerFormData } from '../utils/form-schema';
import { Plus, Trash2, MapPin } from 'lucide-react';

interface Address {
  id?: string;
  firstName: string;
  lastName: string;
  phone: string;
  addressName: string;
  streetAddress: string;
  city: string;
  state: string;
  country: string;
  zip: string;
  createdAt?: string;
  updatedAt?: string;
}

interface CustomerFormProps {
  initialData?: CustomerFormData;
  onSubmit: (data: CustomerFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  isEditing?: boolean;
}

type FormData = CustomerFormData & { addressesArray: Address[] };

export function CustomerForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  isEditing = false
}: CustomerFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Convert addresses object to array for form handling
  const addressesArray = initialData?.addresses 
    ? Object.entries(initialData.addresses).map(([id, address]) => ({ id, ...address }))
    : [];

  const form = useForm<FormData>({
    resolver: zodResolver(customerFormSchema.extend({
      addressesArray: addressSchema.array().optional()
    })),
    defaultValues: {
      ...initialData,
      uid: initialData?.uid || '',
      fullName: initialData?.fullName || '',
      name: initialData?.name || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      country_code: initialData?.country_code || '91',
      status: initialData?.status || 'active',
      addressesArray: addressesArray
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'addressesArray'
  });

  const handleSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      // Convert addresses array back to object format
      const addresses: { [key: string]: any } = {};
      data.addressesArray?.forEach((address, index) => {
        const id = address.id || `addr_${Date.now()}_${index}`;
        const { id: _, ...addressWithoutId } = address;
        addresses[id] = {
          ...addressWithoutId,
          id,
          createdAt: address.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      });

      const { addressesArray, ...restData } = data;
      const formattedData: CustomerFormData = {
        ...restData,
        addresses
      };

      await onSubmit(formattedData);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create customer';
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addAddress = () => {
    append({
      id: `addr_${Date.now()}`,
      firstName: '',
      lastName: '',
      phone: '',
      addressName: '',
      streetAddress: '',
      city: '',
      state: '',
      country: '',
      zip: ''
    });
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="uid">UID</Label>
              <Input
                id="uid"
                {...form.register('uid')}
                placeholder="Auto-generated"
                disabled={true}
                className="bg-muted cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">Auto-generated user identifier</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={form.watch('status') || 'active'}
                onValueChange={(value) => form.setValue('status', value as 'active' | 'inactive')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                {...form.register('fullName')}
                placeholder="Enter Full Name"
              />
              {form.formState.errors.fullName && (
                <p className="text-xs text-red-600">{form.formState.errors.fullName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <Input
                id="name"
                {...form.register('name')}
                placeholder="Enter Display Name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                {...form.register('email')}
                placeholder="Enter Email Address"
              />
              {form.formState.errors.email && (
                <p className="text-xs text-red-600">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <div className="flex space-x-2">
                <Select
                  value={form.watch('country_code') || '91'}
                  onValueChange={(value) => form.setValue('country_code', value)}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="91">+91</SelectItem>
                    <SelectItem value="1">+1</SelectItem>
                    <SelectItem value="44">+44</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  id="phone"
                  type="tel"
                  {...form.register('phone')}
                  placeholder="Enter Phone Number"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Addresses */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>Addresses</span>
          </CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={addAddress}>
            <Plus className="h-4 w-4 mr-2" />
            Add Address
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No addresses added yet</p>
              <Button type="button" variant="outline" onClick={addAddress} className="mt-2">
                Add First Address
              </Button>
            </div>
          ) : (
            fields.map((field, index) => (
              <Card key={field.id} className="border border-muted">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <h4 className="text-sm font-medium">Address {index + 1}</h4>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`addressesArray.${index}.firstName`}>First Name *</Label>
                      <Input
                        {...form.register(`addressesArray.${index}.firstName`)}
                        placeholder="First Name"
                      />
                      {form.formState.errors.addressesArray?.[index]?.firstName && (
                        <p className="text-xs text-red-600">
                          {form.formState.errors.addressesArray[index]?.firstName?.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`addressesArray.${index}.lastName`}>Last Name *</Label>
                      <Input
                        {...form.register(`addressesArray.${index}.lastName`)}
                        placeholder="Last Name"
                      />
                      {form.formState.errors.addressesArray?.[index]?.lastName && (
                        <p className="text-xs text-red-600">
                          {form.formState.errors.addressesArray[index]?.lastName?.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`addressesArray.${index}.phone`}>Phone *</Label>
                      <Input
                        {...form.register(`addressesArray.${index}.phone`)}
                        placeholder="Phone"
                      />
                      {form.formState.errors.addressesArray?.[index]?.phone && (
                        <p className="text-xs text-red-600">
                          {form.formState.errors.addressesArray[index]?.phone?.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`addressesArray.${index}.addressName`}>Address Name *</Label>
                      <Input
                        {...form.register(`addressesArray.${index}.addressName`)}
                        placeholder="e.g., Mannarkkad, Mannarkkad"
                      />
                      {form.formState.errors.addressesArray?.[index]?.addressName && (
                        <p className="text-xs text-red-600">
                          {form.formState.errors.addressesArray[index]?.addressName?.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor={`addressesArray.${index}.streetAddress`}>Street Address *</Label>
                      <Input
                        {...form.register(`addressesArray.${index}.streetAddress`)}
                        placeholder="Street address"
                      />
                      {form.formState.errors.addressesArray?.[index]?.streetAddress && (
                        <p className="text-xs text-red-600">
                          {form.formState.errors.addressesArray[index]?.streetAddress?.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`addressesArray.${index}.city`}>City *</Label>
                      <Input
                        {...form.register(`addressesArray.${index}.city`)}
                        placeholder="City"
                      />
                      {form.formState.errors.addressesArray?.[index]?.city && (
                        <p className="text-xs text-red-600">
                          {form.formState.errors.addressesArray[index]?.city?.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`addressesArray.${index}.state`}>State *</Label>
                      <Input
                        {...form.register(`addressesArray.${index}.state`)}
                        placeholder="State"
                      />
                      {form.formState.errors.addressesArray?.[index]?.state && (
                        <p className="text-xs text-red-600">
                          {form.formState.errors.addressesArray[index]?.state?.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`addressesArray.${index}.country`}>Country *</Label>
                      <Input
                        {...form.register(`addressesArray.${index}.country`)}
                        placeholder="Country"
                      />
                      {form.formState.errors.addressesArray?.[index]?.country && (
                        <p className="text-xs text-red-600">
                          {form.formState.errors.addressesArray[index]?.country?.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`addressesArray.${index}.zip`}>Zip *</Label>
                      <Input
                        {...form.register(`addressesArray.${index}.zip`)}
                        placeholder="Zip"
                      />
                      {form.formState.errors.addressesArray?.[index]?.zip && (
                        <p className="text-xs text-red-600">
                          {form.formState.errors.addressesArray[index]?.zip?.message}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading || isSubmitting}>
          {isLoading || isSubmitting ? 'Saving...' : (isEditing ? 'Update' : 'Create')}
        </Button>
      </div>
    </form>
  );
}