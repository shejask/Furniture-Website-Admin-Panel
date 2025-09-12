import { AddOrderForm } from '@/features/orders/components/add-order-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AddOrderPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/dashboard/orders">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Orders
              </Button>
            </Link>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Create New Order</h1>
            <p className="text-muted-foreground mt-1">
              Add a new order with customer details, products, and payment information
            </p>
          </div>
        </div>
      </div>
      
      {/* Form Container */}
      <div className="container mx-auto px-6 py-6 h-[calc(100vh-120px)] overflow-y-auto pb-24">
        <AddOrderForm />
      </div>
    </div>
  );
} 