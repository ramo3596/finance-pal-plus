import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { addDays, isBefore, isAfter, parseISO } from 'date-fns';

export interface Notification {
  id: string;
  type: 'debt' | 'scheduled_payment' | 'contact';
  title: string;
  message: string;
  date: string;
  isNew: boolean;
  metadata?: any;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const generateNotifications = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const generatedNotifications: Notification[] = [];
      const now = new Date();
      const sevenDaysFromNow = addDays(now, 7);

      // Fetch debts for debt notifications
      const { data: debts } = await supabase
        .from('debts')
        .select(`
          *,
          contacts (name)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (debts) {
        debts.forEach(debt => {
          // Due date alerts
          if (debt.due_date) {
            const dueDate = parseISO(debt.due_date);
            
            // Overdue debts
            if (isBefore(dueDate, now)) {
              generatedNotifications.push({
                id: `debt-overdue-${debt.id}`,
                type: 'debt',
                title: 'Deuda Vencida',
                message: `La deuda con ${debt.contacts?.name || 'contacto'} venció el ${dueDate.toLocaleDateString()}`,
                date: debt.due_date,
                isNew: true,
                metadata: { debtId: debt.id, contactName: debt.contacts?.name }
              });
            }
            // Due soon (within 7 days)
            else if (isBefore(dueDate, sevenDaysFromNow)) {
              generatedNotifications.push({
                id: `debt-due-soon-${debt.id}`,
                type: 'debt',
                title: 'Deuda Próxima a Vencer',
                message: `La deuda con ${debt.contacts?.name || 'contacto'} vence el ${dueDate.toLocaleDateString()}`,
                date: debt.due_date,
                isNew: true,
                metadata: { debtId: debt.id, contactName: debt.contacts?.name }
              });
            }
          }
        });
      }

      // Fetch scheduled payments for payment notifications
      const { data: scheduledPayments } = await supabase
        .from('scheduled_payments')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (scheduledPayments) {
        scheduledPayments.forEach(payment => {
          if (payment.next_payment_date) {
            const nextPaymentDate = parseISO(payment.next_payment_date);
            
            // Payments due within 3 days
            const threeDaysFromNow = addDays(now, 3);
            if (isAfter(nextPaymentDate, now) && isBefore(nextPaymentDate, threeDaysFromNow)) {
              generatedNotifications.push({
                id: `payment-due-${payment.id}`,
                type: 'scheduled_payment',
                title: 'Pago Programado Próximo',
                message: `${payment.name} está programado para el ${nextPaymentDate.toLocaleDateString()}`,
                date: payment.next_payment_date,
                isNew: true,
                metadata: { paymentId: payment.id, paymentName: payment.name }
              });
            }
          }
        });
      }

      // Fetch recently added contacts (last 7 days)
      const sevenDaysAgo = addDays(now, -7);
      const { data: recentContacts } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', sevenDaysAgo.toISOString());

      if (recentContacts) {
        recentContacts.forEach(contact => {
          generatedNotifications.push({
            id: `contact-new-${contact.id}`,
            type: 'contact',
            title: 'Nuevo Contacto Agregado',
            message: `${contact.name} fue agregado a tus contactos`,
            date: contact.created_at,
            isNew: true,
            metadata: { contactId: contact.id, contactName: contact.name }
          });
        });
      }

      // Sort notifications by date (newest first)
      generatedNotifications.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setNotifications(generatedNotifications);
    } catch (error) {
      console.error('Error generating notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, isNew: false } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isNew: false })));
  };

  const getUnreadCount = () => {
    return notifications.filter(n => n.isNew).length;
  };

  useEffect(() => {
    if (user) {
      generateNotifications();
    }
  }, [user]);

  return {
    notifications,
    loading,
    markAsRead,
    markAllAsRead,
    getUnreadCount,
    refetch: generateNotifications,
  };
};