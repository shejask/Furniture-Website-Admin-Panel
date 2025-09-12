'use client';

import { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  MoreHorizontal, 
  Eye, 
  Trash2, 
  Copy, 
  Download, 
  Share2,
  Package,
  Store,
  DollarSign,
  Calendar,
  Tag,
  Star,
  TrendingUp,
  ShoppingCart,
  Image as ImageIcon,
  Files
} from 'lucide-react';
import Image from 'next/image';
import { useFirebaseData, useFirebaseOperations } from '@/hooks/use-firebase-database';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  commissionAmount?: number;
  category: string;
  photo_url?: string;
  vendorId: string;
  vendorName?: string;
  vendorStore?: string;
  stock?: number;
  rating?: number;
  reviews?: number;
  featured?: boolean;
  status?: 'active' | 'inactive' | 'draft';
  created_at: string;
  updated_at: string;
}



export function ProductsTable() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedProductRaw, setSelectedProductRaw] = useState<any | null>(null);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVendor, setSelectedVendor] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('vendor') || 'all';
    }
    return 'all';
  });
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { data: products, loading: productsLoading } = useFirebaseData('products');
  const { data: vendors } = useFirebaseData('vendors');
  const { remove, createWithKey } = useFirebaseOperations();

  const allProducts = useMemo(() => {
    if (!products) return [];
    return Object.entries(products).map(([productId, raw]) => {
      const p = raw as any;
      const categoryName = p.category || p.categoryName || (Array.isArray(p.categories) ? (p.categories[0]?.name || p.categories[0]?.id) : undefined) || '';
      const statusMapped = p.status === 'enabled' ? 'active' : p.status === 'disabled' ? 'inactive' : (p.status || 'active');
      return {
        id: productId,
        name: p.name || '',
        description: p.description || '',
        price: Number(p.price) || 0,
        commissionAmount: Number(p.commissionAmount) || 0,
        category: categoryName,
        photo_url: p.photo_url || p.thumbnail || '',
        vendorId: p.vendorId || p.vendor || '',
        vendorName: p.vendorName,
        vendorStore: p.vendorStore,
        stock: p.stockQuantity ?? p.stock ?? undefined,
        rating: p.rating,
        reviews: p.reviews,
        featured: !!p.featured,
        status: statusMapped,
        created_at: p.created_at || p.createdAt || '',
        updated_at: p.updated_at || p.updatedAt || ''
      } as Product;
    });
  }, [products]);

  const filteredProducts = useMemo(() => {
    let filtered = allProducts;

    // Filter by search query
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchLower) ||
        product.description.toLowerCase().includes(searchLower) ||
        product.category.toLowerCase().includes(searchLower) ||
        product.vendorName?.toLowerCase().includes(searchLower) ||
        product.vendorStore?.toLowerCase().includes(searchLower)
      );
    }

    // Filter by vendor
    if (selectedVendor !== 'all') {
      filtered = filtered.filter(product => product.vendorId === selectedVendor);
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(product => product.status === selectedStatus);
    }

    // Sort products
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy as keyof Product];
      let bValue: any = b[sortBy as keyof Product];

      if (sortBy === 'price' || sortBy === 'rating' || sortBy === 'stock') {
        aValue = Number(aValue) || 0;
        bValue = Number(bValue) || 0;
      } else if (sortBy === 'created_at' || sortBy === 'updated_at') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else {
        aValue = String(aValue || '').toLowerCase();
        bValue = String(bValue || '').toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [allProducts, searchQuery, selectedVendor, selectedCategory, selectedStatus, sortBy, sortOrder]);

  const getVendorName = useCallback((vendorId: string) => {
    if (!vendors || !vendorId) return 'Unknown Vendor';
    const vendor = (vendors as any)[vendorId];
    return vendor?.storeName || vendor?.name || 'Unknown Vendor';
  }, [vendors]);

  const getVendorStore = (vendorId: string) => {
    if (!vendors || !vendorId) return '';
    const vendor = (vendors as any)[vendorId];
    return vendor?.slug || '';
  };

  const productsSummary = useMemo(() => {
    if (!filteredProducts.length) {
      return {
        totalProducts: 0,
        totalVendors: 0,
        averagePrice: 0,
        totalValue: 0,
        activeProducts: 0,
        featuredProducts: 0
      };
    }

    const totalProducts = filteredProducts.length;
    const uniqueVendors = new Set(filteredProducts.map(product => product.vendorId));
    const totalValue = filteredProducts.reduce((sum, product) => sum + (product.price * (product.stock || 0)), 0);
    const averagePrice = filteredProducts.reduce((sum, product) => sum + product.price, 0) / totalProducts;
    const activeProducts = filteredProducts.filter(product => product.status === 'active').length;
    const featuredProducts = filteredProducts.filter(product => product.featured).length;

    // Find top category
    const categoryCounts = filteredProducts.reduce((acc, product) => {
      acc[product.category] = (acc[product.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const topCategory = Object.entries(categoryCounts).sort(([,a], [,b]) => b - a)[0]?.[0];

    // Find top vendor
    const vendorCounts = filteredProducts.reduce((acc, product) => {
      acc[product.vendorId] = (acc[product.vendorId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const topVendorEntry = Object.entries(vendorCounts).sort(([,a], [,b]) => b - a)[0];
    const topVendor = topVendorEntry ? {
      vendorId: topVendorEntry[0],
      vendorName: getVendorName(topVendorEntry[0]),
      productCount: topVendorEntry[1]
    } : undefined;

    return {
      totalProducts,
      totalVendors: uniqueVendors.size,
      averagePrice,
      totalValue,
      activeProducts,
      featuredProducts,
      topCategory,
      topVendor
    };
  }, [filteredProducts, getVendorName]);

  const getUniqueCategories = () => {
    const categories = new Set(allProducts.map(product => product.category));
    return Array.from(categories).sort();
  };

  const getUniqueVendors = () => {
    if (!vendors) return [];
    return Object.entries(vendors).map(([id, vendor]) => ({
      id,
      name: (vendor as any).storeName || (vendor as any).name || 'Unknown Vendor',
      store: (vendor as any).slug || ''
    }));
  };

  const handleViewDetails = (product: Product) => {
    setSelectedProduct(product);
    try {
      const raw = (products as any)?.[product.id];
      setSelectedProductRaw(raw || null);
    } catch {
      setSelectedProductRaw(null);
    }
    setIsDetailSheetOpen(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }
    try {
      await remove(`products/${productId}`);
      // Toast notification will be handled by the Firebase error boundary
    } catch (error) {
      // Handle error silently or log to a proper logging service in production
    }
  };

  const handleDuplicateProduct = async (product: Product) => {
    // Get the raw product data
    const rawProduct = (products as any)?.[product.id];
    if (!rawProduct) return;

    try {
      // Create a duplicate with modified data
      const duplicatedProduct = {
        ...rawProduct,
        name: `${rawProduct.name} (Copy)`,
        slug: `${rawProduct.slug || rawProduct.name?.toLowerCase().replace(/\s+/g, '-')}-copy-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Remove the original ID so Firebase generates a new one
      delete duplicatedProduct.id;

      // Create the duplicated product directly in the database
      await createWithKey('products', duplicatedProduct);
      
      // Show success message
      alert('Product duplicated successfully!');
    } catch (error) {
      console.error('Error duplicating product:', error);
      alert('Failed to duplicate product. Please try again.');
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getRatingStars = (rating?: number) => {
    if (!rating) return null;
    return (
      <div className="flex items-center gap-1">
        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
        <span className="text-xs">{rating.toFixed(1)}</span>
      </div>
    );
  };

  const formatDateISO = (value?: string) => {
    if (!value) return 'N/A';
    const d = new Date(value);
    return isNaN(d.getTime()) ? 'N/A' : d.toISOString().slice(0, 10);
  };

  const formatDateTimeISO = (value?: string) => {
    if (!value) return 'N/A';
    const d = new Date(value);
    return isNaN(d.getTime()) ? 'N/A' : d.toISOString().replace('T', ' ').slice(0, 16);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productsSummary.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              Across {productsSummary.totalVendors} vendors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Price</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{productsSummary.averagePrice.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Per product
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Products</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productsSummary.activeProducts}</div>
            <p className="text-xs text-muted-foreground">
              {productsSummary.featuredProducts} featured
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{productsSummary.totalValue.toLocaleString('en-IN')}</div>
            <p className="text-xs text-muted-foreground">
              Inventory value
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Stats removed as requested */}

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
          <CardDescription>
            Browse and manage all vendor products
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Select value={selectedVendor} onValueChange={setSelectedVendor}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Vendor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vendors</SelectItem>
                  {getUniqueVendors().map(vendor => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {getUniqueCategories().map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Date Created</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="price">Price</SelectItem>
                  <SelectItem value="rating">Rating</SelectItem>
                  <SelectItem value="stock">Stock</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
          </div>

          {/* Products Table */}
          {productsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading products...</div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        {searchQuery || selectedVendor !== 'all' || selectedCategory !== 'all' || selectedStatus !== 'all'
                          ? 'No products found matching your filters.'
                          : 'No products found.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                              {product.photo_url ? (
                                <Image
                                  src={product.photo_url}
                                  alt={product.name}
                                  width={48}
                                  height={48}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              ) : (
                                <Package className="h-6 w-6 text-muted-foreground" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium">{product.name}</div>
                              <div className="text-sm text-muted-foreground line-clamp-1">
                                {product.description}
                              </div>
                              {product.featured && (
                                <Badge variant="outline" className="mt-1 text-xs">
                                  <Star className="h-3 w-3 mr-1" />
                                  Featured
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Store className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{product.vendorName || getVendorName(product.vendorId)}</div>
                              <div className="text-sm text-muted-foreground">{product.vendorStore || getVendorStore(product.vendorId)}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{product.category}</Badge>
                        </TableCell>
                        <TableCell>
                        <div className="font-medium text-green-600">₹{product.price.toFixed(2)}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">₹{Number(product.commissionAmount || 0).toFixed(2)}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {product.stock !== undefined ? product.stock : 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getRatingStars(product.rating)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(product.status)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {formatDateISO(product.created_at)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(product)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleViewDetails(product)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDuplicateProduct(product)}>
                                  <Files className="mr-2 h-4 w-4" />
                                  Duplicate Product
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <Copy className="mr-2 h-4 w-4" />
                                  Copy ID
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Download className="mr-2 h-4 w-4" />
                                  Export Data
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Share2 className="mr-2 h-4 w-4" />
                                  Share
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDeleteProduct(product.id)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Details Dialog */}
      <Dialog open={isDetailSheetOpen} onOpenChange={setIsDetailSheetOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
            <DialogDescription>
              Complete information about the selected product
            </DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-6 mt-4">
              {/* Product Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Product Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                      <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                        {selectedProduct.photo_url ? (
                          <Image
                            src={selectedProduct.photo_url}
                            alt={selectedProduct.name}
                            width={96}
                            height={96}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <Package className="h-12 w-12 text-muted-foreground" />
                        )}
                      </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold">{selectedProduct.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedProduct.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge variant="outline">Category: {selectedProduct.category || 'N/A'}</Badge>
                        {selectedProductRaw?.slug && (
                          <Badge variant="outline">Slug: {selectedProductRaw.slug}</Badge>
                        )}
                        {selectedProductRaw?.productType && (
                          <Badge variant="outline">Type: {selectedProductRaw.productType}</Badge>
                        )}
                        {selectedProduct.featured && (
                          <Badge variant="default" className="bg-yellow-100 text-yellow-800">
                            <Star className="h-3 w-3 mr-1" />
                            Featured
                          </Badge>
                        )}
                        {getStatusBadge(selectedProduct.status)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Vendor Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Store className="h-5 w-5" />
                    Vendor Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                      <Store className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold">
                        {selectedProduct.vendorName || getVendorName(selectedProduct.vendorId)}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Store: {selectedProduct.vendorStore || getVendorStore(selectedProduct.vendorId)}
                      </p>
                      <Badge variant="outline" className="mt-1">
                        Vendor ID: {selectedProduct.vendorId}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Inventory & Pricing */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Inventory & Pricing
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Price</Label>
                      <p className="text-2xl font-bold text-green-600">
                        ₹{selectedProduct.price.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Stock</Label>
                      <p className="text-2xl font-bold">
                        {selectedProduct.stock !== undefined ? selectedProduct.stock : 'N/A'}
                      </p>
                    </div>
                    {selectedProductRaw?.sku && (
                      <div>
                        <Label className="text-sm font-medium">SKU</Label>
                        <p className="text-base">{selectedProductRaw.sku}</p>
                      </div>
                    )}
                    {selectedProductRaw?.inventoryType && (
                      <div>
                        <Label className="text-sm font-medium">Inventory Type</Label>
                        <p className="text-base">{selectedProductRaw.inventoryType}</p>
                      </div>
                    )}
                    {selectedProductRaw?.stockStatus && (
                      <div>
                        <Label className="text-sm font-medium">Stock Status</Label>
                        <p className="text-base">{selectedProductRaw.stockStatus}</p>
                      </div>
                    )}
                    {selectedProductRaw?.salePrice !== undefined && (
                      <div>
                        <Label className="text-sm font-medium">Sale Price</Label>
                        <p className="text-base">₹{Number(selectedProductRaw.salePrice || 0).toFixed(2)}</p>
                      </div>
                    )}
                    {selectedProductRaw?.discount !== undefined && (
                      <div>
                        <Label className="text-sm font-medium">Discount</Label>
                        <p className="text-base">{Number(selectedProductRaw.discount || 0)}%</p>
                      </div>
                    )}
                    {selectedProductRaw?.wholesalePriceType && (
                      <div>
                        <Label className="text-sm font-medium">Wholesale Price Type</Label>
                        <p className="text-base">{selectedProductRaw.wholesalePriceType}</p>
                      </div>
                    )}
                    <div>
                      <Label className="text-sm font-medium">Rating</Label>
                      <div className="flex items-center gap-2">
                        {getRatingStars(selectedProduct.rating)}
                        {selectedProduct.reviews && (
                          <span className="text-sm text-muted-foreground">
                            ({selectedProduct.reviews} reviews)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Media */}
              {(selectedProductRaw?.images?.length || selectedProductRaw?.sizeChart || selectedProductRaw?.metaImage) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ImageIcon className="h-5 w-5" />
                      Media
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Array.isArray(selectedProductRaw?.images) && selectedProductRaw.images.length > 0 && (
                      <div>
                        <Label className="text-sm font-medium">Gallery</Label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                          {selectedProductRaw.images.map((url: string, idx: number) => (
                            <Image key={idx} src={url} alt={`Image ${idx+1}`} width={200} height={120} className="w-full h-24 object-cover rounded" />
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedProductRaw?.sizeChart && (
                      <div>
                        <Label className="text-sm font-medium">Size Chart</Label>
                        <div className="mt-2">
                          <Image src={selectedProductRaw.sizeChart} alt="Size Chart" width={800} height={512} className="w-full max-h-64 object-contain rounded border" />
                        </div>
                      </div>
                    )}
                    {selectedProductRaw?.metaImage && (
                      <div>
                        <Label className="text-sm font-medium">Meta Image</Label>
                        <div className="mt-2">
                          <Image src={selectedProductRaw.metaImage} alt="Meta" width={800} height={512} className="w-full max-h-64 object-contain rounded border" />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Sale Settings */}
              {(selectedProductRaw?.saleStartDate || selectedProductRaw?.saleEndDate || selectedProductRaw?.unit) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Sale Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Sale Start</Label>
                        <p className="text-sm text-muted-foreground">{selectedProductRaw?.saleStartDate ? new Date(selectedProductRaw.saleStartDate).toLocaleString() : 'N/A'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Sale End</Label>
                        <p className="text-sm text-muted-foreground">{selectedProductRaw?.saleEndDate ? new Date(selectedProductRaw.saleEndDate).toLocaleString() : 'N/A'}</p>
                      </div>
                      {selectedProductRaw?.unit && (
                        <div>
                          <Label className="text-sm font-medium">Unit</Label>
                          <p className="text-sm text-muted-foreground">{selectedProductRaw.unit}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* SEO */}
              {(selectedProductRaw?.metaTitle || selectedProductRaw?.metaDescription) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Tag className="h-5 w-5" />
                      SEO
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {selectedProductRaw?.metaTitle && (
                      <div>
                        <Label className="text-sm font-medium">Meta Title</Label>
                        <p className="text-sm text-muted-foreground">{selectedProductRaw.metaTitle}</p>
                      </div>
                    )}
                    {selectedProductRaw?.metaDescription && (
                      <div>
                        <Label className="text-sm font-medium">Meta Description</Label>
                        <p className="text-sm text-muted-foreground">{selectedProductRaw.metaDescription}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Shipping */}
              {(selectedProductRaw?.freeShipping !== undefined || selectedProductRaw?.weight || selectedProductRaw?.estimatedDeliveryText) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5" />
                      Shipping
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedProductRaw?.freeShipping !== undefined && (
                        <div>
                          <Label className="text-sm font-medium">Free Shipping</Label>
                          <p className="text-sm text-muted-foreground">{selectedProductRaw.freeShipping ? 'Yes' : 'No'}</p>
                        </div>
                      )}
                      {selectedProductRaw?.weight !== undefined && (
                        <div>
                          <Label className="text-sm font-medium">Weight</Label>
                          <p className="text-sm text-muted-foreground">{selectedProductRaw.weight}</p>
                        </div>
                      )}
                      {selectedProductRaw?.estimatedDeliveryText && (
                        <div className="col-span-2">
                          <Label className="text-sm font-medium">Estimated Delivery</Label>
                          <p className="text-sm text-muted-foreground">{selectedProductRaw.estimatedDeliveryText}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Classification */}
              {(selectedProductRaw?.tags || selectedProductRaw?.categories || selectedProductRaw?.brands) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Tag className="h-5 w-5" />
                      Classification
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Tags</Label>
                      <div className="text-sm text-muted-foreground mt-1">
                        {Array.isArray(selectedProductRaw?.tags) && selectedProductRaw.tags.length
                          ? selectedProductRaw.tags.map((t: any) => t.name || t.id || t).join(', ')
                          : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Categories</Label>
                      <div className="text-sm text-muted-foreground mt-1">
                        {Array.isArray(selectedProductRaw?.categories) && selectedProductRaw.categories.length
                          ? selectedProductRaw.categories.map((c: any) => c.name || c.id || c).join(', ')
                          : (selectedProduct.category || 'N/A')}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Brands</Label>
                      <div className="text-sm text-muted-foreground mt-1">
                        {Array.isArray(selectedProductRaw?.brands) && selectedProductRaw.brands.length
                          ? selectedProductRaw.brands.map((b: any) => b.name || b.id || b).join(', ')
                          : 'N/A'}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Flags & Related */}
              {(selectedProductRaw?.randomRelatedProduct !== undefined || selectedProductRaw?.featured !== undefined || selectedProductRaw?.encourageOrder !== undefined || selectedProductRaw?.trending !== undefined || selectedProductRaw?.status) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Tag className="h-5 w-5" />
                      Status & Flags
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    {selectedProductRaw?.status && (
                      <div>
                        <Label className="text-sm font-medium">Status</Label>
                        <p className="text-sm text-muted-foreground">{selectedProductRaw.status}</p>
                      </div>
                    )}
                    {selectedProductRaw?.featured !== undefined && (
                      <div>
                        <Label className="text-sm font-medium">Featured</Label>
                        <p className="text-sm text-muted-foreground">{selectedProductRaw.featured ? 'Yes' : 'No'}</p>
                      </div>
                    )}
                    {selectedProductRaw?.encourageOrder !== undefined && (
                      <div>
                        <Label className="text-sm font-medium">Encourage Order</Label>
                        <p className="text-sm text-muted-foreground">{selectedProductRaw.encourageOrder ? 'Yes' : 'No'}</p>
                      </div>
                    )}
                    {selectedProductRaw?.trending !== undefined && (
                      <div>
                        <Label className="text-sm font-medium">Trending</Label>
                        <p className="text-sm text-muted-foreground">{selectedProductRaw.trending ? 'Yes' : 'No'}</p>
                      </div>
                    )}
                    {selectedProductRaw?.randomRelatedProduct !== undefined && (
                      <div>
                        <Label className="text-sm font-medium">Random Related Product</Label>
                        <p className="text-sm text-muted-foreground">{selectedProductRaw.randomRelatedProduct ? 'Enabled' : 'Disabled'}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Timestamps */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Timestamps
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Created</Label>
                      <p className="text-sm text-muted-foreground">
                        {formatDateTimeISO(selectedProduct.created_at)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Updated</Label>
                      <p className="text-sm text-muted-foreground">
                        {formatDateTimeISO(selectedProduct.updated_at)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 