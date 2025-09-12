import { Metadata } from 'next';
import { BrandsTable } from '@/features/products/components/brands-table';

export const metadata: Metadata = {
  title: 'Product Brands',
  description: 'Manage product brands and organization'
};

export default function BrandsPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Product Brands</h1>
        <p className="text-muted-foreground mt-2">
          Manage product brands and organization
        </p>
      </div>
      
      <BrandsTable />
    </div>
  );
} 