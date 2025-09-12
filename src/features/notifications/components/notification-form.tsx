'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';

import { useFirebaseOperations } from '@/hooks/use-firebase-database';
import { Bell } from 'lucide-react';

interface NotificationFormProps {
  isOpen: boolean;
  onClose: () => void;
  notification?: any;
}

interface NotificationData {
  title: string;
  message: string;
  isActive: boolean;
}

const initialFormData: NotificationData = {
  title: '',
  message: '',
  isActive: true
};

export function NotificationForm({ isOpen, onClose, notification }: NotificationFormProps) {
  const [formData, setFormData] = useState<NotificationData>(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const { createWithKey, update } = useFirebaseOperations();

  // Reset form when modal opens/closes or notification changes
  useEffect(() => {
    if (isOpen) {
      if (notification) {
        setFormData({
          title: notification.title || '',
          message: notification.message || '',
          isActive: notification.isActive ?? true
        });
      } else {
        setFormData(initialFormData);
      }
    }
  }, [isOpen, notification]);

  const handleInputChange = (field: keyof NotificationData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.message.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const notificationData = {
        ...formData,
        updatedAt: new Date().toISOString()
      };

      if (notification) {
        // Update existing notification
        await update(`notifications/${notification.id}`, notificationData);
      } else {
        // Create new notification
        const newNotificationData = {
          ...notificationData,
          createdAt: new Date().toISOString()
        };
        await createWithKey('notifications', newNotificationData);
      }

      onClose();
    } catch (error) {
      // Handle error silently or log to a proper logging service in production
      alert('Failed to save notification. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <Dialog open={isOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {notification ? 'Edit Notification' : 'Create New Notification'}
          </DialogTitle>
          <DialogDescription>
            {notification 
              ? 'Update the notification details below.'
              : 'Create a new notification to announce important information to users.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter notification title..."
              required
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message" className="text-sm font-medium">
              Message <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              placeholder="Enter notification message..."
              rows={4}
              required
            />
            <p className="text-xs text-muted-foreground">
              {formData.message.length}/500 characters
            </p>
          </div>









          {/* Active Status */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Active Status</Label>
              <p className="text-xs text-muted-foreground">
                Enable this notification to make it visible to users
              </p>
            </div>
            <Switch
              checked={formData.isActive}
              onCheckedChange={(checked) => handleInputChange('isActive', checked)}
            />
          </div>

          <DialogFooter className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : notification ? 'Update Notification' : 'Create Notification'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
