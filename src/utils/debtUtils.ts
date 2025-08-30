import { supabase } from '@/integrations/supabase/client';

/**
 * Calculate the actual balance of a debt based on the sum of all debt payments
 * This is a standalone utility function that can be called from anywhere
 */
export const calculateDebtBalance = async (debtId: string): Promise<number> => {
  try {
    // Get debt information to know its type
    const { data: debt, error: debtError } = await supabase
      .from('debts')
      .select('type')
      .eq('id', debtId)
      .single();

    if (debtError) throw debtError;

    // Get all debt payments for this debt
    const { data: payments, error: paymentsError } = await supabase
      .from('debt_payments')
      .select('amount')
      .eq('debt_id', debtId);

    if (paymentsError) throw paymentsError;

    // Calculate the sum of all payments
    const totalPayments = (payments || []).reduce((sum, payment) => sum + payment.amount, 0);
    
    // For debts: positive payments reduce the balance (they pay back what was borrowed)
    // For loans: negative payments reduce the balance (they pay back what was lent)
    // The * -1 inverts the sign to show proper balance representation
    return totalPayments * -1;
  } catch (error) {
    console.error('Error calculating debt balance:', error);
    return 0;
  }
};