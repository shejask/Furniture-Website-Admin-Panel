import { z } from 'zod';

export const taxFormSchema = z.object({
  name: z.string()
    .min(1, 'Tax name is required')
    .min(2, 'Tax name must be at least 2 characters')
    .max(50, 'Tax name must be less than 50 characters'),
  rate: z.number()
    .min(0, 'Tax rate cannot be negative')
    .max(100, 'Tax rate cannot exceed 100%')
    .refine((val) => val >= 0 && val <= 100, {
      message: 'Tax rate must be between 0% and 100%'
    }),
  description: z.string()
    .max(200, 'Description must be less than 200 characters')
    .optional(),
  isActive: z.boolean().default(true)
});

export type TaxFormData = z.infer<typeof taxFormSchema>;
