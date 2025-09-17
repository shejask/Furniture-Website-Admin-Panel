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

type ProductListingPage = {};

// Simple fallback table component
function SimpleProductTable({ products, getVendorName, getCategoryName }: { products: any[], getVendorName: (vendorId: string) => string, getCategoryName: (categoryId: string | string[]) => string }) {
  const router = useRouter();

  const handleView = (productId: string) => {
    router.push(`/dashboard/product/${productId}`);
  };

  const handleEdit = (productId: string) => {
    router.push(`/dashboard/product/${productId}/edit`);
  };

  const { remove, createWithUniqueId } = useFirebaseOperations();

  const handleDelete = async (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }
    try {
      await remove(`products/${productId}`);
      // Toast notification will be handled by the Firebase error boundary
    } catch (error) {
      // Log error for debugging but don't expose to client
    }
  };

  const handleDuplicate = async (product: any) => {
    try {
      // Create a duplicate with modified data
      const duplicatedProduct = {
        ...product,
        name: `${product.name} (Copy)`,
        slug: `${product.slug || product.name?.toLowerCase().replace(/\s+/g, '-')}-copy-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Remove the original ID so Firebase generates a new one
      delete duplicatedProduct.id;

      // Create the duplicated product directly in the database
      await createWithUniqueId('products', duplicatedProduct, 'PROD');
      
      // Show success message
      alert('Product duplicated successfully!');
    } catch (error) {
      console.error('Error duplicating product:', error);
      alert('Failed to duplicate product. Please try again.');
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
            <TableHead>Vendor</TableHead>
            <TableHead>Stock Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product, index) => (
            <TableRow key={product.id || index}>
              <TableCell>
                <Image 
                  src={product.thumbnail || product.images?.[0] || '/placeholder-product.png'} 
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
              <TableCell>{getVendorName(product.vendor)}</TableCell>
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
                      <span className="sr-only">Open menu</span>
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

export default function ProductListingPage() {
  const { data: productsData, loading, error } = useFirebaseData('products');
  const { data: vendorsData } = useFirebaseData('vendors');
  const { data: categoriesData } = useFirebaseData('categories');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [mounted, setMounted] = useState(false);

  // Ensure we're on the client side
  useEffect(() => {
    setMounted(true);
  }, []);

  // Function to get vendor name from vendor ID
  const getVendorName = (vendorId: string) => {
    if (!vendorsData || !vendorId) return 'N/A';
    
    const vendor = vendorsData[vendorId];
    if (!vendor) return vendorId; // Fallback to ID if vendor not found
    
    return vendor.storeName || vendor.name || vendorId;
  };

  // Function to get category name from category ID
  const getCategoryName = (categoryId: string | string[]) => {
    if (!categoriesData || !categoryId) return 'N/A';
    
    // Handle if category is an array (take first category)
    const id = Array.isArray(categoryId) ? categoryId[0] : categoryId;
    if (!id) return 'N/A';
    
    const category = categoriesData[id];
    if (!category) return id; // Fallback to ID if category not found
    
    return category.name || id;
  };

  // Convert Firebase data to array format with proper IDs
  const products = useMemo(() => {
    if (!productsData) return [];
    
    if (Array.isArray(productsData)) {
      return productsData;
    } else if (typeof productsData === 'object' && productsData !== null) {
      // Firebase returns object with keys, convert to array and add the key as id
      return Object.entries(productsData).map(([key, value]) => ({
        ...(value as any),
        id: key, // Add the Firebase key as the id
        key: key
      }));
    }
    
    return [];
  }, [productsData]);

  // Filter products based on search and category
  const filteredProducts = useMemo(() => {
    if (!products || !Array.isArray(products)) return [];

    let filtered = [...products];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    return filtered;
  }, [products, searchTerm, selectedCategory]);

  // Get unique categories for filter
  const categories = useMemo(() => {
    return products && Array.isArray(products) 
      ? Array.from(new Set(products.map((p: any) => p.category).filter(Boolean))) as string[] 
      : [];
  }, [products]);

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Products</h2>
            <p className="text-muted-foreground">
              Manage your product catalog and inventory
            </p>
          </div>
          <Link href="/dashboard/product/add">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </Link>
        </div>
        
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Products</h2>
            <p className="text-muted-foreground">
              Manage your product catalog and inventory
            </p>
          </div>
          <Link href="/dashboard/product/add">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </Link>
        </div>
        
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Products</h2>
            <p className="text-muted-foreground">
              Manage your product catalog and inventory
            </p>
          </div>
          <Link href="/dashboard/product/add">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </Link>
        </div>
        
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold text-red-600">Error loading products</h3>
          <p className="text-muted-foreground">There was an error loading the products. Please try again.</p>
          <Button 
            className="mt-4" 
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
        <div className="text-sm text-muted-foreground">
          Showing {filteredProducts.length} of {products?.length || 0} products
        </div>
      </div>
      
      {!products || products.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold">No products found</h3>
          <p className="text-muted-foreground">Get started by adding your first product.</p>
          <Link href="/dashboard/product/add">
            <Button className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Add First Product
            </Button>
          </Link>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold">No products match your search</h3>
          <p className="text-muted-foreground">Try adjusting your search terms or filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <SimpleProductTable products={filteredProducts} getVendorName={getVendorName} getCategoryName={getCategoryName} />
        </div>
      )}
    </div>
  );
}