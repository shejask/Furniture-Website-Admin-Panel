'use client';

import { useFirebaseData } from '@/hooks/use-firebase-database';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ProductDetailPage() {
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

  const handleEdit = () => {
    router.push(`/dashboard/product/${productId}/edit`);
  };

  if (!mounted) {
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
          <p className="text-muted-foreground mt-2">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold text-red-600">Error loading product</h3>
          <p className="text-muted-foreground">There was an error loading the product details.</p>
          <Button 
            className="mt-4" 
            onClick={() => router.back()}
          >
            Go Back
          </Button>
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
    );
  }

  return (
    <div className="container mx-auto p-6 h-[calc(100vh-80px)] overflow-y-auto">
      {/* Normalize fields for flexible shapes */}
      {(() => {
        const readName = (v: any) => (typeof v === 'string' ? v : v?.name || v?.id || '');
        (product as any)._categoryName = typeof product.category === 'string'
          ? product.category
          : (Array.isArray(product.categories) ? readName(product.categories[0]) : '');
        (product as any)._tags = Array.isArray(product.tags)
          ? (product.tags as any[]).map(readName).filter(Boolean)
          : [];
        (product as any)._brandName = typeof product.brand === 'string'
          ? product.brand
          : (Array.isArray(product.brands) ? (product.brands as any[]).map(readName).join(', ') : readName(product.brand));
        return null;
      })()}
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/product">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Products
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <p className="text-muted-foreground">Product Details</p>
          </div>
        </div>
        <Button onClick={handleEdit}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Product
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Images */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Product Images</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Main Image */}
                <div className="aspect-square rounded-lg overflow-hidden">
                  <Image
                    src={product.thumbnail || product.images?.[0] || '/placeholder-product.png'}
                    alt={product.name || 'Product image'}
                    width={400}
                    height={400}
                    className="w-full h-full object-cover"
                    onError={() => {
                      // Fallback to placeholder if image fails to load
                    }}
                  />
                </div>
                
                {/* Additional Images */}
                {product.images && product.images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {product.images.slice(1).map((image: string, index: number) => (
                      <div key={index} className="aspect-square rounded overflow-hidden">
                        <Image
                          src={image}
                          alt={`${product.name || 'Product'} ${index + 2}`}
                          width={100}
                          height={100}
                          className="w-full h-full object-cover"
                          onError={() => {
                            // Fallback to placeholder if image fails to load
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Product Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="text-lg font-semibold">{product.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Price</label>
                  <p className="text-lg font-semibold text-green-600">₹{product.price}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Category</label>
                  <Badge variant="secondary">{(product as any)._categoryName || 'N/A'}</Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Stock</label>
                  <p className="text-lg font-semibold">{product.stock || product.stockQuantity || 0} units</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Vendor</label>
                  <p className="text-lg">{product.vendor || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Stock Status</label>
                  <Badge variant={(product.stock || product.stockQuantity || 0) > 0 ? "default" : "destructive"}>
                    {(product.stock || product.stockQuantity || 0) > 0 ? 'In Stock' : 'Out of Stock'}
                  </Badge>
                </div>
              </div>
              
              {product.description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <p className="text-sm text-muted-foreground mt-1">{product.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Details */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {product.brand && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Brand</label>
                    <p className="text-sm">{(product as any)._brandName}</p>
                  </div>
                )}
                {(product as any)._tags && (product as any)._tags.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Tags</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(product as any)._tags.map((tag: string, index: number) => (
                        <Badge key={index} variant="outline">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {product.sku && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">SKU</label>
                    <p className="text-sm font-mono">{product.sku}</p>
                  </div>
                )}
                {product.weight && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Weight</label>
                    <p className="text-sm">{product.weight}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* SEO Information */}
          {(product.metaTitle || product.metaDescription) && (
            <Card>
              <CardHeader>
                <CardTitle>SEO Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {product.metaTitle && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Meta Title</label>
                    <p className="text-sm">{product.metaTitle}</p>
                  </div>
                )}
                {product.metaDescription && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Meta Description</label>
                    <p className="text-sm">{product.metaDescription}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
} 