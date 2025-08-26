import { useEffect, useState } from 'react';
import { cacheService } from '@/lib/cache';
import { useAuth } from './useAuth';

interface UseCacheOptions {
  ttl?: number; // Time to live in milliseconds
  autoLoad?: boolean; // Auto load from cache on mount
}

type CacheStore = 'transactions' | 'products' | 'contacts' | 'accounts' | 'categories' | 'tags' | 'scheduled_payments' | 'debts' | 'dashboard_cards';

export function useCache<T>(
  storeName: CacheStore,
  key: string,
  fetchFn: () => Promise<T>,
  options: UseCacheOptions = {}
) {
  const { user } = useAuth();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { ttl, autoLoad = true } = options;

  // Create user-specific cache key
  const cacheKey = user ? `${user.id}:${key}` : key;

  const loadFromCacheOrFetch = async (forceRefresh = false) => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Initialize cache service if needed
      await cacheService.init();

      let cachedData: T | null = null;
      
      if (!forceRefresh) {
        // Try to get from cache first
        cachedData = await cacheService.get(storeName, cacheKey);
      }

      if (cachedData) {
        setData(cachedData);
        setLoading(false);
        return cachedData;
      }

      // If no cache or force refresh, fetch from source
      const freshData = await fetchFn();
      setData(freshData);

      // Save to cache
      await cacheService.set(storeName, cacheKey, freshData, ttl);
      
      return freshData;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Cache operation failed');
      setError(error);
      console.error('Cache error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const invalidateCache = async () => {
    try {
      await cacheService.delete(storeName, cacheKey);
    } catch (err) {
      console.error('Failed to invalidate cache:', err);
    }
  };

  const updateCache = async (newData: T) => {
    try {
      await cacheService.set(storeName, cacheKey, newData, ttl);
      setData(newData);
    } catch (err) {
      console.error('Failed to update cache:', err);
    }
  };

  const refresh = () => loadFromCacheOrFetch(true);

  useEffect(() => {
    if (autoLoad && user) {
      loadFromCacheOrFetch();
    }
  }, [user, cacheKey, autoLoad]);

  return {
    data,
    loading,
    error,
    loadFromCacheOrFetch,
    invalidateCache,
    updateCache,
    refresh,
  };
}

// Specialized hooks for common use cases
export function useCachedTransactions(fetchFn: () => Promise<any[]>) {
  return useCache('transactions', 'list', fetchFn, { ttl: 2 * 60 * 1000 }); // 2 minutes
}

export function useCachedProducts(fetchFn: () => Promise<any[]>) {
  return useCache('products', 'list', fetchFn, { ttl: 5 * 60 * 1000 }); // 5 minutes
}

export function useCachedContacts(fetchFn: () => Promise<any[]>) {
  return useCache('contacts', 'list', fetchFn, { ttl: 10 * 60 * 1000 }); // 10 minutes
}

export function useCachedAccounts(fetchFn: () => Promise<any[]>) {
  return useCache('accounts', 'list', fetchFn, { ttl: 10 * 60 * 1000 }); // 10 minutes
}

export function useCachedCategories(fetchFn: () => Promise<any[]>) {
  return useCache('categories', 'list', fetchFn, { ttl: 15 * 60 * 1000 }); // 15 minutes
}

export function useCachedTags(fetchFn: () => Promise<any[]>) {
  return useCache('tags', 'list', fetchFn, { ttl: 15 * 60 * 1000 }); // 15 minutes
}

export function useCachedScheduledPayments(fetchFn: () => Promise<any[]>) {
  return useCache('scheduled_payments', 'list', fetchFn, { ttl: 5 * 60 * 1000 }); // 5 minutes
}

export function useCachedDebts(fetchFn: () => Promise<any[]>) {
  return useCache('debts', 'list', fetchFn, { ttl: 3 * 60 * 1000 }); // 3 minutes
}