import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { useSettings } from './useSettings';

export interface Transaction {
  id: string;
  user_id: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  account_id: string;
  to_account_id?: string;
  category_id?: string;
  subcategory_id?: string;
  description: string;
  beneficiary?: string;
  note?: string;
  payment_method?: string;
  location?: string;
  tags: string[];
  transaction_date: string;
  created_at: string;
  updated_at: string;
  contact_id?: string;
  payer_contact_id?: string;
}

export interface DashboardCard {
  id: string;
  type: 'accounts' | 'transactions' | 'expenses' | 'overview' | 'cash-flow' | 'upcoming-payments' | 'balance-trends' | 'period-comparison' | 'income-expense-by-tag' | 'expenses-by-tag' | 'balance-per-account' | 'income-expense-table';
  title: string;
  position: number;
  visible: boolean;
}

const defaultCards: DashboardCard[] = [
  { id: 'overview', type: 'overview', title: 'Resumen General', position: 0, visible: true },
  { id: 'accounts', type: 'accounts', title: 'Mis Cuentas', position: 1, visible: true },
  { id: 'transactions', type: 'transactions', title: 'Transacciones Recientes', position: 2, visible: true },
  { id: 'expenses', type: 'expenses', title: 'Estructura de Gastos', position: 3, visible: true },
  { id: 'cash-flow', type: 'cash-flow', title: 'Flujo de Efectivo', position: 4, visible: true },
  { id: 'upcoming-payments', type: 'upcoming-payments', title: 'Próximos Pagos', position: 5, visible: true },
  { id: 'balance-trends', type: 'balance-trends', title: 'Tendencias de Saldo', position: 6, visible: false },
  { id: 'period-comparison', type: 'period-comparison', title: 'Comparación de Periodo', position: 7, visible: false },
  { id: 'income-expense-by-tag', type: 'income-expense-by-tag', title: 'Ingresos vs. Gastos por Etiqueta', position: 8, visible: false },
  { id: 'expenses-by-tag', type: 'expenses-by-tag', title: 'Gastos por Etiqueta', position: 9, visible: false },
  { id: 'balance-per-account', type: 'balance-per-account', title: 'Saldo Por Cuenta', position: 10, visible: true },
  { id: 'income-expense-table', type: 'income-expense-table', title: 'Tabla Ingresos y Gastos', position: 11, visible: false },
];

