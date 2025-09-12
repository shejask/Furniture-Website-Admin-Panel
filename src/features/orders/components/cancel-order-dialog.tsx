import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Order } from '../utils/form-schema';
import { OrderActionManager } from '../utils/order-actions';
import { AlertTriangle } from 'lucide-react';

interface CancelOrderDialogProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (order: Order, reason: string, additionalDetails?: string) => Promise<void>;
  isLoading?: boolean;
}

export function CancelOrderDialog({
  order,
  isOpen,
  onClose,
  onConfirm,
  isLoading = false
}: CancelOrderDialogProps) {
  const [reason, setReason] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');

  const handleConfirm = async () => {
    if (!order || !reason) return;
    
    await onConfirm(order, reason, additionalDetails);
    handleClose();
  };

  const handleClose = () => {
    setReason('');
    setAdditionalDetails('');
    onClose();
  };

  if (!order) return null;

  const cancellationReasons = OrderActionManager.getCancellationReasons();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Cancel Order
          </DialogTitle>
          <DialogDescription>
            You are about to cancel order <strong>{order.orderNumber}</strong> for{' '}
            <strong>{order.customerName}</strong>. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Cancellation Reason *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason for cancellation" />
              </SelectTrigger>
              <SelectContent>
                {cancellationReasons.map((reasonOption) => (
                  <SelectItem key={reasonOption} value={reasonOption}>
                    {reasonOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="details">Additional Details (Optional)</Label>
            <Textarea
              id="details"
              placeholder="Add any additional information about the cancellation..."
              value={additionalDetails}
              onChange={(e) => setAdditionalDetails(e.target.value)}
              rows={3}
            />
          </div>

          <div className="bg-muted p-3 rounded-md">
            <h4 className="font-medium text-sm mb-2">Order Details:</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <div>Order Number: {order.orderNumber}</div>
              <div>Customer: {order.customerName}</div>
              <div>Total: ₹{order.total.toFixed(2)}</div>
              <div>Status: {order.status}</div>
              <div>Created: {new Date(order.createdAt).toLocaleDateString()}</div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Keep Order
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!reason || isLoading}
          >
            {isLoading ? 'Cancelling...' : 'Cancel Order'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
