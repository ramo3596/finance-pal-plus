
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { cacheService } from '@/lib/cache';

export interface Account {
  id: string;
  name: string;
  color: string;
  icon: string;
  balance: number;
  account_number?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  nature: string;
  subcategories?: Subcategory[];
  created_at?: string;
  updated_at?: string;
}

export interface Subcategory {
  id: string;
  name: string;
  category_id: string;
  icon: string;
  created_at?: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  created_at?: string;
  updated_at?: string;
}

export interface Template {
  id: string;
  name: string;
  amount: number;
  account_id?: string;
  category_id?: string;
  payment_method?: string;
  type: string;
  beneficiary?: string;
  note?: string;
  created_at?: string;
  updated_at?: string;
  tags?: Tag[];
  tag_ids?: string[];
}

export interface Filter {
  id: string;
  name: string;
  type: string;
  payment_method?: string;
  transfers?: string;
  debts?: string;
  created_at?: string;
  updated_at?: string;
  categories?: Category[];
  tags?: Tag[];
}

export interface UserSettings {
  id: string;
  wallet_reminder: boolean;
  scheduled_payments: boolean;
  debts: boolean;
  income: boolean;
  card_reminders?: boolean;
  inventory_alerts?: boolean;
  contact_notifications?: boolean;
  reports_notifications?: boolean;
  system_updates?: boolean;
  security_alerts?: boolean;
  created_at?: string;
  updated_at?: string;
}

