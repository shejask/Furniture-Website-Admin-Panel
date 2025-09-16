'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2, 
  Copy, 
  Download, 
  Share2,
  Store,
  User,
  Mail,
  Phone,
  Globe,
  MapPin,
  Calendar,
  ExternalLink,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Package
} from 'lucide-react';
import Image from 'next/image';
import { useFirebaseData, useFirebaseOperations } from '@/hooks/use-firebase-database';
import { VendorForm } from './vendor-form';
import { type Vendor } from '../utils/form-schema';

export function VendorsTable() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: vendors, loading } = useFirebaseData('vendors');
  const { data: products, loading: productsLoading } = useFirebaseData('products');
  const { createWithKey, update, remove } = useFirebaseOperations();

  const filteredVendors = useMemo(() => {
    if (!vendors) return [];
    
    return Object.entries(vendors).filter(([, vendor]) => {
      const searchLower = searchQuery.toLowerCase();
      const vendorData = vendor as Vendor;
      return (
        vendorData.storeName?.toLowerCase().includes(searchLower) ||
        vendorData.name?.toLowerCase().includes(searchLower) ||
        vendorData.email?.toLowerCase().includes(searchLower) ||
        vendorData.phone?.toLowerCase().includes(searchLower) ||
        vendorData.city?.toLowerCase().includes(searchLower) ||
        vendorData.status?.toLowerCase().includes(searchLower)
      );
    }).map(([vendorId, vendor]) => ({ ...(vendor as Vendor), id: vendorId }));
  }, [vendors, searchQuery]);

  const handleSubmit = async (data: any) => {
    try {
      // Remove confirmPassword from data before saving
      const { confirmPassword, ...vendorData } = data;
      
      if (editingVendor) {
        await update(`vendors/${editingVendor.id}`, {
          ...vendorData,
          updatedAt: new Date().toISOString()
        });
      } else {
        await createWithKey('vendors', {
          ...vendorData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      setIsDialogOpen(false);
      setEditingVendor(null);
    } catch (error) {
      // Log error for debugging but don't expose to client
    }
  };

  const handleEdit = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setIsDialogOpen(true);
  };

  const handleDelete = async (vendorId: string) => {
    if (confirm('Are you sure you want to delete this vendor?')) {
      try {
        await remove(`vendors/${vendorId}`);
      } catch (error) {
        // Log error for debugging but don't expose to client
      }
    }
  };

  const handleViewDetails = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setIsDetailSheetOpen(true);
  };


  const handleCancel = () => {
    setIsDialogOpen(false);
    setEditingVendor(null);
  };

  const formatDateSafe = (value?: string, withTime?: boolean) => {
    if (!value) return 'N/A';
    const d = new Date(value);
    if (isNaN(d.getTime())) return 'N/A';
    // Stable ISO-based formatting to avoid SSR/client locale mismatches
    return withTime
      ? d.toISOString().replace('T', ' ').slice(0, 16)
      : d.toISOString().slice(0, 10);
  };

  return (
    <div className="space-y-6">
      {/* Search and Actions Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search vendors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Vendor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
                </DialogTitle>
                <DialogDescription>
                  {editingVendor ? 'Update vendor information' : 'Create a new vendor account'}
                </DialogDescription>
              </DialogHeader>
                             <VendorForm
                 initialData={editingVendor ? {
                   ...editingVendor,
                   confirmPassword: editingVendor.password // Use password as confirmPassword for editing
                 } : undefined}
                 onSubmit={handleSubmit}
                 onCancel={handleCancel}
                 isLoading={loading}
                 isEditing={!!editingVendor}
               />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Vendors Table */}
      <Card>
        <CardHeader>
          <CardTitle>Vendors</CardTitle>
          <CardDescription>
            Manage your vendor accounts and store information
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading vendors...</div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Store</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVendors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        {searchQuery ? 'No vendors found matching your search.' : 'No vendors found.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredVendors.map((vendor) => (
                      <TableRow key={vendor.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {vendor.storeLogo ? (
                              <Image
                                src={vendor.storeLogo}
                                alt={vendor.storeName}
                                width={40}
                                height={40}
                                className="rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                                <Store className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium">{vendor.storeName}</div>
                              
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <User className="h-3 w-3 text-muted-foreground" />
                              {vendor.name}
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {vendor.email}
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              +91 {vendor.phone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              {vendor.city}, {vendor.state}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {vendor.country}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={vendor.status === 'active' ? 'default' : 'secondary'}>
                            {vendor.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {formatDateSafe(vendor.createdAt)}
                          </div>
                        </TableCell>
                                                 <TableCell className="text-right">
                           <div className="flex items-center justify-end gap-2">
                             <Button
                               variant="ghost"
                               size="sm"
                               onClick={() => handleViewDetails(vendor)}
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
                                <DropdownMenuItem onClick={() => handleEdit(vendor)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Vendor
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleViewDetails(vendor)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
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
                                  onClick={() => handleDelete(vendor.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Vendor
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

      {/* Vendor Details Dialog */}
      <Dialog open={isDetailSheetOpen} onOpenChange={setIsDetailSheetOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vendor Details</DialogTitle>
            <DialogDescription>
              Complete information about the selected vendor
            </DialogDescription>
          </DialogHeader>
          {selectedVendor && (
            <div className="space-y-6 mt-4">
              {/* Store Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Store className="h-5 w-5" />
                    Store Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    {selectedVendor.storeLogo ? (
                      <Image
                        src={selectedVendor.storeLogo}
                        alt={selectedVendor.storeName}
                        width={80}
                        height={80}
                        className="rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center">
                        <Store className="h-10 w-10 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-semibold">{selectedVendor.storeName}</h3>
                      <Badge variant={selectedVendor.status === 'active' ? 'default' : 'secondary'}>
                        {selectedVendor.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Description</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedVendor.storeDescription}
                    </p>
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
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Name</Label>
                      <p className="text-sm text-muted-foreground">{selectedVendor.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Email</Label>
                      <p className="text-sm text-muted-foreground">{selectedVendor.email}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Phone</Label>
                      <p className="text-sm text-muted-foreground">+91 {selectedVendor.phone}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">WhatsApp</Label>
                      <p className="text-sm text-muted-foreground">
                        {selectedVendor.whatsappNumber ? `+91 ${selectedVendor.whatsappNumber}` : 'Not provided'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Business Information */}
              {(selectedVendor.ownerName || selectedVendor.gstNumber || selectedVendor.panNumber || selectedVendor.bankName) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Store className="h-5 w-5" />
                      Business Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {selectedVendor.ownerName && (
                        <div>
                          <Label className="text-sm font-medium">Owner Name</Label>
                          <p className="text-sm text-muted-foreground">{selectedVendor.ownerName}</p>
                        </div>
                      )}
                      {selectedVendor.gstNumber && (
                        <div>
                          <Label className="text-sm font-medium">GST Number</Label>
                          <p className="text-sm text-muted-foreground">{selectedVendor.gstNumber}</p>
                        </div>
                      )}
                      {selectedVendor.panNumber && (
                        <div>
                          <Label className="text-sm font-medium">PAN Number</Label>
                          <p className="text-sm text-muted-foreground">{selectedVendor.panNumber}</p>
                        </div>
                      )}
                    </div>
                    
                    {(selectedVendor.bankName || selectedVendor.bankAccountNumber || selectedVendor.bankIfscCode) && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Bank Details</h4>
                        <div className="grid grid-cols-2 gap-4">
                          {selectedVendor.bankName && (
                            <div>
                              <Label className="text-sm font-medium">Bank Name</Label>
                              <p className="text-sm text-muted-foreground">{selectedVendor.bankName}</p>
                            </div>
                          )}
                          {selectedVendor.bankAccountNumber && (
                            <div>
                              <Label className="text-sm font-medium">Account Number</Label>
                              <p className="text-sm text-muted-foreground">{selectedVendor.bankAccountNumber}</p>
                            </div>
                          )}
                          {selectedVendor.bankIfscCode && (
                            <div>
                              <Label className="text-sm font-medium">IFSC Code</Label>
                              <p className="text-sm text-muted-foreground">{selectedVendor.bankIfscCode}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Location Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Location Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Country</Label>
                      <p className="text-sm text-muted-foreground">{selectedVendor.country}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">State</Label>
                      <p className="text-sm text-muted-foreground">{selectedVendor.state}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">City</Label>
                      <p className="text-sm text-muted-foreground">{selectedVendor.city}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Pincode</Label>
                      <p className="text-sm text-muted-foreground">{selectedVendor.pincode}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Address</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedVendor.address}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Social Media Links */}
              {(selectedVendor.facebook || selectedVendor.instagram || selectedVendor.twitter || selectedVendor.youtube || selectedVendor.pinterest) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ExternalLink className="h-5 w-5" />
                      Social Media Links
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedVendor.facebook && (
                        <div className="flex items-center gap-2">
                          <Facebook className="h-4 w-4" />
                          <a href={selectedVendor.facebook} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                            Facebook
                          </a>
                        </div>
                      )}
                      {selectedVendor.instagram && (
                        <div className="flex items-center gap-2">
                          <Instagram className="h-4 w-4" />
                          <a href={selectedVendor.instagram} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                            Instagram
                          </a>
                        </div>
                      )}
                      {selectedVendor.twitter && (
                        <div className="flex items-center gap-2">
                          <Twitter className="h-4 w-4" />
                          <a href={selectedVendor.twitter} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                            Twitter
                          </a>
                        </div>
                      )}
                      {selectedVendor.youtube && (
                        <div className="flex items-center gap-2">
                          <Youtube className="h-4 w-4" />
                          <a href={selectedVendor.youtube} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                            Youtube
                          </a>
                        </div>
                      )}
                      {selectedVendor.pinterest && (
                        <div className="flex items-center gap-2">
                          <ExternalLink className="h-4 w-4" />
                          <a href={selectedVendor.pinterest} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                            Pinterest
                          </a>
                        </div>
                      )}
                    </div>
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
                        {formatDateSafe(selectedVendor.createdAt, true)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Updated</Label>
                      <p className="text-sm text-muted-foreground">
                        {formatDateSafe(selectedVendor.updatedAt, true)}
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