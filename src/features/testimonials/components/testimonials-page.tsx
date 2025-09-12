'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { TestimonialsTable } from './testimonials-table';
import { TestimonialForm } from './testimonial-form';
import { useFirebaseData, useFirebaseOperations } from '@/hooks/use-firebase-database';
import { Testimonial } from '../utils/form-schema';

export default function TestimonialsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { data: testimonials, loading, error } = useFirebaseData('testimonials');
  const { createWithKey, update, remove } = useFirebaseOperations();

  const handleAddTestimonial = async (data: Testimonial) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await createWithKey('testimonials', {
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      setIsFormOpen(false);
    } catch (error) {
      alert(`Failed to add testimonial: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTestimonial = async (data: Testimonial) => {
    if (!editingTestimonial?.id || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await update(`testimonials/${editingTestimonial.id}`, {
        ...data,
        updatedAt: new Date().toISOString()
      });
      setEditingTestimonial(null);
    } catch (error) {
      alert(`Failed to update testimonial: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };



  const openEditForm = (testimonial: Testimonial) => {
    setEditingTestimonial(testimonial);
  };

  const closeForm = () => {
    if (isSubmitting) return; // Prevent closing while submitting
    setIsFormOpen(false);
    setEditingTestimonial(null);
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold text-red-600">Error loading testimonials</h3>
          <p className="text-muted-foreground">There was an error loading the testimonials.</p>
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
          <h1 className="text-3xl font-bold">Testimonials</h1>
          <p className="text-muted-foreground">Manage customer testimonials and reviews</p>
        </div>
        <Button 
          onClick={() => setIsFormOpen(true)}
          disabled={isSubmitting || loading}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Testimonial
        </Button>
      </div>

      {/* Testimonials Table */}
      <TestimonialsTable
        testimonials={testimonials || []}
        loading={loading}
        onEdit={openEditForm}
      />

      {/* Add/Edit Form Modal */}
      {(isFormOpen || editingTestimonial) && (
        <TestimonialForm
          initialData={editingTestimonial || undefined}
          onSubmit={editingTestimonial ? handleEditTestimonial : handleAddTestimonial}
          onCancel={closeForm}
          isLoading={isSubmitting}
          isEditing={!!editingTestimonial}
        />
      )}
    </div>
  );
}