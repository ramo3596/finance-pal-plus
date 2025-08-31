import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

type CacheKey = 'transactions' | 'contacts' | 'products' | 'scheduled_payments' | 'debts' | 'debt_payments' | 'accounts' | 'categories' | 'tags' | 'templates' | 'filters' | 'user_settings' | 'subcategories';

interface CacheData {
  data: any[];
  lastUpdated: number;
}

export const useLocalCache = () => {
  const { user } = useAuth();
  const [realtimeChannels, setRealtimeChannels] = useState<any[]>([]);

  // Get cache key with user ID
  const getCacheKey = (key: CacheKey): string => {
    return `${key}_${user?.id || 'anonymous'}`;
  };

  // Get cached data
  const getCachedData = (key: CacheKey): any[] => {
    if (!user) return [];
    
    try {
      const cached = localStorage.getItem(getCacheKey(key));
      if (cached) {
        const cacheData: CacheData = JSON.parse(cached);
        return cacheData.data;
      }
    } catch (error) {
      console.error(`Error reading cache for ${key}:`, error);
    }
    return [];
  };

  // Set cached data
  const setCachedData = (key: CacheKey, data: any[]): void => {
    if (!user) return;
    
    try {
      const cacheData: CacheData = {
        data,
        lastUpdated: Date.now()
      };
      localStorage.setItem(getCacheKey(key), JSON.stringify(cacheData));
    } catch (error) {
      console.error(`Error setting cache for ${key}:`, error);
    }
  };

  // Check if cache is fresh (less than 5 minutes old)
  const isCacheFresh = (key: CacheKey): boolean => {
    if (!user) return false;
    
    try {
      const cached = localStorage.getItem(getCacheKey(key));
      if (cached) {
        const cacheData: CacheData = JSON.parse(cached);
        const fiveMinutes = 5 * 60 * 1000;
        return (Date.now() - cacheData.lastUpdated) < fiveMinutes;
      }
    } catch (error) {
      console.error(`Error checking cache freshness for ${key}:`, error);
    }
    return false;
  };

  // Fetch data from Supabase with caching
  const fetchWithCache = async (
    key: CacheKey,
    queryFn: () => Promise<any[]>,
    forceRefresh = false
  ): Promise<any[]> => {
    // Return cached data if fresh and not forcing refresh
    if (!forceRefresh && isCacheFresh(key)) {
      const cached = getCachedData(key);
      if (cached.length > 0) {
        return cached;
      }
    }

    try {
      const data = await queryFn();
      setCachedData(key, data);
      return data;
    } catch (error) {
      console.error(`Error fetching ${key}:`, error);
      // Return cached data as fallback
      return getCachedData(key);
    }
  };

  // Set up realtime subscriptions
  const setupRealtimeSubscriptions = useCallback(() => {
    if (!user) return;

    // Clean up existing channels
    realtimeChannels.forEach(channel => {
      supabase.removeChannel(channel);
    });

    const tables: CacheKey[] = [
      'transactions', 'contacts', 'products', 'scheduled_payments', 
      'debts', 'debt_payments', 'accounts', 'categories', 'tags', 
      'templates', 'filters', 'user_settings', 'subcategories'
    ];

    const newChannels = tables.map(table => {
      const channel = supabase
        .channel(`${table}_changes_${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: table,
            filter: table === 'subcategories' ? undefined : `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log(`Realtime update for ${table}:`, payload);
            
            // Update local cache based on the change
            const cachedData = getCachedData(table);
            let updatedData = [...cachedData];

            switch (payload.eventType) {
              case 'INSERT':
                // Only add if it belongs to current user or is a subcategory
                if (table === 'subcategories' || payload.new.user_id === user.id) {
                  updatedData.push(payload.new);
                }
                break;
              case 'UPDATE':
                if (table === 'subcategories' || payload.new.user_id === user.id) {
                  updatedData = updatedData.map(item => 
                    item.id === payload.new.id ? payload.new : item
                  );
                }
                break;
              case 'DELETE':
                updatedData = updatedData.filter(item => item.id !== payload.old.id);
                break;
            }

            setCachedData(table, updatedData);
            
            // Trigger custom events for hooks to listen to
            window.dispatchEvent(new CustomEvent(`cache_updated_${table}`, {
              detail: { data: updatedData, payload }
            }));
          }
        )
        .subscribe();

      return channel;
    });

    setRealtimeChannels(newChannels);
  }, [user]);

  // Set up subscriptions when user changes
  useEffect(() => {
    setupRealtimeSubscriptions();
    
    return () => {
      realtimeChannels.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, [setupRealtimeSubscriptions]);

  // Clear all cached data (useful for logout)
  const clearCache = () => {
    if (!user) return;
    
    const tables: CacheKey[] = [
      'transactions', 'contacts', 'products', 'scheduled_payments', 
      'debts', 'debt_payments', 'accounts', 'categories', 'tags', 
      'templates', 'filters', 'user_settings', 'subcategories'
    ];

    tables.forEach(table => {
      localStorage.removeItem(getCacheKey(table));
    });
  };

  return {
    getCachedData,
    setCachedData,
    isCacheFresh,
    fetchWithCache,
    clearCache
  };
};