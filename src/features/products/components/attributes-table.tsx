'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Calendar } from 'lucide-react';
import { useFirebaseData, useFirebaseOperations } from '@/hooks/use-firebase-database';
import { format } from 'date-fns';

interface Attribute {
  id: string;
  name: string;
  style: 'radio' | 'checkbox' | 'dropdown' | 'color' | 'image';
  values: string[];
  createdAt: string;
  updatedAt: string;
}

export function AttributesTable() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState<Attribute | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    style: 'radio' as Attribute['style'],
    values: ''
  });

  const { data: attributes, loading } = useFirebaseData('attributes');
  const { createWithKey, update, remove, loading: operationLoading } = useFirebaseOperations();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const attributeData = {
        name: formData.name,
        style: formData.style,
        values: formData.values.split(',').map(v => v.trim()).filter(v => v),
        createdAt: editingAttribute ? editingAttribute.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (editingAttribute) {
        await update(`attributes/${editingAttribute.id}`, attributeData);
      } else {
        await createWithKey('attributes', attributeData);
      }

      handleCloseDialog();
    } catch (error) {
      // Handle error silently or log to a proper logging service in production
    }
  };

  const handleEdit = (attribute: Attribute) => {
    setEditingAttribute(attribute);
    setFormData({
      name: attribute.name,
      style: attribute.style,
      values: attribute.values.join(', ')
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this attribute?')) {
      try {
        await remove(`attributes/${id}`);
      } catch (error) {
        // Handle error silently or log to a proper logging service in production
      }
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingAttribute(null);
    setFormData({ name: '', style: 'radio', values: '' });
  };

  const getStyleBadge = (style: string) => {
    const styleMap = {
      radio: { label: 'Radio', variant: 'default' as const },
      checkbox: { label: 'Checkbox', variant: 'secondary' as const },
      dropdown: { label: 'Dropdown', variant: 'outline' as const },
      color: { label: 'Color', variant: 'destructive' as const },
      image: { label: 'Image', variant: 'default' as const }
    };
    
    const styleInfo = styleMap[style as keyof typeof styleMap] || { label: style, variant: 'outline' as const };
    return <Badge variant={styleInfo.variant}>{styleInfo.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
       
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Attribute
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingAttribute ? 'Edit Attribute' : 'Create Attribute'}
              </DialogTitle>
              <DialogDescription>
                {editingAttribute 
                  ? 'Update the attribute details below.'
                  : 'Create a new product attribute with variant options.'
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter attribute name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="style">Style *</Label>
                <Select
                  value={formData.style}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, style: value as Attribute['style'] }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="radio">Radio</SelectItem>
                    <SelectItem value="checkbox">Checkbox</SelectItem>
                    <SelectItem value="dropdown">Dropdown</SelectItem>
                    <SelectItem value="color">Color</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Choose the desired shape style, such as rectangle or circle. Based on your selection, variant options will be displayed on product page.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="values">Values *</Label>
                <Input
                  id="values"
                  value={formData.values}
                  onChange={(e) => setFormData(prev => ({ ...prev, values: e.target.value }))}
                  placeholder="Enter values separated by commas (e.g., Red, Blue, Green)"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Enter multiple values separated by commas
                </p>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button type="submit" disabled={operationLoading}>
                  {editingAttribute ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Attributes</CardTitle>
          <CardDescription>
            A list of all product attributes and their configurations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : attributes ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Style</TableHead>
                  <TableHead>Values</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(attributes).map(([id, attribute]: [string, any]) => (
                  <TableRow key={id}>
                    <TableCell className="font-medium">{attribute.name}</TableCell>
                    <TableCell>{getStyleBadge(attribute.style)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {attribute.values?.map((value: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {value}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(attribute.createdAt), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit({ ...attribute, id })}
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
              No attributes found. Create your first attribute to get started.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 