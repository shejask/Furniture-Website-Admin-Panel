'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useFirebaseOperations } from '@/hooks/use-firebase-database';
import { 
  Edit, 
  MoreHorizontal, 
  Trash2, 
  Search,
  FileText,
  Eye,
  EyeOff
} from 'lucide-react';
import { Blog } from '../utils/form-schema';

interface BlogsTableProps {
  blogs: any;
  loading: boolean;
  onEdit: (blog: Blog) => void;
}

export function BlogsTable({ blogs, loading, onEdit }: BlogsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [blogToDelete, setBlogToDelete] = useState<Blog | null>(null);
  const { remove } = useFirebaseOperations();

  // Convert Firebase data to array format
  const blogsList = useMemo(() => {
    if (!blogs) return [];
    if (Array.isArray(blogs)) {
      return blogs;
    } else if (typeof blogs === 'object' && blogs !== null) {
      return Object.entries(blogs).map(([key, value]) => ({
        ...(value as any),
        id: key,
        key: key
      }));
    }
    return [];
  }, [blogs]);

  // Filter blogs based on search term
  const filteredBlogs = useMemo(() => {
    if (!searchTerm) return blogsList;
    return blogsList.filter(blog =>
      blog.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      blog.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      blog.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [blogsList, searchTerm]);

  const handleDelete = (blog: Blog) => {
    setBlogToDelete(blog);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!blogToDelete) return;
    
    try {
      await remove(`blogs/${blogToDelete.id}`);
      setDeleteDialogOpen(false);
      setBlogToDelete(null);
    } catch (error) {
      // console.error('Error deleting blog:', error);
      alert('Failed to delete blog');
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      technology: 'bg-blue-100 text-blue-800',
      business: 'bg-green-100 text-green-800',
      lifestyle: 'bg-purple-100 text-purple-800',
      health: 'bg-red-100 text-red-800',
      travel: 'bg-yellow-100 text-yellow-800',
      food: 'bg-orange-100 text-orange-800',
      education: 'bg-indigo-100 text-indigo-800',
      entertainment: 'bg-pink-100 text-pink-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search blogs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBlogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                    <p className="text-muted-foreground">No blogs found</p>
                    {searchTerm && (
                      <p className="text-sm text-muted-foreground">
                        Try adjusting your search terms
                      </p>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredBlogs.map((blog) => (
                <TableRow key={blog.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden">
                        <Image
                          src={blog.imageUrl || '/placeholder-avatar.svg'}
                          alt={blog.altText || blog.title}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium max-w-xs">
                    <div className="truncate" title={blog.title}>
                      {blog.title}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getCategoryColor(blog.category)}>
                      {blog.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-md">
                    <div className="truncate" title={blog.description}>
                      {blog.description}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {blog.isPublished ? (
                        <>
                          <Eye className="h-4 w-4 text-green-600" />
                          <Badge variant="default">Published</Badge>
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-4 w-4 text-gray-600" />
                          <Badge variant="secondary">Draft</Badge>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => onEdit(blog)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDelete(blog)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the blog post
              &quot;{blogToDelete?.title}&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 