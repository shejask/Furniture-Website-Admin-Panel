import { useState, useEffect } from 'react';
import { getAllOrders, getOrderStatistics } from '@/lib/firebase-orders';
import { Order } from '@/features/orders/utils/form-schema';

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedOrders = await getAllOrders();
      setOrders(fetchedOrders);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch orders'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const refetch = () => {
    fetchOrders();
  };

  return { orders, loading, error, refetch };
}

export function useOrderStatistics() {
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      setError(null);
      const stats = await getOrderStatistics();
      setStatistics(stats);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch order statistics'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, []);

  const refetch = () => {
    fetchStatistics();
  };

  return { statistics, loading, error, refetch };
}
