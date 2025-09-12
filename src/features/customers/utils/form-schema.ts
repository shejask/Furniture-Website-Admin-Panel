import * as z from 'zod';

const addressSchema = z.object({
  id: z.string().optional(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().min(1, 'Phone is required'),
  addressName: z.string().min(1, 'Address name is required'),
  streetAddress: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  country: z.string().min(1, 'Country is required'),
  zip: z.string().min(1, 'Zip is required'),
});

export const customerFormSchema = z.object({
  uid: z.string().optional(),
  fullName: z.string().min(1, 'Full name is required'),
  name: z.string().optional(),
  email: z.string().email('Invalid email address'),
  phone: z.union([z.string(), z.number()]).optional(),
  country_code: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  addresses: z.record(addressSchema).optional(),
});

export { addressSchema };

export type CustomerFormData = z.infer<typeof customerFormSchema>; 