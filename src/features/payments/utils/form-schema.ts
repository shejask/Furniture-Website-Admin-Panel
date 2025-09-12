import { z } from 'zod';

export const paymentFormSchema = z.object({
  transactionId: z.string().min(1, 'Transaction ID is required'),
  orderId: z.string().min(1, 'Order ID is required'),
  customerId: z.string().min(1, 'Customer is required'),
  customerName: z.string().min(1, 'Customer name is required'),
  amount: z.number().min(0, 'Amount must be positive'),
  currency: z.string().min(1, 'Currency is required'),
  paymentMethod: z.enum(['credit_card', 'paypal', 'bank_transfer', 'cash_on_delivery', 'stripe', 'razorpay']),
  status: z.enum(['pending', 'completed', 'failed', 'refunded', 'cancelled']),
  gateway: z.string().optional(),
  gatewayTransactionId: z.string().optional(),
  fees: z.number().min(0, 'Fees must be positive'),
  tax: z.number().min(0, 'Tax must be positive'),
  description: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export type PaymentFormData = z.infer<typeof paymentFormSchema>;

export interface Payment {
  id: string;
  transactionId: string;
  orderId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  currency: string;
  paymentMethod: 'credit_card' | 'paypal' | 'bank_transfer' | 'cash_on_delivery' | 'stripe' | 'razorpay';
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  gateway?: string;
  gatewayTransactionId?: string;
  fees: number;
  tax: number;
  description?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface PaymentAnalytics {
  totalRevenue: number;
  totalTransactions: number;
  averageTransactionValue: number;
  successRate: number;
  pendingAmount: number;
  refundedAmount: number;
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
    transactions: number;
  }>;
  paymentMethodBreakdown: Array<{
    method: string;
    count: number;
    amount: number;
    percentage: number;
  }>;
  topCustomers: Array<{
    customerId: string;
    customerName: string;
    totalSpent: number;
    transactionCount: number;
  }>;
  recentTransactions: Array<Payment>;
  revenueGrowth: {
    currentMonth: number;
    previousMonth: number;
    growthPercentage: number;
  };
  transactionTrends: {
    daily: Array<{ date: string; count: number; amount: number }>;
    weekly: Array<{ week: string; count: number; amount: number }>;
    monthly: Array<{ month: string; count: number; amount: number }>;
  };
}

export interface PaymentReport {
  period: string;
  startDate: string;
  endDate: string;
  summary: {
    totalRevenue: number;
    totalTransactions: number;
    successfulTransactions: number;
    failedTransactions: number;
    refundedTransactions: number;
    averageOrderValue: number;
    netRevenue: number;
  };
  breakdown: {
    byPaymentMethod: Array<{
      method: string;
      count: number;
      amount: number;
      percentage: number;
    }>;
    byStatus: Array<{
      status: string;
      count: number;
      amount: number;
      percentage: number;
    }>;
    byCurrency: Array<{
      currency: string;
      count: number;
      amount: number;
      percentage: number;
    }>;
  };
  transactions: Array<Payment>;
} 