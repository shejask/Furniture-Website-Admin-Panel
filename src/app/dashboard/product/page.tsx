import PageContainer from '@/components/layout/page-container';
import { buttonVariants } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { IconPlus } from '@tabler/icons-react';
import Link from 'next/link';
import ProductListingPage from '@/features/products/components/product-listing';
import ProductsBulkActions from '@/features/products/components/products-bulk-actions';

export const metadata = {
  title: 'Dashboard: Products'
};

export default function Page() {
  return (
    <PageContainer scrollable={false}>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-start justify-between'>
          <Heading
            title='Products'
            description='Manage your product catalog and inventory'
          />
          <div className='flex items-center gap-2'>
            <ProductsBulkActions />
            <Link
              href='/dashboard/product/add'
              className={cn(buttonVariants(), 'text-xs md:text-sm')}
            >
              <IconPlus className='mr-2 h-4 w-4' /> Add New
            </Link>
          </div>
        </div>
        <Separator />
        <ProductListingPage />
      </div>
    </PageContainer>
  );
}
