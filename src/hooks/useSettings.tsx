
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

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

  // Fetch all data
  const fetchData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch accounts
      const { data: accountsData } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id);
      
      // Fetch categories with subcategories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select(`
          *,
          subcategories (*)
        `)
        .eq('user_id', user.id);
      
      // Fetch tags
      const { data: tagsData } = await supabase
        .from('tags')
        .select('*')
        .eq('user_id', user.id);
      
      // Fetch templates
      const { data: templatesData } = await supabase
        .from('templates')
        .select('*')
        .eq('user_id', user.id);
      
      // Fetch filters
      const { data: filtersData } = await supabase
        .from('filters')
        .select('*')
        .eq('user_id', user.id);
      
      // Fetch user settings
      const { data: settingsData } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      setAccounts(accountsData || []);
      setCategories(categoriesData || []);
      setTags(tagsData || []);
      setTemplates(templatesData || []);
      setFilters(filtersData || []);
      setUserSettings(settingsData);
    } catch (error) {
      console.error('Error fetching settings data:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de configuración.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Account CRUD operations
  const createAccount = async (account: Omit<Account, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('accounts')
      .insert([{ ...account, user_id: user.id }])
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo crear la cuenta.",
        variant: "destructive",
      });
      return;
    }

    setAccounts(prev => [...prev, data]);
    toast({
      title: "Éxito",
      description: "Cuenta creada exitosamente.",
    });
  };

  const updateAccount = async (id: string, updates: Partial<Account>) => {
    const { data, error } = await supabase
      .from('accounts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la cuenta.",
        variant: "destructive",
      });
      return;
    }

    setAccounts(prev => prev.map(item => item.id === id ? data : item));
    toast({
      title: "Éxito",
      description: "Cuenta actualizada exitosamente.",
    });
  };

  const deleteAccount = async (id: string) => {
    const { error } = await supabase
      .from('accounts')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la cuenta.",
        variant: "destructive",
      });
      return;
    }

    setAccounts(prev => prev.filter(item => item.id !== id));
    toast({
      title: "Éxito",
      description: "Cuenta eliminada exitosamente.",
    });
  };

  // Category CRUD operations
  const createCategory = async (category: Omit<Category, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('categories')
      .insert([{ ...category, user_id: user.id }])
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo crear la categoría.",
        variant: "destructive",
      });
      return;
    }

    setCategories(prev => [...prev, data]);
    toast({
      title: "Éxito",
      description: "Categoría creada exitosamente.",
    });
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la categoría.",
        variant: "destructive",
      });
      return;
    }

    setCategories(prev => prev.map(item => item.id === id ? data : item));
    toast({
      title: "Éxito",
      description: "Categoría actualizada exitosamente.",
    });
  };

  const deleteCategory = async (id: string) => {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la categoría.",
        variant: "destructive",
      });
      return;
    }

    setCategories(prev => prev.filter(item => item.id !== id));
    toast({
      title: "Éxito",
      description: "Categoría eliminada exitosamente.",
    });
  };

  // Subcategory CRUD operations
  const createSubcategory = async (subcategory: Omit<Subcategory, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
      .from('subcategories')
      .insert([subcategory])
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo crear la subcategoría.",
        variant: "destructive",
      });
      return;
    }

    // Update the categories state to include the new subcategory
    setCategories(prev => prev.map(category => 
      category.id === subcategory.category_id 
        ? { ...category, subcategories: [...(category.subcategories || []), data] }
        : category
    ));
    
    toast({
      title: "Éxito",
      description: "Subcategoría creada exitosamente.",
    });
  };

  const updateSubcategory = async (id: string, updates: Partial<Subcategory>) => {
    const { data, error } = await supabase
      .from('subcategories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la subcategoría.",
        variant: "destructive",
      });
      return;
    }

    // Update the categories state
    setCategories(prev => prev.map(category => ({
      ...category,
      subcategories: category.subcategories?.map(sub => sub.id === id ? data : sub)
    })));
    
    toast({
      title: "Éxito",
      description: "Subcategoría actualizada exitosamente.",
    });
  };

  const deleteSubcategory = async (id: string) => {
    const { error } = await supabase
      .from('subcategories')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la subcategoría.",
        variant: "destructive",
      });
      return;
    }

    // Update the categories state
    setCategories(prev => prev.map(category => ({
      ...category,
      subcategories: category.subcategories?.filter(sub => sub.id !== id)
    })));
    
    toast({
      title: "Éxito",
      description: "Subcategoría eliminada exitosamente.",
    });
  };

  // Tag CRUD operations
  const createTag = async (tag: Omit<Tag, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('tags')
      .insert([{ ...tag, user_id: user.id }])
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo crear la etiqueta.",
        variant: "destructive",
      });
      return;
    }

    setTags(prev => [...prev, data]);
    toast({
      title: "Éxito",
      description: "Etiqueta creada exitosamente.",
    });
  };

  const updateTag = async (id: string, updates: Partial<Tag>) => {
    const { data, error } = await supabase
      .from('tags')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la etiqueta.",
        variant: "destructive",
      });
      return;
    }

    setTags(prev => prev.map(item => item.id === id ? data : item));
    toast({
      title: "Éxito",
      description: "Etiqueta actualizada exitosamente.",
    });
  };

  const deleteTag = async (id: string) => {
    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la etiqueta.",
        variant: "destructive",
      });
      return;
    }

    setTags(prev => prev.filter(item => item.id !== id));
    toast({
      title: "Éxito",
      description: "Etiqueta eliminada exitosamente.",
    });
  };

  // Template CRUD operations
  const createTemplate = async (template: Omit<Template, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('templates')
      .insert([{ ...template, user_id: user.id }])
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo crear la plantilla.",
        variant: "destructive",
      });
      return;
    }

    setTemplates(prev => [...prev, data]);
    toast({
      title: "Éxito",
      description: "Plantilla creada exitosamente.",
    });
  };

  const updateTemplate = async (id: string, updates: Partial<Template>) => {
    const { data, error } = await supabase
      .from('templates')
      .update(updates)
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

    setTemplates(prev => prev.map(item => item.id === id ? data : item));
    toast({
      title: "Éxito",
      description: "Plantilla actualizada exitosamente.",
    });
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
    
    // Category operations
    createCategory,
    updateCategory,
    deleteCategory,
    
    // Subcategory operations
    createSubcategory,
    updateSubcategory,
    deleteSubcategory,
    
    // Tag operations
    createTag,
    updateTag,
    deleteTag,
    
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
