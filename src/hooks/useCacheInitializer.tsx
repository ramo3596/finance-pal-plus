import { useEffect, useState } from 'react';
import { cacheService } from '@/lib/cache';
import { useAuth } from './useAuth';

export const useCacheInitializer = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const initializeCache = async () => {
      if (!user) {
        setIsLoading(false);
        setIsInitialized(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // Initialize the cache service
        await cacheService.init();
        
        // Check if we have cached data
        const cachedTransactions = await cacheService.get('transactions');
        const cachedAccounts = await cacheService.get('accounts');
        const cachedCategories = await cacheService.get('categories');
        const cachedContacts = await cacheService.get('contacts');
        const cachedDebts = await cacheService.get('debts');
        
        // If we have some cached data, consider the cache initialized
        const hasCachedData = (
          cachedTransactions.length > 0 ||
          cachedAccounts.length > 0 ||
          cachedCategories.length > 0 ||
          cachedContacts.length > 0 ||
          cachedDebts.length > 0
        );
        
        setIsInitialized(hasCachedData);
        console.log('Cache initialization completed:', {
          hasCachedData,
          transactions: cachedTransactions.length,
          accounts: cachedAccounts.length,
          categories: cachedCategories.length,
          contacts: cachedContacts.length,
          debts: cachedDebts.length
        });
        
      } catch (error) {
        console.error('Error initializing cache:', error);
        setIsInitialized(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeCache();
  }, [user]);

  return {
    isInitialized,
    isLoading
  };
};