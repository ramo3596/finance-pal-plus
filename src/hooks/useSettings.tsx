
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
  icon: string;
  display_order?: number;
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
  to_account_id?: string;
  category_id?: string;
  subcategory_id?: string;
  payment_method?: string;
  type: string;
  beneficiary?: string;
  note?: string;
  display_order?: number;
  created_at?: string;
  updated_at?: string;
  user_id: string;
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

  // Fetch all data
  const fetchData = async (forceRefresh = false) => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch accounts
      const { data: accountsData } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('display_order', { ascending: true });
      
      // Fetch categories with subcategories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select(`
          *,
          subcategories (*)
        `)
        .eq('user_id', user.id)
        .order('display_order', { ascending: true });

      // Process categories to ensure subcategories have icons and are ordered
      const processedCategories = categoriesData?.map(category => ({
        ...category,
        subcategories: category.subcategories
          ?.map((subcategory: any) => ({
            ...subcategory,
            icon: subcategory.icon || '📦'
          }))
          ?.sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0)) || []
      })) || [];
    
      // Fetch tags
      const { data: tagsData } = await supabase
        .from('tags')
        .select('*')
        .eq('user_id', user.id)
        .order('display_order', { ascending: true });
      
      // Fetch templates with tags
      const { data: templatesData } = await supabase
        .from('templates')
        .select(`
          *,
          tags:template_tags(
            tag:tags(*)
          )
        `)
        .eq('user_id', user.id)
        .order('display_order', { ascending: true });

      // Process templates data to flatten tags
      const processedTemplates = templatesData?.map(template => ({
        ...template,
        tags: template.tags?.map((t: any) => t.tag) || []
      })) || [];
      
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
      setCategories(processedCategories);
      setTags(tagsData || []);
      setTemplates(processedTemplates);
      setFilters(filtersData || []);
      setUserSettings(settingsData || null);
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
      subcategories: category.subcategories
        ?.map((subcategory: any) => ({
          ...subcategory,
          icon: subcategory.icon || '📦'
        }))
        ?.sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0)) || []
    })) || []
  }

  // Removed initializeDebtCategories function to prevent duplicate category creation
  // Categories are now created on-demand by the useDebts hook when needed

  // Setup realtime subscriptions
  useEffect(() => {
    if (!user) return;

    fetchData();

    // Subscribe to realtime changes for all settings tables
    const channel = supabase
      .channel('settings_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'accounts',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Account change detected:', payload);
          fetchData(true);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'categories',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Category change detected:', payload);
          fetchData(true);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subcategories'
        },
        (payload) => {
          console.log('Subcategory change detected:', payload);
          fetchData(true);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tags',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Tag change detected:', payload);
          fetchData(true);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'templates',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Template change detected:', payload);
          fetchData(true);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'template_tags'
        },
        (payload) => {
          console.log('Template tag change detected:', payload);
          fetchData(true);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'filters',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Filter change detected:', payload);
          fetchData(true);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_settings',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('User settings change detected:', payload);
          fetchData(true);
        }
      )
      .subscribe((status) => {
        console.log('Settings subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
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
    if (!user) return null;
    
    console.log('Creating category with data:', { ...category, user_id: user.id });
    
    const { data, error } = await supabase
      .from('categories')
      .insert([{ ...category, user_id: user.id }])
      .select()
      .single();
    
    console.log('Category creation result:', { data, error });

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo crear la categoría.",
        variant: "destructive",
      });
      return null;
    }

    setCategories(prev => [...prev, data]);
    toast({
      title: "Éxito",
      description: "Categoría creada exitosamente.",
    });
    return data as Category;
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
    console.log('Creating subcategory with data:', subcategory);
    
    const { data, error } = await supabase
      .from('subcategories')
      .insert([subcategory])
      .select()
      .single();
    
    console.log('Subcategory creation result:', { data, error });

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo crear la subcategoría.",
        variant: "destructive",
      });
      return null;
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
    
    return data as Subcategory;
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

  const reorderTemplates = async (newOrder: Template[]) => {
    try {
      // Update display_order for each template
      const updates = newOrder.map((template, index) => 
        supabase
          .from('templates')
          .update({ display_order: index })
          .eq('id', template.id)
      );
      
      await Promise.all(updates);
      
      // Update local state
      setTemplates(newOrder);
      
      toast({
        title: "Éxito",
        description: "Orden de plantillas actualizado.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el orden de las plantillas.",
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

  const reorderSubcategories = async (categoryId: string, newOrder: Subcategory[]) => {
    try {
      // Update display_order for each subcategory
      const updates = newOrder.map((subcategory, index) => 
        supabase
          .from('subcategories')
          .update({ display_order: index })
          .eq('id', subcategory.id)
      );
      
      await Promise.all(updates);
      
      // Update local state
      setCategories(prev => prev.map(category => 
        category.id === categoryId 
          ? { ...category, subcategories: newOrder }
          : category
      ));
      
      toast({
        title: "Éxito",
        description: "Orden de subcategorías actualizado.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el orden de las subcategorías.",
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
    reorderSubcategories,
    
    // Tag operations
    createTag,
    updateTag,
    deleteTag,
    reorderTags,
    
    // Template operations
    createTemplate,
    updateTemplate,
    deleteTemplate,
    reorderTemplates,
    
    // Filter operations
    createFilter,
    updateFilter,
    deleteFilter,
    
    // Settings operations
    updateUserSettings,
    
    // Utility
    refetch: (forceRefresh = false) => fetchData(forceRefresh),
  };
};
