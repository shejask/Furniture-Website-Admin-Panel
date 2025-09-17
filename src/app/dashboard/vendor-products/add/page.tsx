import { Metadata } from 'next';
import VendorProductForm from '@/features/products/components/vendor-product-form';

export const metadata: Metadata = {
  title: 'Add Product | Vendor Dashboard',
  description: 'Add a new product to your store'
};

export default function VendorAddProductPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add New Product</h1>
          <p className="text-muted-foreground">
            Create a new product for your store
          </p>
        </div>
      </div>
      <VendorProductForm />
    </div>
  );
}
