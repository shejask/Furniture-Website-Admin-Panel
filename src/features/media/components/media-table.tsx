'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Calendar, 
  Image as ImageIcon, 
  Eye,
  Search,
  MoreHorizontal,
  Link,
  Tag
} from 'lucide-react';
import { useFirebaseData, useFirebaseOperations } from '@/hooks/use-firebase-database';
import { format } from 'date-fns';
import { MediaForm } from './media-form';
import { type MediaFormData, type MediaItem } from '../utils/form-schema';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function MediaTable() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMedia, setEditingMedia] = useState<MediaItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [formData, setFormData] = useState<MediaFormData>({
    title: '',
    description: '',
    type: 'image',
    imageUrl: '',
    altText: '',
    linkUrl: '',
    displayOrder: 0,
    metadata: {}
  });

  const { data: mediaItems, loading } = useFirebaseData('media');
  const { createWithKey, update, remove, loading: operationLoading } = useFirebaseOperations();

  // Filter media items based on search query
  const filteredMediaItems = useMemo(() => {
    if (!mediaItems) return [];
    
    return Object.entries(mediaItems).filter(([, media]: [string, any]) => {
      const query = searchQuery.toLowerCase();
      return (
        media.title?.toLowerCase().includes(query) ||
        media.description?.toLowerCase().includes(query) ||
        media.type?.toLowerCase().includes(query) ||
        media.altText?.toLowerCase().includes(query)
      );
    });
  }, [mediaItems, searchQuery]);

  const handleSubmit = async (data: MediaFormData) => {
    try {
      const mediaData = {
        ...data,
        createdAt: editingMedia ? editingMedia.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (editingMedia) {
        await update(`media/${editingMedia.id}`, mediaData);
      } else {
        await createWithKey('media', mediaData);
      }

      handleCloseDialog();
    } catch (error) {
      // Log error for debugging but don't expose to client
    }
  };

  const handleEdit = (media: MediaItem) => {
    setEditingMedia(media);
    setFormData({
      title: media.title,
      description: media.description || '',
      type: media.type,
      imageUrl: media.imageUrl,
      altText: media.altText,
      linkUrl: media.linkUrl || '',
      displayOrder: media.displayOrder,
      metadata: media.metadata || {}
    });
    setIsDialogOpen(true);
  };

  const handleViewDetails = (media: MediaItem) => {
    setSelectedMedia(media);
    setIsDetailDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this media item?')) {
      try {
        await remove(`media/${id}`);
      } catch (error) {
        // Log error for debugging but don't expose to client
      }
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingMedia(null);
    setFormData({
      title: '',
      description: '',
      type: 'image',
      imageUrl: '',
      altText: '',
      linkUrl: '',
      displayOrder: 0,
      metadata: {}
    });
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      'banner': 'bg-blue-100 text-blue-800',
      'ad': 'bg-green-100 text-green-800',
      'image': 'bg-gray-100 text-gray-800'
    };
    
    const colorClass = colors[type as keyof typeof colors] || colors.image;
    
    return (
      <Badge variant="outline" className={colorClass}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  

  return (
    <div className="space-y-6">
      {/* Search and Actions Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search media..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Media
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingMedia ? 'Edit Media' : 'Add Media'}
                </DialogTitle>
                <DialogDescription>
                  {editingMedia 
                    ? 'Update the media details below.'
                    : 'Create a new media item with image upload and settings.'
                  }
                </DialogDescription>
              </DialogHeader>
              <MediaForm
                initialData={editingMedia ? formData : undefined}
                onSubmit={handleSubmit}
                onCancel={handleCloseDialog}
                isLoading={operationLoading}
                isEditing={!!editingMedia}
                disabledTypes={Object.values(mediaItems || {}).reduce((acc: string[], item: any) => {
                  if (['banner-category-1','banner-category-2','banner-category-3'].includes(item.type)) {
                    acc.push(item.type);
                  }
                  return acc;
                }, [])}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Media</CardTitle>
          <CardDescription>
            Manage banners, ads, and other media assets
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredMediaItems.length > 0 ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredMediaItems.length} of {Object.keys(mediaItems || {}).length} media items
                </p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Preview</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
            
                    
                    <TableHead>Order</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMediaItems.map(([id, media]: [string, any]) => (
                    <TableRow key={id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="relative w-16 h-12">
                          <Image
                            src={media.imageUrl}
                            alt={media.altText}
                            width={64}
                            height={48}
                            className="w-full h-full object-cover rounded border"
                          />
                          {media.linkUrl && (
                            <Link className="absolute -top-1 -right-1 h-3 w-3 text-blue-600 bg-white rounded-full" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{media.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {media.description ? `${media.description.slice(0, 50)}...` : 'No description'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getTypeBadge(media.type)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Tag className="h-3 w-3 text-muted-foreground" />
      
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm font-mono">{media.displayOrder}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(media.createdAt), 'MMM dd, yyyy')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails({ ...media, id })}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit({ ...media, id })}
                            title="Edit Media"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleViewDetails({ ...media, id })}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit({ ...media, id })}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Media
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDelete(id)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Media
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>
                {searchQuery 
                  ? `No media found matching "${searchQuery}"` 
                  : 'No media items found. Add your first media item to get started.'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Media Details Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Media Details</DialogTitle>
            <DialogDescription>
              Complete information about the media item
            </DialogDescription>
          </DialogHeader>
          {selectedMedia && (
            <div className="space-y-6 mt-6">
              {/* Image Preview */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Image Preview
                </h3>
                <div className="relative">
                  <Image
                    src={selectedMedia.imageUrl}
                    alt={selectedMedia.altText}
                    width={500}
                    height={300}
                    className="w-full h-auto rounded-lg border"
                  />
                </div>
              </div>

              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Title</Label>
                    <p className="font-medium">{selectedMedia.title}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Type</Label>
                    <div className="mt-1">{getTypeBadge(selectedMedia.type)}</div>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs text-muted-foreground">Description</Label>
                    <p className="text-sm">{selectedMedia.description || 'No description'}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs text-muted-foreground">Alt Text</Label>
                    <p className="text-sm">{selectedMedia.altText}</p>
                  </div>
                  {selectedMedia.linkUrl && (
                    <div className="col-span-2">
                      <Label className="text-xs text-muted-foreground">Link URL</Label>
                      <p className="text-sm text-blue-600">{selectedMedia.linkUrl}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Timestamps */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Timestamps
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Created At</Label>
                    <p className="text-sm">{format(new Date(selectedMedia.createdAt), 'MMM dd, yyyy HH:mm')}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Last Updated</Label>
                    <p className="text-sm">{format(new Date(selectedMedia.updatedAt), 'MMM dd, yyyy HH:mm')}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button 
                  onClick={() => {
                    handleEdit(selectedMedia);
                    setIsDetailDialogOpen(false);
                  }}
                  className="flex-1"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Media
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(selectedMedia.imageUrl);
                  }}
                >
                  <Link className="mr-2 h-4 w-4" />
                  Copy URL
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 