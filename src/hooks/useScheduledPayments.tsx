import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export interface ScheduledPayment {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  type: 'income' | 'expense' | 'transfer';
  category_id?: string;
  account_id?: string;
  to_account_id?: string;
  amount: number;
  payment_method?: string;
  contact_id?: string;
  frequency_type: 'once' | 'recurring';
  start_date: string;
  notification_days: number;
  recurrence_pattern?: string;
  recurrence_interval?: number;
  recurrence_day_option?: string;
  end_type?: 'never' | 'date' | 'count';
  end_date?: string;
  end_count?: number;
  note?: string;
  tags: string[];
  is_active: boolean;
  next_payment_date?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  category_name?: string;
  category_icon?: string;
  category_color?: string;
  account_name?: string;
  to_account_name?: string;
  contact_name?: string;
}

export const useScheduledPayments = () => {
  const [scheduledPayments, setScheduledPayments] = useState<ScheduledPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchScheduledPayments = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('scheduled_payments')
        .select('*')
        .eq('user_id', user.id)
        .order('next_payment_date', { ascending: true });

      if (error) throw error;

      // Fetch related data separately
      const paymentIds = data?.map(p => p.id) || [];
      const categoryIds = data?.filter(p => p.category_id).map(p => p.category_id) || [];
      const accountIds = [...new Set([
        ...(data?.filter(p => p.account_id).map(p => p.account_id) || []),
        ...(data?.filter(p => p.to_account_id).map(p => p.to_account_id) || [])
      ])];
      const contactIds = data?.filter(p => p.contact_id).map(p => p.contact_id) || [];

      // Fetch categories
      const { data: categories } = categoryIds.length > 0 ? await supabase
        .from('categories')
        .select('id, name, icon, color')
        .in('id', categoryIds) : { data: [] };

      // Fetch accounts
      const { data: accounts } = accountIds.length > 0 ? await supabase
        .from('accounts')
        .select('id, name')
        .in('id', accountIds) : { data: [] };

      // Fetch contacts
      const { data: contacts } = contactIds.length > 0 ? await supabase
        .from('contacts')
        .select('id, name')
        .in('id', contactIds) : { data: [] };

      // Helper function to calculate the next payment date
      const calculateNextPaymentDate = (payment: any): string => {
        if (payment.frequency_type === 'once') {
          return payment.start_date;
        }

        const startDate = new Date(payment.start_date);
        const today = new Date();
        let currentDate = new Date(startDate);
        const interval = payment.recurrence_interval || 1;
        const pattern = payment.recurrence_pattern || 'monthly';
        const endDate = payment.end_type === 'date' && payment.end_date ? new Date(payment.end_date) : null;
        const maxCount = payment.end_type === 'count' ? payment.end_count : null;
        let count = 0;

        // If start date is in the future, that's the next payment
        if (startDate > today) {
          return payment.start_date;
        }

        // Calculate future occurrences until we find the next one
        while (currentDate <= today) {
          count++;
          
          // Check if we've reached the end conditions
          if (maxCount && count >= maxCount) {
            return currentDate.toISOString();
          }
          if (endDate && currentDate >= endDate) {
            return currentDate.toISOString();
          }

          // Move to next occurrence
          switch (pattern) {
            case 'daily':
              currentDate = new Date(currentDate.getTime() + (interval * 24 * 60 * 60 * 1000));
              break;
            case 'weekly':
              currentDate = new Date(currentDate.getTime() + (interval * 7 * 24 * 60 * 60 * 1000));
              break;
            case 'monthly':
              currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + interval, currentDate.getDate());
              break;
            case 'yearly':
              currentDate = new Date(currentDate.getFullYear() + interval, currentDate.getMonth(), currentDate.getDate());
              break;
            default:
              currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + interval, currentDate.getDate());
          }
        }

        return currentDate.toISOString();
      };

      const formattedPayments = (data || []).map(payment => {
        const category = categories?.find(c => c.id === payment.category_id);
        const account = accounts?.find(a => a.id === payment.account_id);
        const toAccount = accounts?.find(a => a.id === payment.to_account_id);
        const contact = contacts?.find(c => c.id === payment.contact_id);

        return {
          ...payment,
          type: payment.type as 'income' | 'expense' | 'transfer',
          category_name: category?.name,
          category_icon: category?.icon,
          category_color: category?.color,
          account_name: account?.name,
          to_account_name: toAccount?.name,
          contact_name: contact?.name,
          next_payment_date: calculateNextPaymentDate(payment),
        } as ScheduledPayment;
      });

      setScheduledPayments(formattedPayments);
    } catch (error) {
      console.error('Error fetching scheduled payments:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los pagos programados",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createScheduledPayment = async (payment: Omit<ScheduledPayment, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('scheduled_payments')
        .insert([{
          ...payment,
          user_id: user.id,
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Pago programado creado correctamente",
      });

      await fetchScheduledPayments();
      return data;
    } catch (error) {
      console.error('Error creating scheduled payment:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el pago programado",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateScheduledPayment = async (id: string, updates: Partial<ScheduledPayment>) => {
    try {
      const { error } = await supabase
        .from('scheduled_payments')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Pago programado actualizado correctamente",
      });

      await fetchScheduledPayments();
    } catch (error) {
      console.error('Error updating scheduled payment:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el pago programado",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteScheduledPayment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('scheduled_payments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Pago programado eliminado correctamente",
      });

      await fetchScheduledPayments();
    } catch (error) {
      console.error('Error deleting scheduled payment:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el pago programado",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchScheduledPayments();
  }, [user]);

  return {
    scheduledPayments,
    loading,
    fetchScheduledPayments,
    createScheduledPayment,
    updateScheduledPayment,
    deleteScheduledPayment,
  };
};