import { useCachedDebts, useCachedScheduledPayments } from './useCache';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useCachedDebtsHook() {
  const { user } = useAuth();

  const fetchDebtsFromDB = async () => {
    if (!user) return [];
    
    const { data, error } = await supabase
      .from('debts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  };

  const fetchScheduledPaymentsFromDB = async () => {
    if (!user) return [];
    
    const { data, error } = await supabase
      .from('scheduled_payments')
      .select('*')
      .eq('user_id', user.id)
      .order('start_date', { ascending: true });

    if (error) throw error;
    return data || [];
  };

  const cachedDebts = useCachedDebts(fetchDebtsFromDB);
  const cachedScheduledPayments = useCachedScheduledPayments(fetchScheduledPaymentsFromDB);

  return {
    debts: cachedDebts.data || [],
    scheduledPayments: cachedScheduledPayments.data || [],
    loading: cachedDebts.loading || cachedScheduledPayments.loading,
    refreshDebts: cachedDebts.refresh,
    refreshScheduledPayments: cachedScheduledPayments.refresh,
    updateDebtsCache: cachedDebts.updateCache,
    updateScheduledPaymentsCache: cachedScheduledPayments.updateCache,
  };
}