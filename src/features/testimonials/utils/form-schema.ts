import { z } from 'zod';

export const testimonialFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  imageUrl: z.string().min(1, 'Image is required'),
  altText: z.string().min(1, 'Alt text is required')
});

export type TestimonialFormData = z.infer<typeof testimonialFormSchema>;

export interface Testimonial {
  id?: string;
  name: string;
  description: string;
  imageUrl: string;
  altText: string;
  createdAt?: string;
  updatedAt?: string;
}
