import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Transaction {
  id: string;
  user_id: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  account_id: string;
  to_account_id?: string;
  category_id?: string;
  description: string;
  beneficiary?: string;
  note?: string;
  payment_method?: string;
  location?: string;
  tags: string[];
  transaction_date: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardCard {
  id: string;
  type: 'accounts' | 'transactions' | 'expenses' | 'overview';
  title: string;
  position: number;
  visible: boolean;
}

export const useTransactions = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cards, setCards] = useState<DashboardCard[]>([
    { id: 'overview', type: 'overview', title: 'Resumen', position: 0, visible: true },
    { id: 'accounts', type: 'accounts', title: 'Mis Cuentas', position: 1, visible: true },
    { id: 'transactions', type: 'transactions', title: 'Transacciones Recientes', position: 2, visible: true },
    { id: 'expenses', type: 'expenses', title: 'Estructura de Gastos', position: 3, visible: true },
  ]);
  const [loading, setLoading] = useState(false);

  const fetchTransactions = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('transaction_date', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Error al cargar las transacciones');
    } finally {
      setLoading(false);
    }
  };

  const createTransaction = async (transaction: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([{
          ...transaction,
          user_id: user.id,
        }])
        .select()
        .single();

      if (error) throw error;
      
      setTransactions(prev => [data, ...prev]);
      toast.success('Transacción creada exitosamente');
      return data;
    } catch (error) {
      console.error('Error creating transaction:', error);
      toast.error('Error al crear la transacción');
      throw error;
    }
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setTransactions(prev => prev.map(t => t.id === id ? data : t));
      toast.success('Transacción actualizada');
      return data;
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast.error('Error al actualizar la transacción');
      throw error;
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setTransactions(prev => prev.filter(t => t.id !== id));
      toast.success('Transacción eliminada');
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error('Error al eliminar la transacción');
      throw error;
    }
  };

  const updateCardPosition = (cardId: string, newPosition: number) => {
    setCards(prev => {
      const card = prev.find(c => c.id === cardId);
      if (!card) return prev;
      
      const otherCards = prev.filter(c => c.id !== cardId);
      const updatedCards = otherCards.map(c => {
        if (c.position >= newPosition) {
          return { ...c, position: c.position + 1 };
        }
        return c;
      });
      
      return [...updatedCards, { ...card, position: newPosition }]
        .sort((a, b) => a.position - b.position);
    });
  };

  const toggleCardVisibility = (cardId: string) => {
    setCards(prev => prev.map(c => 
      c.id === cardId ? { ...c, visible: !c.visible } : c
    ));
  };

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user]);

  return {
    transactions,
    cards,
    loading,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    updateCardPosition,
    toggleCardVisibility,
    refetch: fetchTransactions,
  };
};