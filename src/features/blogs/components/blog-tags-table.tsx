'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Calendar, 
  Tag, 
  Search,
  Filter,
  MoreHorizontal,
  Copy,
  Download,
  Share2
} from 'lucide-react';
import { useFirebaseData, useFirebaseOperations } from '@/hooks/use-firebase-database';
import { format } from 'date-fns';
import { blogTagFormSchema, type BlogTagFormData } from '../utils/form-schema';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface BlogTag {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export function BlogTagsTable() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<BlogTag | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: tags, loading } = useFirebaseData('blog-tags');
  const { createWithKey, update, remove, loading: operationLoading } = useFirebaseOperations();

  // Filter tags based on search query
  const filteredTags = useMemo(() => {
    if (!tags) return [];
    
    return Object.entries(tags).filter(([, tag]: [string, any]) => {
      const query = searchQuery.toLowerCase();
      return (
        tag.name?.toLowerCase().includes(query) ||
        tag.slug?.toLowerCase().includes(query) ||
        tag.description?.toLowerCase().includes(query) ||
        tag.status?.toLowerCase().includes(query)
      );
    });
  }, [tags, searchQuery]);

  const form = useForm<BlogTagFormData>({
    resolver: zodResolver(blogTagFormSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      status: 'active'
    }
  });

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    form.setValue('name', name);
    if (!form.getValues('slug')) {
      form.setValue('slug', generateSlug(name));
    }
  };

  const handleSubmit = async (data: BlogTagFormData) => {
    try {
      const tagData = {
        name: data.name,
        slug: data.slug,
        description: data.description,
        status: data.status,
        createdAt: editingTag ? editingTag.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (editingTag) {
        await update(`blog-tags/${editingTag.id}`, tagData);
      } else {
        await createWithKey('blog-tags', tagData);
      }

      handleCloseDialog();
    } catch (error) {
      // Log error for debugging but don't expose to client
    }
  };

  const handleEdit = (tag: BlogTag) => {
    setEditingTag(tag);
    form.reset({
      name: tag.name,
      slug: tag.slug,
      description: tag.description,
      status: tag.status
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this tag?')) {
      try {
        await remove(`blog-tags/${id}`);
      } catch (error) {
        // Log error for debugging but don't expose to client
      }
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTag(null);
    form.reset({
      name: '',
      slug: '',
      description: '',
      status: 'active'
    });
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      'active': 'bg-green-100 text-green-800',
      'inactive': 'bg-red-100 text-red-800'
    };
    
    const colorClass = colors[status as keyof typeof colors] || colors.active;
    
    return (
      <Badge variant="outline" className={colorClass}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
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
              placeholder="Search tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Tag
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {editingTag ? 'Edit Tag' : 'Add Tag'}
                </DialogTitle>
                <DialogDescription>
                  {editingTag 
                    ? 'Update the tag details below.'
                    : 'Create a new blog tag.'
                  }
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      {...form.register('name')}
                      onChange={handleNameChange}
                      placeholder="Enter tag name"
                    />
                    {form.formState.errors.name && (
                      <p className="text-xs text-red-600">{form.formState.errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug *</Label>
                    <Input
                      id="slug"
                      {...form.register('slug')}
                      placeholder="Enter slug"
                    />
                    {form.formState.errors.slug && (
                      <p className="text-xs text-red-600">{form.formState.errors.slug.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    {...form.register('description')}
                    placeholder="Enter tag description"
                    rows={3}
                  />
                  {form.formState.errors.description && (
                    <p className="text-xs text-red-600">{form.formState.errors.description.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select
                    value={form.watch('status')}
                    onValueChange={(value) => form.setValue('status', value as 'active' | 'inactive')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.status && (
                    <p className="text-xs text-red-600">{form.formState.errors.status.message}</p>
                  )}
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={handleCloseDialog}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={operationLoading}>
                    {operationLoading ? 'Saving...' : (editingTag ? 'Update' : 'Create')}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Tags</CardTitle>
          <CardDescription>
            A list of all blog tags
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredTags.length > 0 ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredTags.length} of {Object.keys(tags || {}).length} tags
                </p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTags.map(([id, tag]: [string, any]) => (
                    <TableRow key={id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <Tag className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{tag.name}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-sm text-muted-foreground">
                          {tag.slug}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground max-w-xs truncate">
                          {tag.description || 'No description'}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(tag.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(tag.createdAt), 'MMM dd, yyyy')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit({ ...tag, id })}
                            title="Edit Tag"
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
                              <DropdownMenuItem onClick={() => handleEdit({ ...tag, id })}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Tag
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <Copy className="mr-2 h-4 w-4" />
                                Copy Slug
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
                                onClick={() => handleDelete(id)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Tag
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
              <Tag className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>
                {searchQuery 
                  ? `No tags found matching "${searchQuery}"` 
                  : 'No tags found. Create your first tag to get started.'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 