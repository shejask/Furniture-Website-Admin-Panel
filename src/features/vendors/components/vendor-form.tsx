'use client';

import { useState, useRef } from 'react';
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
  Store, 
  X, 
  User,
  Lock,
  Globe,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Link
} from 'lucide-react';
import { useFirebaseStorage } from '@/hooks/use-firebase-storage';
import { vendorFormSchema, type VendorFormData } from '../utils/form-schema';
import Image from 'next/image';

interface VendorFormProps {
  initialData?: VendorFormData;
  onSubmit: (data: VendorFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  isEditing?: boolean;
}

export function VendorForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isLoading = false, 
  isEditing = false 
}: VendorFormProps) {
  const [logoPreview, setLogoPreview] = useState<string | null>(initialData?.storeLogo || null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { upload } = useFirebaseStorage();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<VendorFormData>({
    resolver: zodResolver(vendorFormSchema),
    defaultValues: initialData || {
      storeLogo: '',
      storeName: '',
      storeDescription: '',
      country: '',
      state: '',
      city: '',
      address: '',
      pincode: '',
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      gstNumber: '',
      panNumber: '',
      bankAccountNumber: '',
      bankName: '',
      bankIfscCode: '',
      ownerName: '',
      whatsappNumber: '',
      facebook: '',
      pinterest: '',
      instagram: '',
      twitter: '',
      youtube: '',
      status: 'active'
    }
  });

  const handleStoreNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setValue('storeName', name);
  };

  const handleLogoUpload = async (file: File) => {
    if (!file) return;

    try {
      setUploadProgress(0);
      const logoUrl = await upload(
        `vendors/logos/${Date.now()}_${file.name}`,
        file
      );
      
      setValue('storeLogo', logoUrl);
      setLogoPreview(logoUrl);
      setUploadProgress(0);
    } catch (error) {
      // Log error for debugging but don't expose to client
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleLogoUpload(file);
    }
  };

  const handleSubmitForm = async (data: VendorFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      // Log error for debugging but don't expose to client
    }
  };

  return (
    <form onSubmit={handleSubmit(handleSubmitForm)} className="space-y-6">
      {/* Store Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Store Information
          </CardTitle>
          <CardDescription>
            Enter the basic store details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Store Logo */}
          <div className="space-y-2">
            <Label>Store Logo</Label>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Choose Logo
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
              <p className="text-xs text-muted-foreground">
                *Upload image size 500x500px recommended
              </p>
            </div>

            {logoPreview && (
              <div className="relative">
                <div className="relative w-32 h-32">
                  <Image
                    src={logoPreview}
                    alt="Logo preview"
                    fill
                    className="object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setLogoPreview(null);
                      setValue('storeLogo', '');
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="storeName">Store Name *</Label>
              <Input
                id="storeName"
                {...register('storeName')}
                onChange={handleStoreNameChange}
                placeholder="Enter Store Name"
              />
              {errors.storeName && (
                <p className="text-sm text-red-600">{errors.storeName.message}</p>
              )}
            </div>

            
          </div>

          <div className="space-y-2">
            <Label htmlFor="storeDescription">Store Description *</Label>
            <Textarea
              id="storeDescription"
              {...register('storeDescription')}
              placeholder="Enter Description"
              rows={3}
            />
            {errors.storeDescription && (
              <p className="text-sm text-red-600">{errors.storeDescription.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Location Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Location Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="country">Country *</Label>
              <Select
                value={watch('country')}
                onValueChange={(value) => setValue('country', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="India">India</SelectItem>
                  <SelectItem value="United States">United States</SelectItem>
                  <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                  <SelectItem value="Canada">Canada</SelectItem>
                  <SelectItem value="Australia">Australia</SelectItem>
                </SelectContent>
              </Select>
              {errors.country && (
                <p className="text-sm text-red-600">{errors.country.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State *</Label>
              <Select
                value={watch('state')}
                onValueChange={(value) => setValue('state', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select State" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Kerala">Kerala</SelectItem>
                  <SelectItem value="Maharashtra">Maharashtra</SelectItem>
                  <SelectItem value="Delhi">Delhi</SelectItem>
                  <SelectItem value="Karnataka">Karnataka</SelectItem>
                  <SelectItem value="Tamil Nadu">Tamil Nadu</SelectItem>
                  <SelectItem value="Telangana">Telangana</SelectItem>
                </SelectContent>
              </Select>
              {errors.state && (
                <p className="text-sm text-red-600">{errors.state.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                {...register('city')}
                placeholder="Enter City"
              />
              {errors.city && (
                <p className="text-sm text-red-600">{errors.city.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="pincode">Pincode *</Label>
              <Input
                id="pincode"
                {...register('pincode')}
                placeholder="Enter Pincode"
              />
              {errors.pincode && (
                <p className="text-sm text-red-600">{errors.pincode.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address *</Label>
            <Textarea
              id="address"
              {...register('address')}
              placeholder="Enter Address"
              rows={3}
            />
            {errors.address && (
              <p className="text-sm text-red-600">{errors.address.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Enter Name"
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="Enter email address"
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                  +91
                </span>
                <Input
                  id="phone"
                  type="tel"
                  {...register('phone')}
                  placeholder="Enter Phone"
                  className="pl-12"
                />
              </div>
              {errors.phone && (
                <p className="text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                  +91
                </span>
                <Input
                  id="whatsappNumber"
                  type="tel"
                  {...register('whatsappNumber')}
                  placeholder="Enter WhatsApp Number"
                  className="pl-12"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Business Information
          </CardTitle>
          <CardDescription>
            Additional business details (optional)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ownerName">Owner Name</Label>
              <Input
                id="ownerName"
                {...register('ownerName')}
                placeholder="Enter Owner Name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gstNumber">GST Number</Label>
              <Input
                id="gstNumber"
                {...register('gstNumber')}
                placeholder="Enter GST Number"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="panNumber">PAN Number</Label>
              <Input
                id="panNumber"
                {...register('panNumber')}
                placeholder="Enter PAN Number"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium">Bank Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bankName">Bank Name</Label>
                <Input
                  id="bankName"
                  {...register('bankName')}
                  placeholder="Enter Bank Name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankAccountNumber">Account Number</Label>
                <Input
                  id="bankAccountNumber"
                  {...register('bankAccountNumber')}
                  placeholder="Enter Account Number"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bankIfscCode">IFSC Code</Label>
              <Input
                id="bankIfscCode"
                {...register('bankIfscCode')}
                placeholder="Enter IFSC Code"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Account Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  {...register('password')}
                  placeholder="Enter password"
                />
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...register('confirmPassword')}
                  placeholder="Confirm password"
                />
              {errors.confirmPassword && (
                <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Social Media Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Social Media Links
          </CardTitle>
          <CardDescription>
            Add your social media profiles (optional)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="facebook">Facebook</Label>
              <div className="flex items-center gap-2">
                <Facebook className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="facebook"
                  {...register('facebook')}
                  placeholder="Enter FaceBook Url"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pinterest">Pinterest</Label>
              <div className="flex items-center gap-2">
                <Link className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="pinterest"
                  {...register('pinterest')}
                  placeholder="Enter Pinterest Url"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram</Label>
              <div className="flex items-center gap-2">
                <Instagram className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="instagram"
                  {...register('instagram')}
                  placeholder="Enter Instagram Url"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="twitter">Twitter</Label>
              <div className="flex items-center gap-2">
                <Twitter className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="twitter"
                  {...register('twitter')}
                  placeholder="Enter Twitter Url"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="youtube">Youtube</Label>
            <div className="flex items-center gap-2">
              <Youtube className="h-4 w-4 text-muted-foreground" />
              <Input
                id="youtube"
                {...register('youtube')}
                placeholder="Enter Youtube Url"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : isEditing ? 'Update Vendor' : 'Add Vendor'}
        </Button>
      </div>
    </form>
  );
} 