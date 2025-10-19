import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

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
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchProducts = async (forceRefresh = false) => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los productos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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

      await fetchProducts();
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

      await fetchProducts();
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

      await fetchProducts();
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

  // Setup realtime subscriptions
  useEffect(() => {
    if (!user) return;

    fetchProducts();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('products_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchProducts(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    products,
    loading,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
  };
}