export const useTransactions = () => {
  const { user } = useAuth();
  const { refetch: refetchSettings } = useSettings();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cards, setCards] = useState<DashboardCard[]>(defaultCards);
  const [loading, setLoading] = useState(false);

  // Fetch dashboard card preferences
  const fetchCardPreferences = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('dashboard_card_preferences')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      
      if (data && data.length > 0) {
        const savedCards = data.map(pref => ({
          id: pref.card_id,
          type: pref.card_type as DashboardCard['type'],
          title: pref.title,
          position: pref.position,
          visible: pref.visible
        }));
        
        const mergedCards = defaultCards.map(defaultCard => {
          const savedCard = savedCards.find(sc => sc.id === defaultCard.id);
          if (savedCard) {
            return {
              ...defaultCard,
              position: savedCard.position,
              visible: savedCard.visible,
            };
          }
          return defaultCard;
        });
        
        setCards(mergedCards);
      }
    } catch (error) {
      console.error('Error fetching card preferences:', error);
    }
  };

  const fetchTransactions = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('transaction_date', { ascending: false });

      if (error) throw error;
      setTransactions((data as unknown as Transaction[]) || []);
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
      if (transaction.type === 'transfer') {
        // For transfers, create two transactions: one debit and one credit
        const transferData = [
          {
            ...transaction,
            user_id: user.id,
            amount: -Math.abs(transaction.amount), // Negative for source account
            account_id: transaction.account_id, // Source account
            to_account_id: transaction.to_account_id,
            description: `Transferencia`,
          },
          {
            ...transaction,
            user_id: user.id,
            amount: Math.abs(transaction.amount), // Positive for destination account
            account_id: transaction.to_account_id, // Destination account
            to_account_id: transaction.account_id,
            description: `Transferencia`,
          }
        ];

        const { data, error } = await supabase
          .from('transactions' as any)
          .insert(transferData)
          .select();

        if (error) throw error;
        
        setTransactions(prev => [...(data as unknown as Transaction[]), ...prev]);
        // Refetch accounts to update balances
        refetchSettings();
        toast.success('Transferencia creada exitosamente');
        return data;
      } else {
        // For regular income/expense transactions
        // Make sure expenses are negative
        const adjustedAmount = transaction.type === 'expense' 
          ? -Math.abs(transaction.amount) 
          : Math.abs(transaction.amount);

        const { data, error } = await supabase
          .from('transactions' as any)
          .insert([{
            ...transaction,
            user_id: user.id,
            amount: adjustedAmount,
          }])
          .select()
          .single();

        if (error) throw error;
        
        setTransactions(prev => [data as unknown as Transaction, ...prev]);
        // Refetch accounts to update balances
        refetchSettings();
        toast.success('Transacción creada exitosamente');
        return data;
      }
    } catch (error) {
      console.error('Error creating transaction:', error);
      toast.error('Error al crear la transacción');
      throw error;
    }
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    try {
      // Get the current transaction before updating
      const currentTransaction = transactions.find(t => t.id === id);
      if (!currentTransaction) {
        throw new Error('Transaction not found');
      }

      // Check if this transaction is linked to a debt payment
      const { data: linkedDebtPayment } = await supabase
        .from('debt_payments')
        .select('id, debt_id, amount')
        .eq('transaction_id', id)
        .single();

      // Check if this is an initial debt/loan transaction (by description pattern)
      const isInitialDebtTransaction = currentTransaction.description?.includes('Deuda -') || 
                                      currentTransaction.description?.includes('Préstamo -');

      // Update the transaction
      const { data, error } = await supabase
        .from('transactions' as any)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Handle debt synchronization if this transaction is linked to a debt
      if (linkedDebtPayment) {
        // This transaction is linked to a debt payment - update the debt payment
        const debtPaymentUpdates: any = {};
        
        if (updates.amount !== undefined) {
          debtPaymentUpdates.amount = updates.amount;
          
          // Recalcular el saldo basado en la suma de todos los registros
          const { calculateDebtBalance } = await import('@/utils/debtUtils');
          const newBalance = await calculateDebtBalance(linkedDebtPayment.debt_id);
          
          await supabase
            .from('debts')
            .update({ current_balance: newBalance })
            .eq('id', linkedDebtPayment.debt_id);
        }
        
        if (updates.transaction_date !== undefined) {
          debtPaymentUpdates.payment_date = updates.transaction_date;
        }
        
        if (updates.note !== undefined) {
          debtPaymentUpdates.description = updates.note;
        }
        
        // Update the debt payment if there are changes
        if (Object.keys(debtPaymentUpdates).length > 0) {
          await supabase
            .from('debt_payments')
            .update(debtPaymentUpdates)
            .eq('id', linkedDebtPayment.id);
        }
      } else if (isInitialDebtTransaction) {
        // This is an initial debt/loan transaction - update the corresponding debt
        const { data: correspondingDebt } = await supabase
          .from('debts')
          .select('id, initial_amount')
          .eq('debt_date', currentTransaction.transaction_date)
          .or(`description.ilike.%${currentTransaction.description?.split(' - ')[1] || ''}%`)
          .single();
        
        if (correspondingDebt) {
          const debtUpdates: any = {};
          
          if (updates.amount !== undefined) {
            debtUpdates.initial_amount = Math.abs(updates.amount);
            // Update current balance to match new initial amount
            debtUpdates.current_balance = Math.abs(updates.amount);
          }
          
          if (updates.transaction_date !== undefined) {
            debtUpdates.debt_date = updates.transaction_date;
          }
          
          if (updates.description !== undefined) {
            // Extract contact name from description and update debt description
            const contactName = updates.description.split(' - ')[1];
            if (contactName) {
              debtUpdates.description = `${updates.description.includes('Deuda') ? 'Deuda con' : 'Préstamo a'} ${contactName}`;
            }
          }
          
          // Update the debt if there are changes
          if (Object.keys(debtUpdates).length > 0) {
            await supabase
              .from('debts')
              .update(debtUpdates)
              .eq('id', correspondingDebt.id);
          }
        }
      }
      
      setTransactions(prev => prev.map(t => t.id === id ? data as unknown as Transaction : t));
      // Refetch accounts to update balances
      refetchSettings();
      toast.success('Transacción actualizada');
      return data;
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast.error('Error al actualizar la transacción');
      throw error;
    }
  };

  const updateTransferPair = async (id: string, updates: Partial<Transaction>) => {
    try {
      // Find the current transaction to get its pair
      const currentTransaction = transactions.find(t => t.id === id);
      if (!currentTransaction || currentTransaction.type !== 'transfer') {
        throw new Error('Transaction not found or not a transfer');
      }

      // Find the paired transaction
      const pairedTransaction = transactions.find(t => 
        t.id !== id && 
        t.type === 'transfer' &&
        t.transaction_date === currentTransaction.transaction_date &&
        ((t.account_id === currentTransaction.to_account_id && t.to_account_id === currentTransaction.account_id) ||
         (t.account_id === currentTransaction.account_id && t.to_account_id === currentTransaction.to_account_id))
      );

      if (!pairedTransaction) {
        throw new Error('Paired transfer transaction not found');
      }

      // Update both transactions
      const sourceUpdate = {
        ...updates,
        amount: -Math.abs(updates.amount || 0),
        account_id: updates.account_id,
        to_account_id: updates.to_account_id,
      };

      const destUpdate = {
        ...updates,
        amount: Math.abs(updates.amount || 0),
        account_id: updates.to_account_id,
        to_account_id: updates.account_id,
      };

      const { data: sourceData, error: sourceError } = await supabase
        .from('transactions' as any)
        .update(sourceUpdate)
        .eq('id', currentTransaction.amount < 0 ? id : pairedTransaction.id)
        .select()
        .single();

      if (sourceError) throw sourceError;

      const { data: destData, error: destError } = await supabase
        .from('transactions' as any)
        .update(destUpdate)
        .eq('id', currentTransaction.amount < 0 ? pairedTransaction.id : id)
        .select()
        .single();

      if (destError) throw destError;
      
      // Update local state
      setTransactions(prev => prev.map(t => {
        if (t.id === (sourceData as unknown as Transaction).id) return sourceData as unknown as Transaction;
        if (t.id === (destData as unknown as Transaction).id) return destData as unknown as Transaction;
        return t;
      }));
      
      // Refetch accounts to update balances
      refetchSettings();
      toast.success('Transferencia actualizada');
      return [sourceData, destData];
    } catch (error) {
      console.error('Error updating transfer pair:', error);
      toast.error('Error al actualizar la transferencia');
      throw error;
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      // Find the transaction to delete
      const transactionToDelete = transactions.find(t => t.id === id);
      if (!transactionToDelete) {
        throw new Error('Transaction not found');
      }

      // Check if this transaction is linked to a debt payment
      const { data: linkedDebtPayment } = await supabase
        .from('debt_payments')
        .select('id, debt_id')
        .eq('transaction_id', id)
        .single();

      // Check if this is an initial debt/loan transaction (by description pattern)
      const isInitialDebtTransaction = transactionToDelete.description?.includes('Deuda -') || 
                                      transactionToDelete.description?.includes('Préstamo -');

      // If it's a transfer, find and delete both transactions
      if (transactionToDelete.type === 'transfer') {
        // Find the paired transaction
        const pairedTransaction = transactions.find(t => 
          t.id !== id && 
          t.type === 'transfer' &&
          t.transaction_date === transactionToDelete.transaction_date &&
          ((t.account_id === transactionToDelete.to_account_id && t.to_account_id === transactionToDelete.account_id) ||
           (t.account_id === transactionToDelete.account_id && t.to_account_id === transactionToDelete.to_account_id))
        );

        // Delete both transactions in parallel
        const deletePromises = [
          supabase.from('transactions' as any).delete().eq('id', id)
        ];

        if (pairedTransaction) {
          deletePromises.push(
            supabase.from('transactions' as any).delete().eq('id', pairedTransaction.id)
          );
        }

        const results = await Promise.all(deletePromises);
        
        // Check for errors
        for (const result of results) {
          if (result.error) throw result.error;
        }
        
        // Update local state - remove both transactions
        setTransactions(prev => prev.filter(t => 
          t.id !== id && (!pairedTransaction || t.id !== pairedTransaction.id)
        ));
        
        toast.success('Transferencia eliminada completamente');
      } else {
        // For regular transactions, handle debt synchronization first
        if (linkedDebtPayment) {
          // This transaction is linked to a debt payment - delete the debt payment first
          await supabase
            .from('debt_payments')
            .delete()
            .eq('id', linkedDebtPayment.id);
          
          // Recalcular el saldo basado en la suma de todos los registros restantes
          const { calculateDebtBalance } = await import('@/utils/debtUtils');
          const newBalance = await calculateDebtBalance(linkedDebtPayment.debt_id);
          
          await supabase
            .from('debts')
            .update({ current_balance: newBalance })
            .eq('id', linkedDebtPayment.debt_id);
        } else if (isInitialDebtTransaction) {
          // This is an initial debt/loan transaction - find and delete the corresponding debt
          const { data: correspondingDebt } = await supabase
            .from('debts')
            .select('id')
            .eq('debt_date', transactionToDelete.transaction_date)
            .or(`description.ilike.%${transactionToDelete.description?.split(' - ')[1] || ''}%`)
            .single();
          
          if (correspondingDebt) {
            // Delete all debt payments first
            await supabase
              .from('debt_payments')
              .delete()
              .eq('debt_id', correspondingDebt.id);
            
            // Delete the debt
            await supabase
              .from('debts')
              .delete()
              .eq('id', correspondingDebt.id);
          }
        }
        
        // Delete the transaction
        const { error } = await supabase
          .from('transactions' as any)
          .delete()
          .eq('id', id);

        if (error) throw error;
        
        setTransactions(prev => prev.filter(t => t.id !== id));
        toast.success('Transacción eliminada');
      }
      
      // Refetch accounts to update balances
      refetchSettings();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error('Error al eliminar la transacción');
      throw error;
    }
  };

  const updateCardPosition = (cardId: string, newIndex: number) => {
    let updatedCards: DashboardCard[] = [];
    setCards(prev => {
      const oldIndex = prev.findIndex(c => c.id === cardId);
      if (oldIndex === -1) return prev;
      
      // Usar arrayMove para reordenar correctamente
      const reorderedCards = [...prev];
      const [movedCard] = reorderedCards.splice(oldIndex, 1);
      reorderedCards.splice(newIndex, 0, movedCard);
      
      // Actualizar las posiciones basándose en el nuevo orden
      updatedCards = reorderedCards.map((card, index) => ({
        ...card,
        position: index
      }));
      return updatedCards;
    });
    return updatedCards;
  };

  const toggleCardVisibility = (cardId: string) => {
    setCards(prev => prev.map(c => 
      c.id === cardId ? { ...c, visible: !c.visible } : c
    ));
  };

  const saveCardPreferences = async (cardsToSave?: DashboardCard[]) => {
    if (!user) return;
    
    try {
      // Delete existing preferences for this user
      await supabase
        .from('dashboard_card_preferences')
        .delete()
        .eq('user_id', user.id);

      // Use provided cards or current state
      const cardsData = cardsToSave || cards;
      
      // Insert new preferences
      const preferences = cardsData.map(card => ({
        user_id: user.id,
        card_id: card.id,
        card_type: card.type,
        title: card.title,
        position: card.position,
        visible: card.visible
      }));

      const { error } = await supabase
        .from('dashboard_card_preferences')
        .insert(preferences);

      if (error) throw error;
      
      toast.success('Configuración de tarjetas guardada exitosamente');
    } catch (error) {
      console.error('Error saving card preferences:', error);
      toast.error('Error al guardar la configuración de tarjetas');
    }
  };

  useEffect(() => {
    if (user) {
      fetchTransactions();
      fetchCardPreferences();
    }
  }, [user]);

  return {
    transactions,
    cards,
    loading,
    createTransaction,
    updateTransaction,
    updateTransferPair,
    deleteTransaction,
    updateCardPosition,
    toggleCardVisibility,
    saveCardPreferences,
    refetch: fetchTransactions,
  };
};
