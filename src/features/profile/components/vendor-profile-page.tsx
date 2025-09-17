'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Store, 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Building, 
  CreditCard,
  Globe,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Edit,
  Shield
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Vendor } from '@/features/vendors/utils/form-schema';
import { getCurrentUser, User as UserType } from '@/lib/auth';
import { VendorForm } from '@/features/vendors/components/vendor-form';
import Image from 'next/image';

export default function VendorProfilePage() {
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserType | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Get user data from localStorage
    const currentUser = getCurrentUser();
    setUser(currentUser);
    
    if (currentUser) {
      // Convert User data to Vendor format using actual database fields
      const vendorData: Vendor = {
        id: currentUser.uniqueId || currentUser.id,
        storeName: currentUser.storeName || 'Not provided',
        storeDescription: currentUser.storeDescription || 'Not provided',
        country: currentUser.country || 'Not provided',
        state: currentUser.state || 'Not provided',
        city: currentUser.city || 'Not provided',
        address: currentUser.address || 'Not provided',
        pincode: currentUser.pincode || 'Not provided',
        name: currentUser.name || 'Not provided',
        email: currentUser.email || 'Not provided',
        phone: currentUser.phone || 'Not provided',
        password: currentUser.password || '',
        gstNumber: currentUser.gstNumber || 'Not provided',
        panNumber: currentUser.panNumber || 'Not provided',
        bankAccountNumber: currentUser.bankAccountNumber || 'Not provided',
        bankName: currentUser.bankName || 'Not provided',
        bankIfscCode: currentUser.bankIfscCode || 'Not provided',
        ownerName: currentUser.ownerName || 'Not provided',
        whatsappNumber: currentUser.whatsappNumber || 'Not provided',
        facebook: currentUser.facebook || 'Not provided',
        pinterest: currentUser.pinterest || 'Not provided',
        instagram: currentUser.instagram || 'Not provided',
        twitter: currentUser.twitter || 'Not provided',
        youtube: currentUser.youtube || 'Not provided',
        status: currentUser.status as 'active' | 'inactive' | 'suspended',
        createdAt: currentUser.createdAt || new Date().toISOString(),
        updatedAt: currentUser.updatedAt || new Date().toISOString()
      };
      setVendor(vendorData);
    }
    setLoading(false);
  }, []);

  // Handle edit form submission
  const handleEditSubmit = async (formData: any) => {
    setIsSaving(true);
    try {
      // Update the vendor data in localStorage
      const updatedUser: UserType = {
        ...user!,
        storeName: formData.storeName,
        storeDescription: formData.storeDescription,
        country: formData.country,
        state: formData.state,
        city: formData.city,
        address: formData.address,
        pincode: formData.pincode,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        gstNumber: formData.gstNumber,
        panNumber: formData.panNumber,
        bankAccountNumber: formData.bankAccountNumber,
        bankName: formData.bankName,
        bankIfscCode: formData.bankIfscCode,
        ownerName: formData.ownerName,
        whatsappNumber: formData.whatsappNumber,
        facebook: formData.facebook,
        pinterest: formData.pinterest,
        instagram: formData.instagram,
        twitter: formData.twitter,
        youtube: formData.youtube,
        updatedAt: new Date().toISOString()
      };

      // Update localStorage
      localStorage.setItem('user_data', JSON.stringify(updatedUser));
      
      // Update local state
      setUser(updatedUser);
      
      // Convert to vendor format for display
      const updatedVendor: Vendor = {
        id: updatedUser.uniqueId || updatedUser.id,
        storeName: updatedUser.storeName || 'Not provided',
        storeDescription: updatedUser.storeDescription || 'Not provided',
        country: updatedUser.country || 'Not provided',
        state: updatedUser.state || 'Not provided',
        city: updatedUser.city || 'Not provided',
        address: updatedUser.address || 'Not provided',
        pincode: updatedUser.pincode || 'Not provided',
        name: updatedUser.name || 'Not provided',
        email: updatedUser.email || 'Not provided',
        phone: updatedUser.phone || 'Not provided',
        password: updatedUser.password || '',
        gstNumber: updatedUser.gstNumber || 'Not provided',
        panNumber: updatedUser.panNumber || 'Not provided',
        bankAccountNumber: updatedUser.bankAccountNumber || 'Not provided',
        bankName: updatedUser.bankName || 'Not provided',
        bankIfscCode: updatedUser.bankIfscCode || 'Not provided',
        ownerName: updatedUser.ownerName || 'Not provided',
        whatsappNumber: updatedUser.whatsappNumber || 'Not provided',
        facebook: updatedUser.facebook || 'Not provided',
        pinterest: updatedUser.pinterest || 'Not provided',
        instagram: updatedUser.instagram || 'Not provided',
        twitter: updatedUser.twitter || 'Not provided',
        youtube: updatedUser.youtube || 'Not provided',
        status: updatedUser.status as 'active' | 'inactive' | 'suspended',
        createdAt: updatedUser.createdAt || new Date().toISOString(),
        updatedAt: updatedUser.updatedAt || new Date().toISOString()
      };
      
      setVendor(updatedVendor);
      setIsEditing(false);
      
      // Show success message
      alert('Profile updated successfully!');
    } catch (error) {
      alert('Error updating profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="flex w-full flex-col p-4">
        <div className="text-center">
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="flex w-full flex-col p-4">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Vendor not found</p>
          <div className="text-sm text-muted-foreground">
            <p>User data: {user ? 'Found' : 'Not found'}</p>
            <p>Please make sure you are logged in.</p>
          </div>
        </div>
      </div>
    );
  }

  // If in edit mode, show the edit form
  if (isEditing) {
    const formData = {
      storeLogo: vendor.storeLogo || '',
      storeName: vendor.storeName || '',
      storeDescription: vendor.storeDescription || '',
      country: vendor.country || '',
      state: vendor.state || '',
      city: vendor.city || '',
      address: vendor.address || '',
      pincode: vendor.pincode || '',
      name: vendor.name || '',
      email: vendor.email || '',
      phone: vendor.phone || '',
      password: vendor.password || '',
      confirmPassword: vendor.password || '',
      gstNumber: vendor.gstNumber || '',
      panNumber: vendor.panNumber || '',
      bankAccountNumber: vendor.bankAccountNumber || '',
      bankName: vendor.bankName || '',
      bankIfscCode: vendor.bankIfscCode || '',
      ownerName: vendor.ownerName || '',
      whatsappNumber: vendor.whatsappNumber || '',
      facebook: vendor.facebook || '',
      pinterest: vendor.pinterest || '',
      instagram: vendor.instagram || '',
      twitter: vendor.twitter || '',
      youtube: vendor.youtube || '',
      status: vendor.status || 'active'
    };

    return (
      <div className="flex w-full flex-col p-4">
        <div className="max-w-4xl mx-auto w-full space-y-6">
          {/* Header with Actions */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Edit Profile</h1>
              <p className="text-muted-foreground">
                Update your vendor information
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCancelEdit} variant="outline">
                Cancel
              </Button>
            </div>
          </div>

          {/* Edit Form */}
          <VendorForm
            initialData={formData}
            onSubmit={handleEditSubmit}
            onCancel={handleCancelEdit}
            isLoading={isSaving}
            isEditing={true}
          />
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
      case 'suspended':
        return <Badge className="bg-red-100 text-red-800">Suspended</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="flex w-full flex-col p-4">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        {/* Header with Actions */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {vendor.storeLogo && (
                  <div className="relative h-16 w-16 rounded-full overflow-hidden border-2 border-border shadow-md">
                    <Image
                      src={vendor.storeLogo}
                      alt={vendor.storeName}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">
                    {vendor.storeName}
                  </h1>
                  <p className="text-muted-foreground text-lg">
                    {vendor.storeDescription}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    {getStatusBadge(vendor.status)}
                    <span className="text-sm text-muted-foreground">
                      Vendor
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => setIsEditing(true)} 
                  className="shadow-sm"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Store Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Store Information
            </CardTitle>
            <CardDescription>
              Basic store details and branding
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-start gap-6">
              {vendor.storeLogo && (
                <div className="relative h-24 w-24 rounded-lg overflow-hidden border-2 border-border shadow-sm">
                  <Image
                    src={vendor.storeLogo}
                    alt={vendor.storeName}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="flex-1 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Store Name</label>
                  <p className="text-xl font-semibold">{vendor.storeName}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <p className="text-sm leading-relaxed">{vendor.storeDescription}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div>
                    {getStatusBadge(vendor.status)}
                  </div>
                </div>
              </div>
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
            <CardDescription>
              Primary contact details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                <p className="text-sm font-semibold">{vendor.name}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <p className="text-sm flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {vendor.email}
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Phone</label>
                <p className="text-sm flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {vendor.phone}
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">WhatsApp</label>
                <p className="text-sm">{vendor.whatsappNumber || 'Not provided'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Address Information
            </CardTitle>
            <CardDescription>
              Store location and address details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Address</label>
                <p className="text-sm">{vendor.address}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">City</label>
                <p className="text-sm">{vendor.city}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">State</label>
                <p className="text-sm">{vendor.state}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Country</label>
                <p className="text-sm">{vendor.country}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Pincode</label>
                <p className="text-sm">{vendor.pincode}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Business Information
            </CardTitle>
            <CardDescription>
              Legal and business registration details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Owner Name</label>
                <p className="text-sm">{vendor.ownerName || 'Not provided'}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">GST Number</label>
                <p className="text-sm">{vendor.gstNumber || 'Not provided'}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">PAN Number</label>
                <p className="text-sm">{vendor.panNumber || 'Not provided'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bank Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Bank Details
            </CardTitle>
            <CardDescription>
              Banking information for payments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Bank Name</label>
                <p className="text-sm">{vendor.bankName || 'Not provided'}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Account Number</label>
                <p className="text-sm">{vendor.bankAccountNumber || 'Not provided'}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">IFSC Code</label>
                <p className="text-sm">{vendor.bankIfscCode || 'Not provided'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Social Media Links */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Social Media Links
            </CardTitle>
            <CardDescription>
              Online presence and social media profiles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Facebook className="h-4 w-4" />
                  Facebook
                </label>
                <p className="text-sm">{vendor.facebook || 'Not provided'}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Instagram className="h-4 w-4" />
                  Instagram
                </label>
                <p className="text-sm">{vendor.instagram || 'Not provided'}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Twitter className="h-4 w-4" />
                  Twitter
                </label>
                <p className="text-sm">{vendor.twitter || 'Not provided'}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Youtube className="h-4 w-4" />
                  YouTube
                </label>
                <p className="text-sm">{vendor.youtube || 'Not provided'}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Pinterest
                </label>
                <p className="text-sm">{vendor.pinterest || 'Not provided'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Account Information
            </CardTitle>
            <CardDescription>
              Account role and security details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Role</label>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Vendor</Badge>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Account Status</label>
                {getStatusBadge(vendor.status)}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Created At</label>
                <p className="text-sm">{new Date(vendor.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                <p className="text-sm">{new Date(vendor.updatedAt).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