export const useSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filters, setFilters] = useState<Filter[]>([]);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch all data from cache
  const fetchData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Load all data from cache with individual error handling
      const accountsData = await cacheService.get('accounts').catch(err => {
        console.warn('Error loading accounts from cache:', err);
        return [];
      });
      
      const categoriesData = await cacheService.get('categories').catch(err => {
        console.warn('Error loading categories from cache:', err);
        return [];
      });
      
      const tagsData = await cacheService.get('tags').catch(err => {
        console.warn('Error loading tags from cache:', err);
        return [];
      });
      
      const templatesData = await cacheService.get('templates').catch(err => {
        console.warn('Error loading templates from cache:', err);
        return [];
      });
      
      const filtersData = await cacheService.get('filters').catch(err => {
        console.warn('Error loading filters from cache:', err);
        return [];
      });
      
      // Filter data by user_id and sort
      const userAccounts = accountsData
        .filter(a => a.user_id === user.id)
        .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
        
      const userCategories = categoriesData
        .filter(c => c.user_id === user.id)
        .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
        .map(category => ({
          ...category,
          subcategories: category.subcategories?.map((subcategory: any) => ({
            ...subcategory,
            icon: subcategory.icon || '📦'
          })) || []
        }));
        
      const userTags = tagsData
        .filter(t => t.user_id === user.id)
        .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
        
      const userTemplates = templatesData
        .filter(t => t.user_id === user.id)
        .map(template => ({
          ...template,
          tags: template.tags || []
        }));
        
      const userFilters = filtersData.filter(f => f.user_id === user.id);
      
      // For user settings, we'll need to handle this differently since it's not in cache yet
      // For now, we'll set it to null and it will be loaded during sync
      
      setAccounts(userAccounts);
      setCategories(userCategories);
      setTags(userTags);
      setTemplates(userTemplates);
      setFilters(userFilters);
      setUserSettings(null); // Will be loaded during sync
    } catch (error) {
      console.error('Error loading settings data from cache:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de configuración desde caché.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper function to fetch categories
  const fetchCategories = async (): Promise<Category[]> => {
    if (!user) return []
    
    const { data } = await supabase
      .from('categories')
      .select(`
        *,
        subcategories (*)
      `)
      .eq('user_id', user.id)
      .order('display_order', { ascending: true })
    
    return data?.map(category => ({
      ...category,
      subcategories: category.subcategories?.map((subcategory: any) => ({
        ...subcategory,
        icon: subcategory.icon || '📦'
      })) || []
    })) || []
  }

  // Removed initializeDebtCategories function to prevent duplicate category creation
  // Categories are now created on-demand by the useDebts hook when needed

  useEffect(() => {
    if (user) {
      fetchData()
      // Removed initializeDebtCategories() call to prevent duplicate category creation
      // Categories will be created on-demand by useDebts hook when needed
    }
  }, [user]);

  // Account CRUD operations
  const createAccount = async (account: Omit<Account, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;
    
    try {
      const newAccount = {
        ...account,
        id: crypto.randomUUID(),
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Update local state
      setAccounts(prev => [...prev, newAccount]);
      
      // Update cache and register pending change
      await cacheService.updateCacheItem('accounts', newAccount);
      await cacheService.addPendingChange({
        table: 'accounts',
        record_id: newAccount.id,
        operation: 'create',
        data: newAccount
      });

      toast({
        title: "Éxito",
        description: "Cuenta creada exitosamente.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear la cuenta.",
        variant: "destructive",
      });
    }
  };

  const updateAccount = async (id: string, updates: Partial<Account>) => {
    try {
      const updatedAccount = {
        ...accounts.find(a => a.id === id),
        ...updates,
        updated_at: new Date().toISOString()
      };

      // Update local state
      setAccounts(prev => prev.map(item => item.id === id ? updatedAccount : item));
      
      // Update cache and register pending change
      await cacheService.updateCacheItem('accounts', updatedAccount);
      await cacheService.addPendingChange({
        table: 'accounts',
        record_id: id,
        operation: 'update',
        data: updatedAccount
      });

      toast({
        title: "Éxito",
        description: "Cuenta actualizada exitosamente.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la cuenta.",
        variant: "destructive",
      });
    }
  };

  const deleteAccount = async (id: string) => {
    try {
      // Update local state
      setAccounts(prev => prev.filter(item => item.id !== id));
      
      // Remove from cache and register pending change
      await cacheService.deleteCacheItem('accounts', id);
      await cacheService.addPendingChange({
        table: 'accounts',
        record_id: id,
        operation: 'delete'
      });

      toast({
        title: "Éxito",
        description: "Cuenta eliminada exitosamente.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la cuenta.",
        variant: "destructive",
      });
    }
  };

  // Category CRUD operations
  const createCategory = async (category: Omit<Category, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) return null;
    
    try {
      const newCategory = {
        ...category,
        id: crypto.randomUUID(),
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        subcategories: []
      };

      // Update local state
      setCategories(prev => [...prev, newCategory]);
      
      // Update cache and register pending change
      await cacheService.updateCacheItem('categories', newCategory);
      await cacheService.addPendingChange({
        table: 'categories',
        record_id: newCategory.id,
        operation: 'create',
        data: newCategory
      });

      toast({
        title: "Éxito",
        description: "Categoría creada exitosamente.",
      });
      return newCategory as Category;
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear la categoría.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    try {
      const updatedCategory = {
        ...categories.find(c => c.id === id),
        ...updates,
        updated_at: new Date().toISOString()
      };

      // Update local state
      setCategories(prev => prev.map(item => item.id === id ? updatedCategory : item));
      
      // Update cache and register pending change
      await cacheService.updateCacheItem('categories', updatedCategory);
      await cacheService.addPendingChange({
        table: 'categories',
        record_id: id,
        operation: 'update',
        data: updatedCategory
      });

      toast({
        title: "Éxito",
        description: "Categoría actualizada exitosamente.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la categoría.",
        variant: "destructive",
      });
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      // Update local state
      setCategories(prev => prev.filter(item => item.id !== id));
      
      // Remove from cache and register pending change
      await cacheService.deleteCacheItem('categories', id);
      await cacheService.addPendingChange({
        table: 'categories',
        record_id: id,
        operation: 'delete'
      });

      toast({
        title: "Éxito",
        description: "Categoría eliminada exitosamente.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la categoría.",
        variant: "destructive",
      });
    }
  };

  // Subcategory CRUD operations
  const createSubcategory = async (subcategory: Omit<Subcategory, 'id' | 'created_at'>) => {
    try {
      const newSubcategory = {
        ...subcategory,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString()
      };

      // Update the categories state to include the new subcategory
      setCategories(prev => prev.map(category => 
        category.id === subcategory.category_id 
          ? { ...category, subcategories: [...(category.subcategories || []), newSubcategory] }
          : category
      ));
      
      // Update cache - we need to update the entire categories array
      const updatedCategories = categories.map(category => 
        category.id === subcategory.category_id 
          ? { ...category, subcategories: [...(category.subcategories || []), newSubcategory] }
          : category
      );
      await cacheService.set('categories', updatedCategories);
      
      // Register pending change for subcategory
      await cacheService.addPendingChange({
        table: 'subcategories',
        record_id: newSubcategory.id,
        operation: 'create',
        data: newSubcategory
      });
      
      toast({
        title: "Éxito",
        description: "Subcategoría creada exitosamente.",
      });
      
      return newSubcategory as Subcategory;
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear la subcategoría.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateSubcategory = async (id: string, updates: Partial<Subcategory>) => {
    try {
      // Find current subcategory
      let currentSubcategory = null;
      for (const category of categories) {
        const found = category.subcategories?.find(sub => sub.id === id);
        if (found) {
          currentSubcategory = found;
          break;
        }
      }
      
      if (!currentSubcategory) return;
      
      const updatedSubcategory = {
        ...currentSubcategory,
        ...updates
      };

      // Update the categories state
      setCategories(prev => prev.map(category => ({
        ...category,
        subcategories: category.subcategories?.map(sub => sub.id === id ? updatedSubcategory : sub)
      })));
      
      // Update cache
      const updatedCategories = categories.map(category => ({
        ...category,
        subcategories: category.subcategories?.map(sub => sub.id === id ? updatedSubcategory : sub)
      }));
      await cacheService.set('categories', updatedCategories);
      
      // Register pending change
      await cacheService.addPendingChange({
        table: 'subcategories',
        record_id: id,
        operation: 'update',
        data: updatedSubcategory
      });
      
      toast({
        title: "Éxito",
        description: "Subcategoría actualizada exitosamente.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la subcategoría.",
        variant: "destructive",
      });
    }
  };

  const deleteSubcategory = async (id: string) => {
    try {
      // Update the categories state
      setCategories(prev => prev.map(category => ({
        ...category,
        subcategories: category.subcategories?.filter(sub => sub.id !== id)
      })));
      
      // Update cache
      const updatedCategories = categories.map(category => ({
        ...category,
        subcategories: category.subcategories?.filter(sub => sub.id !== id)
      }));
      await cacheService.set('categories', updatedCategories);
      
      // Register pending change
      await cacheService.addPendingChange({
        table: 'subcategories',
        record_id: id,
        operation: 'delete'
      });
      
      toast({
        title: "Éxito",
        description: "Subcategoría eliminada exitosamente.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la subcategoría.",
        variant: "destructive",
      });
    }
  };

  // Tag CRUD operations
  const createTag = async (tag: Omit<Tag, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;
    
    try {
      const newTag = {
        ...tag,
        id: crypto.randomUUID(),
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Update local state
      setTags(prev => [...prev, newTag]);
      
      // Update cache and register pending change
      await cacheService.updateCacheItem('tags', newTag);
      await cacheService.addPendingChange({
        table: 'tags',
        record_id: newTag.id,
        operation: 'create',
        data: newTag
      });

      toast({
        title: "Éxito",
        description: "Etiqueta creada exitosamente.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear la etiqueta.",
        variant: "destructive",
      });
    }
  };

  const updateTag = async (id: string, updates: Partial<Tag>) => {
    try {
      const updatedTag = {
        ...tags.find(t => t.id === id),
        ...updates,
        updated_at: new Date().toISOString()
      };

      // Update local state
      setTags(prev => prev.map(item => item.id === id ? updatedTag : item));
      
      // Update cache and register pending change
      await cacheService.updateCacheItem('tags', updatedTag);
      await cacheService.addPendingChange({
        table: 'tags',
        record_id: id,
        operation: 'update',
        data: updatedTag
      });

      toast({
        title: "Éxito",
        description: "Etiqueta actualizada exitosamente.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la etiqueta.",
        variant: "destructive",
      });
    }
  };

  const deleteTag = async (id: string) => {
    try {
      // Update local state
      setTags(prev => prev.filter(item => item.id !== id));
      
      // Remove from cache and register pending change
      await cacheService.deleteCacheItem('tags', id);
      await cacheService.addPendingChange({
        table: 'tags',
        record_id: id,
        operation: 'delete'
      });

      toast({
        title: "Éxito",
        description: "Etiqueta eliminada exitosamente.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la etiqueta.",
        variant: "destructive",
      });
    }
  };

  // Template CRUD operations
  const createTemplate = async (template: Omit<Template, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;
    
    try {
      // Handle tag_ids separately
      const { tag_ids, ...templateData } = template;
      
      const { data, error } = await supabase
        .from('templates')
        .insert([{ ...templateData, user_id: user.id }])
        .select()
        .single();

      if (error) {
        console.error('Template creation error:', error);
        toast({
          title: "Error",
          description: "No se pudo crear la plantilla.",
          variant: "destructive",
        });
        return;
      }

      // Handle template tags if any
      if (tag_ids && tag_ids.length > 0) {
        const templateTagInserts = tag_ids.map(tagId => ({
          template_id: data.id,
          tag_id: tagId
        }));

        const { error: tagError } = await supabase
          .from('template_tags')
          .insert(templateTagInserts);

        if (tagError) {
          console.error('Template tags error:', tagError);
        }
      }

      // Fetch template with tags for state update
      const { data: templateWithTags } = await supabase
        .from('templates')
        .select(`
          *,
          tags:template_tags(
            tag:tags(*)
          )
        `)
        .eq('id', data.id)
        .single();

      const processedTemplate = {
        ...templateWithTags,
        tags: templateWithTags?.tags?.map((t: any) => t.tag) || []
      };

      setTemplates(prev => [...prev, processedTemplate]);
      toast({
        title: "Éxito",
        description: "Plantilla creada exitosamente.",
      });
    } catch (err) {
      console.error('Unexpected error creating template:', err);
      toast({
        title: "Error",
        description: "Error inesperado al crear la plantilla.",
        variant: "destructive",
      });
    }
  };

  const updateTemplate = async (id: string, updates: Partial<Template>) => {
    try {
      // Handle tag_ids separately
      const { tag_ids, ...templateUpdates } = updates;
      
      const { data, error } = await supabase
        .from('templates')
        .update(templateUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        toast({
          title: "Error",
          description: "No se pudo actualizar la plantilla.",
          variant: "destructive",
        });
        return;
      }

      // Handle template tags if tag_ids is provided
      if (tag_ids !== undefined) {
        // Delete existing template tags
        await supabase
          .from('template_tags')
          .delete()
          .eq('template_id', id);

        // Insert new template tags if any
        if (tag_ids.length > 0) {
          const templateTagInserts = tag_ids.map(tagId => ({
            template_id: id,
            tag_id: tagId
          }));

          await supabase
            .from('template_tags')
            .insert(templateTagInserts);
        }
      }

      // Fetch updated template with tags
      const { data: templateWithTags } = await supabase
        .from('templates')
        .select(`
          *,
          tags:template_tags(
            tag:tags(*)
          )
        `)
        .eq('id', id)
        .single();

      const processedTemplate = {
        ...templateWithTags,
        tags: templateWithTags?.tags?.map((t: any) => t.tag) || []
      };

      setTemplates(prev => prev.map(item => item.id === id ? processedTemplate : item));
      toast({
        title: "Éxito",
        description: "Plantilla actualizada exitosamente.",
      });
    } catch (err) {
      console.error('Error updating template:', err);
      toast({
        title: "Error",
        description: "Error inesperado al actualizar la plantilla.",
        variant: "destructive",
      });
    }
  };

  const deleteTemplate = async (id: string) => {
    const { error } = await supabase
      .from('templates')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la plantilla.",
        variant: "destructive",
      });
      return;
    }

    setTemplates(prev => prev.filter(item => item.id !== id));
    toast({
      title: "Éxito",
      description: "Plantilla eliminada exitosamente.",
    });
  };

  // Filter CRUD operations
  const createFilter = async (filter: Omit<Filter, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('filters')
      .insert([{ ...filter, user_id: user.id }])
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo crear el filtro.",
        variant: "destructive",
      });
      return;
    }

    setFilters(prev => [...prev, data]);
    toast({
      title: "Éxito",
      description: "Filtro creado exitosamente.",
    });
  };

  const updateFilter = async (id: string, updates: Partial<Filter>) => {
    const { data, error } = await supabase
      .from('filters')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el filtro.",
        variant: "destructive",
      });
      return;
    }

    setFilters(prev => prev.map(item => item.id === id ? data : item));
    toast({
      title: "Éxito",
      description: "Filtro actualizado exitosamente.",
    });
  };

  const deleteFilter = async (id: string) => {
    const { error } = await supabase
      .from('filters')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el filtro.",
        variant: "destructive",
      });
      return;
    }

    setFilters(prev => prev.filter(item => item.id !== id));
    toast({
      title: "Éxito",
      description: "Filtro eliminado exitosamente.",
    });
  };

  // User settings operations
  const updateUserSettings = async (settings: Partial<UserSettings>) => {
    if (!user || !userSettings) return;

    const { data, error } = await supabase
      .from('user_settings')
      .update(settings)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "No se pudieron actualizar las configuraciones.",
        variant: "destructive",
      });
      return;
    }

    setUserSettings(data);
    toast({
      title: "Éxito",
      description: "Configuraciones actualizadas exitosamente.",
    });
  };

  // Reorder operations
  const reorderAccounts = async (newOrder: Account[]) => {
    try {
      // Update display_order for each account
      const updates = newOrder.map((account, index) => 
        supabase
          .from('accounts')
          .update({ display_order: index })
          .eq('id', account.id)
      );
      
      await Promise.all(updates);
      
      // Update local state
      setAccounts(newOrder);
      
      toast({
        title: "Éxito",
        description: "Orden de cuentas actualizado.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el orden de las cuentas.",
        variant: "destructive",
      });
    }
  };

  const reorderCategories = async (newOrder: Category[]) => {
    try {
      // Update display_order for each category
      const updates = newOrder.map((category, index) => 
        supabase
          .from('categories')
          .update({ display_order: index })
          .eq('id', category.id)
      );
      
      await Promise.all(updates);
      
      // Update local state
      setCategories(newOrder);
      
      toast({
        title: "Éxito",
        description: "Orden de categorías actualizado.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el orden de las categorías.",
        variant: "destructive",
      });
    }
  };

  const reorderTags = async (newOrder: Tag[]) => {
    try {
      // Update display_order for each tag
      const updates = newOrder.map((tag, index) => 
        supabase
          .from('tags')
          .update({ display_order: index })
          .eq('id', tag.id)
      );
      
      await Promise.all(updates);
      
      // Update local state
      setTags(newOrder);
      
      toast({
        title: "Éxito",
        description: "Orden de etiquetas actualizado.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el orden de las etiquetas.",
        variant: "destructive",
      });
    }
  };

  return {
    // Data
    accounts,
    categories,
    tags,
    templates,
    filters,
    userSettings,
    loading,
    
    // Account operations
    createAccount,
    updateAccount,
    deleteAccount,
    reorderAccounts,
    
    // Category operations
    createCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    
    // Subcategory operations
    createSubcategory,
    updateSubcategory,
    deleteSubcategory,
    
    // Tag operations
    createTag,
    updateTag,
    deleteTag,
    reorderTags,
    
    // Template operations
    createTemplate,
    updateTemplate,
    deleteTemplate,
    
    // Filter operations
    createFilter,
    updateFilter,
    deleteFilter,
    
    // Settings operations
    updateUserSettings,
    
    // Utility
    refetch: fetchData,
  };
};
