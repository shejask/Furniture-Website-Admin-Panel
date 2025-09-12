import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { CategoriesTable } from '@/features/products/components/categories-table';

export const metadata: Metadata = {
  title: 'Product Categories',
  description: 'Manage product categories and organization'
};

export default function CategoriesPage() {
  return (
    <PageContainer>
      <div className="w-full space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Product Categories</h1>
          <p className="text-muted-foreground mt-2">
            Manage product categories and organization
          </p>
        </div>
        
        <CategoriesTable />
      </div>
    </PageContainer>
  );
} 