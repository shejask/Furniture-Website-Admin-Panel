import { z } from 'zod';

export const vendorFormSchema = z.object({
  storeLogo: z.string().optional(),
  storeName: z.string().min(1, 'Store name is required'),
  
  storeDescription: z.string().min(1, 'Store description is required'),
  country: z.string().min(1, 'Country is required'),
  state: z.string().min(1, 'State is required'),
  city: z.string().min(1, 'City is required'),
  address: z.string().min(1, 'Address is required'),
  pincode: z.string().min(1, 'Pincode is required'),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Confirm password is required'),
  // New optional fields
  gstNumber: z.string().optional(),
  panNumber: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankName: z.string().optional(),
  bankIfscCode: z.string().optional(),
  ownerName: z.string().optional(),
  whatsappNumber: z.string().optional(),
  // Social media fields
  facebook: z.string().optional(),
  pinterest: z.string().optional(),
  instagram: z.string().optional(),
  twitter: z.string().optional(),
  youtube: z.string().optional(),
  status: z.enum(['active', 'inactive']).default('active')
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type VendorFormData = z.infer<typeof vendorFormSchema>;

export interface Vendor {
  id: string;
  storeLogo?: string;
  storeName: string;
  storeDescription: string;
  country: string;
  state: string;
  city: string;
  address: string;
  pincode: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  // New optional fields
  gstNumber?: string;
  panNumber?: string;
  bankAccountNumber?: string;
  bankName?: string;
  bankIfscCode?: string;
  ownerName?: string;
  whatsappNumber?: string;
  // Social media fields
  facebook?: string;
  pinterest?: string;
  instagram?: string;
  twitter?: string;
  youtube?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
} 