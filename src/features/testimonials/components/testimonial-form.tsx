'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Upload, 
  Image as ImageIcon, 
  X, 
  User
} from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import { useFirebaseStorage } from '@/hooks/use-firebase-storage';
import { testimonialFormSchema, type TestimonialFormData } from '../utils/form-schema';

interface TestimonialFormProps {
  initialData?: TestimonialFormData;
  onSubmit: (data: TestimonialFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  isEditing?: boolean;
}

export function TestimonialForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isLoading = false, 
  isEditing = false 
}: TestimonialFormProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.imageUrl || null);
  const [hasNewImage, setHasNewImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { upload } = useFirebaseStorage();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<TestimonialFormData>({
    resolver: zodResolver(testimonialFormSchema),
    defaultValues: initialData || {
      name: '',
      description: '',
      imageUrl: '',
      altText: ''
    }
  });

  const currentImageUrl = watch('imageUrl');
  const isImageUploaded = !!currentImageUrl;

  // Update image preview when initial data changes
  useEffect(() => {
    if (initialData?.imageUrl) {
      setImagePreview(initialData.imageUrl);
    }
  }, [initialData?.imageUrl]);

  const handleImageUpload = async (file: File) => {
    if (!file) return;

    try {
      setUploadProgress(0);
      const imageUrl = await upload(
        `testimonials/${Date.now()}_${file.name}`,
        file
      );
      
      setValue('imageUrl', imageUrl);
      setImagePreview(imageUrl);
      setHasNewImage(true);
      setUploadProgress(0);
    } catch (error) {
      toast.error('Failed to upload image');
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleFormSubmit = (data: TestimonialFormData) => {
    onSubmit(data);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border">
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b bg-muted/30">
            <div>
              <h2 className="text-2xl font-bold">
                {isEditing ? 'Edit Testimonial' : 'Add New Testimonial'}
              </h2>
              <p className="text-muted-foreground">
                {isEditing ? 'Update testimonial information' : 'Create a new customer testimonial'}
              </p>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Basic Information
                </CardTitle>
                <CardDescription>
                  Enter the customer&apos;s basic details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    {...register('name')}
                    placeholder="Customer name"
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    {...register('description')}
                    placeholder="Customer testimonial or review"
                    rows={4}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-600">{errors.description.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Image Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Customer Photo
                </CardTitle>
                <CardDescription>
                  Upload a photo of the customer
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isLoading}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Choose Photo
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
                          width={800}
                          height={600}
                          className="w-full h-auto rounded-lg border"
                        />
                        {hasNewImage && (
                          <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                            New Image
                          </div>
                        )}
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => {
                            setImagePreview(null);
                            setValue('imageUrl', '');
                            setHasNewImage(false);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="altText">Alt Text *</Label>
                  <Input
                    id="altText"
                    {...register('altText')}
                    placeholder="Description of the image for accessibility"
                  />
                  {errors.altText && (
                    <p className="text-sm text-red-600">{errors.altText.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-2 p-6 border-t bg-muted/30">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || (!isImageUploaded && !isEditing)}>
              {isLoading ? 'Saving...' : isEditing ? 'Update Testimonial' : 'Add Testimonial'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
