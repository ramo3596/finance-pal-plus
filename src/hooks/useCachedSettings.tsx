import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { useCachedAccounts, useCachedCategories, useCachedTags, useCache } from './useCache';

// Types from useSettings
export interface Account {
  id: string;
  user_id: string;
  name: string;
  balance: number;
  icon: string;
  color: string;
  account_number?: string;
  payment_method_id?: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  nature: 'income' | 'expense';
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  icon: string;
  created_at: string;
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  color: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Template {
  id: string;
  user_id: string;
  name: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  account_id?: string;
  category_id?: string;
  beneficiary?: string;
  note?: string;
  payment_method?: string;
  created_at: string;
  updated_at: string;
}

export interface Filter {
  id: string;
  user_id: string;
  name: string;
  type: 'income' | 'expense' | 'all';
  payment_method: string;
  transfers: string;
  debts: string;
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  income: boolean;
  debts: boolean;
  scheduled_payments: boolean;
  wallet_reminder: boolean;
  created_at: string;
  updated_at: string;
}

export function useCachedSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  // Individual cached data fetchers
  const fetchAccountsFromDB = async (): Promise<Account[]> => {
    if (!user) return [];
    
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', user.id)
      .order('display_order');

    if (error) throw error;
    return (data || []) as Account[];
  };

  const fetchCategoriesFromDB = async (): Promise<Category[]> => {
    if (!user) return [];
    
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .order('display_order');

    if (error) throw error;
    return (data || []) as Category[];
  };

  const fetchTagsFromDB = async (): Promise<Tag[]> => {
    if (!user) return [];
    
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .eq('user_id', user.id)
      .order('display_order');

    if (error) throw error;
    return (data || []) as Tag[];
  };

  const fetchTemplatesFromDB = async (): Promise<Template[]> => {
    if (!user) return [];
    
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('user_id', user.id);

    if (error) throw error;
    return (data || []) as Template[];
  };

  const fetchFiltersFromDB = async (): Promise<Filter[]> => {
    if (!user) return [];
    
    const { data, error } = await supabase
      .from('filters')
      .select('*')
      .eq('user_id', user.id);

    if (error) throw error;
    return (data || []) as Filter[];
  };

  const fetchUserSettingsFromDB = async (): Promise<UserSettings | null> => {
    if (!user) return null;
    
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  };

  const fetchSubcategoriesFromDB = async (): Promise<Subcategory[]> => {
    if (!user) return [];
    
    const { data, error } = await supabase
      .from('subcategories')
      .select(`
        *,
        categories!inner(user_id)
      `)
      .eq('categories.user_id', user.id);

    if (error) throw error;
    return data || [];
  };

  // Use cached hooks
  const cachedAccounts = useCachedAccounts(fetchAccountsFromDB);
  const cachedCategories = useCachedCategories(fetchCategoriesFromDB);
  const cachedTags = useCachedTags(fetchTagsFromDB);
  const cachedTemplates = useCache('dashboard_cards', 'templates', fetchTemplatesFromDB, { ttl: 10 * 60 * 1000 });
  const cachedFilters = useCache('dashboard_cards', 'filters', fetchFiltersFromDB, { ttl: 15 * 60 * 1000 });
  const cachedUserSettings = useCache('dashboard_cards', 'user_settings', fetchUserSettingsFromDB, { ttl: 30 * 60 * 1000 });
  const cachedSubcategories = useCache('dashboard_cards', 'subcategories', fetchSubcategoriesFromDB, { ttl: 15 * 60 * 1000 });

  // Extract data
  const accounts = cachedAccounts.data || [];
  const categories = cachedCategories.data || [];
  const tags = cachedTags.data || [];
  const templates = cachedTemplates.data || [];
  const filters = cachedFilters.data || [];
  const userSettings = cachedUserSettings.data;
  const subcategories = cachedSubcategories.data || [];

  // Combined loading state
  const isLoading = loading || 
    cachedAccounts.loading || 
    cachedCategories.loading || 
    cachedTags.loading ||
    cachedTemplates.loading ||
    cachedFilters.loading ||
    cachedUserSettings.loading ||
    cachedSubcategories.loading;

  const refetch = async () => {
    await Promise.all([
      cachedAccounts.refresh(),
      cachedCategories.refresh(),
      cachedTags.refresh(),
      cachedTemplates.refresh(),
      cachedFilters.refresh(),
      cachedUserSettings.refresh(),
      cachedSubcategories.refresh(),
    ]);
  };

  // CRUD operations with cache updates
  const createAccount = async (accountData: Omit<Account, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('accounts')
        .insert([{
          ...accountData,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      // Update cache
      const newAccounts = [...accounts, data];
      await cachedAccounts.updateCache(newAccounts);

      toast.success('Cuenta creada exitosamente');
      return data;
    } catch (error) {
      console.error('Error creating account:', error);
      toast.error('Error al crear la cuenta');
      throw error;
    }
  };

  const updateAccount = async (id: string, updates: Partial<Account>) => {
    try {
      const { error } = await supabase
        .from('accounts')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      // Update cache
      const updatedAccounts = accounts.map(a => a.id === id ? { ...a, ...updates } : a);
      await cachedAccounts.updateCache(updatedAccounts);

      toast.success('Cuenta actualizada');
    } catch (error) {
      console.error('Error updating account:', error);
      toast.error('Error al actualizar la cuenta');
      throw error;
    }
  };

  const deleteAccount = async (id: string) => {
    try {
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update cache
      const updatedAccounts = accounts.filter(a => a.id !== id);
      await cachedAccounts.updateCache(updatedAccounts);

      toast.success('Cuenta eliminada');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Error al eliminar la cuenta');
      throw error;
    }
  };

  useEffect(() => {
    if (user) {
      setLoading(false);
    }
  }, [user]);

  return {
    accounts,
    categories,
    tags,
    templates,
    filters,
    userSettings,
    subcategories,
    loading: isLoading,
    refetch,
    createAccount,
    updateAccount,
    deleteAccount,
    // Add other CRUD operations as needed
  };
}