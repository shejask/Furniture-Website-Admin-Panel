'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Calendar, Tag, Search, Filter, CheckCircle } from 'lucide-react';
import { useFirebaseData, useFirebaseOperations } from '@/hooks/use-firebase-database';
import { format } from 'date-fns';
import type { Coupon, CouponFormData, DiscountType } from '@/types/coupon';
import { CouponForm } from './coupon-form';
import { 
  formatDiscountValue, 
  getCouponStatusBadge, 
  getCouponStatusText, 
  calculateUsagePercentage,
  calculateCouponStats,
  filterCoupons,
  sortCoupons
} from '../utils/coupon-utils';

export function CouponsTable() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'expired'>('all');
  const [discountTypeFilter, setDiscountTypeFilter] = useState<DiscountType | 'all'>('all');
  const [sortBy] = useState<'createdAt' | 'updatedAt' | 'code' | 'usageCount' | 'validTo'>('createdAt');
  const [sortOrder] = useState<'asc' | 'desc'>('desc');

  const { data: coupons, loading } = useFirebaseData('coupons');
  const { createWithKey, update, remove, loading: operationLoading } = useFirebaseOperations();

  const handleSubmit = async (data: CouponFormData) => {
    try {
      if (editingCoupon) {
        await update(`coupons/${editingCoupon.id}`, {
          ...data,
          updatedAt: new Date().toISOString()
        });
      } else {
        await createWithKey('coupons', data);
      }
      handleCloseDialog();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Error ${editingCoupon ? 'updating' : 'creating'} coupon: ${errorMessage}`);
    }
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this coupon?')) {
      try {
        await remove(`coupons/${id}`);
      } catch (error) {
        // Error handling - could be improved with proper error reporting
      }
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCoupon(null);
  };

  // Calculate statistics
  const stats = coupons ? calculateCouponStats(coupons) : null;

  // Filter and sort coupons
  const filteredCoupons = coupons ? filterCoupons(coupons, {
    status: statusFilter === 'all' ? undefined : statusFilter,
    discountType: discountTypeFilter === 'all' ? undefined : discountTypeFilter,
    searchTerm: searchTerm || undefined
  }) : {};

  const sortedCoupons = sortCoupons(filteredCoupons, sortBy, sortOrder);

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Tag className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">Total Coupons</p>
                  <p className="text-2xl font-bold">{stats.totalCoupons}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Active Coupons</p>
                  <p className="text-2xl font-bold">{stats.activeCoupons}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-red-600" />
                <div>
                  <p className="text-sm font-medium">Expired Coupons</p>
                  <p className="text-2xl font-bold">{stats.expiredCoupons}</p>
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
              placeholder="Search coupons..."
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
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>

          <Select value={discountTypeFilter} onValueChange={(value: any) => setDiscountTypeFilter(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="percentage">Percentage</SelectItem>
              <SelectItem value="fixed">Fixed</SelectItem>
              <SelectItem value="free_shipping">Free Shipping</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Coupon
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCoupon ? 'Edit Coupon' : 'Create Coupon'}
              </DialogTitle>
              <DialogDescription>
                {editingCoupon 
                  ? 'Update the coupon details below.'
                  : 'Create a new coupon with all necessary information.'
                }
              </DialogDescription>
            </DialogHeader>
            <CouponForm
              coupon={editingCoupon || undefined}
              onSubmit={handleSubmit}
              onCancel={handleCloseDialog}
              loading={operationLoading}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Coupons Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Coupons</CardTitle>
          <CardDescription>
            Manage all discount coupons and promotional codes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : sortedCoupons.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Min Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Valid Until</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedCoupons.map(({ id, coupon }) => (
                  <TableRow key={id}>
                    <TableCell>
                      <div className="font-mono font-medium">{coupon.code}</div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <Badge variant="outline" className="mb-1">
                          {formatDiscountValue(coupon.discountType, coupon.discountValue)}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm font-medium">
                          {coupon.usageCount} / {coupon.usageLimit || coupon.totalQuantity}
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                          <div 
                            className="bg-blue-600 h-1.5 rounded-full" 
                            style={{ width: `${calculateUsagePercentage(coupon)}%` }}
                          ></div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {coupon.minOrderAmount ? `₹${coupon.minOrderAmount}` : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getCouponStatusBadge(coupon)}>
                        {getCouponStatusText(coupon)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(coupon.validTo), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit({ ...coupon, id })}
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
              <Tag className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>No coupons found. Create your first coupon to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 