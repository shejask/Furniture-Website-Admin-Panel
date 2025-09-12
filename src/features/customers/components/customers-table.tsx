'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Calendar, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Eye,
  Search,
  Filter,
  MoreHorizontal,
  Copy,
  Download,
  Share2
} from 'lucide-react';
import { useFirebaseData, useFirebaseOperations } from '@/hooks/use-firebase-database';
import { format } from 'date-fns';
import { CustomerForm } from './customer-form';
import { type CustomerFormData } from '../utils/form-schema';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface Address {
  id?: string;
  firstName: string;
  lastName: string;
  phone: string;
  addressName: string;
  streetAddress: string;
  city: string;
  state: string;
  country: string;
  zip: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Customer {
  id: string;
  uid: string;
  fullName: string;
  name: string;
  email: string;
  phone: number;
  country_code: string;
  addresses?: { [key: string]: Address };
  status?: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

export function CustomersTable() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);
  const [formData, setFormData] = useState<CustomerFormData>({
    uid: '',
    fullName: '',
    name: '',
    email: '',
    phone: '',
    country_code: '91',
    status: 'active',
    addresses: {}
  });

  const { data: customers, loading } = useFirebaseData('customers');
  const { createWithKey, update, remove, loading: operationLoading } = useFirebaseOperations();

  // Filter customers based on search query
  const filteredCustomers = useMemo(() => {
    if (!customers) return [];
    
    return Object.entries(customers).filter(([, customer]: [string, any]) => {
      const query = searchQuery.toLowerCase();
      return (
        customer.fullName?.toLowerCase().includes(query) ||
        customer.name?.toLowerCase().includes(query) ||
        customer.email?.toLowerCase().includes(query) ||
        customer.uid?.toLowerCase().includes(query) ||
        customer.phone?.toString().includes(query)
      );
    });
  }, [customers, searchQuery]);



  const handleSubmit = async (data: CustomerFormData) => {
    try {
      const customerData = {
        uid: data.uid || '',
        fullName: data.fullName,
        name: data.name,
        email: data.email.toLowerCase(),
        phone: typeof data.phone === 'string' ? parseInt(data.phone) || 0 : data.phone || 0,
        country_code: data.country_code || '91',
        status: data.status || 'active',
        addresses: data.addresses || {},
        createdAt: editingCustomer ? editingCustomer.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLogin: editingCustomer ? editingCustomer.lastLogin : new Date().toISOString()
      };

      if (editingCustomer) {
        await update(`customers/${editingCustomer.id}`, customerData);
      } else {
        await createWithKey('customers', customerData);
      }

      handleCloseDialog();
    } catch (error) {
      // Log error for debugging but don't expose to client
      const message = error instanceof Error ? error.message : 'Failed to save customer';
      alert(message);
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      uid: customer.uid,
      fullName: customer.fullName,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      country_code: customer.country_code,
      status: customer.status,
      addresses: customer.addresses || {}
    });
    setIsDialogOpen(true);
  };

  const handleViewDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDetailSheetOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this customer?')) {
      try {
        await remove(`customers/${id}`);
      } catch (error) {
        // Log error for debugging but don't expose to client
      }
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCustomer(null);
    setFormData({
      uid: '',
      fullName: '',
      name: '',
      email: '',
      phone: '',
      country_code: '91',
      status: 'active',
      addresses: {}
    });
  };

  const getStatusBadge = (status?: string) => {
    const colors = {
      'active': 'bg-green-100 text-green-800',
      'inactive': 'bg-red-100 text-red-800'
    };
    
    const actualStatus = status || 'active'; // Default to active if no status
    const colorClass = colors[actualStatus as keyof typeof colors] || colors.active;
    
    return (
      <Badge variant="outline" className={colorClass}>
        {actualStatus.charAt(0).toUpperCase() + actualStatus.slice(1)}
      </Badge>
    );
  };

  const formatPhone = (phone: number | string | null | undefined, countryCode?: string) => {
    // Handle null, undefined, or empty values
    if (phone === null || phone === undefined) {
      return '-';
    }
    
    // Convert to string if it's a number
    const phoneStr = phone.toString();
    
    // Handle empty string
    if (phoneStr.trim() === '') {
      return '-';
    }
    
    // Use provided country code or default to 91
    const code = countryCode || '91';
    
    // Add country code if not present
    if (!phoneStr.startsWith('+')) {
      return `+${code} ${phoneStr}`;
    }
    return phoneStr;
  };

  return (
    <div className="space-y-6">
      {/* Search and Actions Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Customer
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingCustomer ? 'Edit Customer' : 'Add Customer'}
                </DialogTitle>
                <DialogDescription>
                  {editingCustomer 
                    ? 'Update the customer details below.'
                    : 'Create a new customer with all necessary information.'
                  }
                </DialogDescription>
              </DialogHeader>
              <CustomerForm
                initialData={editingCustomer ? formData : undefined}
                onSubmit={handleSubmit}
                onCancel={handleCloseDialog}
                isLoading={operationLoading}
                isEditing={!!editingCustomer}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Customers</CardTitle>
          <CardDescription>
            A list of all customers and their contact information
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredCustomers.length > 0 ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredCustomers.length} of {Object.keys(customers || {}).length} customers
                </p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>UID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map(([id, customer]: [string, any]) => (
                    <TableRow key={id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="font-mono text-sm font-medium">
                          {customer.uid}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{customer.fullName || customer.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {customer.fullName && customer.name && customer.fullName !== customer.name ? customer.name : ''}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{customer.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{formatPhone(customer.phone, customer.country_code)}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(customer.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails({ ...customer, id })}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit({ ...customer, id })}
                            title="Edit Customer"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleViewDetails({ ...customer, id })}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit({ ...customer, id })}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Customer
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
                              <DropdownMenuItem>
                                <Share2 className="mr-2 h-4 w-4" />
                                Share
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDelete(id)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Customer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>
                {searchQuery 
                  ? `No customers found matching "${searchQuery}"` 
                  : 'No customers found. Create your first customer to get started.'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customer Details Sheet */}
      <Sheet open={isDetailSheetOpen} onOpenChange={setIsDetailSheetOpen}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Customer Details</SheetTitle>
            <SheetDescription>
              Complete information about the customer
            </SheetDescription>
          </SheetHeader>
          {selectedCustomer && (
            <div className="space-y-6 mt-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">UID</Label>
                    <p className="font-mono text-sm font-medium">{selectedCustomer.uid || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedCustomer.status)}</div>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs text-muted-foreground">Full Name</Label>
                    <p className="font-medium">{selectedCustomer.fullName}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs text-muted-foreground">Email</Label>
                    <p className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {selectedCustomer.email}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs text-muted-foreground">Phone</Label>
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      {formatPhone(selectedCustomer.phone)}
                    </p>
                  </div>
                  
                </div>
              </div>

              {/* Address Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Address Information
                </h3>
                <div className="space-y-3">
                  {selectedCustomer.addresses && Object.keys(selectedCustomer.addresses).length > 0 ? (
                    Object.entries(selectedCustomer.addresses as Record<string, Address>).map(([addrId, address]) => (
                      <div key={addrId} className="border rounded p-3">
                        <div className="font-medium text-sm">{address.addressName}</div>
                        <div className="text-sm text-muted-foreground">{address.firstName} {address.lastName} • {address.phone}</div>
                        <div className="text-sm">{address.streetAddress}, {address.city}, {address.state}, {address.country} - {address.zip}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground">No addresses available</div>
                  )}
                </div>
              </div>

              

              {/* Timestamps */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Timestamps
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Created At</Label>
                    <p className="text-sm">{format(new Date(selectedCustomer.createdAt), 'MMM dd, yyyy HH:mm')}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Last Updated</Label>
                    <p className="text-sm">{format(new Date(selectedCustomer.updatedAt), 'MMM dd, yyyy HH:mm')}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button 
                  onClick={() => {
                    handleEdit(selectedCustomer);
                    setIsDetailSheetOpen(false);
                  }}
                  className="flex-1"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Customer
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(selectedCustomer.uid || '');
                  }}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy UID
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
} 