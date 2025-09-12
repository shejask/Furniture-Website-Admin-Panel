import { Metadata } from 'next';
import { TagsTable } from '@/features/products/components/tags-table';

export const metadata: Metadata = {
  title: 'Product Tags',
  description: 'Manage product tags and organization'
};

export default function TagsPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Product Tags</h1>
        <p className="text-muted-foreground mt-2">
          Manage product tags and organization
        </p>
      </div>
      
      <TagsTable />
    </div>
  );
} 