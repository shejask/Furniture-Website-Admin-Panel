'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import Image from 'next/image';
import { 
  Search, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2, 
  Star,
  User,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  Award,
  Shield,
  MessageSquare,
  Calendar
} from 'lucide-react';
import { useFirebaseOperations } from '@/hooks/use-firebase-database';
import { useProductReviews } from '@/hooks/use-product-reviews';
import { type Review, type ReviewSummary } from '../utils/form-schema';

export function ReviewsTable() {
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedRating, setSelectedRating] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { reviews: allReviews, loading, refetch } = useProductReviews();

  const filteredReviews = useMemo(() => {
    let filtered = allReviews;

    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter((review) => {
        return (
          review.productName?.toLowerCase().includes(searchLower) ||
          review.customerName?.toLowerCase().includes(searchLower) ||
          review.title?.toLowerCase().includes(searchLower) ||
          review.description?.toLowerCase().includes(searchLower) ||
          review.status?.toLowerCase().includes(searchLower)
        );
      });
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter((review) => review.status === selectedStatus);
    }

    // Rating filter
    if (selectedRating !== 'all') {
      const rating = parseInt(selectedRating);
      filtered = filtered.filter((review) => review.rating === rating);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue = a[sortBy as keyof Review];
      let bValue = b[sortBy as keyof Review];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return (aValue ?? '') > (bValue ?? '') ? 1 : -1;
      } else {
        return (aValue ?? '') < (bValue ?? '') ? 1 : -1;
      }
    });

    return filtered;
  }, [allReviews, searchQuery, selectedStatus, selectedRating, sortBy, sortOrder]);

  const reviewSummary: ReviewSummary = useMemo(() => {
    const totalReviews = allReviews.length;
    const totalRating = allReviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalReviews > 0 ? totalRating / totalReviews : 0;
    const pendingReviews = allReviews.filter(review => review.status === 'pending').length;
    const approvedReviews = allReviews.filter(review => review.status === 'approved').length;
    const rejectedReviews = allReviews.filter(review => review.status === 'rejected').length;

    // Find top rated product
    const productStats = allReviews.reduce((acc, review) => {
      if (!acc[review.productId]) {
        acc[review.productId] = {
          productId: review.productId,
          productName: review.productName,
          totalRating: 0,
          reviewCount: 0,
        };
      }
      acc[review.productId].totalRating += review.rating;
      acc[review.productId].reviewCount++;
      return acc;
    }, {} as Record<string, { productId: string; productName: string; totalRating: number; reviewCount: number }>);

    const topRatedProduct = Object.values(productStats)
      .map(product => ({
        ...product,
        averageRating: product.reviewCount > 0 ? product.totalRating / product.reviewCount : 0,
      }))
      .sort((a, b) => b.averageRating - a.averageRating)[0];

    // Find top reviewer
    const customerStats = allReviews.reduce((acc, review) => {
      if (!acc[review.customerId]) {
        acc[review.customerId] = {
          customerId: review.customerId,
          customerName: review.customerName,
          totalRating: 0,
          reviewCount: 0,
        };
      }
      acc[review.customerId].totalRating += review.rating;
      acc[review.customerId].reviewCount++;
      return acc;
    }, {} as Record<string, { customerId: string; customerName: string; totalRating: number; reviewCount: number }>);

    const topReviewer = Object.values(customerStats)
      .map(customer => ({
        ...customer,
        averageRating: customer.reviewCount > 0 ? customer.totalRating / customer.reviewCount : 0,
      }))
      .sort((a, b) => b.reviewCount - a.reviewCount)[0];

    return {
      totalReviews,
      averageRating,
      pendingReviews,
      approvedReviews,
      rejectedReviews,
      topRatedProduct,
      topReviewer,
    };
  }, [allReviews]);

  const { update, remove, loading: operationLoading } = useFirebaseOperations();

  const handleApprove = async (review: Review) => {
    try {
      await update(`products/${review.productId}/reviews/${review.id}`, {
        status: 'approved',
        updatedAt: new Date().toISOString(),
      });
      await refetch();
    } catch (error) {
      console.error('Error approving review:', error);
      alert('Failed to approve review');
    }
  };

  const handleReject = async (review: Review) => {
    try {
      await update(`products/${review.productId}/reviews/${review.id}`, {
        status: 'rejected',
        updatedAt: new Date().toISOString(),
      });
      await refetch();
    } catch (error) {
      console.error('Error rejecting review:', error);
      alert('Failed to reject review');
    }
  };

  const handleDelete = async (review: Review) => {
    if (confirm('Are you sure you want to delete this review?')) {
      try {
        console.log('Deleting review:', review);
        console.log('Delete path:', `products/${review.productId}/reviews/${review.id}`);
        await remove(`products/${review.productId}/reviews/${review.id}`);
        console.log('Review deleted successfully');
        // Refresh the reviews data
        await refetch();
      } catch (error) {
        console.error('Error deleting review:', error);
        alert(`Failed to delete review: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  const handleEdit = async (data: any) => {
    try {
      await update(`products/${editingReview!.productId}/reviews/${editingReview!.id}`, {
        ...data,
        updatedAt: new Date().toISOString(),
      });
      setIsEditDialogOpen(false);
      setEditingReview(null);
    } catch (error) {
      console.error('Error editing review:', error);
      alert('Failed to edit review');
    }
  };

  const handleViewDetails = (review: Review) => {
    setSelectedReview(review);
    setIsDetailDialogOpen(true);
  };

  const handleCancel = () => {
    setIsEditDialogOpen(false);
    setEditingReview(null);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: 'secondary',
      approved: 'default',
      rejected: 'destructive',
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const getRatingStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-sm text-muted-foreground ml-1">({rating})</span>
      </div>
    );
  };

  const getRatingFilterOptions = () => {
    return [
      { value: 'all', label: 'All Ratings' },
      { value: '5', label: '5 Stars' },
      { value: '4', label: '4 Stars' },
      { value: '3', label: '3 Stars' },
      { value: '2', label: '2 Stars' },
      { value: '1', label: '1 Star' },
    ];
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reviewSummary.totalReviews}</div>
            <p className="text-xs text-muted-foreground">
              +{reviewSummary.pendingReviews} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reviewSummary.averageRating.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              {reviewSummary.approvedReviews} approved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Reviews</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reviewSummary.approvedReviews}</div>
            <p className="text-xs text-muted-foreground">
              {reviewSummary.rejectedReviews} rejected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Rated Product</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {reviewSummary.topRatedProduct?.productName || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {reviewSummary.topRatedProduct?.averageRating.toFixed(1) || '0.0'} stars
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Actions Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search reviews..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedRating} onValueChange={setSelectedRating}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Rating" />
            </SelectTrigger>
            <SelectContent>
              {getRatingFilterOptions().map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Date</SelectItem>
              <SelectItem value="rating">Rating</SelectItem>
              <SelectItem value="productName">Product</SelectItem>
              <SelectItem value="customerName">Customer</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortOrder} onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Desc</SelectItem>
              <SelectItem value="asc">Asc</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Reviews Table */}
      <Card>
        <CardHeader>
          <CardTitle>Reviews</CardTitle>
          <CardDescription>
            Manage product reviews and customer feedback
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading reviews...</div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Review</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReviews.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {searchQuery || selectedStatus !== 'all' || selectedRating !== 'all' 
                          ? 'No reviews found matching your filters.' 
                          : 'No reviews found.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredReviews.map((review) => (
                      <TableRow key={review.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {review.productImage ? (
                              <Image
                                src={review.productImage}
                                alt={review.productName}
                                width={40}
                                height={40}
                                className="w-10 h-10 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                                <Package className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium truncate max-w-[150px]" title={review.productName}>
                                {review.productName.length > 20 
                                  ? `${review.productName.substring(0, 20)}...` 
                                  : review.productName
                                }
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {review.verified && <Shield className="inline h-3 w-3 mr-1" />}
                                {review.featured && <Award className="inline h-3 w-3 mr-1" />}
                                {review.verified ? 'Verified' : 'Unverified'}
                                {review.featured && ' • Featured'}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{review.customerName}</div>
                            <div className="text-sm text-muted-foreground">{review.customerEmail}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 max-w-xs">
                            <div className="font-medium">{review.title}</div>
                            <div className="text-sm text-muted-foreground line-clamp-2">
                              {review.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getRatingStars(review.rating)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(review.status)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(review.createdAt).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(review)}
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
                                <DropdownMenuItem onClick={() => {
                                  setEditingReview(review);
                                  setIsEditDialogOpen(true);
                                }}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Review
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleViewDetails(review)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                {review.status === 'pending' && (
                                  <>
                                    <DropdownMenuItem onClick={() => handleApprove(review)}>
                                      <CheckCircle className="mr-2 h-4 w-4" />
                                      Approve
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleReject(review)}>
                                      <XCircle className="mr-2 h-4 w-4" />
                                      Reject
                                    </DropdownMenuItem>
                                  </>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDelete(review)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Review
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

      {/* Edit Review Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Review</DialogTitle>
            <DialogDescription>
              Update review information and status
            </DialogDescription>
          </DialogHeader>
          {editingReview && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Product</Label>
                  <p className="text-sm text-muted-foreground">{editingReview.productName}</p>
                </div>
                <div>
                  <Label>Customer</Label>
                  <p className="text-sm text-muted-foreground">{editingReview.customerName}</p>
                </div>
              </div>

              <div>
                <Label>Title</Label>
                <Input
                  value={editingReview.title}
                  onChange={(e) => setEditingReview({...editingReview, title: e.target.value})}
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={editingReview.description}
                  onChange={(e) => setEditingReview({...editingReview, description: e.target.value})}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Rating</Label>
                  <div className="flex items-center gap-2 mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Button
                        key={star}
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingReview({...editingReview, rating: star})}
                        className={star <= editingReview.rating ? 'text-yellow-400' : 'text-gray-300'}
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select
                    value={editingReview.status}
                    onValueChange={(value) => setEditingReview({...editingReview, status: value as any})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={editingReview.verified}
                    onCheckedChange={(checked) => setEditingReview({...editingReview, verified: checked})}
                  />
                  <Label>Verified Purchase</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={editingReview.featured}
                    onCheckedChange={(checked) => setEditingReview({...editingReview, featured: checked})}
                  />
                  <Label>Featured Review</Label>
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button onClick={() => handleEdit(editingReview)} disabled={operationLoading}>
                  {operationLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Review Details Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Details</DialogTitle>
            <DialogDescription>
              Complete information about the selected review
            </DialogDescription>
          </DialogHeader>
          {selectedReview && (
            <div className="space-y-6 mt-6">
              {/* Product Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Product Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    {selectedReview.productImage ? (
                      <Image
                        src={selectedReview.productImage}
                        alt={selectedReview.productName}
                        width={80}
                        height={80}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center">
                        <Package className="h-10 w-10 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-semibold">{selectedReview.productName}</h3>
                      <div className="flex items-center gap-2 mt-2">
                        {selectedReview.verified && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Shield className="h-3 w-3" />
                            Verified Purchase
                          </Badge>
                        )}
                        {selectedReview.featured && (
                          <Badge variant="default" className="flex items-center gap-1">
                            <Award className="h-3 w-3" />
                            Featured
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Customer Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Customer Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-sm font-medium">Name</Label>
                      <p className="text-sm text-muted-foreground">{selectedReview.customerName}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Email</Label>
                      <p className="text-sm text-muted-foreground">{selectedReview.customerEmail}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Review Content */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Review Content
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Rating</Label>
                    <div className="mt-2">{getRatingStars(selectedReview.rating)}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Title</Label>
                    <p className="text-sm text-muted-foreground mt-1">{selectedReview.title}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Description</Label>
                    <p className="text-sm text-muted-foreground mt-1">{selectedReview.description}</p>
                  </div>
                  
                  {/* Review Images */}
                  {selectedReview.images && selectedReview.images.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium">Review Images</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {selectedReview.images.map((imageUrl, index) => (
                          <Image
                            key={index}
                            src={imageUrl}
                            alt={`Review image ${index + 1}`}
                            width={200}
                            height={150}
                            className="w-full h-24 rounded-lg object-cover border"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Review Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Review Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Status</Label>
                      <div className="mt-1">{getStatusBadge(selectedReview.status)}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Created</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          {new Date(selectedReview.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Updated</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          {new Date(selectedReview.updatedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 