'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  setData, 
  getData, 
  pushData, 
  updateData, 
  deleteData, 
  subscribeToData, 
  queryData,
  batchUpdate 
} from '@/lib/firebase-database';

// Hook for real-time data subscription
export const useFirebaseData = <T = any>(
  path: string,
  options?: {
    transform?: (data: any) => T;
    onError?: (error: any) => void;
  }
) => {
  const [data, setDataState] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToData(
      path,
      (snapshot) => {
        try {
          const transformedData = options?.transform 
            ? options.transform(snapshot)
            : snapshot;
          setDataState(transformedData);
        } catch (err) {
          const error = err instanceof Error ? err : new Error('Data transformation failed');
          setError(error);
          options?.onError?.(error);
        }
        setLoading(false);
      },
      (error) => {
        setError(error);
        setLoading(false);
        options?.onError?.(error);
      }
    );

    return unsubscribe;
  }, [path, options]);

  return { data, loading, error };
};

// Hook for one-time data fetching
export const useFirebaseDataOnce = <T = any>(
  path: string,
  options?: {
    transform?: (data: any) => T;
    onError?: (error: any) => void;
  }
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const snapshot = await getData(path);
      const transformedData = options?.transform 
        ? options.transform(snapshot)
        : snapshot;
      setData(transformedData);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch data');
      setError(error);
      options?.onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [path, options]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

// Hook for querying data with filters
export const useFirebaseQuery = <T = any>(
  path: string,
  queryOptions?: {
    orderBy?: string;
    equalTo?: any;
    limit?: number;
    startAt?: any;
    endAt?: any;
  },
  options?: {
    transform?: (data: any[]) => T[];
    onError?: (error: any) => void;
  }
) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const snapshot = await queryData(path, queryOptions);
      const transformedData = options?.transform 
        ? options.transform(snapshot)
        : snapshot;
      setData(transformedData);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to query data');
      setError(error);
      options?.onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [path, queryOptions, options]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

// Hook for database operations
export const useFirebaseOperations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const create = useCallback(async (path: string, data: any) => {
    try {
      setLoading(true);
      setError(null);
      await setData(path, data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create data');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const createWithKey = useCallback(async (path: string, data: any) => {
    try {
      setLoading(true);
      setError(null);
      const key = await pushData(path, data);
      return key;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create data with key');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const update = useCallback(async (path: string, updates: any) => {
    try {
      setLoading(true);
      setError(null);
      await updateData(path, updates);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update data');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const remove = useCallback(async (path: string) => {
    try {
      console.log('Firebase remove operation starting for path:', path);
      setLoading(true);
      setError(null);
      await deleteData(path);
      console.log('Firebase remove operation completed successfully for path:', path);
    } catch (err) {
      console.error('Firebase remove operation failed for path:', path, err);
      const error = err instanceof Error ? err : new Error('Failed to delete data');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const batch = useCallback(async (updates: { [path: string]: any }) => {
    try {
      setLoading(true);
      setError(null);
      await batchUpdate(updates);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to batch update');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    create,
    createWithKey,
    update,
    remove,
    batch,
    loading,
    error,
  };
}; 