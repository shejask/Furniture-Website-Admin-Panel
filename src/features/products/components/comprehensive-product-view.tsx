'use client';

import { useFirebaseData } from '@/hooks/use-firebase-database';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Edit, 
  Package, 
  DollarSign, 
  Tag, 
  User, 
  MapPin, 
  Truck, 
  Star,
  Info,
  Image as ImageIcon,
  Palette,
  Ruler,
  Shield,
  Globe,
  FileText
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface ComprehensiveProductViewProps {
  productId: string;
  product: any;
}

export function ComprehensiveProductView({ productId, product }: ComprehensiveProductViewProps) {
  const router = useRouter();
  const { data: vendorsData } = useFirebaseData('vendors');
  const { data: categoriesData } = useFirebaseData('categories');
  const { data: taxesData } = useFirebaseData('taxes');
  const { data: brandsData } = useFirebaseData('brands');
  const { data: tagsData } = useFirebaseData('tags');

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

  // Function to get tax information from tax ID
  const getTaxInfo = (taxId: string) => {
    if (!taxesData || !taxId) return { name: 'N/A', rate: 0 };
    
    const tax = taxesData[taxId];
    if (!tax) return { name: taxId, rate: 0 }; // Fallback to ID if tax not found
    
    return {
      name: tax.name || taxId,
      rate: tax.rate || 0,
      isActive: tax.isActive || false
    };
  };

  // Function to get brand name from brand ID
  const getBrandName = (brandId: string) => {
    if (!brandsData || !brandId) return 'N/A';
    
    const brand = brandsData[brandId];
    if (!brand) return brandId; // Fallback to ID if brand not found
    
    return brand.name || brandId;
  };

  // Function to get tag name from tag ID
  const getTagName = (tagId: string) => {
    if (!tagsData || !tagId) return 'N/A';
    
    const tag = tagsData[tagId];
    if (!tag) return tagId; // Fallback to ID if tag not found
    
    return tag.name || tagId;
  };

  // Function to get subcategory name from subcategory ID
  const getSubCategoryName = (subCatId: string) => {
    if (!categoriesData) return subCatId;
    
    // Search through all categories to find the subcategory
    for (const categoryKey in categoriesData) {
      const category = categoriesData[categoryKey];
      if (category.subCategories && Array.isArray(category.subCategories)) {
        const subCategory = category.subCategories.find((sub: any) => sub.id === subCatId);
        if (subCategory) {
          return subCategory.name || subCatId;
        }
      }
    }
    
    return subCatId; // Fallback to ID if not found
  };

  const handleEdit = () => {
    router.push(`/dashboard/product/${productId}/edit`);
  };

  return (
    <div className="container mx-auto p-6 space-y-6 scrollbar-hide overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/product">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Products
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{product.name || 'Product Details'}</h1>
            <p className="text-muted-foreground">SKU: {product.sku || 'N/A'}</p>
          </div>
        </div>
        <Button onClick={handleEdit}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Product
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Product Images */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Product Images
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Thumbnail */}
              {product.thumbnail && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Thumbnail</h4>
                  <Image
                    src={product.thumbnail}
                    alt={product.name || 'Product thumbnail'}
                    width={200}
                    height={200}
                    className="w-full h-48 object-cover rounded-lg border"
                  />
                </div>
              )}
              
              {/* Additional Images */}
              {product.images && product.images.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Gallery ({product.images.length} images)</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {product.images.slice(0, 4).map((image: string, index: number) => (
                      <Image
                        key={index}
                        src={image}
                        alt={`${product.name} image ${index + 1}`}
                        width={100}
                        height={100}
                        className="w-full h-24 object-cover rounded-md border"
                      />
                    ))}
                  </div>
                  {product.images.length > 4 && (
                    <p className="text-xs text-muted-foreground">
                      +{product.images.length - 4} more images
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Product Name</label>
                  <p className="text-sm">{product.name || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Product Type</label>
                  <Badge variant="outline">{product.productType || 'N/A'}</Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">SKU</label>
                  <p className="text-sm font-mono">{product.sku || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Slug</label>
                  <p className="text-sm font-mono">{product.slug || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Vendor</label>
                  <p className="text-sm">{getVendorName(product.vendor)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Category</label>
                  <p className="text-sm">{getCategoryName(product.categories || product.category)}</p>
                </div>
              </div>
              
              {product.shortDescription && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Short Description</label>
                  <p className="text-sm">{product.shortDescription}</p>
                </div>
              )}
              
              {product.description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <div className="text-sm bg-muted p-3 rounded-md" dangerouslySetInnerHTML={{ __html: product.description }} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pricing & Inventory */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pricing & Inventory
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Price</label>
                  <p className="text-lg font-semibold">₹{product.price || '0'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Sale Price</label>
                  <p className="text-lg font-semibold text-green-600">₹{product.salePrice || '0'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Discount</label>
                  <p className="text-sm">₹{product.discount || '0'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Stock Quantity</label>
                  <p className="text-sm">{product.stockQuantity || product.stock || '0'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Stock Status</label>
                  <Badge variant={product.stockStatus === 'in_stock' ? 'default' : 'destructive'}>
                    {product.stockStatus || 'N/A'}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Inventory Type</label>
                  <Badge variant="outline">{product.inventoryType || 'N/A'}</Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Commission Amount</label>
                  <p className="text-sm">₹{product.commissionAmount || '0'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tax</label>
                  {product.taxId ? (
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{getTaxInfo(product.taxId).name}</p>
                      <p className="text-xs text-muted-foreground">Rate: {getTaxInfo(product.taxId).rate}%</p>
                      <Badge variant={getTaxInfo(product.taxId).isActive ? 'default' : 'secondary'} className="text-xs">
                        {getTaxInfo(product.taxId).isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">N/A</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Material & Finish */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Material & Finish
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Primary Material</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {product.primaryMaterial && product.primaryMaterial.length > 0 ? (
                      product.primaryMaterial.map((material: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {material}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">N/A</span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Finish</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {product.finish && product.finish.length > 0 ? (
                      product.finish.map((finish: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {finish}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">N/A</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Upholstery Material</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {product.upholsteryMaterial && product.upholsteryMaterial.length > 0 ? (
                      product.upholsteryMaterial.map((material: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {material}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">N/A</span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Pattern</label>
                  <p className="text-sm">{product.pattern || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Shipping Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Weight (Gms)</label>
                  <p className="text-sm">{product.weight || '0'} gms</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Dead Weight (Kg)</label>
                  <p className="text-sm">{product.deadWeight || '0'} kg</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Dimensions</label>
                  <p className="text-sm">{product.dimensions || 'N/A'}</p>
                </div>
              </div>
              
              {product.estimatedDeliveryText && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Estimated Delivery</label>
                  <p className="text-sm">{product.estimatedDeliveryText}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Product Specifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ruler className="h-5 w-5" />
                Product Specifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Room Type</label>
                  <p className="text-sm">{product.roomType || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Theme</label>
                  <p className="text-sm">{product.theme || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Made In</label>
                  <p className="text-sm">{product.madeIn || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Warranty</label>
                  <p className="text-sm">{product.warrantyTime || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Variable Options */}
          {product.inventoryType === 'variable' && product.variableOptions && product.variableOptions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Variable Options
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {product.variableOptions.map((option: any, index: number) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                        <div>
                          <span className="font-medium">Size:</span> {option.size || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium">Color:</span> {option.color || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium">Stock:</span> {option.stock || '0'}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm mt-2">
                        <div>
                          <span className="font-medium">Price:</span> ₹{option.price || '0'}
                        </div>
                        <div>
                          <span className="font-medium">Sale Price:</span> ₹{option.salePrice || '0'}
                        </div>
                        <div>
                          <span className="font-medium">SKU:</span> {option.sku || 'N/A'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Categories & Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Categories & Tags
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Categories</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {product.categories && product.categories.length > 0 ? (
                      product.categories.map((categoryId: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {getCategoryName(categoryId)}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">N/A</span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Sub Categories</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {product.subCategories && product.subCategories.length > 0 ? (
                      product.subCategories.map((subCat: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {getSubCategoryName(subCat)}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">N/A</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Brands</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {product.brands && product.brands.length > 0 ? (
                      product.brands.map((brand: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {getBrandName(brand)}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">N/A</span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tags</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {product.tags && product.tags.length > 0 ? (
                      product.tags.map((tag: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {getTagName(tag)}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">N/A</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SEO Information */}
          {(product.metaTitle || product.metaDescription) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  SEO Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
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
                  {product.metaImage && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Meta Image</label>
                      <Image
                        src={product.metaImage}
                        alt="Meta image"
                        width={100}
                        height={60}
                        className="w-24 h-16 object-cover rounded border"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Additional Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Rating</label>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">{product.rating || '0'}/5</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">New Product</label>
                  <Badge variant={product.new ? 'default' : 'outline'}>
                    {product.new ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created At</label>
                  <p className="text-sm">{product.createdAt ? new Date(product.createdAt).toLocaleString() : 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Updated At</label>
                  <p className="text-sm">{product.updatedAt ? new Date(product.updatedAt).toLocaleString() : 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
