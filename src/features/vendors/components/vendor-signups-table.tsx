'use client';

import { useMemo, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFirebaseData, useFirebaseOperations } from '@/hooks/use-firebase-database';
import { Check, X, Search, Trash2 } from 'lucide-react';

type VendorSignup = {
  id?: string;
  businessName?: string;
  categoryId?: string;
  categoryName?: string;
  email?: string;
  gst?: string;
  mobile?: string;
  pan?: string;
  source?: string;
  status?: 'new' | 'approved' | 'declined';
  timestamp?: string;
};

export function VendorSignupsTable() {
  const { data: raw, loading } = useFirebaseData('vendors_signups');
  const { update, remove } = useFirebaseOperations();
  const [search, setSearch] = useState('');

  const rows = useMemo(() => {
    if (!raw) return [] as VendorSignup[];
    const entries = Object.entries(raw as Record<string, VendorSignup>).map(([id, v]) => ({ id, ...(v || {}) }));
    const q = search.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((v) =>
      [v.businessName, v.email, v.mobile, v.categoryName].some((f) => (f || '').toLowerCase().includes(q))
    );
  }, [raw, search]);

  const formatDate = (iso?: string) => {
    if (!iso) return 'N/A';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return 'N/A';
    return d.toISOString().replace('T', ' ').slice(0, 16);
  };

  const handleApprove = async (id: string | undefined) => {
    if (!id) return;
    await update(`vendors_signups/${id}`, { status: 'approved' });
  };

  const handleDecline = async (id: string | undefined) => {
    if (!id) return;
    await update(`vendors_signups/${id}`, { status: 'declined' });
  };

  const handleDelete = async (id: string | undefined) => {
    if (!id) return;
    if (confirm('Are you sure you want to delete this vendor signup? This action cannot be undone.')) {
      try {
        await remove(`vendors_signups/${id}`);
      } catch (error) {
        console.error('Error deleting vendor signup:', error);
        alert('Failed to delete vendor signup');
      }
    }
  };

  const badgeFor = (status?: VendorSignup['status']) => {
    const variant = status === 'approved' ? 'default' : status === 'declined' ? 'destructive' : 'secondary';
    return <Badge variant={variant as any}>{status || 'new'}</Badge>;
  };

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search signups by name, email, phone, category"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vendor Signups</CardTitle>
          <CardDescription>Review and approve or decline vendor applications</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">Loading signups...</div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {search ? 'No signups match your search.' : 'No vendor signups found.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{s.businessName || '—'}</div>
                            <div className="text-xs text-muted-foreground">GST: {s.gst || '—'} • PAN: {s.pan || '—'}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-sm">
                            <div>{s.email || '—'}</div>
                            <div className="text-muted-foreground">{s.mobile || '—'}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{s.categoryName || '—'}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{s.source || '—'}</div>
                        </TableCell>
                        <TableCell>{badgeFor(s.status)}</TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">{formatDate(s.timestamp)}</div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApprove(s.id)}
                              disabled={s.status === 'approved'}
                            >
                              <Check className="h-4 w-4 mr-1" /> Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDecline(s.id)}
                              disabled={s.status === 'declined'}
                            >
                              <X className="h-4 w-4 mr-1" /> Decline
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(s.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 mr-1" /> Delete
                            </Button>
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
    </div>
  );
}


