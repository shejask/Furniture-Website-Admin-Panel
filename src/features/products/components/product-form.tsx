'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebaseData } from '@/hooks/use-firebase-database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save, Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFirebaseOperations } from '@/hooks/use-firebase-database';
import { useFirebaseStorage } from '@/hooks/use-firebase-storage';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import Image from 'next/image';

interface SubCategory {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface ProductFormData {
  // Basic Information
  productType: 'physical' | 'digital';
  vendor: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  
  // Images
  thumbnail: string;
  images: string[];
  
  // Inventory
  inventoryType: 'simple' | 'variable';
  stockStatus: 'in_stock' | 'out_of_stock' | 'on_backorder';
  sku: string;
  stockQuantity: number;
  price: number;
  discount: number;
  salePrice: number;
  commissionAmount: number;
  
  // Variable Product Options
  variableOptions: Array<{
    name: string;
    values: string[];
  }>;
  
  // Categories and Tags
  tags: string[];
  categories: string[];
  subCategories: string[];
  brands: string[];
  
  // Color & Design
  color: string;
  style: string[];
  offerType: number;
  usageFunctionality: string[];
  theme: string;
  
  // Material & Finish
  primaryMaterial: string[];
  finish: string[];
  upholsteryMaterial: string[];
  pattern: string;
  madeIn: string;
  
  // SEO
  metaTitle: string;
  metaDescription: string;
  metaImage: string;
  
  // Shipping
  weight: number;
  estimatedDeliveryText: string;
  
  // Product Specifications
  dimensions: string;
  roomType: string;
  warrantyTime: string;
  
  // Status
  new: boolean;
  bestSeller: boolean;
  onSale: boolean;
  newArrivals: boolean;
  trending: boolean;
  featured: boolean;
}

const initialFormData: ProductFormData = {
  productType: 'physical',
  vendor: '',
  name: '',
  slug: '',
  shortDescription: '',
  description: '',
  thumbnail: '',
  images: [],
  inventoryType: 'simple',
  stockStatus: 'in_stock',
  sku: '',
  stockQuantity: 0,
  price: 0,
  discount: 0,
  salePrice: 0,
  commissionAmount: 0,
  variableOptions: [],
  tags: [] as string[],
  categories: [] as string[],
  subCategories: [] as string[],
  brands: [] as string[],
  color: 'none',
  style: [],
  offerType: 0,
  usageFunctionality: [],
  theme: 'none',
  primaryMaterial: [],
  finish: [],
  upholsteryMaterial: [],
  pattern: 'none',
  madeIn: 'none',
  metaTitle: '',
  metaDescription: '',
  metaImage: '',
  weight: 0,
  estimatedDeliveryText: '',
  dimensions: '',
  roomType: '',
  warrantyTime: '',
  new: false,
  bestSeller: false,
  onSale: false,
  newArrivals: false,
  trending: false,
  featured: false
};

interface ProductFormProps {
  initialData?: any;
}

export function ProductForm({ initialData }: ProductFormProps) {
  
  const [formData, setFormData] = useState<ProductFormData>(() => {
    if (initialData) {
      return {
        productType: initialData.productType || 'physical',
        vendor: initialData.vendor || '',
        name: initialData.name || '',
        slug: initialData.slug || '',
        shortDescription: initialData.shortDescription || '',
        description: initialData.description || '',
        thumbnail: initialData.thumbnail || '',
        images: initialData.images || [],
        inventoryType: initialData.inventoryType || 'simple',
        stockStatus: initialData.stockStatus || 'in_stock',
        sku: initialData.sku || '',
        stockQuantity: initialData.stockQuantity || initialData.stock || 0,
        price: initialData.price || 0,
        discount: initialData.discount || 0,
        salePrice: initialData.salePrice || 0,
        commissionAmount: Number(initialData.commissionAmount) || 0,
        variableOptions: initialData.variableOptions || [],
        tags: initialData.tags || [],
        categories: initialData.categories || [initialData.category || ''],
        subCategories: initialData.subCategories || [],
        brands: initialData.brands || (initialData.brand ? [initialData.brand] : []),
        color: initialData.color || 'none',
        style: initialData.style || [],
        offerType: initialData.offerType || 0,
        usageFunctionality: initialData.usageFunctionality || [],
        theme: initialData.theme || 'none',
        primaryMaterial: initialData.primaryMaterial || [],
        finish: initialData.finish || [],
        upholsteryMaterial: initialData.upholsteryMaterial || [],
        pattern: initialData.pattern || 'none',
        madeIn: initialData.madeIn || 'none',
        metaTitle: initialData.metaTitle || '',
        metaDescription: initialData.metaDescription || '',
        metaImage: initialData.metaImage || '',
        weight: initialData.weight || 0,
        estimatedDeliveryText: initialData.estimatedDeliveryText || '',
        dimensions: initialData.dimensions || '',
        roomType: initialData.roomType || '',
        warrantyTime: initialData.warrantyTime || '',
        new: initialData.new || false,
        bestSeller: initialData.bestSeller || false,
        onSale: initialData.onSale || false,
        newArrivals: initialData.newArrivals || false,
        trending: initialData.trending || false,
        featured: initialData.featured || false
      };
    }
    return initialFormData;
  });
  
  // Debug logging for edit mode
  useEffect(() => {
    if (initialData) {
      console.log('=== EDIT MODE DEBUG ===');
      console.log('Initial Data received:', initialData);
      console.log('Form Data initialized:', formData);
      console.log('Variable Options in form:', formData.variableOptions);
      console.log('Inventory Type in form:', formData.inventoryType);
      
      // Check for missing fields and log them
      const missingFields = [];
      if (!initialData.inventoryType) missingFields.push('inventoryType');
      if (!initialData.variableOptions) missingFields.push('variableOptions');
      if (!initialData.dimensions) missingFields.push('dimensions');
      if (!initialData.roomType) missingFields.push('roomType');
      if (!initialData.warrantyTime) missingFields.push('warrantyTime');
      
      if (missingFields.length > 0) {
        console.log('⚠️ Missing fields in existing product:', missingFields);
        console.log('These fields will be initialized with default values');
      }
      
      console.log('=== END EDIT MODE DEBUG ===');
    }
  }, [initialData, formData]);
  
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const router = useRouter();
  const { createWithKey, update } = useFirebaseOperations();
  const { uploadImageFile, generatePath } = useFirebaseStorage();
  
  // Fetch dynamic data
  const { data: vendors } = useFirebaseData('vendors');
  const { data: categories } = useFirebaseData('categories');
  const { data: tags } = useFirebaseData('tags');
  const { data: brands } = useFirebaseData('brands');

  // Get subcategories for a selected category
  const getSubCategoriesForCategory = (categoryId: string): SubCategory[] => {
    if (!categories || !categoryId) return [];
    
    const category = categories[categoryId];
    if (!category) return [];
    
    return category.subCategories || [];
  };

  const handleInputChange = (field: keyof ProductFormData, value: any) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value } as ProductFormData;
      
