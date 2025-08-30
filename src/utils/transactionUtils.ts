import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TransactionData {
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
  contact_id?: string;
  payer_contact_id?: string;
}

/**
 * Standalone function to create transactions without hook dependencies
 */
export const createTransactionDirectly = async (userId: string, transaction: TransactionData) => {
  try {
    if (transaction.type === 'transfer') {
      // For transfers, create two transactions: one debit and one credit
      const transferData = [
        {
          ...transaction,
          user_id: userId,
          amount: -Math.abs(transaction.amount), // Negative for source account
          account_id: transaction.account_id, // Source account
          to_account_id: transaction.to_account_id,
          description: `Transferencia`,
        },
        {
          ...transaction,
          user_id: userId,
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
          user_id: userId,
          amount: adjustedAmount,
        }])
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Transacción creada exitosamente');
      return data;
    }
  } catch (error) {
    console.error('Error creating transaction:', error);
    toast.error('Error al crear la transacción');
    throw error;
  }
};