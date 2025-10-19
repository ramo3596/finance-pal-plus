import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Contact {
  id: string;
  name: string;
  contact_type: 'persona' | 'empresa';
  image_url?: string;
  address?: string;
  identification_number?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  website?: string;
  internal_notes?: string;
  tags: Array<{ id: string; name: string; color: string }>;
  totalExpenses: number;
  totalIncome: number;
  debtAmount: number; // Lo que me deben
  loanAmount: number; // Lo que debo
  created_at: string;
  updated_at: string;
}

export interface CreateContactData {
  name: string;
  contact_type: 'persona' | 'empresa';
  image_url?: string;
  address?: string;
  identification_number?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  website?: string;
  internal_notes?: string;
  tagIds: string[];
}

export interface UpdateContactData {
  name?: string;
  contact_type?: 'persona' | 'empresa';
  image_url?: string;
  address?: string;
  identification_number?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  website?: string;
  internal_notes?: string;
  tagIds?: string[];
}

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchContacts = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch contacts with tags
      const { data: contactsData, error: contactsError } = await supabase
        .from('contacts')
        .select(`
          *,
          contact_tags(
            tags(id, name, color)
          )
        `)
        .eq('user_id', user.id)
        .order('name');

      if (contactsError) throw contactsError;

      const contactIds = (contactsData || []).map(c => c.id);
      if (contactIds.length === 0) {
        setContacts([]);
        return;
      }

      // Expense totals
      const { data: expenseTotals } = await supabase
        .from('transactions')
        .select('contact_id, amount')
        .eq('user_id', user.id)
        .in('contact_id', contactIds)
        .eq('type', 'expense')
        .not('contact_id', 'is', null);

      // Income totals
      const { data: incomeTotals } = await supabase
        .from('transactions')
        .select('payer_contact_id, amount')
        .eq('user_id', user.id)
        .in('payer_contact_id', contactIds)
        .eq('type', 'income')
        .not('payer_contact_id', 'is', null);

      // Debt/loan subcategories
      const DEBT_SUBCATEGORIES = {
        LOANS_INCOME: 'e9fb73a7-86d4-44f0-bb40-dee112a5560d',
        COMMISSION: '6450a480-9d0c-4ae1-a08a-26e5d4b158a2',
        LOANS_EXPENSE: 'e3b4a085-a4da-4b24-b356-fd9a2b3113e5',
      };

      const { data: debtTransactions } = await supabase
        .from('transactions')
        .select('contact_id, payer_contact_id, amount, type, subcategory_id')
        .eq('user_id', user.id)
        .in('subcategory_id', Object.values(DEBT_SUBCATEGORIES))
        .or(`contact_id.in.(${contactIds.join(',')}),payer_contact_id.in.(${contactIds.join(',')})`);

      const expenseMap = new Map<string, number>();
      const incomeMap = new Map<string, number>();
      const debtMap = new Map<string, number>();
      const loanMap = new Map<string, number>();

      (expenseTotals || []).forEach(trx => {
        const contactId = trx.contact_id;
        const amount = Math.abs(Number(trx.amount));
        expenseMap.set(contactId, (expenseMap.get(contactId) || 0) + amount);
      });

      (incomeTotals || []).forEach(trx => {
        const contactId = trx.payer_contact_id;
        const amount = Math.abs(Number(trx.amount));
        incomeMap.set(contactId, (incomeMap.get(contactId) || 0) + amount);
      });

      (debtTransactions || []).forEach(trx => {
        const contactId = trx.contact_id || trx.payer_contact_id;
        if (!contactId) return;
        const amount = Math.abs(Number(trx.amount));
        if (trx.type === 'income' && trx.subcategory_id === DEBT_SUBCATEGORIES.LOANS_INCOME) {
          debtMap.set(contactId, (debtMap.get(contactId) || 0) + amount);
        } else if (
          trx.type === 'expense' &&
          (trx.subcategory_id === DEBT_SUBCATEGORIES.COMMISSION || trx.subcategory_id === DEBT_SUBCATEGORIES.LOANS_EXPENSE)
        ) {
          loanMap.set(contactId, (loanMap.get(contactId) || 0) + amount);
        }
      });

      const contactsWithTotals = (contactsData || []).map(contact => ({
        ...contact,
        contact_type: contact.contact_type as 'persona' | 'empresa',
        tags: Array.isArray(contact.contact_tags)
          ? contact.contact_tags.map((ct: any) => ct.tags).filter(Boolean)
          : [],
        totalExpenses: expenseMap.get(contact.id) || 0,
        totalIncome: incomeMap.get(contact.id) || 0,
        debtAmount: debtMap.get(contact.id) || 0,
        loanAmount: loanMap.get(contact.id) || 0,
      }));

      setContacts(contactsWithTotals);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const createContact = async (contactData: CreateContactData) => {
    if (!user) throw new Error('User not authenticated');

    const { tagIds, ...contactInfo } = contactData;

    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .insert({
        ...contactInfo,
        user_id: user.id,
      })
      .select()
      .single();

    if (contactError) throw contactError;

    if (tagIds.length > 0) {
      const contactTags = tagIds.map(tagId => ({
        contact_id: contact.id,
        tag_id: tagId,
      }));

      const { error: tagsError } = await supabase
        .from('contact_tags')
        .insert(contactTags);

      if (tagsError) throw tagsError;
    }

    await fetchContacts();
  };

  const updateContact = async (contactId: string, updates: UpdateContactData) => {
    if (!user) throw new Error('User not authenticated');

    const { tagIds, ...contactUpdates } = updates;

    const { error: contactError } = await supabase
      .from('contacts')
      .update(contactUpdates)
      .eq('id', contactId)
      .eq('user_id', user.id);

    if (contactError) throw contactError;

    if (tagIds !== undefined) {
      await supabase
        .from('contact_tags')
        .delete()
        .eq('contact_id', contactId);

      if (tagIds.length > 0) {
        const contactTags = tagIds.map(tagId => ({
          contact_id: contactId,
          tag_id: tagId,
        }));

        const { error: tagsError } = await supabase
          .from('contact_tags')
          .insert(contactTags);

        if (tagsError) throw tagsError;
      }
    }

    await fetchContacts();
  };

  const deleteContact = async (contactId: string) => {
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', contactId)
      .eq('user_id', user.id);

    if (error) throw error;

    await fetchContacts();
  };

  useEffect(() => {
    if (user) {
      fetchContacts();
    }
  }, [user]);

  // Suscripciones en tiempo real: contactos y transacciones (para totales)
  useEffect(() => {
    if (!user) return;

    const channels = [
      supabase
        .channel(`rt-contacts-${user.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'contacts', filter: `user_id=eq.${user.id}` },
          () => fetchContacts()
        )
        .subscribe(),
      supabase
        .channel(`rt-contacts-trx-${user.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${user.id}` },
          () => fetchContacts()
        )
        .subscribe(),
      supabase
        .channel(`rt-contact-tags-${user.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'contact_tags' },
          () => fetchContacts()
        )
        .subscribe(),
    ];

    return () => {
      channels.forEach(ch => supabase.removeChannel(ch));
    };
  }, [user]);

  return {
    contacts,
    loading,
    createContact,
    updateContact,
    deleteContact,
    refetch: () => fetchContacts(),
  };
}