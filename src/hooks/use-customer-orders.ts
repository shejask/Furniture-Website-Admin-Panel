import { useState, useEffect } from 'react';
import { getCustomerOrders } from '@/lib/firebase-orders';
import { Order } from '@/features/orders/utils/form-schema';

export function useCustomerOrders(userId: string) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchOrders = async () => {
    if (!userId) {
      setOrders([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const fetchedOrders = await getCustomerOrders(userId);
      setOrders(fetchedOrders);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch customer orders'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [userId]);

  const refetch = () => {
    fetchOrders();
  };

  return { orders, loading, error, refetch };
}
