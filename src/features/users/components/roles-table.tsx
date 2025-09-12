'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Edit, Trash2, Calendar, Shield } from 'lucide-react';
import { useFirebaseData, useFirebaseOperations } from '@/hooks/use-firebase-database';
import { format } from 'date-fns';

interface Role {
  id: string;
  name: string;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

const ADMIN_PAGES: Permission[] = [
  // Dashboard
  { id: 'dashboard_view', name: 'Dashboard View', description: 'View dashboard and analytics', category: 'Dashboard' },
  
  // Products
  { id: 'products_view', name: 'Products View', description: 'View all products', category: 'Products' },
  { id: 'products_create', name: 'Products Create', description: 'Create new products', category: 'Products' },
  { id: 'products_edit', name: 'Products Edit', description: 'Edit existing products', category: 'Products' },
  { id: 'products_delete', name: 'Products Delete', description: 'Delete products', category: 'Products' },
  { id: 'categories_view', name: 'Categories View', description: 'View product categories', category: 'Products' },
  { id: 'categories_create', name: 'Categories Create', description: 'Create new categories', category: 'Products' },
  { id: 'categories_edit', name: 'Categories Edit', description: 'Edit categories', category: 'Products' },
  { id: 'categories_delete', name: 'Categories Delete', description: 'Delete categories', category: 'Products' },
  { id: 'brands_view', name: 'Brands View', description: 'View product brands', category: 'Products' },
  { id: 'brands_create', name: 'Brands Create', description: 'Create new brands', category: 'Products' },
  { id: 'brands_edit', name: 'Brands Edit', description: 'Edit brands', category: 'Products' },
  { id: 'brands_delete', name: 'Brands Delete', description: 'Delete brands', category: 'Products' },
  
  // Users
  { id: 'users_view', name: 'Users View', description: 'View all users', category: 'Users' },
  { id: 'users_create', name: 'Users Create', description: 'Create new users', category: 'Users' },
  { id: 'users_edit', name: 'Users Edit', description: 'Edit user details', category: 'Users' },
  { id: 'users_delete', name: 'Users Delete', description: 'Delete users', category: 'Users' },
  { id: 'roles_view', name: 'Roles View', description: 'View user roles', category: 'Users' },
  { id: 'roles_create', name: 'Roles Create', description: 'Create new roles', category: 'Users' },
  { id: 'roles_edit', name: 'Roles Edit', description: 'Edit roles and permissions', category: 'Users' },
  { id: 'roles_delete', name: 'Roles Delete', description: 'Delete roles', category: 'Users' },
  
  // Marketing
  { id: 'coupons_view', name: 'Coupons View', description: 'View all coupons', category: 'Marketing' },
  { id: 'coupons_create', name: 'Coupons Create', description: 'Create new coupons', category: 'Marketing' },
  { id: 'coupons_edit', name: 'Coupons Edit', description: 'Edit coupons', category: 'Marketing' },
  { id: 'coupons_delete', name: 'Coupons Delete', description: 'Delete coupons', category: 'Marketing' },
  
  // Content
  { id: 'faq_view', name: 'FAQ View', description: 'View FAQ management', category: 'Content' },
  { id: 'faq_create', name: 'FAQ Create', description: 'Create new FAQs', category: 'Content' },
  { id: 'faq_edit', name: 'FAQ Edit', description: 'Edit FAQs', category: 'Content' },
  { id: 'faq_delete', name: 'FAQ Delete', description: 'Delete FAQs', category: 'Content' },
  
  // Settings
  { id: 'settings_view', name: 'Settings View', description: 'View system settings', category: 'Settings' },
  { id: 'settings_edit', name: 'Settings Edit', description: 'Edit system settings', category: 'Settings' },
  
  // System
  { id: 'system_admin', name: 'System Admin', description: 'Full system access', category: 'System' },
  { id: 'data_export', name: 'Data Export', description: 'Export system data', category: 'System' },
  { id: 'logs_view', name: 'Logs View', description: 'View system logs', category: 'System' }
];

export function RolesTable() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    permissions: [] as string[]
  });

  const { data: roles, loading } = useFirebaseData('roles');
  const { createWithKey, update, remove, loading: operationLoading } = useFirebaseOperations();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const roleData = {
        name: formData.name,
        permissions: formData.permissions,
        createdAt: editingRole ? editingRole.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (editingRole) {
        await update(`roles/${editingRole.id}`, roleData);
      } else {
        await createWithKey('roles', roleData);
      }

      handleCloseDialog();
    } catch (error) {
      // Log error for debugging but don't expose to client
    }
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      permissions: role.permissions
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this role?')) {
      try {
        await remove(`roles/${id}`);
      } catch (error) {
        // Log error for debugging but don't expose to client
      }
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingRole(null);
    setFormData({
      name: '',
      permissions: []
    });
  };

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        permissions: [...prev.permissions, permissionId]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        permissions: prev.permissions.filter(p => p !== permissionId)
      }));
    }
  };

  const handleSelectAllCategory = (category: string, checked: boolean) => {
    const categoryPermissions = ADMIN_PAGES.filter(p => p.category === category).map(p => p.id);
    
    if (checked) {
      setFormData(prev => ({
        ...prev,
        permissions: [...Array.from(new Set([...prev.permissions, ...categoryPermissions]))]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        permissions: prev.permissions.filter(p => !categoryPermissions.includes(p))
      }));
    }
  };

  const getPermissionCount = (permissions: string[]) => {
    return permissions.length;
  };

  const getCategoryPermissions = (category: string) => {
    return ADMIN_PAGES.filter(p => p.category === category);
  };

  const getCategories = () => {
    return [...Array.from(new Set(ADMIN_PAGES.map(p => p.category)))];
  };

  const isCategorySelected = (category: string) => {
    const categoryPermissions = getCategoryPermissions(category).map(p => p.id);
    return categoryPermissions.every(p => formData.permissions.includes(p));
  };



  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Role
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingRole ? 'Edit Role' : 'Add Role'}
              </DialogTitle>
              <DialogDescription>
                {editingRole 
                  ? 'Update the role details and permissions below.'
                  : 'Create a new role with specific permissions.'
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Role Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter role name"
                  required
                />
              </div>

              <div className="space-y-4">
                <Label>Permissions *</Label>
                <div className="space-y-4 max-h-[400px] overflow-y-auto border rounded-md p-4">
                  {getCategories().map((category) => (
                    <div key={category} className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={isCategorySelected(category)}
                          onCheckedChange={(checked) => handleSelectAllCategory(category, checked as boolean)}
                        />
                        <Label className="font-medium">{category}</Label>
                      </div>
                      <div className="ml-6 space-y-2">
                        {getCategoryPermissions(category).map((permission) => (
                          <div key={permission.id} className="flex items-center space-x-2">
                            <Checkbox
                              checked={formData.permissions.includes(permission.id)}
                              onCheckedChange={(checked) => handlePermissionChange(permission.id, checked as boolean)}
                            />
                            <div>
                              <Label className="text-sm font-medium">{permission.name}</Label>
                              <p className="text-xs text-muted-foreground">{permission.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Selected permissions: {formData.permissions.length}
                </p>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button type="submit" disabled={operationLoading}>
                  {operationLoading ? 'Saving...' : (editingRole ? 'Update' : 'Create')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Roles</CardTitle>
          <CardDescription>
            A list of all user roles and their permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : roles ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role Name</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(roles).map(([id, role]: [string, any]) => (
                  <TableRow key={id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <Shield className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{role.name}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="secondary">
                          {getPermissionCount(role.permissions)} permissions
                        </Badge>
                        {role.permissions.slice(0, 3).map((permission: string) => {
                          const perm = ADMIN_PAGES.find(p => p.id === permission);
                          return (
                            <Badge key={permission} variant="outline" className="text-xs">
                              {perm?.name || permission}
                            </Badge>
                          );
                        })}
                        {role.permissions.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{role.permissions.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(role.createdAt), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit({ ...role, id })}
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
              <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>No roles found. Create your first role to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 