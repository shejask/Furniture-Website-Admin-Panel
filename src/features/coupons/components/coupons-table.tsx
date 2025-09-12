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
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Edit, Trash2, Calendar, Tag } from 'lucide-react';
import { useFirebaseData, useFirebaseOperations } from '@/hooks/use-firebase-database';
import { format } from 'date-fns';

interface Coupon {
  id: string;
  title: string;
  description: string;
  code: string;
  type: 'percentage' | 'fixed' | 'free_shipping';
  amount: number;
  isExpired: boolean;
  isFirstOrder: boolean;
  status: 'active' | 'inactive';
  applyToAllProducts: boolean;
  products: string[];
  minSpend: number;
  isUnlimited: boolean;
  usagePerCoupon: number;
  usagePerCustomer: number;
  createdAt: string;
  updatedAt: string;
}

export function CouponsTable() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    code: '',
    type: 'percentage' as Coupon['type'],
    amount: 0,
    isExpired: false,
    isFirstOrder: false,
    status: 'active' as Coupon['status'],
    applyToAllProducts: true,
    products: [] as string[],
    minSpend: 0,
    isUnlimited: false,
    usagePerCoupon: 1,
    usagePerCustomer: 1
  });

  const { data: coupons, loading } = useFirebaseData('coupons');
  const { data: products } = useFirebaseData('products');
  const { createWithKey, update, remove, loading: operationLoading } = useFirebaseOperations();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const couponData = {
        title: formData.title,
        description: formData.description,
        code: formData.code.toUpperCase(),
        type: formData.type,
        amount: formData.amount,
        isExpired: formData.isExpired,
        isFirstOrder: formData.isFirstOrder,
        status: formData.status,
        applyToAllProducts: formData.applyToAllProducts,
        products: formData.products?.filter(Boolean) || [],
        minSpend: formData.minSpend,
        isUnlimited: formData.isUnlimited,
        usagePerCoupon: formData.usagePerCoupon,
        usagePerCustomer: formData.usagePerCustomer,
        createdAt: editingCoupon ? editingCoupon.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (editingCoupon) {
        await update(`coupons/${editingCoupon.id}`, couponData);
      } else {
        await createWithKey('coupons', couponData);
      }

      handleCloseDialog();
    } catch (error) {
      // console.error('Error saving coupon:', error);
    }
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      title: coupon.title,
      description: coupon.description,
      code: coupon.code,
      type: coupon.type,
      amount: coupon.amount,
      isExpired: coupon.isExpired,
      isFirstOrder: coupon.isFirstOrder,
      status: coupon.status,
      applyToAllProducts: coupon.applyToAllProducts,
      products: coupon.products?.filter(Boolean) || [],
      minSpend: coupon.minSpend,
      isUnlimited: coupon.isUnlimited,
      usagePerCoupon: coupon.usagePerCoupon,
      usagePerCustomer: coupon.usagePerCustomer
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this coupon?')) {
      try {
        await remove(`coupons/${id}`);
      } catch (error) {
        // console.error('Error deleting coupon:', error);
      }
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCoupon(null);
    setFormData({
      title: '',
      description: '',
      code: '',
      type: 'percentage',
      amount: 0,
      isExpired: false,
      isFirstOrder: false,
      status: 'active',
      applyToAllProducts: true,
      products: [],
      minSpend: 0,
      isUnlimited: false,
      usagePerCoupon: 1,
      usagePerCustomer: 1
    });
  };

  const getStatusBadge = (status: string) => {
    return status === 'active' ? (
      <Badge variant="default">Active</Badge>
    ) : (
      <Badge variant="secondary">Inactive</Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      'percentage': 'bg-blue-100 text-blue-800',
      'fixed': 'bg-green-100 text-green-800',
      'free_shipping': 'bg-purple-100 text-purple-800'
    };
    
    const colorClass = colors[type as keyof typeof colors] || colors.percentage;
    
    return (
      <Badge variant="outline" className={colorClass}>
        {type === 'percentage' ? 'Percentage' : type === 'fixed' ? 'Fixed Amount' : 'Free Shipping'}
      </Badge>
    );
  };

  const formatAmount = (amount: number, type: string) => {
    if (type === 'percentage') {
      return `${amount}%`;
    } else if (type === 'fixed') {
      return `₹${amount}`;
    } else {
      return 'Free Shipping';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Coupon
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
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
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter title"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code">Code *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="Enter code"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter description"
                  className="w-full min-h-[80px] px-3 py-2 border border-input rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as Coupon['type'] }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                      <SelectItem value="free_shipping">Free Shipping</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount *</Label>
                  <div className="relative">
                                         <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                       {formData.type === 'percentage' ? '' : formData.type === 'fixed' ? '₹' : ''}
                     </span>
                    <Input
                      id="amount"
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                      placeholder={`Enter ${formData.type === 'percentage' ? 'percentage' : 'amount'}`}
                      className={formData.type === 'fixed' ? 'pl-8' : ''}
                      required
                      disabled={formData.type === 'free_shipping'}
                    />
                    {formData.type === 'percentage' && <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">%</span>}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minSpend">Min Spend *</Label>
                                     <div className="relative">
                     <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">₹</span>
                     <Input
                       id="minSpend"
                       type="number"
                       value={formData.minSpend}
                       onChange={(e) => setFormData(prev => ({ ...prev, minSpend: parseFloat(e.target.value) || 0 }))}
                       placeholder="Enter minimum spend"
                       className="pl-8"
                       required
                     />
                   </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as Coupon['status'] }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="usagePerCoupon">Usage Per Coupon *</Label>
                  <Input
                    id="usagePerCoupon"
                    type="number"
                    value={formData.usagePerCoupon}
                    onChange={(e) => setFormData(prev => ({ ...prev, usagePerCoupon: parseInt(e.target.value) || 1 }))}
                    placeholder="Enter value"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    *Specify the maximum number of times a single coupon can be utilized.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="usagePerCustomer">Usage Per Customer *</Label>
                  <Input
                    id="usagePerCustomer"
                    type="number"
                    value={formData.usagePerCustomer}
                    onChange={(e) => setFormData(prev => ({ ...prev, usagePerCustomer: parseInt(e.target.value) || 1 }))}
                    placeholder="Enter value"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    *Specify the maximum number of times a single customer can utilize the coupon.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isExpired"
                    checked={formData.isExpired}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isExpired: checked as boolean }))}
                  />
                  <Label htmlFor="isExpired">Is Expired</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isFirstOrder"
                    checked={formData.isFirstOrder}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isFirstOrder: checked as boolean }))}
                  />
                  <Label htmlFor="isFirstOrder">Is First Order</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="applyToAllProducts"
                    checked={formData.applyToAllProducts}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, applyToAllProducts: checked as boolean }))}
                  />
                  <Label htmlFor="applyToAllProducts">Apply To All Products</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isUnlimited"
                    checked={formData.isUnlimited}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isUnlimited: checked as boolean }))}
                  />
                  <Label htmlFor="isUnlimited">Is Unlimited</Label>
                </div>
              </div>

              {!formData.applyToAllProducts && products && (
                <div className="space-y-2">
                  <Label>Products *</Label>
                  <Select
                    onValueChange={(value) => {
                      if (value && !formData.products?.includes(value)) {
                        setFormData(prev => ({ 
                          ...prev, 
                          products: [...(prev.products || []), value].filter(Boolean)
                        }));
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select products" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(products).map(([id, product]: [string, any]) => (
                        <SelectItem key={id} value={id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.products?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.products.filter(Boolean).map((productId) => {
                        const product = products?.[productId];
                        return (
                          <Badge key={productId} variant="secondary" className="flex items-center gap-1">
                            {product?.name || productId}
                            <button
                              type="button"
                              onClick={() => setFormData(prev => ({ 
                                ...prev, 
                                products: (prev.products || []).filter(p => p && p !== productId) 
                              }))}
                              className="ml-1 text-xs"
                            >
                              ×
                            </button>
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button type="submit" disabled={operationLoading}>
                  {operationLoading ? 'Saving...' : (editingCoupon ? 'Update' : 'Create')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Coupons</CardTitle>
          <CardDescription>
            A list of all discount coupons and their configurations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : coupons ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Min Spend</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(coupons).map(([id, coupon]: [string, any]) => (
                  <TableRow key={id}>
                    <TableCell>
                      <div className="font-mono font-medium">{coupon.code}</div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px]">
                        <div className="font-medium truncate">{coupon.title}</div>
                        <div className="text-sm text-muted-foreground mt-1 line-clamp-1">
                          {coupon.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getTypeBadge(coupon.type)}</TableCell>
                    <TableCell className="font-medium">
                      {formatAmount(coupon.amount, coupon.type)}
                    </TableCell>
                                         <TableCell>₹{coupon.minSpend}</TableCell>
                    <TableCell>{getStatusBadge(coupon.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(coupon.createdAt), 'MMM dd, yyyy')}
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