import { Metadata } from 'next';
import VendorProductListingPage from '@/features/products/components/vendor-product-listing';

export const metadata: Metadata = {
  title: 'My Products | Vendor Dashboard',
  description: 'Manage your products'
};

export default function VendorProductsPage() {
  return <VendorProductListingPage />;
}
