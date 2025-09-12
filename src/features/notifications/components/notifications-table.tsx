'use client';

import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useFirebaseOperations } from '@/hooks/use-firebase-database';
import { 
  Edit, 
  MoreHorizontal, 
  Trash2, 
  Search,
  Bell,
  BellOff,
  Calendar,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  isActive: boolean;
  priority: 'low' | 'medium' | 'high';
  targetAudience: 'all' | 'customers' | 'vendors' | 'staff';
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface NotificationsTableProps {
  notifications: any;
  loading: boolean;
  onEdit: (notification: Notification) => void;
}

export function NotificationsTable({ notifications, loading, onEdit }: NotificationsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState<Notification | null>(null);
  const { update, remove } = useFirebaseOperations();

  // Convert Firebase data to array format
  const notificationsList = useMemo(() => {
    if (!notifications) return [];
    if (Array.isArray(notifications)) {
      return notifications;
    } else if (typeof notifications === 'object' && notifications !== null) {
      return Object.entries(notifications).map(([key, value]) => ({
        ...(value as any),
        id: key,
        key: key
      }));
    }
    return [];
  }, [notifications]);

  // Filter notifications based on search term
  const filteredNotifications = useMemo(() => {
    if (!searchTerm) return notificationsList;
    return notificationsList.filter(notification =>
      notification.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [notificationsList, searchTerm]);

  const handleToggleActive = async (notification: Notification) => {
    try {
      const updatedData = {
        ...notification,
        isActive: !notification.isActive,
        updatedAt: new Date().toISOString()
      };
      await update(`notifications/${notification.id}`, updatedData);
    } catch (error) {
      // Handle error silently or log to a proper logging service in production
      alert('Failed to update notification status');
    }
  };

  const handleDelete = (notification: Notification) => {
    setNotificationToDelete(notification);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!notificationToDelete) return;
    
    try {
      await remove(`notifications/${notificationToDelete.id}`);
      setDeleteDialogOpen(false);
      setNotificationToDelete(null);
    } catch (error) {
      // Handle error silently or log to a proper logging service in production
      alert('Failed to delete notification');
    }
  };

  

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notifications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredNotifications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Bell className="h-8 w-8 text-muted-foreground" />
                    <p className="text-muted-foreground">No notifications found</p>
                    {searchTerm && (
                      <p className="text-sm text-muted-foreground">
                        Try adjusting your search terms
                      </p>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredNotifications.map((notification) => (
                <TableRow key={notification.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={notification.isActive}
                        onCheckedChange={() => handleToggleActive(notification)}
                        disabled={isExpired(notification.expiresAt)}
                      />
                      {notification.isActive ? (
                        <Bell className="h-4 w-4 text-green-600" />
                      ) : (
                        <BellOff className="h-4 w-4 text-gray-400" />
                      )}
                      {isExpired(notification.expiresAt) && (
                        <Badge variant="outline" className="text-red-600 border-red-200">
                          Expired
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {notification.title}
                  </TableCell>
                  <TableCell className="max-w-md">
                    <div className="truncate" title={notification.message}>
                      {notification.message}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {notification.createdAt 
                          ? format(new Date(notification.createdAt), 'MMM dd, yyyy')
                          : 'N/A'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {notification.expiresAt ? (
                      <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>
                          {format(new Date(notification.expiresAt), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Never</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => onEdit(notification)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleToggleActive(notification)}
                          disabled={isExpired(notification.expiresAt)}
                        >
                          {notification.isActive ? (
                            <>
                              <BellOff className="mr-2 h-4 w-4" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <Bell className="mr-2 h-4 w-4" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDelete(notification)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the notification
              &quot;{notificationToDelete?.title}&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
