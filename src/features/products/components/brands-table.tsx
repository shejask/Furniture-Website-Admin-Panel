'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Calendar, Image as ImageIcon } from 'lucide-react';
import { useFirebaseData, useFirebaseOperations } from '@/hooks/use-firebase-database';
import { SimpleFileUploader } from '@/components/simple-file-uploader';
import { format } from 'date-fns';
import Image from 'next/image';

interface Brand {
  id: string;
  name: string;
  image: string;
  createdAt: string;
  updatedAt: string;
}

export function BrandsTable() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    image: '',
    
  });

  const [tempImages, setTempImages] = useState({
    image: '',
    
  });

  const [isUploading, setIsUploading] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const uploadInProgressRef = useRef(false);

  // Debug upload state changes
  useEffect(() => {
    uploadInProgressRef.current = isUploading || !!uploadingField;
  }, [isUploading, uploadingField]);

  const { data: brands, loading } = useFirebaseData('brands');
  const { createWithKey, update, remove, loading: operationLoading } = useFirebaseOperations();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Use tempImages if they exist, otherwise use formData values
      const brandData = {
        name: formData.name,
        image: tempImages.image || formData.image,
        createdAt: editingBrand ? editingBrand.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (editingBrand) {
        await update(`brands/${editingBrand.id}`, brandData);
      } else {
        await createWithKey('brands', brandData);
      }

      handleCloseDialog();
    } catch (error) {
      // Log error for debugging but don't expose to client
    }
  };

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setFormData({
      name: brand.name,
      image: brand.image
    });
    // Reset temp images when editing
    setTempImages({
      image: ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this brand?')) {
      try {
        await remove(`brands/${id}`);
      } catch (error) {
        // Log error for debugging but don't expose to client
      }
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingBrand(null);
    setFormData({
      name: '',
      image: '',
      
    });
    setTempImages({
      image: '',
      
    });
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name
    }));
  };

     return (
     <div className="space-y-6">
       <div className="flex justify-end">
                 <Dialog open={isDialogOpen} onOpenChange={(open) => {
           if (!open && uploadInProgressRef.current) {
             return;
           }
           setIsDialogOpen(open);
         }}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Brand
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingBrand ? 'Edit Brand' : 'Create Brand'}
              </DialogTitle>
              <DialogDescription>
                {editingBrand 
                  ? 'Update the brand details below.'
                  : 'Create a new product brand with all necessary information.'
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Enter brand name"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Brand Image</Label>
                                     <SimpleFileUploader
                     onUploadStart={() => {
                       setIsUploading(true);
                       setUploadingField('image');
                     }}
                     onUploadComplete={(urls: string[]) => {
                       setTempImages(prev => ({ ...prev, image: urls[0] }));
                       setFormData(prev => ({ ...prev, image: urls[0] }));
                       setIsUploading(false);
                       setUploadingField(null);
                     }}
                     onUploadError={() => {
                       setIsUploading(false);
                       setUploadingField(null);
                       alert('Failed to upload brand image. Please try again.');
                     }}
                     onUploadEnd={() => {
                       setIsUploading(false);
                       setUploadingField(null);
                     }}
                     folder="brands/images"
                     accept="image/*"
                     maxFiles={1}
                     showPreview={true}
                   />
                  {(tempImages.image || formData.image) && (
                    <div className="flex items-center space-x-2">
                      <Image 
                        src={tempImages.image || formData.image} 
                        alt="Brand" 
                        width={32}
                        height={32}
                        className="rounded-full" 
                      />
                      <span className="text-xs text-muted-foreground">
                        {tempImages.image ? 'New image uploaded' : 'Current image'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              

                             <div className="flex justify-end space-x-2">
                 <Button type="button" variant="outline" onClick={handleCloseDialog} disabled={isUploading || !!uploadingField}>
                   Cancel
                 </Button>
                 <Button type="submit" disabled={operationLoading || isUploading || !!uploadingField}>
                   {operationLoading ? 'Saving...' : isUploading ? `Uploading ${uploadingField}...` : (editingBrand ? 'Update' : 'Create')}
                 </Button>
               </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Brands</CardTitle>
          <CardDescription>
            A list of all product brands and their configurations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : brands ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(brands).map(([id, brand]: [string, any]) => (
                  <TableRow key={id}>
                    <TableCell>
                      {brand.image ? (
                        <Image
                          src={brand.image}
                          alt={brand.name}
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{brand.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(brand.createdAt), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit({ ...brand, id })}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No brands found. Create your first brand to get started.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 