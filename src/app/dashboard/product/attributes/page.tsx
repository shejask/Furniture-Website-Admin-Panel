import { Metadata } from 'next';
import { AttributesTable } from '@/features/products/components/attributes-table';

export const metadata: Metadata = {
  title: 'Product Attributes',
  description: 'Manage product attributes and variants'
};

export default function AttributesPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Product Attributes</h1>
        <p className="text-muted-foreground mt-2">
          Manage product attributes and variant options
        </p>
      </div>
      
      <AttributesTable />
    </div>
  );
} 