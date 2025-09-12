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
  User
} from 'lucide-react';
import { Testimonial } from '../utils/form-schema';

interface TestimonialsTableProps {
  testimonials: any;
  loading: boolean;
  onEdit: (testimonial: Testimonial) => void;
}

export function TestimonialsTable({ testimonials, loading, onEdit }: TestimonialsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [testimonialToDelete, setTestimonialToDelete] = useState<Testimonial | null>(null);
  const { remove } = useFirebaseOperations();

  // Convert Firebase data to array format
  const testimonialsList = useMemo(() => {
    if (!testimonials) return [];
    if (Array.isArray(testimonials)) {
      return testimonials;
    } else if (typeof testimonials === 'object' && testimonials !== null) {
      return Object.entries(testimonials).map(([key, value]) => ({
        ...(value as any),
        id: key,
        key: key
      }));
    }
    return [];
  }, [testimonials]);

  // Filter testimonials based on search term
  const filteredTestimonials = useMemo(() => {
    if (!searchTerm) return testimonialsList;
    return testimonialsList.filter(testimonial =>
      testimonial.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      testimonial.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [testimonialsList, searchTerm]);

  const handleDelete = (testimonial: Testimonial) => {
    setTestimonialToDelete(testimonial);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!testimonialToDelete) return;
    
    try {
      await remove(`testimonials/${testimonialToDelete.id}`);
      setDeleteDialogOpen(false);
      setTestimonialToDelete(null);
    } catch (error) {
      // Handle error silently or log to a proper logging service in production
      alert('Failed to delete testimonial');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
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
            placeholder="Search testimonials..."
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
              <TableHead>Photo</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTestimonials.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <User className="h-8 w-8 text-muted-foreground" />
                    <p className="text-muted-foreground">No testimonials found</p>
                    {searchTerm && (
                      <p className="text-sm text-muted-foreground">
                        Try adjusting your search terms
                      </p>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredTestimonials.map((testimonial) => (
                <TableRow key={testimonial.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div className="relative w-10 h-10 rounded-full overflow-hidden">
                        <Image
                          src={testimonial.imageUrl || '/placeholder-avatar.svg'}
                          alt={testimonial.altText || testimonial.name}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder-avatar.svg';
                          }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {testimonial.name}
                  </TableCell>
                  <TableCell className="max-w-md">
                    <div className="truncate" title={testimonial.description}>
                      {testimonial.description}
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
                        <DropdownMenuItem onClick={() => onEdit(testimonial)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDelete(testimonial)}
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
              This action cannot be undone. This will permanently delete the testimonial
              &quot;{testimonialToDelete?.name}&quot;.
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