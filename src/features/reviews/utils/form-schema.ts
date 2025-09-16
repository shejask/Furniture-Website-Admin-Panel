import { z } from 'zod';

export const reviewFormSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  productName: z.string().min(1, 'Product name is required'),
  productImage: z.string().optional(),
  customerId: z.string().min(1, 'Customer is required'),
  customerName: z.string().min(1, 'Customer name is required'),
  customerEmail: z.string().email('Invalid email address'),
  rating: z.number().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
  title: z.string().min(1, 'Review title is required').max(100, 'Title too long'),
  description: z.string().min(10, 'Review description must be at least 10 characters').max(1000, 'Description too long'),
  status: z.enum(['pending', 'approved', 'rejected']),
  helpful: z.number().min(0, 'Helpful count cannot be negative'),
  notHelpful: z.number().min(0, 'Not helpful count cannot be negative'),
  verified: z.boolean().default(false),
  featured: z.boolean().default(false),
});

export type ReviewFormData = z.infer<typeof reviewFormSchema>;

export interface Review {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  rating: number;
  title: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  helpful: number;
  notHelpful: number;
  verified: boolean;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
  images?: string[];
}

export interface ReviewSummary {
  totalReviews: number;
  averageRating: number;
  pendingReviews: number;
  approvedReviews: number;
  rejectedReviews: number;
  topRatedProduct?: {
    productId: string;
    productName: string;
    averageRating: number;
    reviewCount: number;
  };
  topReviewer?: {
    customerId: string;
    customerName: string;
    reviewCount: number;
    averageRating: number;
  };
} 