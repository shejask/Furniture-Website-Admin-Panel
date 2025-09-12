'use client';

import { useFirebaseData } from '@/hooks/use-firebase-database';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ProductForm } from '@/features/products/components/product-form';

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const [mounted, setMounted] = useState(false);

  const { data: productsData, loading, error } = useFirebaseData('products');
  const [product, setProduct] = useState<any>(null);

  // Ensure we're on the client side
  useEffect(() => {
    setMounted(true);
  }, []);

  // Find the specific product
  useEffect(() => {
    if (productsData && productId) {
      // Handle different Firebase data structures
      let products: any[] = [];
      
      if (Array.isArray(productsData)) {
        products = productsData;
      } else if (typeof productsData === 'object' && productsData !== null) {
        // Firebase returns object with keys, convert to array and add the key as id
        products = Object.entries(productsData).map(([key, value]) => {
          if (typeof value === 'object' && value !== null) {
            return {
              ...value,
              id: key, // Add the Firebase key as the id
              key: key
            };
          }
          // Fallback if value is not an object
          return {
            id: key,
            key: key,
            ...(typeof value === 'object' ? value : {})
          };
        });
      }
      
      // Try to find product by ID
      const foundProduct = products.find(p => {
        return p.id === productId || p.key === productId;
      });
      
      setProduct(foundProduct);
    }
  }, [productsData, productId, params]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">Loading product for editing...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-red-600">Error loading product</h3>
            <p className="text-muted-foreground">There was an error loading the product for editing.</p>
            <Button 
              className="mt-4" 
              onClick={() => router.back()}
            >
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h3 className="text-lg font-semibold">Product not found</h3>
            <p className="text-muted-foreground">
              The product with ID &quot;{productId}&quot; doesn&apos;t exist.
            </p>
            <div className="mt-4 text-sm text-muted-foreground">
              <p>Available products: {productsData ? Object.keys(productsData).length : 0}</p>
              <p>Product IDs: {productsData ? Object.keys(productsData).slice(0, 5).join(', ') : 'None'}</p>
              <p>Route params: {JSON.stringify(params)}</p>
              <p>Product ID from params: {productId}</p>
            </div>
            <Button 
              className="mt-4" 
              onClick={() => router.push('/dashboard/product')}
            >
              Back to Products
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Link href={`/dashboard/product/${productId}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Product
              </Button>
            </Link>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Edit Product</h1>
            <p className="text-muted-foreground mt-1">
              Update product information and details
            </p>
          </div>
        </div>
      </div>
      
      {/* Form Container */}
      <div className="container mx-auto px-6 py-6 max-h-[calc(100vh-120px)] overflow-y-auto pb-16">
        <ProductForm initialData={product} />
      </div>
    </div>
  );
} 