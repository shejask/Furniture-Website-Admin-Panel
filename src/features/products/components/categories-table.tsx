'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Calendar, Image as ImageIcon, FolderPlus } from 'lucide-react';
import { useFirebaseData, useFirebaseOperations } from '@/hooks/use-firebase-database';
import { SimpleFileUploader } from '@/components/simple-file-uploader';
import Image from 'next/image';

// Simple date formatting function
const formatDate = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleDateString();
  } catch {
    return 'Invalid date';
  }
};

interface Category {
  id: string;
  name: string;
  description: string;
  image: string;
  banner?: string;
  icon?: string;
  metaTitle: string;
  metaDescription: string;
  showInMainMenu: boolean;
  subCategories?: SubCategory[];
  createdAt: string;
  updatedAt: string;
  firebaseKey?: string;
}

interface SubCategory {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface CategoryFormData {
  name: string;
  description: string;
  image: string;
  banner: string;
  icon: string;
  metaTitle: string;
  metaDescription: string;
  showInMainMenu: boolean;
}

interface SubCategoryFormData {
  name: string;
}

interface CategoriesData {
  [key: string]: Omit<Category, 'id'>;
}



export function CategoriesTable() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubCategoryDialogOpen, setIsSubCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingSubCategory, setEditingSubCategory] = useState<SubCategory | null>(null);
  const [selectedParentCategory, setSelectedParentCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    image: '',
    banner: '',
    icon: '',
    metaTitle: '',
    metaDescription: '',
    showInMainMenu: false
  });

  const [subCategoryFormData, setSubCategoryFormData] = useState<SubCategoryFormData>({
    name: ''
  });

  const [tempImage, setTempImage] = useState('');
  const [tempBanner, setTempBanner] = useState('');
  const [tempIcon, setTempIcon] = useState('');

  const { data: categories, loading } = useFirebaseData<CategoriesData>('categories');
  const { createWithKey, update, remove, loading: operationLoading } = useFirebaseOperations();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Name is required.');
      return;
    }
    
    try {
      // Use tempImage and tempIcon if they exist, otherwise use formData values
      const categoryData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        image: tempImage || formData.image,
        banner: tempBanner || formData.banner,
        icon: tempIcon || formData.icon,
        metaTitle: formData.metaTitle.trim(),
        metaDescription: formData.metaDescription.trim(),
        showInMainMenu: formData.showInMainMenu === true,
        createdAt: editingCategory ? editingCategory.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (editingCategory) {
        await update(`categories/${editingCategory.id}`, categoryData);
      } else {
        await createWithKey('categories', categoryData);
      }

      handleCloseDialog();
    } catch (error) {
      alert('Failed to save category. Please try again.');
    }
  };

  const handleSubCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subCategoryFormData.name.trim()) {
      alert('Name is required.');
      return;
    }
    
    if (!selectedParentCategory) {
      alert('Parent category is required.');
      return;
    }
    
    try {
      // Get current category data
      if (loading) {
        alert('Please wait, categories are still loading...');
        return;
      }
      
      if (!categories) {
        alert('No categories found. Please create a category first.');
        return;
      }
      
      // Use the firebaseKey if available, otherwise find by name
      let categoryKey = selectedParentCategory.firebaseKey;
      let currentCategory;
      
      if (categoryKey && categories[categoryKey]) {
        currentCategory = categories[categoryKey];
      } else {
        // Fallback: find by name
        const categoryEntry = Object.entries(categories).find(([key, category]) => 
          category.name === selectedParentCategory.name
        );
        
        if (!categoryEntry) {
          alert('Category not found.');
          return;
        }
        
        [categoryKey, currentCategory] = categoryEntry;
      }

      const newSubCategory = {
        id: editingSubCategory ? editingSubCategory.id : `sub_${Date.now()}`,
        name: subCategoryFormData.name.trim(),
        createdAt: editingSubCategory ? editingSubCategory.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Update or add sub-category to the category's subCategories array
      let updatedSubCategories = currentCategory.subCategories || [];
      
      if (editingSubCategory) {
        // Update existing sub-category
        updatedSubCategories = updatedSubCategories.map(sub => 
          sub.id === editingSubCategory.id ? newSubCategory : sub
        );
      } else {
        // Add new sub-category
        updatedSubCategories = [...updatedSubCategories, newSubCategory];
      }

      // Update the category document with the new sub-categories array
      await update(`categories/${categoryKey}`, {
        ...currentCategory,
        subCategories: updatedSubCategories,
        updatedAt: new Date().toISOString()
      });
      
      handleCloseSubCategoryDialog();
    } catch (error) {
      alert('Failed to save sub-category. Please try again.');
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
      image: category.image,
      banner: category.banner || '',
      icon: category.icon || '',
      metaTitle: category.metaTitle,
      metaDescription: category.metaDescription,
      showInMainMenu: category.showInMainMenu === true
    });
    // Reset temp states when editing
    setTempImage('');
    setTempBanner('');
    setTempIcon('');
    setIsDialogOpen(true);
  };

  const handleAddSubCategory = (category: Category, categoryKey: string) => {
    setSelectedParentCategory({ ...category, firebaseKey: categoryKey });
    setEditingSubCategory(null);
    setSubCategoryFormData({
      name: ''
    });
    setIsSubCategoryDialogOpen(true);
  };

  const handleEditSubCategory = (subCategory: SubCategory, parentCategory: Category, categoryKey: string) => {
    setSelectedParentCategory({ ...parentCategory, firebaseKey: categoryKey });
    setEditingSubCategory(subCategory);
    setSubCategoryFormData({
      name: subCategory.name
    });
    setIsSubCategoryDialogOpen(true);
  };

  const handleDeleteSubCategory = async (subCategoryId: string, parentCategory: Category, categoryKey: string) => {
    if (window.confirm(`Are you sure you want to delete the sub-category "${parentCategory.name}"? This action cannot be undone.`)) {
      try {
        if (!categories) {
          alert('Category not found.');
          return;
        }

        const currentCategory = categories[categoryKey];
        if (!currentCategory) {
          alert('Category not found.');
          return;
        }

        // Remove the sub-category from the array
        const updatedSubCategories = (currentCategory.subCategories || []).filter(
          sub => sub.id !== subCategoryId
        );

        // Update the category document
        await update(`categories/${categoryKey}`, {
          ...currentCategory,
          subCategories: updatedSubCategories,
          updatedAt: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error deleting sub-category:', error);
        alert('Failed to delete sub-category. Please try again.');
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await remove(`categories/${id}`);
      } catch (error) {
        alert('Failed to delete category. Please try again.');
      }
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      image: '',
      banner: '',
      icon: '',
      metaTitle: '',
      metaDescription: '',
      showInMainMenu: false
    });
    setTempImage('');
    setTempBanner('');
    setTempIcon('');
  };

  const handleCloseSubCategoryDialog = () => {
    setIsSubCategoryDialogOpen(false);
    setSelectedParentCategory(null);
    setEditingSubCategory(null);
    setSubCategoryFormData({
      name: ''
    });
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name
    }));
  };

  const handleImageUpload = (urls: string[]) => {
    if (urls.length > 0) {
      setTempImage(urls[0]);
      setFormData(prev => ({ ...prev, image: urls[0] }));
    }
  };

  const handleBannerUpload = (urls: string[]) => {
    if (urls.length > 0) {
      setTempBanner(urls[0]);
      setFormData(prev => ({ ...prev, banner: urls[0] }));
    }
  };

  const handleIconUpload = (urls: string[]) => {
    if (urls.length > 0) {
      setTempIcon(urls[0]);
      setFormData(prev => ({ ...prev, icon: urls[0] }));
    }
  };



  const handleUploadError = () => {
    // Handle error silently or log to a proper logging service in production
    alert('Failed to upload file. Please try again.');
  };

  // Get sub-categories for a specific category
  const getSubCategoriesForCategory = (categoryId: string) => {
    if (!categories) return [];
    
    // First try to find by firebaseKey if it's a valid key
    if (categories[categoryId]) {
      return categories[categoryId].subCategories || [];
    }
    
    // Fallback: find by name
    const categoryEntry = Object.entries(categories).find(([key, category]) => 
      category.name === categoryId
    );
    
    if (!categoryEntry) return [];
    
    const [_, currentCategory] = categoryEntry;
    return currentCategory.subCategories || [];
  };

  return (
    <div className="space-y-6">
      {/* Main Category Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Category
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Edit Category' : 'Create Category'}
            </DialogTitle>
            <DialogDescription>
              {editingCategory 
                ? 'Update the category details below.'
                : 'Create a new product category with all necessary information.'
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
                  placeholder="Enter category name"
                  required
                />
              </div>

            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter category description"
                className="w-full min-h-[100px] px-3 py-2 border border-input rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
            </div>

                         <div className="space-y-2">
               <Label>Category Image</Label>
               <SimpleFileUploader
                 onUploadComplete={handleImageUpload}
                 onUploadError={handleUploadError}
                 folder="categories/images"
                 accept="image/*"
                 maxFiles={1}
                 showPreview={true}
               />
               {(tempImage || formData.image) && (
                 <div className="flex items-center space-x-2">
                   <Image 
                     src={tempImage || formData.image} 
                     alt="Category" 
                     width={32}
                     height={32}
                   />
                   <span className="text-xs text-muted-foreground">
                     {tempImage ? 'New image uploaded' : 'Current image'}
                   </span>
                 </div>
               )}
             </div>

            <div className="space-y-2">
              <Label>Category Banner (Optional)</Label>
              <SimpleFileUploader
                onUploadComplete={handleBannerUpload}
                onUploadError={handleUploadError}
                folder="categories/banners"
                accept="image/*"
                maxFiles={1}
                showPreview={true}
              />
              <p className="text-xs text-muted-foreground">Recommended size: 2560 × 500 px</p>
              {(tempBanner || formData.banner) && (
                <div className="flex items-center space-x-2">
                  <Image 
                    src={tempBanner || formData.banner} 
                    alt="Category Banner" 
                    width={64}
                    height={32}
                  />
                  <span className="text-xs text-muted-foreground">
                    {tempBanner ? 'New banner uploaded' : 'Current banner'}
                  </span>
                </div>
              )}
            </div>

                         <div className="space-y-2">
               <Label>Category Icon (Optional)</Label>
               <SimpleFileUploader
                 onUploadComplete={handleIconUpload}
                 onUploadError={handleUploadError}
                 folder="categories/icons"
                 accept="image/*"
                 maxFiles={1}
                 showPreview={true}
               />
               {(tempIcon || formData.icon) && (
                 <div className="flex items-center space-x-2">
                   <Image 
                     src={tempIcon || formData.icon} 
                     alt="Category Icon" 
                     width={32}
                     height={32}
                   />
                   <span className="text-xs text-muted-foreground">
                     {tempIcon ? 'New icon uploaded' : 'Current icon'}
                   </span>
                 </div>
               )}
             </div>

            <div className="space-y-2">
              <Label htmlFor="metaTitle">Meta Title</Label>
              <Input
                id="metaTitle"
                value={formData.metaTitle}
                onChange={(e) => setFormData(prev => ({ ...prev, metaTitle: e.target.value }))}
                placeholder="Enter meta title for SEO"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="metaDescription">Meta Description</Label>
              <textarea
                id="metaDescription"
                value={formData.metaDescription}
                onChange={(e) => setFormData(prev => ({ ...prev, metaDescription: e.target.value }))}
                placeholder="Enter meta description for SEO"
                className="w-full min-h-[80px] px-3 py-2 border border-input rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="showInMainMenu"
                checked={formData.showInMainMenu}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, showInMainMenu: checked }))}
              />
              <Label htmlFor="showInMainMenu">Show in Main Menu</Label>
            </div>

            {/* Sub-Categories Section - Hidden in popup */}

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={operationLoading}>
                {operationLoading ? 'Saving...' : (editingCategory ? 'Update' : 'Create')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Sub-Category Dialog */}
      <Dialog open={isSubCategoryDialogOpen} onOpenChange={setIsSubCategoryDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSubCategory ? 'Edit Sub-Category' : 'Add Sub-Category'}
            </DialogTitle>
            <DialogDescription>
              {selectedParentCategory && `${editingSubCategory ? 'Edit' : 'Add a new'} sub-category to "${selectedParentCategory.name}"`}
            </DialogDescription>
          </DialogHeader>
          


          <form onSubmit={handleSubCategorySubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subCategoryName">Name *</Label>
              <Input
                id="subCategoryName"
                value={subCategoryFormData.name}
                onChange={(e) => setSubCategoryFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter sub-category name"
                required
                minLength={2}
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground">
                Sub-category name should be between 2-50 characters
              </p>
            </div>

            {editingSubCategory && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Editing:</strong> {editingSubCategory.name}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Created: {formatDate(editingSubCategory.createdAt)}
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={handleCloseSubCategoryDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={operationLoading || !subCategoryFormData.name.trim()}>
                {operationLoading ? 'Saving...' : (editingSubCategory ? 'Update Sub-Category' : 'Create Sub-Category')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Categories</CardTitle>
              <CardDescription>
                A list of all product categories and their configurations
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : categories && Object.keys(categories).length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Sub-Categories</TableHead>
                  <TableHead>Main Menu</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(categories).map(([id, category]) => {
                  const categorySubCategories = getSubCategoriesForCategory(id);
                  return (
                    <TableRow key={id}>
                      <TableCell>
                        {category.image ? (
                          <Image
                            src={category.image}
                            alt={category.name}
                            width={40}
                            height={40}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                            <ImageIcon className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell>
                        <div className="max-w-[200px] truncate" title={category.description}>
                          {category.description || 'No description'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <Badge 
                              variant={categorySubCategories.length > 0 ? "default" : "secondary"} 
                              className="text-xs"
                            >
                              {categorySubCategories.length} sub-category{categorySubCategories.length !== 1 ? 's' : ''}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAddSubCategory({ ...category, id }, id)}
                              disabled={operationLoading}
                              className="h-6 px-2"
                              title="Add new sub-category"
                            >
                              <FolderPlus className="h-3 w-3 mr-1" />
                              Add
                            </Button>
                          </div>
                          {categorySubCategories.length > 0 ? (
                            <div className="space-y-1">
                              {categorySubCategories.map((subCategory) => (
                                <div key={subCategory.id} className="flex items-center justify-between p-2 bg-muted/50 rounded text-xs">
                                  <span className="truncate flex-1">{subCategory.name}</span>
                                  <div className="flex items-center space-x-1 ml-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEditSubCategory(subCategory, { ...category, id }, id)}
                                      disabled={operationLoading}
                                      className="h-5 px-1"
                                      title="Edit sub-category"
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteSubCategory(subCategory.id, { ...category, id }, id)}
                                      disabled={operationLoading}
                                      className="h-5 px-1 text-destructive hover:text-destructive"
                                      title="Delete sub-category"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground italic">
                              No sub-categories yet
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={category.showInMainMenu === true ? "default" : "secondary"}>
                          {category.showInMainMenu === true ? "Yes" : "No"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {formatDate(category.createdAt)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit({ ...category, id })}
                            disabled={operationLoading}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(id)}
                            disabled={operationLoading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No categories found. Create your first category to get started.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}