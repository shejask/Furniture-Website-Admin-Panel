'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2, 
  Copy, 
  Download, 
  DollarSign,
  Percent,
  Calculator,
  TrendingUp,
  Calendar,
  User,
  Store,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useFirebaseData, useFirebaseOperations } from '@/hooks/use-firebase-database';
import { CommissionForm } from './commission-form';
import { type Commission } from '../utils/commission-schema';

export function CommissionTable() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCommission, setEditingCommission] = useState<Commission | null>(null);
  const [selectedCommission, setSelectedCommission] = useState<Commission | null>(null);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: commissions, loading } = useFirebaseData('commissions');
  const { data: vendors } = useFirebaseData('vendors');
  const { createWithKey, update, remove } = useFirebaseOperations();

  const getVendorName = useMemo(() => (vendorId: string) => {
    if (!vendors || !vendorId) return 'Unknown Vendor';
    const vendor = vendors[vendorId];
    return vendor ? (vendor as any).storeName || (vendor as any).name || 'Unknown Vendor' : 'Unknown Vendor';
  }, [vendors]);

  const filteredCommissions = useMemo(() => {
    if (!commissions) return [];
    
    return Object.entries(commissions).filter(([, commission]) => {
      const searchLower = searchQuery.toLowerCase();
      const commissionData = commission as Commission;
      const vendorName = getVendorName(commissionData.vendorId);
      return (
        vendorName.toLowerCase().includes(searchLower) ||
        commissionData.status.toLowerCase().includes(searchLower) ||
        commissionData.period.toLowerCase().includes(searchLower) ||
        commissionData.transactionId?.toLowerCase().includes(searchLower)
      );
    }).map(([commissionId, commission]) => ({ ...(commission as Commission), id: commissionId }));
  }, [commissions, searchQuery, getVendorName]);

  const commissionSummary = useMemo(() => {
    if (!filteredCommissions.length) {
      return {
        totalEarnings: 0,
        pendingAmount: 0,
        paidAmount: 0,
        totalVendors: 0,
        averageCommissionRate: 0
      };
    }

    const totalEarnings = filteredCommissions.reduce((sum, commission) => sum + commission.commissionEarned, 0);
    const pendingAmount = filteredCommissions
      .filter(commission => commission.status === 'pending')
      .reduce((sum, commission) => sum + commission.commissionEarned, 0);
    const paidAmount = filteredCommissions
      .filter(commission => commission.status === 'paid')
      .reduce((sum, commission) => sum + commission.commissionEarned, 0);
    
    const uniqueVendors = new Set(filteredCommissions.map(commission => commission.vendorId));
    const averageCommissionRate = filteredCommissions.reduce((sum, commission) => sum + commission.commissionRate, 0) / filteredCommissions.length;

    const topEarningVendor = filteredCommissions
      .reduce((top, commission) => {
        const vendorEarnings = filteredCommissions
          .filter(c => c.vendorId === commission.vendorId)
          .reduce((sum, c) => sum + c.commissionEarned, 0);
        
        if (vendorEarnings > (top?.earnings || 0)) {
          return {
            vendorId: commission.vendorId,
            vendorName: getVendorName(commission.vendorId),
            earnings: vendorEarnings
          };
        }
        return top;
      }, null as { vendorId: string; vendorName: string; earnings: number } | null);

    return {
      totalEarnings,
      pendingAmount,
      paidAmount,
      totalVendors: uniqueVendors.size,
      averageCommissionRate: Math.round(averageCommissionRate * 100) / 100,
      topEarningVendor
    };
  }, [filteredCommissions, getVendorName]);

  const getVendorStore = (vendorId: string) => {
    if (!vendors || !vendorId) return '';
    const vendor = vendors[vendorId] as any;
    return vendor?.slug || '';
  };

  const handleSubmit = async (data: any) => {
    try {
      if (editingCommission) {
        await update(`commissions/${editingCommission.id}`, data);
      } else {
        await createWithKey('commissions', data);
      }
      setIsDialogOpen(false);
      setEditingCommission(null);
    } catch (error) {
      // Log error for debugging but don't expose to client
    }
  };

  const handleEdit = (commission: Commission) => {
    setEditingCommission(commission);
    setIsDialogOpen(true);
  };

  const handleDelete = async (commissionId: string) => {
    if (confirm('Are you sure you want to delete this commission record?')) {
      try {
        await remove(`commissions/${commissionId}`);
      } catch (error) {
        // Log error for debugging but don't expose to client
      }
    }
  };

  const handleViewDetails = (commission: Commission) => {
    setSelectedCommission(commission);
    setIsDetailSheetOpen(true);
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
    setEditingCommission(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Paid</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'cancelled':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPeriodBadge = (period: string) => {
    const colors = {
      daily: 'bg-blue-100 text-blue-800',
      weekly: 'bg-purple-100 text-purple-800',
      monthly: 'bg-green-100 text-green-800',
      yearly: 'bg-orange-100 text-orange-800'
    };
    return <Badge variant="outline" className={colors[period as keyof typeof colors]}>{period}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${commissionSummary.totalEarnings.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +${commissionSummary.paidAmount.toLocaleString()} paid
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${commissionSummary.pendingAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting payment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Vendors</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{commissionSummary.totalVendors}</div>
            <p className="text-xs text-muted-foreground">
              Earning commissions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Commission Rate</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{commissionSummary.averageCommissionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Across all vendors
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Earning Vendor */}
      {commissionSummary.topEarningVendor && (
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Top Earning Vendor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold">{commissionSummary.topEarningVendor.vendorName}</p>
                <p className="text-sm text-muted-foreground">Highest commission earner</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">
                  ${commissionSummary.topEarningVendor.earnings.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Total earnings</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Actions Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search commissions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Commission
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingCommission ? 'Edit Commission' : 'Add New Commission'}
                </DialogTitle>
                <DialogDescription>
                  {editingCommission ? 'Update commission information' : 'Create a new commission record'}
                </DialogDescription>
              </DialogHeader>
              <CommissionForm
                initialData={editingCommission || undefined}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                isLoading={loading}
                isEditing={!!editingCommission}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Commissions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Commission Records</CardTitle>
          <CardDescription>
            Manage commission earnings and payments for vendors
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading commissions...</div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Sales</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCommissions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        {searchQuery ? 'No commissions found matching your search.' : 'No commissions found.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCommissions.map((commission) => (
                      <TableRow key={commission.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                              <Store className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                              <div className="font-medium">{commission.vendorName || getVendorName(commission.vendorId)}</div>
                              <div className="text-sm text-muted-foreground">{commission.vendorStore || getVendorStore(commission.vendorId)}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-green-600">
                            ${commission.commissionEarned.toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            ${commission.totalSales.toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {commission.commissionRate}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getPeriodBadge(commission.period)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(commission.status)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(commission.createdAt).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(commission)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleEdit(commission)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Commission
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleViewDetails(commission)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <Copy className="mr-2 h-4 w-4" />
                                  Copy ID
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Download className="mr-2 h-4 w-4" />
                                  Export Data
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDelete(commission.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Commission
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Commission Details Sheet */}
      <Sheet open={isDetailSheetOpen} onOpenChange={setIsDetailSheetOpen}>
        <SheetContent className="w-[600px] sm:w-[800px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Commission Details</SheetTitle>
            <SheetDescription>
              Complete information about the selected commission
            </SheetDescription>
          </SheetHeader>
          {selectedCommission && (
            <div className="space-y-6 mt-6">
              {/* Vendor Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Store className="h-5 w-5" />
                    Vendor Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                      <Store className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">
                        {selectedCommission.vendorName || getVendorName(selectedCommission.vendorId)}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Store: {selectedCommission.vendorStore || getVendorStore(selectedCommission.vendorId)}
                      </p>
                      <Badge variant="outline" className="mt-1">
                        Vendor ID: {selectedCommission.vendorId}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Commission Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Commission Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Commission Rate</Label>
                      <p className="text-2xl font-bold text-primary">
                        {selectedCommission.commissionRate}%
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Total Sales</Label>
                      <p className="text-2xl font-bold">
                        ${selectedCommission.totalSales.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Commission Earned</Label>
                      <p className="text-2xl font-bold text-green-600">
                        ${selectedCommission.commissionEarned.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Period</Label>
                      <div className="mt-1">
                        {getPeriodBadge(selectedCommission.period)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Payment Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Status</Label>
                      <div className="mt-1">
                        {getStatusBadge(selectedCommission.status)}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Payment Date</Label>
                      <p className="text-sm text-muted-foreground">
                        {selectedCommission.paymentDate 
                          ? new Date(selectedCommission.paymentDate).toLocaleDateString()
                          : 'Not set'
                        }
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Transaction ID</Label>
                      <p className="text-sm text-muted-foreground">
                        {selectedCommission.transactionId || 'Not provided'}
                      </p>
                    </div>
                  </div>
                  {selectedCommission.notes && (
                    <div>
                      <Label className="text-sm font-medium">Notes</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedCommission.notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Timestamps */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Timestamps
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Created</Label>
                      <p className="text-sm text-muted-foreground">
                        {new Date(selectedCommission.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Updated</Label>
                      <p className="text-sm text-muted-foreground">
                        {new Date(selectedCommission.updatedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
} 