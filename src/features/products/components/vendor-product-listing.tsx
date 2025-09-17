'use client';

import { Button } from '@/components/ui/button';
import { Plus, Eye, Edit, MoreHorizontal, Trash2, Files } from 'lucide-react';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useFirebaseData, useFirebaseOperations } from '@/hooks/use-firebase-database';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { getCurrentUser } from '@/lib/auth';

// Vendor-specific product table component
function VendorProductTable({ products, getVendorName, getCategoryName }: { products: any[], getVendorName: (vendorId: string) => string, getCategoryName: (categoryId: string | string[]) => string }) {
  const router = useRouter();

  const handleView = (productId: string) => {
    router.push(`/dashboard/vendor-products/${productId}`);
  };

  const handleEdit = (productId: string) => {
    router.push(`/dashboard/vendor-products/${productId}/edit`);
  };

  const { remove, createWithUniqueId } = useFirebaseOperations();

  const handleDelete = async (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }
    try {
      await remove(`products/${productId}`);
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const handleDuplicate = async (product: any) => {
    try {
      // Create a duplicate with modified data
      const duplicatedProduct = {
        ...product,
        name: `${product.name} (Copy)`,
        sku: `${product.sku}-copy-${Date.now()}`,
        slug: `${product.slug}-copy-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Remove the original id to create a new product
      delete duplicatedProduct.id;
      delete duplicatedProduct.key;
      
      await createWithUniqueId('products', duplicatedProduct, 'VPROD');
    } catch (error) {
      console.error('Error duplicating product:', error);
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Image</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell>
                <Image
                  src={product.thumbnail || '/placeholder-avatar.svg'}
                  alt={product.name}
                  width={48}
                  height={48}
                  className="w-12 h-12 object-cover rounded"
                />
              </TableCell>
              <TableCell className="font-medium">{product.name}</TableCell>
              <TableCell>{getCategoryName(product.categories || product.category)}</TableCell>
              <TableCell>₹{product.price}</TableCell>
              <TableCell>{product.stock || product.stockQuantity || 0}</TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  (product.stock || product.stockQuantity || 0) > 0 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {(product.stock || product.stockQuantity || 0) > 0 ? 'In Stock' : 'Out of Stock'}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => handleView(product.id)}
                      className="cursor-pointer"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleEdit(product.id)}
                      className="cursor-pointer"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Product
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDuplicate(product)}
                      className="cursor-pointer"
                    >
                      <Files className="mr-2 h-4 w-4" />
                      Duplicate Product
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleDelete(product.id)}
                      className="cursor-pointer text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Product
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function VendorProductListingPage() {
  const { data: productsData, loading, error } = useFirebaseData('products');
  const { data: vendorsData } = useFirebaseData('vendors');
  const { data: categoriesData } = useFirebaseData('categories');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [mounted, setMounted] = useState(false);
  const [currentVendor, setCurrentVendor] = useState<any>(null);

  // Get current vendor
  useEffect(() => {
    const user = getCurrentUser();
    setCurrentVendor(user);
  }, []);

  // Ensure we're on the client side
  useEffect(() => {
    setMounted(true);
  }, []);

  // Function to get vendor name from vendor ID
  const getVendorName = (vendorId: string) => {
    if (!vendorsData || !vendorId) return 'N/A';
    
    const vendor = vendorsData[vendorId];
    if (!vendor) return vendorId;
    
    return vendor.storeName || vendor.name || vendorId;
  };

  // Function to get category name from category ID
  const getCategoryName = (categoryId: string | string[]) => {
    if (!categoriesData || !categoryId) return 'N/A';
    
    const id = Array.isArray(categoryId) ? categoryId[0] : categoryId;
    if (!id) return 'N/A';
    
    const category = categoriesData[id];
    if (!category) return id;
    
    return category.name || id;
  };

  // Convert Firebase data to array format and filter for current vendor
  const products = useMemo(() => {
    if (!productsData || !currentVendor) return [];
    
    let allProducts: any[] = [];
    
    if (Array.isArray(productsData)) {
      allProducts = productsData;
    } else if (typeof productsData === 'object' && productsData !== null) {
      allProducts = Object.entries(productsData).map(([key, value]) => ({
        ...(value as any),
        id: key,
        key: key
      }));
    }
    
    // Filter products for current vendor only
    return allProducts.filter(product => product.vendor === currentVendor.uniqueId);
  }, [productsData, currentVendor]);

  // Filter products based on search and category
  const filteredProducts = useMemo(() => {
    if (!products) return [];

    return products.filter(product => {
      const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.sku?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = selectedCategory === 'all' || 
                            (Array.isArray(product.categories) ? 
                              product.categories.includes(selectedCategory) : 
                              product.category === selectedCategory);

      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

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
          <p className="text-muted-foreground mt-2">Loading your products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold text-red-600">Error loading products</h3>
          <p className="text-muted-foreground">There was an error loading your products.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Products</h1>
          <p className="text-muted-foreground">
            Manage your product inventory
          </p>
        </div>
        <Link href="/dashboard/vendor-products/add">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </Link>
      </div>

      {/* Products Display */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold">No products found</h3>
          <p className="text-muted-foreground">
            {products.length === 0 
              ? "You haven't added any products yet." 
              : "No products match your search criteria."
            }
          </p>
          {products.length === 0 && (
            <Link href="/dashboard/vendor-products/add">
              <Button className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Product
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <VendorProductTable products={filteredProducts} getVendorName={getVendorName} getCategoryName={getCategoryName} />
        </div>
      )}
    </div>
  );
}
