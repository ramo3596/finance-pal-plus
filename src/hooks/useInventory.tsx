import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";
import { useCachedProducts } from "./useCache";

export interface Product {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  barcode?: string;
  image_url?: string;
  quantity: number;
  price: number;
  cost: number;
  category_id?: string;
  subcategory_id?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
  // Related data
  category?: {
    id: string;
    name: string;
    icon: string;
    color: string;
  };
  subcategory?: {
    id: string;
    name: string;
    icon: string;
  };
}

export interface CreateProductData {
  name: string;
  description?: string;
  barcode?: string;
  image_url?: string;
  quantity: number;
  price: number;
  cost: number;
  category_id?: string;
  subcategory_id?: string;
  tags?: string[];
}

export interface UpdateProductData {
  name?: string;
  description?: string;
  barcode?: string;
  image_url?: string;
  quantity?: number;
  price?: number;
  cost?: number;
  category_id?: string;
  subcategory_id?: string;
  tags?: string[];
}

export function useInventory() {
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Use cached products with automatic loading and cache management
  const fetchProductsFromDB = async (): Promise<Product[]> => {
    if (!user) return [];
    
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((product: any) => ({
        ...product,
      }));
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los productos",
        variant: "destructive",
      });
      throw error;
    }
  };

  const cachedProducts = useCachedProducts(fetchProductsFromDB);
  const products = cachedProducts.data || [];

  // Merge loading states
  const isLoading = loading || cachedProducts.loading;

  const fetchProducts = async () => {
    // Use cached products refresh method
    await cachedProducts.refresh();
  };

  const createProduct = async (productData: CreateProductData) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('products')
        .insert([{
          ...productData,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Producto creado correctamente",
      });

      // Update cache with new product
      const newProducts = [data, ...products];
      await cachedProducts.updateCache(newProducts);
      
      return data;
    } catch (error) {
      console.error('Error creating product:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el producto",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateProduct = async (productId: string, updates: UpdateProductData) => {
    try {
      const { error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Producto actualizado correctamente",
      });

      // Update cache with updated product
      const updatedProducts = products.map(p => p.id === productId ? { ...p, ...updates } : p);
      await cachedProducts.updateCache(updatedProducts);
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el producto",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Producto eliminado correctamente",
      });

      // Update cache - remove the product
      const updatedProducts = products.filter(p => p.id !== productId);
      await cachedProducts.updateCache(updatedProducts);
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el producto",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    if (user) {
      fetchProducts();
    }
  }, [user]);

  return {
    products,
    loading: isLoading,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
  };
}