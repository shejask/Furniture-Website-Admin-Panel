import { z } from 'zod';

export const blogFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().min(1, 'Description is required'),
  imageUrl: z.string().min(1, 'Image is required'),
  altText: z.string().min(1, 'Alt text is required'),
  content: z.string().min(1, 'Content is required'),
  isPublished: z.boolean().default(false),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
});

export type BlogFormData = z.infer<typeof blogFormSchema>;

export interface Blog {
  id?: string;
  title: string;
  category: string;
  description: string;
  imageUrl: string;
  altText: string;
  content: string;
  isPublished: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const blogCategoryFormSchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
});

export type BlogCategoryFormData = z.infer<typeof blogCategoryFormSchema>;

export const blogTagFormSchema = z.object({
  name: z.string().min(1, 'Tag name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
});

export type BlogTagFormData = z.infer<typeof blogTagFormSchema>; 