'use client';

import { useFirebaseData } from '@/hooks/use-firebase-database';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import VendorProductForm from '@/features/products/components/vendor-product-form';
import { getCurrentUser } from '@/lib/auth';

export default function VendorEditProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const [mounted, setMounted] = useState(false);
  const [currentVendor, setCurrentVendor] = useState<any>(null);

  const { data: productsData, loading, error } = useFirebaseData('products');
  const [product, setProduct] = useState<any>(null);

  // Get current vendor
  useEffect(() => {
    const user = getCurrentUser();
    setCurrentVendor(user);
  }, []);

  // Ensure we're on the client side
  useEffect(() => {
    setMounted(true);
  }, []);

  // Find the specific product and check vendor ownership
  useEffect(() => {
    if (productsData && productId && currentVendor) {
      let products: any[] = [];
      
      if (Array.isArray(productsData)) {
        products = productsData;
      } else if (typeof productsData === 'object' && productsData !== null) {
        products = Object.entries(productsData).map(([key, value]) => {
          if (typeof value === 'object' && value !== null) {
            return {
              ...value,
              id: key,
              key: key
            };
          }
          return {
            id: key,
            key: key,
            ...(typeof value === 'object' ? value : {})
          };
        });
      }
      
      const foundProduct = products.find(p => {
        return p.id === productId || p.key === productId;
      });
      
      // Check if this product belongs to the current vendor
      if (foundProduct && foundProduct.vendor === currentVendor.uniqueId) {
        setProduct(foundProduct);
      } else {
        setProduct(null);
      }
    }
  }, [productsData, productId, params, currentVendor]);

  if (!mounted || !currentVendor) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold">Product not found</h3>
          <p className="text-muted-foreground">
            The product doesn&apos;t exist or you don&apos;t have permission to edit it.
          </p>
          <Button 
            className="mt-4" 
            onClick={() => router.push('/dashboard/vendor-products')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to My Products
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/vendor-products')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to My Products
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Product</h1>
            <p className="text-muted-foreground">
              Update your product information
            </p>
          </div>
        </div>
      </div>
      <VendorProductForm initialData={product} />
    </div>
  );
}
