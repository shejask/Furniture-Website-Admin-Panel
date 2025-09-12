'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFirebaseData } from '@/hooks/use-firebase-database';
import { NotificationsTable } from './notifications-table';
import { NotificationForm } from './notification-form';
import { Breadcrumbs } from '@/components/breadcrumbs';



export default function NotificationsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingNotification, setEditingNotification] = useState(null);
  const { data: notifications, loading } = useFirebaseData('notifications');

  const handleAddNew = () => {
    setEditingNotification(null);
    setIsFormOpen(true);
  };

  const handleEdit = (notification: any) => {
    setEditingNotification(notification);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingNotification(null);
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Breadcrumbs />
      
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Notifications</h2>
          <p className="text-muted-foreground">
            Manage system notifications and announcements for users
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={handleAddNew}>
            <Plus className="mr-2 h-4 w-4" />
            Add Notification
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>All Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <NotificationsTable 
              notifications={notifications} 
              loading={loading}
              onEdit={handleEdit}
            />
          </CardContent>
        </Card>
      </div>

      {/* Notification Form Sheet */}
      <NotificationForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        notification={editingNotification}
      />
    </div>
  );
}
