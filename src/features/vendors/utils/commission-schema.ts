import { z } from 'zod';

export const commissionFormSchema = z.object({
  vendorId: z.string().min(1, 'Vendor is required'),
  commissionRate: z.number().min(0, 'Commission rate must be at least 0%').max(100, 'Commission rate cannot exceed 100%'),
  totalSales: z.number().min(0, 'Total sales must be positive'),
  commissionEarned: z.number().min(0, 'Commission earned must be positive'),
  period: z.enum(['daily', 'weekly', 'monthly', 'yearly']).default('monthly'),
  status: z.enum(['pending', 'paid', 'cancelled']).default('pending'),
  notes: z.string().optional(),
  paymentDate: z.string().optional(),
  transactionId: z.string().optional()
});

export type CommissionFormData = z.infer<typeof commissionFormSchema>;

export interface Commission {
  id: string;
  vendorId: string;
  vendorName?: string;
  vendorStore?: string;
  commissionRate: number;
  totalSales: number;
  commissionEarned: number;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  status: 'pending' | 'paid' | 'cancelled';
  notes?: string;
  paymentDate?: string;
  transactionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommissionSummary {
  totalEarnings: number;
  pendingAmount: number;
  paidAmount: number;
  totalVendors: number;
  averageCommissionRate: number;
  topEarningVendor?: {
    vendorId: string;
    vendorName: string;
    earnings: number;
  };
} 