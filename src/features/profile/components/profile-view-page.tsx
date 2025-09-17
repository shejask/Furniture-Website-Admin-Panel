'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getCurrentUser } from '@/lib/auth';
import { useEffect, useState } from 'react';
import { User } from '@/lib/auth';

export default function ProfileViewPage() {
  const [user, setUser] = useState<User | null>(null);
  const [localStorageData, setLocalStorageData] = useState<string>('');

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    
    // Debug: Show what's in localStorage
    const storedData = localStorage.getItem('user_data');
    setLocalStorageData(storedData || 'No data found');
  }, []);

  if (!user) {
    return (
      <div className="flex w-full flex-col p-4">
        <div className="text-center">
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='flex w-full flex-col p-4'>
      <div className="max-w-2xl mx-auto w-full space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Your account details and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Name</label>
                <p className="text-sm">{user.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <p className="text-sm">{user.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">User ID</label>
                <p className="text-sm">{user.id}</p>
              </div>
              {user.uniqueId && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Unique ID</label>
                  <p className="text-sm">{user.uniqueId}</p>
                </div>
              )}
              {user.status && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <p className="text-sm capitalize">{user.status}</p>
                </div>
              )}
              {user.storeName && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Store Name</label>
                  <p className="text-sm">{user.storeName}</p>
                </div>
              )}
              {user.phone && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Phone</label>
                  <p className="text-sm">{user.phone}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Debug Section */}
        <Card>
          <CardHeader>
            <CardTitle>Debug Information</CardTitle>
            <CardDescription>
              LocalStorage data for debugging
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Raw localStorage Data:</label>
              <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                {localStorageData}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
