import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Order } from '../utils/form-schema';
import { CheckCircle, Package, DollarSign, User, MapPin } from 'lucide-react';

interface ConfirmOrderDialogProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (order: Order, notes?: string) => Promise<void>;
  isLoading?: boolean;
}

export function ConfirmOrderDialog({
  order,
  isOpen,
  onClose,
  onConfirm,
  isLoading = false
}: ConfirmOrderDialogProps) {
  const [notes, setNotes] = useState('');

  const handleConfirm = async () => {
    if (!order) return;
    
    await onConfirm(order, notes);
    handleClose();
  };

  const handleClose = () => {
    setNotes('');
    onClose();
  };

  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Confirm Order
          </DialogTitle>
          <DialogDescription>
            You are about to confirm order <strong>{order.orderId}</strong> for{' '}
            <strong>{order.address?.firstName} {order.address?.lastName}</strong>. This will approve the order for processing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted p-3 rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-medium text-sm">Customer Info</h4>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>{order.address?.firstName} {order.address?.lastName}</div>
                <div>{order.userEmail}</div>
                <div>{order.address?.phone}</div>
              </div>
            </div>

            <div className="bg-muted p-3 rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-medium text-sm">Order Total</h4>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>Subtotal: ₹{order.subtotal.toFixed(2)}</div>
                <div>Shipping: ₹{order.shipping.toFixed(2)}</div>
                <div>Discount: -₹{order.discount.toFixed(2)}</div>
                <div className="font-semibold pt-1 border-t">
                  Total: ₹{order.total.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-muted p-3 rounded-md">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <h4 className="font-medium text-sm">Shipping Address</h4>
            </div>
            <div className="text-sm text-muted-foreground">
              {order.address.streetAddress || order.address.street}, {order.address.city},{' '}
              {order.address.state} {order.address.zip || order.address.postalCode},{' '}
              {order.address.country}
            </div>
          </div>

          <div className="bg-muted p-3 rounded-md">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <h4 className="font-medium text-sm">Products ({order.items.length})</h4>
            </div>
            <div className="text-sm text-muted-foreground space-y-1 max-h-32 overflow-y-auto">
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between">
                  <span>
                    {item.name} x{item.quantity}
                  </span>
                  <span>₹{(item.total || (item.price * item.quantity)).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Confirmation Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about the order confirmation..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? 'Confirming...' : 'Confirm Order'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
