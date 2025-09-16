'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  getCountries, 
  getCountry, 
  saveCountry, 
  addStateToCountry, 
  removeStateFromCountry,
  addCityToState,
  removeCityFromState,
  updateCityPrice,
  subscribeToCountry,
  subscribeToAllCountries,
  type Country,
  type State,
  type City
} from '@/lib/shipping-database';

// Hook for all countries
export const useAllCountries = () => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToAllCountries(
      (data) => {
        setCountries(data);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  return { countries, loading, error };
};

// Hook for a specific country
export const useCountry = (countryName: string) => {
  const [country, setCountry] = useState<Country | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!countryName) {
      setCountry(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToCountry(
      countryName,
      (data) => {
        setCountry(data);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [countryName]);

  return { country, loading, error };
};

// Hook for shipping operations
export const useShippingOperations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const addState = useCallback(async (countryName: string, stateName: string) => {
    try {
      setLoading(true);
      setError(null);
      await addStateToCountry(countryName, stateName);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to add state');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const removeState = useCallback(async (countryName: string, stateName: string) => {
    try {
      setLoading(true);
      setError(null);
      await removeStateFromCountry(countryName, stateName);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to remove state');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const addCity = useCallback(async (countryName: string, stateName: string, cityName: string, price: number) => {
    try {
      setLoading(true);
      setError(null);
      await addCityToState(countryName, stateName, cityName, price);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to add city');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const removeCity = useCallback(async (countryName: string, stateName: string, cityName: string) => {
    try {
      setLoading(true);
      setError(null);
      await removeCityFromState(countryName, stateName, cityName);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to remove city');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCity = useCallback(async (countryName: string, stateName: string, cityName: string, newPrice: number) => {
    try {
      setLoading(true);
      setError(null);
      await updateCityPrice(countryName, stateName, cityName, newPrice);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update city');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    addState,
    removeState,
    addCity,
    removeCity,
    updateCity,
    loading,
    error
  };
};
