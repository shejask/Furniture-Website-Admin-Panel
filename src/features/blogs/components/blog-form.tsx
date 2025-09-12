'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  X, 
  FileText,
  Upload,
  Image as ImageIcon,
  Globe
} from 'lucide-react';
import Image from 'next/image';
import { useFirebaseStorage } from '@/hooks/use-firebase-storage';
import { blogFormSchema, type BlogFormData } from '../utils/form-schema';

interface BlogFormProps {
  initialData?: BlogFormData;
  onSubmit: (data: BlogFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  isEditing?: boolean;
}

export function BlogForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isLoading = false, 
  isEditing = false 
}: BlogFormProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.imageUrl || null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { upload } = useFirebaseStorage();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<BlogFormData>({
    resolver: zodResolver(blogFormSchema),
    defaultValues: initialData || {
      title: '',
      category: '',
      description: '',
      imageUrl: '',
      altText: '',
      content: '',
      isPublished: false
    }
  });

  const handleImageUpload = async (file: File) => {
    if (!file) return;

    try {
      setUploadProgress(0);
      const imageUrl = await upload(
        `blogs/${Date.now()}_${file.name}`,
        file
      );
      
      setValue('imageUrl', imageUrl);
      setImagePreview(imageUrl);
      setUploadProgress(0);
    } catch (error) {
      // console.error('Error uploading image:', error);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleFormSubmit = (data: BlogFormData) => {
    onSubmit(data);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border">
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b bg-muted/30">
            <div>
              <h2 className="text-2xl font-bold">
                {isEditing ? 'Edit Blog Post' : 'Add New Blog Post'}
              </h2>
              <p className="text-muted-foreground">
                {isEditing ? 'Update blog post information' : 'Create a new blog post'}
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
                  <FileText className="h-5 w-5" />
                  Basic Information
                </CardTitle>
                <CardDescription>
                  Enter the blog post basic details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      {...register('title')}
                      placeholder="Blog post title"
                    />
                    {errors.title && (
                      <p className="text-sm text-red-600">{errors.title.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Input
                      id="category"
                      {...register('category')}
                      placeholder="Enter category (e.g., Technology, Business, Lifestyle)"
                    />
                    {errors.category && (
                      <p className="text-sm text-red-600">{errors.category.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    {...register('description')}
                    placeholder="Brief description of the blog post"
                    rows={3}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-600">{errors.description.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Content *</Label>
                  <Textarea
                    id="content"
                    {...register('content')}
                    placeholder="Write your blog post content here..."
                    rows={8}
                  />
                  {errors.content && (
                    <p className="text-sm text-red-600">{errors.content.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Image Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Featured Image
                </CardTitle>
                <CardDescription>
                  Upload a featured image for the blog post
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
                          width={500}
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
                            setValue('imageUrl', '');
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

            {/* Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Publishing Settings
                </CardTitle>
                <CardDescription>
                  Configure publishing options
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Published Status</Label>
                    <p className="text-sm text-muted-foreground">
                      Make this blog post visible to readers
                    </p>
                  </div>
                  <Switch
                    checked={watch('isPublished')}
                    onCheckedChange={(checked) => setValue('isPublished', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-2 p-6 border-t bg-muted/30">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : isEditing ? 'Update Blog Post' : 'Add Blog Post'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 