      // Debug logging for variableOptions
      if (field === 'variableOptions') {
        console.log('🔄 Updating variableOptions:', value);
        console.log('📋 Previous variableOptions:', prev.variableOptions);
        console.log('✅ New variableOptions type:', typeof value);
        console.log('📊 Is Array:', Array.isArray(value));
        
        // Ensure variableOptions is always a valid array
        if (!Array.isArray(value)) {
          console.warn('⚠️ variableOptions is not an array, converting...');
          next.variableOptions = [];
        } else {
          // Validate each option has proper structure
          next.variableOptions = value.map(option => ({
            name: option.name || '',
            values: Array.isArray(option.values) ? option.values : []
          }));
        }
      }
      
      // Reset subcategories when category changes
      if (field === 'categories') {
        next.subCategories = [];
      }
      
      // Auto-calc salePrice if commissionAmount is present and user edited price/commission/discount
      if (['price', 'commissionAmount', 'discount', 'salePrice'].includes(field)) {
        const base = Number(next.price) || 0;
        const commission = Number(next.commissionAmount) || 0;
        const discountPct = Number(next.discount) || 0;
        // If user directly edits salePrice, keep it, else compute from base+commission-discount
        if (field !== 'salePrice') {
          const discountValue = (base + commission) * (discountPct / 100);
          const computed = Math.max(0, (base + commission) - discountValue);
          next.salePrice = Number.isFinite(computed) ? Number(computed.toFixed(2)) : 0;
        }
      }
      return next;
    });
  };

  const handleNumberChange = (
    field: keyof ProductFormData,
    parser: (v: string) => number = parseFloat
  ) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (v === '') {
      // Avoid setting NaN in controlled inputs
      setFormData(prev => ({ ...prev, [field]: 0 as any }));
      return;
    }
    const num = parser(v);
    setFormData(prev => ({ ...prev, [field]: (isNaN(num) ? 0 : num) as any }));
  };

  // Custom image upload handler
  const handleImageUpload = async (files: FileList, type: 'thumbnail' | 'images' | 'metaImage') => {
    setUploadError(null);
    setUploadProgress(0);
    
    try {
      const uploadedUrls: string[] = [];
      const totalFiles = files.length;
      
      for (let i = 0; i < totalFiles; i++) {
        const file = files[i];
        const path = generatePath(file.name, `products/${type}`);
        
        const url = await uploadImageFile(path, file, {
          maxWidth: 1920,
          maxHeight: 1080,
          quality: 0.8
        });
        
        uploadedUrls.push(url);
        setUploadProgress(((i + 1) / totalFiles) * 100);
      }
      
      if (type === 'images') {
        handleInputChange('images', [...formData.images, ...uploadedUrls]);
      } else if (type === 'metaImage') {
        handleInputChange('metaImage', uploadedUrls[0]);
      } else {
        handleInputChange(type, uploadedUrls[0]);
      }
      
      setUploadProgress(100);
    } catch (error) {
      setUploadError('Failed to upload image. Please try again.');
      // Log error for debugging but don't expose to client
    }
  };

  // Image upload component
  const ImageUpload = ({ 
    label, 
    type, 
    currentValue, 
    multiple = false
  }: { 
    label: string; 
    type: 'thumbnail' | 'images' | 'metaImage'; 
    currentValue: string | string[]; 
    multiple?: boolean;
  }) => {
    const [isDragOver, setIsDragOver] = useState(false);
    
    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleImageUpload(files, type);
      }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleImageUpload(files, type);
      }
    };

    const removeImage = (index?: number) => {
      if (type === 'images' && Array.isArray(currentValue)) {
        const newImages = currentValue.filter((_, i) => i !== index);
        handleInputChange('images', newImages);
      } else {
        handleInputChange(type, '');
      }
    };

    return (
      <div className="space-y-3">
        <Label>{label}</Label>
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
            isDragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25",
            currentValue && (Array.isArray(currentValue) ? currentValue.length > 0 : currentValue) 
              ? "border-green-500 bg-green-50" 
              : ""
          )}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept="image/*"
            multiple={multiple}
            onChange={handleFileSelect}
            className="hidden"
            id={`file-upload-${type}`}
          />
          <label htmlFor={`file-upload-${type}`} className="cursor-pointer">
            <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              {isDragOver ? "Drop images here" : "Click to upload or drag and drop"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PNG, JPG, GIF up to 10MB
            </p>
          </label>
        </div>

        {/* Upload Progress */}
        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="space-y-2">
            <Progress value={uploadProgress} className="h-2" />
            <p className="text-xs text-muted-foreground">Uploading... {Math.round(uploadProgress)}%</p>
          </div>
        )}

        {/* Upload Error */}
        {uploadError && (
          <Alert variant="destructive">
            <AlertDescription>{uploadError}</AlertDescription>
          </Alert>
        )}

        {/* Image Preview */}
        {currentValue && (
          <div className="space-y-2">
            {type === 'images' && Array.isArray(currentValue) ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {currentValue.map((url, index) => (
                  <div key={index} className="relative group">
                    <Image
                      src={url}
                      alt={`Product image ${index + 1}`}
                      width={100}
                      height={50}
                      className="w-full h-24 object-cover rounded-md"
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="relative group">
                <Image
                  src={currentValue as string}
                  alt="Product image"
                  width={100}
                  height={50}
                  className="w-full h-32 object-cover rounded-md"
                />
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeImage()}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate form data before submission
      console.log('=== FORM VALIDATION ===');
      console.log('Current form data:', formData);
      console.log('Inventory Type:', formData.inventoryType);
      console.log('Variable Options:', formData.variableOptions);
      console.log('Variable Options type:', typeof formData.variableOptions);
      console.log('Variable Options is Array:', Array.isArray(formData.variableOptions));
      
      // Ensure variableOptions is always an array
      if (!Array.isArray(formData.variableOptions)) {
        console.warn('⚠️ variableOptions is not an array, fixing...');
        formData.variableOptions = [];
      }
      
      // Ensure inventoryType is set
      if (!formData.inventoryType) {
        console.warn('⚠️ inventoryType is not set, defaulting to simple...');
        formData.inventoryType = 'simple';
      }
      
      // Prepare the data, handling dates properly
      // All variation fields (variableOptions, dimensions, roomType, warrantyTime) are automatically included
      const productData = {
        ...formData,
        updatedAt: new Date().toISOString()
      };

      // Debug logging to check variableOptions
      console.log('Form Data:', formData);
      console.log('Variable Options:', formData.variableOptions);
      console.log('Product Data to Save:', productData);
      console.log('Variable Options in Product Data:', productData.variableOptions);
      console.log('Variable Options type:', typeof productData.variableOptions);
      console.log('Variable Options is Array:', Array.isArray(productData.variableOptions));
      
      // Validate that variableOptions are properly structured
      if (formData.variableOptions && formData.variableOptions.length > 0) {
        console.log('Validating variableOptions structure:');
        formData.variableOptions.forEach((option, index) => {
          console.log(`Option ${index}:`, {
            name: option.name,
            values: option.values,
            nameType: typeof option.name,
            valuesType: typeof option.values,
            isValuesArray: Array.isArray(option.values)
          });
        });
      }

      if (initialData) {
        // Update existing product
        console.log('=== UPDATING EXISTING PRODUCT ===');
        console.log('Product ID:', initialData.id);
        console.log('Data being sent to update:', productData);
        console.log('Variable Options being updated:', productData.variableOptions);
        
        // Force ensure all required fields are present for existing products
        const completeProductData = {
          ...productData,
          // CRITICAL: Force these fields to exist with proper values
          inventoryType: productData.inventoryType || 'simple',
          variableOptions: Array.isArray(productData.variableOptions) ? productData.variableOptions : [],
          dimensions: productData.dimensions || '',
          roomType: productData.roomType || '',
          warrantyTime: productData.warrantyTime || '',
          new: Boolean(productData.new),
          bestSeller: Boolean(productData.bestSeller),
          onSale: Boolean(productData.onSale),
          newArrivals: Boolean(productData.newArrivals),
          trending: Boolean(productData.trending),
          featured: Boolean(productData.featured),
          tags: Array.isArray(productData.tags) ? productData.tags : [],
          categories: Array.isArray(productData.categories) ? productData.categories : [],
          subCategories: Array.isArray(productData.subCategories) ? productData.subCategories : [],
          brands: Array.isArray(productData.brands) ? productData.brands : [],
          metaTitle: productData.metaTitle || '',
          metaDescription: productData.metaDescription || '',
          metaImage: productData.metaImage || '',
          weight: Number(productData.weight) || 0,
          estimatedDeliveryText: productData.estimatedDeliveryText || ''
        };
        
        console.log('Complete product data for update:', completeProductData);
        console.log('Variable Options type:', typeof completeProductData.variableOptions);
        console.log('Variable Options is Array:', Array.isArray(completeProductData.variableOptions));
        console.log('Variable Options content:', completeProductData.variableOptions);
        
        try {
          // First, try to update with complete data
          await update(`products/${initialData.id}`, completeProductData);
          console.log('Product updated successfully!');
          
          // Verify the update by checking if we can read the data back
          console.log('Update completed. Product should now have all required fields.');
          
          router.push(`/dashboard/product/${initialData.id}`);
        } catch (updateError) {
          console.error('Update operation failed:', updateError);
          console.error('Update error details:', {
            message: updateError instanceof Error ? updateError.message : 'Unknown error',
            stack: updateError instanceof Error ? updateError.stack : 'No stack trace'
          });
          throw updateError;
        }
      } else {
        // Create new product
        const productWithCreatedAt = {
          ...productData,
          createdAt: new Date().toISOString()
        };
        await createWithKey('products', productWithCreatedAt);
        router.push('/dashboard/product');
      }
    } catch (error) {
      // Log error for debugging but don't expose to client
      console.error('Error saving product:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        formData: formData
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-none">
      <form onSubmit={handleSubmit} className="w-full space-y-8">
          {/* Basic Information */}
          <Card className="w-full border-0 shadow-lg">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="w-3 h-3 bg-primary rounded-full"></div>
                Basic Information
              </CardTitle>
              <CardDescription className="text-base">
                Enter the basic product details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="productType">Product Type *</Label>
                  <Select
                    value={formData.productType}
                    onValueChange={(value) => handleInputChange('productType', value)}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select product type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="physical">Physical Product</SelectItem>
                      <SelectItem value="digital">Digital Product</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="vendor">Vendors</Label>
                  <Select
                    value={formData.vendor}
                    onValueChange={(value) => handleInputChange('vendor', value)}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      {vendors && Object.entries(vendors).map(([id, vendor]) => (
                        <SelectItem key={id} value={id}>
                          {(vendor as any).storeName || (vendor as any).name || id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter product name"
                    className="h-12"
                    required
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => handleInputChange('slug', e.target.value)}
                    placeholder="Enter product slug"
                    className="h-12"
                    required
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="shortDescription">Short Description *</Label>
                <Textarea
                  id="shortDescription"
                  value={formData.shortDescription}
                  onChange={(e) => handleInputChange('shortDescription', e.target.value)}
                  placeholder="Enter short description"
                  rows={4}
                  className="resize-none min-h-[120px]"
                  required
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Enter detailed description"
                  rows={8}
                  className="resize-none min-h-[200px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Product Images */}
          <Card className="w-full border-0 shadow-lg">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="w-3 h-3 bg-primary rounded-full"></div>
                Product Images
              </CardTitle>
              <CardDescription className="text-base">
                Upload product images and media
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
                <ImageUpload
                  label="Thumbnail"
                  type="thumbnail"
                  currentValue={formData.thumbnail}
                />
              </div>

              <ImageUpload
                label="Product Images"
                type="images"
                currentValue={formData.images}
                multiple
              />
            </CardContent>
          </Card>

          {/* Inventory */}
          <Card className="w-full border-0 shadow-lg">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="w-3 h-3 bg-primary rounded-full"></div>
                Inventory & Pricing
              </CardTitle>
              <CardDescription className="text-base">
                Manage product inventory and pricing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* <div className="space-y-3">
                  <Label htmlFor="inventoryType">Type *</Label>
                  <Select
                    value={formData.inventoryType}
                    onValueChange={(value) => handleInputChange('inventoryType', value)}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select inventory type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simple">Simple Product</SelectItem>
                      <SelectItem value="variable">Variable Product</SelectItem>
                    </SelectContent>
                  </Select>
                </div> */}

                <div className="space-y-3">
                  <Label htmlFor="stockStatus">Stock Status *</Label>
                  <Select
                    value={formData.stockStatus}
                    onValueChange={(value) => handleInputChange('stockStatus', value)}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select stock status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in_stock">In Stock</SelectItem>
                      <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                      <SelectItem value="on_backorder">On Backorder</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="sku">SKU *</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => handleInputChange('sku', e.target.value)}
                    placeholder="Enter SKU"
                    className="h-12"
                    required
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="stockQuantity">Stock Quantity *</Label>
                  <Input
                    id="stockQuantity"
                    type="number"
                    value={Number.isFinite(formData.stockQuantity) ? formData.stockQuantity : ''}
                    onChange={handleNumberChange('stockQuantity', (v) => parseInt(v, 10))}
                    placeholder="Enter quantity"
                    className="h-12"
                    required
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="price">Price *</Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground">₹</span>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={Number.isFinite(formData.price) ? formData.price : ''}
                      onChange={handleNumberChange('price', parseFloat)}
                      placeholder="Enter price"
                      className="h-12 pl-8"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="discount">Discount (%)</Label>
                  <Input
                    id="discount"
                    type="number"
                    step="0.01"
                    value={Number.isFinite(formData.discount) ? formData.discount : ''}
                    onChange={handleNumberChange('discount', parseFloat)}
                    placeholder="Enter discount"
                    className="h-12"
                  />
                </div>

                <div className="space-y-3">
                <Label htmlFor="salePrice">Sale Price (Final price customer pays)</Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground">₹</span>
                    <Input
                      id="salePrice"
                      type="number"
                      step="0.01"
                      value={Number.isFinite(formData.salePrice) ? formData.salePrice : ''}
                      onChange={handleNumberChange('salePrice', parseFloat)}
                      placeholder="0.00"
                      className="h-12 pl-8"
                    />
                  </div>
                <p className="text-xs text-muted-foreground">Sale Price is the final payable amount.</p>
                </div>

                              <div className="space-y-3">
                  <Label htmlFor="commissionAmount">Commission Amount (auto-adds to Sale Price)</Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground">₹</span>
                    <Input
                      id="commissionAmount"
                      type="number"
                      step="0.01"
                      value={Number.isFinite(formData.commissionAmount) ? formData.commissionAmount : ''}
                      onChange={handleNumberChange('commissionAmount', parseFloat)}
                      placeholder="0.00"
                      className="h-12 pl-8"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">When set, Sale Price will auto-calculate as Price + Commission Amount - Discount.</p>
                </div>
              </div>

              {/* Variable Product Options */}
              {formData.inventoryType === 'variable' && (
                <div className="space-y-6">
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4">Variable Product Options</h3>
                    
                    <div className="space-y-4">
                      {/* Size Options */}
                      <div className="space-y-3">
                        <Label>Size Options</Label>
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Input
                              placeholder="Add size (e.g., Small, Medium, Large)"
                              className="flex-1"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const input = e.target as HTMLInputElement;
                                  const sizeValue = input.value.trim();
                                  if (sizeValue) {
                                    const currentOptions = Array.isArray(formData.variableOptions) ? [...formData.variableOptions] : [];
                                    const sizeOptionIndex = currentOptions.findIndex(option => option.name === 'Size');
                                    
                                    if (sizeOptionIndex >= 0) {
                                      // Update existing Size option
                                      if (!currentOptions[sizeOptionIndex].values.includes(sizeValue)) {
                                        currentOptions[sizeOptionIndex].values.push(sizeValue);
                                      }
                                    } else {
                                      // Create new Size option
                                      currentOptions.push({ name: 'Size', values: [sizeValue] });
                                    }
                                    
                                    handleInputChange('variableOptions', currentOptions);
                                    input.value = '';
                                  }
                                }
                              }}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={(e) => {
                                const input = (e.target as HTMLElement).parentElement?.querySelector('input') as HTMLInputElement;
                                const sizeValue = input?.value.trim();
                                if (sizeValue) {
                                  const currentOptions = Array.isArray(formData.variableOptions) ? [...formData.variableOptions] : [];
                                  const sizeOptionIndex = currentOptions.findIndex(option => option.name === 'Size');
                                  
                                  if (sizeOptionIndex >= 0) {
                                    if (!currentOptions[sizeOptionIndex].values.includes(sizeValue)) {
                                      currentOptions[sizeOptionIndex].values.push(sizeValue);
                                    }
                                  } else {
                                    currentOptions.push({ name: 'Size', values: [sizeValue] });
                                  }
                                  
                                  handleInputChange('variableOptions', currentOptions);
                                  input.value = '';
                                }
                              }}
                            >
                              Add
                            </Button>
                          </div>
                          {/* Display current size values */}
                          <div className="flex flex-wrap gap-2">
                            {formData.variableOptions
                              .find(option => option.name === 'Size')
                              ?.values.map((value, index) => (
                                <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm">
                                  {value}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const currentOptions = [...formData.variableOptions];
                                      const sizeOptionIndex = currentOptions.findIndex(option => option.name === 'Size');
                                      if (sizeOptionIndex >= 0) {
                                        currentOptions[sizeOptionIndex].values = currentOptions[sizeOptionIndex].values.filter((_, i) => i !== index);
                                        if (currentOptions[sizeOptionIndex].values.length === 0) {
                                          currentOptions.splice(sizeOptionIndex, 1);
                                        }
                                        handleInputChange('variableOptions', currentOptions);
                                      }
                                    }}
                                    className="text-blue-600 hover:text-blue-800"
                                  >
                                    ×
                                  </button>
                                </span>
                              )) || []}
                          </div>
                        </div>
                      </div>

                      {/* Material Options */}
                      <div className="space-y-3">
                        <Label>Material Options</Label>
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Input
                              placeholder="Add material (e.g., Wood, Metal, Plastic)"
                              className="flex-1"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const input = e.target as HTMLInputElement;
                                  const materialValue = input.value.trim();
                                  if (materialValue) {
                                    const currentOptions = Array.isArray(formData.variableOptions) ? [...formData.variableOptions] : [];
                                    const materialOptionIndex = currentOptions.findIndex(option => option.name === 'Material');
                                    
                                    if (materialOptionIndex >= 0) {
                                      if (!currentOptions[materialOptionIndex].values.includes(materialValue)) {
                                        currentOptions[materialOptionIndex].values.push(materialValue);
                                      }
                                    } else {
                                      currentOptions.push({ name: 'Material', values: [materialValue] });
                                    }
                                    
                                    handleInputChange('variableOptions', currentOptions);
                                    input.value = '';
                                  }
                                }
                              }}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={(e) => {
                                const input = (e.target as HTMLElement).parentElement?.querySelector('input') as HTMLInputElement;
                                const materialValue = input?.value.trim();
                                if (materialValue) {
                                  const currentOptions = Array.isArray(formData.variableOptions) ? [...formData.variableOptions] : [];
                                  const materialOptionIndex = currentOptions.findIndex(option => option.name === 'Material');
                                  
                                  if (materialOptionIndex >= 0) {
                                    if (!currentOptions[materialOptionIndex].values.includes(materialValue)) {
                                      currentOptions[materialOptionIndex].values.push(materialValue);
                                    }
                                  } else {
                                    currentOptions.push({ name: 'Material', values: [materialValue] });
                                    input.value = '';
                                  }
                                  
                                  handleInputChange('variableOptions', currentOptions);
                                }
                              }}
                            >
                              Add
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {formData.variableOptions
                              .find(option => option.name === 'Material')
                              ?.values.map((value, index) => (
                                <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-md text-sm">
                                  {value}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const currentOptions = [...formData.variableOptions];
                                      const materialOptionIndex = currentOptions.findIndex(option => option.name === 'Material');
                                      if (materialOptionIndex >= 0) {
                                        currentOptions[materialOptionIndex].values = currentOptions[materialOptionIndex].values.filter((_, i) => i !== index);
                                        if (currentOptions[materialOptionIndex].values.length === 0) {
                                          currentOptions.splice(materialOptionIndex, 1);
                                        }
                                        handleInputChange('variableOptions', currentOptions);
                                      }
                                    }}
                                    className="text-green-600 hover:text-green-800"
                                  >
                                    ×
                                  </button>
                                </span>
                              )) || []}
                          </div>
                        </div>
                      </div>

                      {/* Color Options */}
                      <div className="space-y-3">
                        <Label>Color Options</Label>
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Input
                              placeholder="Add color (e.g., Brown, Black, White)"
                              className="flex-1"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const input = e.target as HTMLInputElement;
                                  const colorValue = input.value.trim();
                                  if (colorValue) {
                                    const currentOptions = Array.isArray(formData.variableOptions) ? [...formData.variableOptions] : [];
                                    const colorOptionIndex = currentOptions.findIndex(option => option.name === 'Color');
                                    
                                    if (colorOptionIndex >= 0) {
                                      if (!currentOptions[colorOptionIndex].values.includes(colorValue)) {
                                        currentOptions[colorOptionIndex].values.push(colorValue);
                                      }
                                    } else {
                                      currentOptions.push({ name: 'Color', values: [colorValue] });
                                    }
                                    
                                    handleInputChange('variableOptions', currentOptions);
                                    input.value = '';
                                  }
                                }
                              }}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={(e) => {
                                const input = (e.target as HTMLElement).parentElement?.querySelector('input') as HTMLInputElement;
                                const colorValue = input?.value.trim();
                                if (colorValue) {
                                  const currentOptions = Array.isArray(formData.variableOptions) ? [...formData.variableOptions] : [];
                                  const colorOptionIndex = currentOptions.findIndex(option => option.name === 'Color');
                                  
                                  if (colorOptionIndex >= 0) {
                                    if (!currentOptions[colorOptionIndex].values.includes(colorValue)) {
                                      currentOptions[colorOptionIndex].values.push(colorValue);
                                    }
                                  } else {
                                    currentOptions.push({ name: 'Color', values: [colorValue] });
                                  }
                                  
                                  handleInputChange('variableOptions', currentOptions);
                                  input.value = '';
                                }
                              }}
                            >
                              Add
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {formData.variableOptions
                              .find(option => option.name === 'Color')
                              ?.values.map((value, index) => (
                                <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded-md text-sm">
                                  {value}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const currentOptions = [...formData.variableOptions];
                                      const colorOptionIndex = currentOptions.findIndex(option => option.name === 'Color');
                                      if (colorOptionIndex >= 0) {
                                        currentOptions[colorOptionIndex].values = currentOptions[colorOptionIndex].values.filter((_, i) => i !== index);
                                        if (currentOptions[colorOptionIndex].values.length === 0) {
                                          currentOptions.splice(colorOptionIndex, 1);
                                        }
                                        handleInputChange('variableOptions', currentOptions);
                                      }
                                    }}
                                    className="text-purple-800"
                                  >
                                    ×
                                  </button>
                                </span>
                              )) || []}
                          </div>
                        </div>
                      </div>

                      {/* Add Custom Field */}
                      <div className="space-y-3">
                        <Label>Add Custom Field</Label>
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Input
                              placeholder="Field name (e.g., Pattern, Style, Finish)"
                              className="flex-1"
                              id="custom-field-name"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                const input = document.getElementById('custom-field-name') as HTMLInputElement;
                                const fieldName = input?.value.trim();
                                if (fieldName) {
                                  const currentOptions = Array.isArray(formData.variableOptions) ? [...formData.variableOptions] : [];
                                  if (!currentOptions.some(option => option.name === fieldName)) {
                                    currentOptions.push({ name: fieldName, values: [] });
                                    handleInputChange('variableOptions', currentOptions);
                                    input.value = '';
                                  }
                                }
                              }}
                            >
                              Add Field
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Dynamic Custom Fields */}
                      {formData.variableOptions
                        .filter(option => !['Size', 'Material', 'Color'].includes(option.name))
                        .map((option, optionIndex) => (
                          <div key={option.name} className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Label>{option.name} Options</Label>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const currentOptions = [...formData.variableOptions];
                                  const index = currentOptions.findIndex(opt => opt.name === option.name);
                                  if (index >= 0) {
                                    currentOptions.splice(index, 1);
                                    handleInputChange('variableOptions', currentOptions);
                                  }
                                }}
                                className="text-red-600 hover:text-red-700"
                              >
                                Remove Field
                              </Button>
                            </div>
                            <div className="space-y-2">
                              <div className="flex gap-2">
                                <Input
                                  placeholder={`Add ${option.name.toLowerCase()} value`}
                                  className="flex-1"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      const input = e.target as HTMLInputElement;
                                      const value = input.value.trim();
                                      if (value) {
                                        const currentOptions = [...formData.variableOptions];
                                        const index = currentOptions.findIndex(opt => opt.name === option.name);
                                        if (index >= 0 && !currentOptions[index].values.includes(value)) {
                                          currentOptions[index].values.push(value);
                                          handleInputChange('variableOptions', currentOptions);
                                          input.value = '';
                                        }
                                      }
                                    }
                                  }}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={(e) => {
                                    const input = (e.target as HTMLElement).parentElement?.querySelector('input') as HTMLInputElement;
                                    const value = input?.value.trim();
                                    if (value) {
                                      const currentOptions = [...formData.variableOptions];
                                      const index = currentOptions.findIndex(opt => opt.name === option.name);
                                      if (index >= 0 && !currentOptions[index].values.includes(value)) {
                                        currentOptions[index].values.push(value);
                                        handleInputChange('variableOptions', currentOptions);
                                      }
                                    }
                                    input.value = '';
                                  }}
                                >
                                  Add
                                </Button>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {option.values.map((value, valueIndex) => (
                                  <span key={valueIndex} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 rounded-md text-sm">
                                    {value}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const currentOptions = [...formData.variableOptions];
                                        const index = currentOptions.findIndex(opt => opt.name === option.name);
                                        if (index >= 0) {
                                          currentOptions[index].values = currentOptions[index].values.filter((_, i) => i !== valueIndex);
                                          handleInputChange('variableOptions', currentOptions);
                                        }
                                      }}
                                      className="text-gray-600 hover:text-gray-800"
                                    >
                                      ×
                                    </button>
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}

                      {/* Current Options Summary */}
                      {formData.variableOptions.length > 0 && (
                        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                          <h4 className="text-sm font-medium mb-3">Current Variable Options Summary:</h4>
                          <div className="space-y-2">
                            {formData.variableOptions.map((option, index) => (
                              <div key={index} className="text-sm">
                                <span className="font-medium">{option.name}:</span>
                                <span className="ml-2 text-gray-600">
                                  {option.values.length > 0 ? option.values.join(', ') : 'No values'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Categories and Tags */}
          <Card className="w-full border-0 shadow-lg">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="w-3 h-3 bg-primary rounded-full"></div>
                Categories and Tags
              </CardTitle>
              <CardDescription className="text-base">
                Organize your product with categories and tags
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label>Tags</Label>
                  <Select
                    value={formData.tags[0] || ''}
                    onValueChange={(value) => {
                      handleInputChange('tags', [value]);
                    }}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select tags" />
                    </SelectTrigger>
                    <SelectContent>
                      {tags && Object.entries(tags).map(([id, tag]) => (
                        <SelectItem key={id} value={id}>
                          {(tag as any).name || id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Brands</Label>
                  <Select
                    value={formData.brands[0] || ''}
                    onValueChange={(value) => {
                      handleInputChange('brands', [value]);
                    }}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select brands" />
                    </SelectTrigger>
                    <SelectContent>
                      {brands && Object.entries(brands).map(([id, brand]) => (
                        <SelectItem key={id} value={id}>
                          {(brand as any).name || id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label>Categories *</Label>
                  <Select
                    value={formData.categories[0] || ''}
                    onValueChange={(value) => {
                      handleInputChange('categories', [value]);
                    }}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select categories" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories && Object.entries(categories).map(([id, category]) => (
                        <SelectItem key={id} value={id}>
                          {(category as any).name || id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                                  <div className="space-y-3">
                    <Label>Sub-Categories</Label>
                    <Select
                      value={formData.subCategories[0] || 'none'}
                      onValueChange={(value) => {
                        if (value === 'none') {
                          handleInputChange('subCategories', []);
                        } else {
                          handleInputChange('subCategories', [value]);
                        }
                      }}
                      disabled={!formData.categories[0]}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder={formData.categories[0] ? "Select sub-category" : "Select a category first"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No sub-category</SelectItem>
                        {formData.categories[0] && getSubCategoriesForCategory(formData.categories[0]).map((subCategory: SubCategory) => (
                          <SelectItem key={subCategory.id} value={subCategory.id}>
                            {subCategory.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!formData.categories[0] && (
                      <p className="text-xs text-muted-foreground">
                        Please select a category first to choose sub-categories
                      </p>
                    )}
                    {formData.categories[0] && getSubCategoriesForCategory(formData.categories[0]).length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        This category has no sub-categories available
                      </p>
                    )}
                  </div>
              </div>
            </CardContent>
          </Card>

          {/* Color & Design */}
          <Card className="w-full border-0 shadow-lg">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="w-3 h-3 bg-primary rounded-full"></div>
                Color & Design
              </CardTitle>
              <CardDescription className="text-base">
                Product color, style, and design specifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="color">Color</Label>
                  <Select
                    value={formData.color}
                    onValueChange={(value) => handleInputChange('color', value)}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select color" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="white">White</SelectItem>
                      <SelectItem value="black">Black</SelectItem>
                      <SelectItem value="grey">Grey</SelectItem>
                      <SelectItem value="brown">Brown</SelectItem>
                      <SelectItem value="beige">Beige</SelectItem>
                      <SelectItem value="blue">Blue</SelectItem>
                      <SelectItem value="green">Green</SelectItem>
                      <SelectItem value="red">Red</SelectItem>
                      <SelectItem value="yellow">Yellow</SelectItem>
                      <SelectItem value="multicolor">Multicolor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="theme">Theme</Label>
                  <Select
                    value={formData.theme}
                    onValueChange={(value) => handleInputChange('theme', value)}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="festive">Festive</SelectItem>
                      <SelectItem value="contemporary">Contemporary</SelectItem>
                      <SelectItem value="vintage">Vintage</SelectItem>
                      <SelectItem value="handmade">Handmade</SelectItem>
                      <SelectItem value="luxury">Luxury</SelectItem>
                      <SelectItem value="rustic">Rustic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Style & Design (Multi-select)</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['Modern', 'Contemporary', 'Minimalist', 'Traditional', 'Scandinavian', 'Industrial', 'Bohemian'].map((styleOption) => (
                    <div key={styleOption} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`style-${styleOption.toLowerCase()}`}
                        checked={formData.style.includes(styleOption.toLowerCase())}
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleInputChange('style', [...formData.style, styleOption.toLowerCase()]);
                          } else {
                            handleInputChange('style', formData.style.filter(s => s !== styleOption.toLowerCase()));
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor={`style-${styleOption.toLowerCase()}`} className="text-sm">
                        {styleOption}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Usage / Functionality (Multi-select)</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['Space-saving', 'Modular', 'Multi-functional', 'Ergonomic', 'Portable', 'Stackable', 'Foldable', 'Adjustable'].map((usageOption) => (
                    <div key={usageOption} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`usage-${usageOption.toLowerCase().replace(/\s+/g, '-')}`}
                        checked={formData.usageFunctionality.includes(usageOption.toLowerCase().replace(/\s+/g, '-'))}
                        onChange={(e) => {
                          const value = usageOption.toLowerCase().replace(/\s+/g, '-');
                          if (e.target.checked) {
                            handleInputChange('usageFunctionality', [...formData.usageFunctionality, value]);
                          } else {
                            handleInputChange('usageFunctionality', formData.usageFunctionality.filter(u => u !== value));
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor={`usage-${usageOption.toLowerCase().replace(/\s+/g, '-')}`} className="text-sm">
                        {usageOption}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="offerType">Offer Type: {formData.offerType}%</Label>
                <div className="space-y-2">
                  <input
                    type="range"
                    id="offerType"
                    min="0"
                    max="100"
                    value={formData.offerType}
                    onChange={(e) => handleInputChange('offerType', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>0%</span>
                    <span>25%</span>
                    <span>50%</span>
                    <span>75%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Material & Finish */}
          <Card className="w-full border-0 shadow-lg">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="w-3 h-3 bg-primary rounded-full"></div>
                Material & Finish
              </CardTitle>
              <CardDescription className="text-base">
                Product materials, finishes, and upholstery details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label>Primary Material (Multi-select)</Label>
                  <div className="grid grid-cols-2 gap-3 max-h-32 overflow-y-auto">
                    {['Wood (Teak)', 'Wood (Oak)', 'Wood (Engineered)', 'Metal', 'Glass', 'Plastic', 'Rattan', 'Fabric', 'Marble', 'Granite', 'Ceramic', 'Bamboo'].map((materialOption) => (
                      <div key={materialOption} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`material-${materialOption.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                          checked={formData.primaryMaterial.includes(materialOption)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              handleInputChange('primaryMaterial', [...formData.primaryMaterial, materialOption]);
                            } else {
                              handleInputChange('primaryMaterial', formData.primaryMaterial.filter(m => m !== materialOption));
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor={`material-${materialOption.toLowerCase().replace(/[^a-z0-9]/g, '-')}`} className="text-sm">
                          {materialOption}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Finish (Multi-select)</Label>
                  <div className="grid grid-cols-2 gap-3 max-h-32 overflow-y-auto">
                    {['Matte', 'Glossy', 'Textured', 'Polished', 'Painted', 'Natural', 'Distressed', 'Brushed', 'Anodized', 'Powder Coated'].map((finishOption) => (
                      <div key={finishOption} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`finish-${finishOption.toLowerCase().replace(/\s+/g, '-')}`}
                          checked={formData.finish.includes(finishOption)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              handleInputChange('finish', [...formData.finish, finishOption]);
                            } else {
                              handleInputChange('finish', formData.finish.filter(f => f !== finishOption));
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor={`finish-${finishOption.toLowerCase().replace(/\s+/g, '-')}`} className="text-sm">
                          {finishOption}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label>Upholstery Material (Multi-select)</Label>
                  <div className="grid grid-cols-2 gap-3 max-h-32 overflow-y-auto">
                    {['Cotton', 'Linen', 'Velvet', 'Leatherette', 'Jute', 'Wool', 'Silk', 'Polyester', 'Microfiber', 'Suede', 'Canvas'].map((upholsteryOption) => (
                      <div key={upholsteryOption} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`upholstery-${upholsteryOption.toLowerCase()}`}
                          checked={formData.upholsteryMaterial.includes(upholsteryOption)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              handleInputChange('upholsteryMaterial', [...formData.upholsteryMaterial, upholsteryOption]);
                            } else {
                              handleInputChange('upholsteryMaterial', formData.upholsteryMaterial.filter(u => u !== upholsteryOption));
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor={`upholstery-${upholsteryOption.toLowerCase()}`} className="text-sm">
                          {upholsteryOption}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="pattern">Pattern</Label>
                  <Select
                    value={formData.pattern}
                    onValueChange={(value) => handleInputChange('pattern', value)}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select pattern" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="solid">Solid</SelectItem>
                      <SelectItem value="striped">Striped</SelectItem>
                      <SelectItem value="floral">Floral</SelectItem>
                      <SelectItem value="geometric">Geometric</SelectItem>
                      <SelectItem value="printed">Printed</SelectItem>
                      <SelectItem value="embossed">Embossed</SelectItem>
                      <SelectItem value="woven">Woven</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="madeIn">Made In</Label>
                <Select
                  value={formData.madeIn}
                  onValueChange={(value) => handleInputChange('madeIn', value)}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select country of origin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="india">India</SelectItem>
                    <SelectItem value="italy">Italy</SelectItem>
                    <SelectItem value="china">China</SelectItem>
                    <SelectItem value="usa">USA</SelectItem>
                    <SelectItem value="germany">Germany</SelectItem>
                    <SelectItem value="france">France</SelectItem>
                    <SelectItem value="japan">Japan</SelectItem>
                    <SelectItem value="uk">UK</SelectItem>
                    <SelectItem value="spain">Spain</SelectItem>
                    <SelectItem value="sweden">Sweden</SelectItem>
                    <SelectItem value="denmark">Denmark</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* SEO */}
          <Card className="w-full border-0 shadow-lg">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="w-3 h-3 bg-primary rounded-full"></div>
                SEO Settings
              </CardTitle>
              <CardDescription className="text-base">
                Search engine optimization settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="metaTitle">Meta Title</Label>
                <Input
                  id="metaTitle"
                  value={formData.metaTitle}
                  onChange={(e) => handleInputChange('metaTitle', e.target.value)}
                  placeholder="Enter meta title"
                  className="h-12"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="metaDescription">Meta Description</Label>
                <Textarea
                  id="metaDescription"
                  value={formData.metaDescription}
                  onChange={(e) => handleInputChange('metaDescription', e.target.value)}
                  placeholder="Enter meta description"
                  rows={4}
                  className="resize-none"
                />
              </div>

              <div className="space-y-3">
                <Label>Meta Image</Label>
                <ImageUpload
                  label="Meta Image"
                  type="metaImage"
                  currentValue={formData.metaImage}
                />
              </div>
            </CardContent>
          </Card>

          {/* Shipping */}
          <Card className="w-full border-0 shadow-lg">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="w-3 h-3 bg-primary rounded-full"></div>
                Shipping Settings
              </CardTitle>
              <CardDescription className="text-base">
                Configure shipping settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="weight">Weight (Gms)</Label>
                  <Input
                    id="weight"
                    type="number"
                    value={Number.isFinite(formData.weight) ? formData.weight : ''}
                    onChange={handleNumberChange('weight', parseFloat)}
                    placeholder="e.g., 100"
                    className="h-12"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="estimatedDeliveryText">Estimated Delivery Text</Label>
                  <Input
                    id="estimatedDeliveryText"
                    value={formData.estimatedDeliveryText}
                    onChange={(e) => handleInputChange('estimatedDeliveryText', e.target.value)}
                    placeholder="e.g., Your order is likely to reach you within 5 to 10 days"
                    className="h-12"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product Specifications */}
          <Card className="w-full border-0 shadow-lg">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="w-3 h-3 bg-primary rounded-full"></div>
                Product Specifications
              </CardTitle>
              <CardDescription className="text-base">
                Additional product details and specifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Dimensions */}
              <div className="space-y-3">
                <Label htmlFor="dimensions">Dimensions (In Centimeters)</Label>
                <Input
                  id="dimensions"
                  type="text"
                  value={formData.dimensions}
                  onChange={(e) => handleInputChange('dimensions', e.target.value)}
                  placeholder="e.g., 120 x 80 x 75 (L x W x H)"
                  className="h-12"
                />
                <p className="text-xs text-muted-foreground">
                  Enter dimensions in format: Length x Width x Height (e.g., 120 x 80 x 75)
                </p>
              </div>

              {/* Room Type */}
              <div className="space-y-3">
                <Label htmlFor="roomType">Room Type</Label>
                <Select
                  value={formData.roomType}
                  onValueChange={(value) => handleInputChange('roomType', value)}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select room type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="living-room">Living Room</SelectItem>
                    <SelectItem value="bedroom">Bedroom</SelectItem>
                    <SelectItem value="dining-room">Dining Room</SelectItem>
                    <SelectItem value="kitchen">Kitchen</SelectItem>
                    <SelectItem value="bathroom">Bathroom</SelectItem>
                    <SelectItem value="office">Office</SelectItem>
                    <SelectItem value="outdoor">Outdoor</SelectItem>
                    <SelectItem value="nursery">Nursery</SelectItem>
                    <SelectItem value="study">Study</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Warranty Time */}
              <div className="space-y-3">
                <Label htmlFor="warrantyTime">Warranty Time</Label>
                <Select
                  value={formData.warrantyTime}
                  onValueChange={(value) => handleInputChange('warrantyTime', value)}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select warranty time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-warranty">No Warranty</SelectItem>
                    <SelectItem value="3-months">3 Months</SelectItem>
                    <SelectItem value="6-months">6 Months</SelectItem>
                    <SelectItem value="1-year">1 Year</SelectItem>
                    <SelectItem value="2-years">2 Years</SelectItem>
                    <SelectItem value="3-years">3 Years</SelectItem>
                    <SelectItem value="5-years">5 Years</SelectItem>
                    <SelectItem value="10-years">10 Years</SelectItem>
                    <SelectItem value="lifetime">Lifetime</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Status */}
          <Card className="w-full border-0 shadow-lg">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="w-3 h-3 bg-primary rounded-full"></div>
                Product Status
              </CardTitle>
              <CardDescription className="text-base">
                Configure product status and visibility
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="flex items-center space-x-3">
                  <Switch
                    id="new"
                    checked={formData.new}
                    onCheckedChange={(checked) => handleInputChange('new', checked)}
                  />
                  <Label htmlFor="new" className="text-base">New</Label>
                </div>

                <div className="flex items-center space-x-3">
                  <Switch
                    id="bestSeller"
                    checked={formData.bestSeller}
                    onCheckedChange={(checked) => handleInputChange('bestSeller', checked)}
                  />
                  <Label htmlFor="bestSeller" className="text-base">Best Seller</Label>
                </div>

                <div className="flex items-center space-x-3">
                  <Switch
                    id="onSale"
                    checked={formData.onSale}
                    onCheckedChange={(checked) => handleInputChange('onSale', checked)}
                  />
                  <Label htmlFor="onSale" className="text-base">On Sale</Label>
                </div>

                <div className="flex items-center space-x-3">
                  <Switch
                    id="newArrivals"
                    checked={formData.newArrivals}
                    onCheckedChange={(checked) => handleInputChange('newArrivals', checked)}
                  />
                  <Label htmlFor="newArrivals" className="text-base">New Arrivals</Label>
                </div>

                <div className="flex items-center space-x-3">
                  <Switch
                    id="trending"
                    checked={formData.trending}
                    onCheckedChange={(checked) => handleInputChange('trending', checked)}
                  />
                  <Label htmlFor="trending" className="text-base">Trending</Label>
                </div>

                <div className="flex items-center space-x-3">
                  <Switch
                    id="featured"
                    checked={formData.featured}
                    onCheckedChange={(checked) => handleInputChange('featured', checked)}
                  />
                  <Label htmlFor="featured" className="text-base">Featured Product</Label>
                </div>


              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex items-center justify-start pt-6 pb-8">
            <Button type="submit" disabled={loading} size="lg" className="min-w-[160px]">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {initialData ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {initialData ? 'Update Product' : 'Create Product'}
                </>
              )}
            </Button>
          </div>
      </form>
    </div>
  );
}
