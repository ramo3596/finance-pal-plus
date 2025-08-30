import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CategoryData {
  name: string;
  color: string;
  icon: string;
  nature: string;
  display_order?: number;
}

export interface SubcategoryData {
  name: string;
  category_id: string;
  icon: string;
}

/**
 * Standalone function to create categories without hook dependencies
 */
export const createCategoryDirectly = async (userId: string, category: CategoryData) => {
  try {
    console.log('Creating category with data:', { ...category, user_id: userId });
    
    const { data, error } = await supabase
      .from('categories')
      .insert([{ ...category, user_id: userId }])
      .select()
      .single();
    
    console.log('Category creation result:', { data, error });

    if (error) {
      toast.error('No se pudo crear la categoría.');
      return null;
    }

    toast.success('Categoría creada exitosamente.');
    return data;
  } catch (error) {
    console.error('Error creating category:', error);
    toast.error('Error al crear la categoría');
    return null;
  }
};

/**
 * Standalone function to create subcategories without hook dependencies
 */
export const createSubcategoryDirectly = async (subcategory: SubcategoryData) => {
  try {
    console.log('Creating subcategory with data:', subcategory);
    
    const { data, error } = await supabase
      .from('subcategories')
      .insert([subcategory])
      .select()
      .single();
    
    console.log('Subcategory creation result:', { data, error });

    if (error) {
      toast.error('No se pudo crear la subcategoría.');
      return null;
    }

    toast.success('Subcategoría creada exitosamente.');
    return data;
  } catch (error) {
    console.error('Error creating subcategory:', error);
    toast.error('Error al crear la subcategoría');
    return null;
  }
};

/**
 * Standalone function to fetch categories without hook dependencies
 */
export const fetchCategoriesDirectly = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select(`
        *,
        subcategories (*)
      `)
      .eq('user_id', userId)
      .order('display_order', { ascending: true });
    
    if (error) throw error;

    return data?.map(category => ({
      ...category,
      subcategories: category.subcategories?.map((subcategory: any) => ({
        ...subcategory,
        icon: subcategory.icon || '📦'
      })) || []
    })) || [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};