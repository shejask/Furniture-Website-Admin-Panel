'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Upload, 
  Image as ImageIcon, 
  X, 
  Link,
  Settings
} from 'lucide-react';
import { useFirebaseStorage } from '@/hooks/use-firebase-storage';
import { mediaFormSchema, type MediaFormData } from '../utils/form-schema';
import Image from 'next/image';

interface MediaFormProps {
  initialData?: MediaFormData;
  onSubmit: (data: MediaFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  isEditing?: boolean;
  disabledTypes?: string[];
}

export function MediaForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isLoading = false, 
  isEditing = false,
  disabledTypes = []
}: MediaFormProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.imageUrl || null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { upload } = useFirebaseStorage();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<MediaFormData>({
    resolver: zodResolver(mediaFormSchema),
    defaultValues: initialData || {
      title: '',
      description: '',
      type: 'banner',
      imageUrl: '',
      altText: '',
      linkUrl: '',
      
      displayOrder: 0,
      
      metadata: {}
    }
  });

  // Reset form when initialData changes (for editing)
  useEffect(() => {
    if (initialData) {
      reset(initialData);
      setImagePreview(initialData.imageUrl || null);
    }
  }, [initialData, reset]);

  const watchedType = watch('type');
  const disabledSet = new Set(disabledTypes);
  const currentType = watchedType;
  
  // Check if the selected type is a banner category
  const isBannerCategory = watchedType && watchedType.startsWith('banner-category');
  
  // Check if the selected type is home advertisement
  const isHomeAdvertisement = watchedType === 'home-advertisement';
  
  // Check if fields should be hidden (only banner categories)
  const shouldHideFields = isBannerCategory;
  
  // Check if display order should be hidden (banner categories and home advertisement)
  const shouldHideDisplayOrder = isBannerCategory || isHomeAdvertisement;
  
  // Settings removed across all types
  const shouldHideSettings = true;

  const handleImageUpload = async (file: File) => {
    if (!file) return;

    try {
      setUploadProgress(0);
      const imageUrl = await upload(
        `media/${watchedType}/${Date.now()}_${file.name}`,
        file
      );
      
      setValue('imageUrl', imageUrl, { shouldValidate: true, shouldDirty: true });
      setImagePreview(imageUrl);
      setUploadProgress(0);
    } catch (error) {
      // Log error for debugging but don't expose to client
      setUploadProgress(0);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };



  const getRecommendedDimensions = (type: string) => {
    switch (type) {
      case 'banner':
        return '1920x400px (Desktop), 768x200px (Mobile)';
      case 'banner-category-1':
      case 'banner-category-2':
      case 'banner-category-3':
        return '1200x300px (Category Banner)';
      case 'home-advertisement':
        return '1200x400px (Home Page Advertisement)';
      case 'ad':
        return '728x90px (Leaderboard), 300x250px (Medium Rectangle)';
      case 'image':
        return '800x600px (General), 1200x800px (High Quality)';
      default:
        return '800x600px';
    }
  };

  const getTypeDescription = (type: string) => {
    switch (type) {
      case 'banner':
        return 'Full-width promotional banners displayed at the top of pages';
      case 'banner-category-1':
      case 'banner-category-2':
      case 'banner-category-3':
        return 'Category-specific promotional banners with simplified fields';
      case 'home-advertisement':
        return 'Home page advertisements with simplified fields';
      case 'ad':
        return 'Advertisement images for promotional campaigns';
      case 'image':
        return 'General images for content and galleries';
      default:
        return '';
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Basic Information
          </CardTitle>
          <CardDescription>
            Enter the basic details for your media item
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                {...register('title')}
                placeholder="Enter media title"
              />
              {errors.title && (
                <p className="text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
                             <Select
                 value={watchedType}
                 onValueChange={(value) => setValue('type', value as 'banner' | 'banner-category-1' | 'banner-category-2' | 'banner-category-3' | 'home-advertisement' | 'ad' | 'image')}
               >
                 <SelectTrigger>
                   <SelectValue placeholder="Select media type" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="banner">Banner</SelectItem>
                   {(!disabledSet.has('banner-category-1') || currentType === 'banner-category-1') && (
                     <SelectItem value="banner-category-1" disabled={disabledSet.has('banner-category-1') && currentType !== 'banner-category-1'}>
                       Banner Category 1
                     </SelectItem>
                   )}
                   {(!disabledSet.has('banner-category-2') || currentType === 'banner-category-2') && (
                     <SelectItem value="banner-category-2" disabled={disabledSet.has('banner-category-2') && currentType !== 'banner-category-2'}>
                       Banner Category 2
                     </SelectItem>
                   )}
                   {(!disabledSet.has('banner-category-3') || currentType === 'banner-category-3') && (
                     <SelectItem value="banner-category-3" disabled={disabledSet.has('banner-category-3') && currentType !== 'banner-category-3'}>
                       Banner Category 3
                     </SelectItem>
                   )}
                   <SelectItem value="home-advertisement">Home Advertisement</SelectItem>
                   {isEditing && (currentType === 'ad') && (
                     <SelectItem value="ad" disabled>
                       Advertisement (legacy)
                     </SelectItem>
                   )}
                   {isEditing && (currentType === 'image') && (
                     <SelectItem value="image" disabled>
                       General Image (legacy)
                     </SelectItem>
                   )}
                 </SelectContent>
               </Select>
              {errors.type && (
                <p className="text-sm text-red-600">{errors.type.message}</p>
              )}
            </div>
          </div>

                     {!shouldHideFields && (
             <div className="space-y-2">
               <Label htmlFor="description">Description</Label>
               <Textarea
                 id="description"
                 {...register('description')}
                 placeholder="Enter media description"
                 rows={3}
               />
               {errors.description && (
                 <p className="text-sm text-red-600">{errors.description.message}</p>
               )}
             </div>
           )}

                                           {!shouldHideDisplayOrder && (
                        <div className="space-y-2">
                          <Label htmlFor="displayOrder">Display Order</Label>
                          <Input
                            id="displayOrder"
                            type="number"
                            {...register('displayOrder', { valueAsNumber: true })}
                            placeholder="0"
                            min="0"
                          />
                          {errors.displayOrder && (
                            <p className="text-sm text-red-600">{errors.displayOrder.message}</p>
                          )}
                        </div>
                      )}
        </CardContent>
      </Card>

      {/* Image Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Image Upload
          </CardTitle>
          <CardDescription>
            {getTypeDescription(watchedType)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Recommended Dimensions</Label>
            <p className="text-sm text-muted-foreground">
              {getRecommendedDimensions(watchedType)}
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
              >
                <Upload className="mr-2 h-4 w-4" />
                Choose Image
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="flex-1">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Uploading... {uploadProgress}%
                  </p>
                </div>
              )}
            </div>

            {imagePreview && (
              <div className="relative">
                <div className="relative w-full max-w-md">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    width={400}
                    height={300}
                    className="w-full h-auto rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setImagePreview(null);
                      setValue('imageUrl', '', { shouldValidate: true, shouldDirty: true });
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Hidden input to register imageUrl with form */}
          <input type="hidden" {...register('imageUrl')} />

          <div className="space-y-2">
            <Label htmlFor="altText">Alt Text *</Label>
            <Input
              id="altText"
              {...register('altText')}
              placeholder="Enter alt text for accessibility"
            />
            {errors.altText && (
              <p className="text-sm text-red-600">{errors.altText.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkUrl">Link URL</Label>
            <div className="flex items-center gap-2">
              <Link className="h-4 w-4 text-muted-foreground" />
              <Input
                id="linkUrl"
                {...register('linkUrl')}
                placeholder="https://example.com"
              />
            </div>
            {errors.linkUrl && (
              <p className="text-sm text-red-600">{errors.linkUrl.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Settings - Hidden for Banner Categories and Home Advertisement */}
      {!shouldHideSettings && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Settings
            </CardTitle>
            <CardDescription>
              Configure display and scheduling options
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
          </CardContent>
        </Card>
      )}

      

      {/* Form Actions */}
      <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading || uploadProgress > 0}>
          {uploadProgress > 0 ? `Uploading... ${uploadProgress}%` : isLoading ? 'Saving...' : isEditing ? 'Update Media' : 'Add Media'}
        </Button>
      </div>
    </form>
  );
} 