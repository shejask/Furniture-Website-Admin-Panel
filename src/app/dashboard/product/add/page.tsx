import { Metadata } from 'next';
import { ProductForm } from '@/features/products/components/product-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Add New Product',
  description: 'Add a new product to your store'
};

export default function AddProductPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/dashboard/product">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Products
              </Button>
            </Link>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Add New Product</h1>
            <p className="text-muted-foreground mt-1">
              Create a new product with all necessary details and images
            </p>
          </div>
        </div>
      </div>
      
      {/* Form Container */}
      <div className="container mx-auto px-6 py-6 max-h-[calc(100vh-120px)] overflow-y-auto pb-16">
        <ProductForm />
      </div>
    </div>
  );
} 