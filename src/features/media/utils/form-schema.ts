import { z } from 'zod';

export const mediaFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  type: z.enum(['banner', 'banner-category-1', 'banner-category-2', 'banner-category-3', 'home-advertisement', 'ad', 'image']),
  imageUrl: z.string().min(1, 'Image URL is required'),
  altText: z.string().min(1, 'Alt text is required'),
  linkUrl: z.string().optional(),
  displayOrder: z.number().min(0, 'Display order must be 0 or greater'),
  metadata: z.record(z.string()).optional()
});

export type MediaFormData = z.infer<typeof mediaFormSchema>;

export interface MediaItem {
  id: string;
  title: string;
  description?: string;
  type: 'banner' | 'banner-category-1' | 'banner-category-2' | 'banner-category-3' | 'home-advertisement' | 'ad' | 'image';
  imageUrl: string;
  altText: string;
  linkUrl?: string;
  displayOrder: number;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
} 