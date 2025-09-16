'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Search, Filter, Percent, Calculator } from 'lucide-react';
import { useFirebaseData, useFirebaseOperations } from '@/hooks/use-firebase-database';
import { format } from 'date-fns';
import type { Tax, TaxFormData } from '@/types/tax';
import { TaxForm } from './tax-form';
import { 
  formatTaxRate, 
  getTaxStatusBadge, 
  getTaxStatusText, 
  calculateTaxStats,
  filterTaxes,
  sortTaxes
} from '../utils/tax-utils';

export function TaxesTable() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTax, setEditingTax] = useState<Tax | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy] = useState<'name' | 'rate' | 'createdAt' | 'updatedAt'>('createdAt');
  const [sortOrder] = useState<'asc' | 'desc'>('desc');

  const { data: taxes, loading } = useFirebaseData('taxes');
  const { createWithKey, update, remove, loading: operationLoading } = useFirebaseOperations();

  const handleSubmit = async (data: TaxFormData) => {
    try {
      if (editingTax) {
        await update(`taxes/${editingTax.id}`, {
          ...data,
          updatedAt: new Date().toISOString()
        });
      } else {
        await createWithKey('taxes', {
          ...data,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      alert(`Error ${editingTax ? 'updating' : 'creating'} tax: ${error.message || error}`);
    }
  };

  const handleEdit = (tax: Tax) => {
    setEditingTax(tax);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this tax?')) {
      try {
        await remove(`taxes/${id}`);
      } catch (error) {
        console.error('Error deleting tax:', error);
        alert('Error deleting tax. Please try again.');
      }
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTax(null);
  };

  // Calculate statistics
  const stats = taxes ? calculateTaxStats(taxes) : null;

  // Filter and sort taxes
  const filteredTaxes = taxes ? filterTaxes(taxes, {
    isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
    searchTerm: searchTerm || undefined
  }) : {};

  const sortedTaxes = sortTaxes(filteredTaxes, sortBy, sortOrder);

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Percent className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">Total Taxes</p>
                  <p className="text-2xl font-bold">{stats.totalTaxes}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calculator className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Active Taxes</p>
                  <p className="text-2xl font-bold">{stats.activeTaxes}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-red-600" />
                <div>
                  <p className="text-sm font-medium">Inactive Taxes</p>
                  <p className="text-2xl font-bold">{stats.inactiveTaxes}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Percent className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="text-sm font-medium">Average Rate</p>
                  <p className="text-2xl font-bold">{stats.averageRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-wrap gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search taxes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Tax
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTax ? 'Edit Tax' : 'Create Tax'}
              </DialogTitle>
              <DialogDescription>
                {editingTax 
                  ? 'Update the tax details below.'
                  : 'Create a new tax with all necessary information.'
                }
              </DialogDescription>
            </DialogHeader>
            <TaxForm
              tax={editingTax || undefined}
              onSubmit={handleSubmit}
              onCancel={handleCloseDialog}
              loading={operationLoading}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Taxes Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Taxes</CardTitle>
          <CardDescription>
            Manage all tax rates and configurations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : sortedTaxes.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tax Name</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTaxes.map(({ id, tax }) => (
                  <TableRow key={id}>
                    <TableCell>
                      <div className="font-medium">{tax.name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Percent className="h-3 w-3 text-muted-foreground" />
                        <span className="font-mono">{formatTaxRate(tax.rate)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px] truncate text-sm text-muted-foreground">
                        {tax.description || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getTaxStatusBadge(tax.isActive)}>
                        {getTaxStatusText(tax.isActive)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(tax.createdAt), 'MMM dd, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit({ ...tax, id })}
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
              <Percent className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>No taxes found. Create your first tax to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
