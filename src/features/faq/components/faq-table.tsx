'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Calendar, HelpCircle } from 'lucide-react';
import { useFirebaseData, useFirebaseOperations } from '@/hooks/use-firebase-database';
import { format } from 'date-fns';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  createdAt: string;
  updatedAt: string;
}

export function FAQTable() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
  });

  const { data: faqs, loading } = useFirebaseData('faqs');
  const { createWithKey, update, remove, loading: operationLoading } = useFirebaseOperations();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
     try {
             const faqData = {
         question: formData.question,
         answer: formData.answer,
         createdAt: editingFAQ ? editingFAQ.createdAt : new Date().toISOString(),
         updatedAt: new Date().toISOString()
       };

      if (editingFAQ) {
        await update(`faqs/${editingFAQ.id}`, faqData);
      } else {
        await createWithKey('faqs', faqData);
      }

      handleCloseDialog();
    } catch (error) {
      // console.error('Error saving FAQ:', error);
    }
  };

     const handleEdit = (faq: FAQ) => {
     setEditingFAQ(faq);
     setFormData({
       question: faq.question,
       answer: faq.answer
     });
     setIsDialogOpen(true);
   };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this FAQ?')) {
      try {
        await remove(`faqs/${id}`);
      } catch (error) {
        // console.error('Error deleting FAQ:', error);
      }
    }
  };

     const handleCloseDialog = () => {
     setIsDialogOpen(false);
     setEditingFAQ(null);
     setFormData({
       question: '',
       answer: ''
     });
   };

  

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add FAQ
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingFAQ ? 'Edit FAQ' : 'Create FAQ'}
              </DialogTitle>
              <DialogDescription>
                {editingFAQ 
                  ? 'Update the FAQ details below.'
                  : 'Create a new FAQ with question and answer.'
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="question">Question *</Label>
                <Input
                  id="question"
                  value={formData.question}
                  onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
                  placeholder="Enter the question"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="answer">Answer *</Label>
                <textarea
                  id="answer"
                  value={formData.answer}
                  onChange={(e) => setFormData(prev => ({ ...prev, answer: e.target.value }))}
                  placeholder="Enter the answer"
                  className="w-full min-h-[120px] px-3 py-2 border border-input rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  required
                />
              </div>

              

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button type="submit" disabled={operationLoading}>
                  {operationLoading ? 'Saving...' : (editingFAQ ? 'Update' : 'Create')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All FAQs</CardTitle>
          <CardDescription>
            A list of all frequently asked questions and their answers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : faqs ? (
            <Table>
                             <TableHeader>
                 <TableRow>
                   <TableHead>Question</TableHead>
                   <TableHead>Created At</TableHead>
                   <TableHead className="text-right">Actions</TableHead>
                 </TableRow>
               </TableHeader>
              <TableBody>
                {Object.entries(faqs).map(([id, faq]: [string, any]) => (
                  <TableRow key={id}>
                                         <TableCell>
                       <div className="max-w-[300px]">
                         <div className="font-medium truncate">{faq.question}</div>
                         <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
                           {faq.answer}
                         </div>
                       </div>
                     </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(faq.createdAt), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit({ ...faq, id })}
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
              <HelpCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>No FAQs found. Create your first FAQ to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 