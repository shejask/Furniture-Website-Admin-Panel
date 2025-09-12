'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { BlogsTable } from './blogs-table';
import { BlogForm } from './blog-form';
import { useFirebaseData, useFirebaseOperations } from '@/hooks/use-firebase-database';
import { Blog } from '../utils/form-schema';

export default function BlogsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { data: blogs, loading, error } = useFirebaseData('blogs');
  const { createWithKey, update } = useFirebaseOperations();

  const handleAddBlog = async (data: Blog) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await createWithKey('blogs', {
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      setIsFormOpen(false);
    } catch (error) {
      alert(`Failed to add blog: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditBlog = async (data: Blog) => {
    if (!editingBlog?.id || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await update(`blogs/${editingBlog.id}`, {
        ...data,
        updatedAt: new Date().toISOString()
      });
      setEditingBlog(null);
    } catch (error) {
      alert(`Failed to update blog: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };



  const openEditForm = (blog: Blog) => {
    setEditingBlog(blog);
  };

  const closeForm = () => {
    if (isSubmitting) return; // Prevent closing while submitting
    setIsFormOpen(false);
    setEditingBlog(null);
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold text-red-600">Error loading blogs</h3>
          <p className="text-muted-foreground">There was an error loading the blogs.</p>
          <p className="text-sm text-red-500 mt-2">{error.message}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4"
            variant="outline"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Blogs</h1>
          <p className="text-muted-foreground">Manage blog posts and articles</p>
        </div>
        <Button 
          onClick={() => setIsFormOpen(true)}
          disabled={isSubmitting || loading}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Blog Post
        </Button>
      </div>

      {/* Blogs Table */}
      <BlogsTable
        blogs={blogs || []}
        loading={loading}
        onEdit={openEditForm}
      />

      {/* Add/Edit Form Modal */}
      {(isFormOpen || editingBlog) && (
        <BlogForm
          initialData={editingBlog || undefined}
          onSubmit={editingBlog ? handleEditBlog : handleAddBlog}
          onCancel={closeForm}
          isLoading={isSubmitting}
          isEditing={!!editingBlog}
        />
      )}
    </div>
  );
}
