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

  const fetchContacts = async (forceRefresh = false) => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch contacts with their tags and transaction totals in a single optimized query
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

      // Get all contact IDs for batch transaction queries
      const contactIds = (contactsData || []).map(c => c.id);
      
      if (contactIds.length === 0) {
        setContacts([]);
        setLoading(false);
        return;
      }

      // Fetch all expense totals in a single query with aggregation
      const { data: expenseTotals, error: expenseError } = await supabase
        .from('transactions')
        .select('contact_id, amount')
        .eq('user_id', user.id)
        .in('contact_id', contactIds)
        .eq('type', 'expense')
        .not('contact_id', 'is', null);

      if (expenseError) {
        console.error('Error fetching expense totals:', expenseError);
      }

      // Fetch all income totals in a single query with aggregation
      const { data: incomeTotals, error: incomeError } = await supabase
        .from('transactions')
        .select('payer_contact_id, amount')
        .eq('user_id', user.id)
        .in('payer_contact_id', contactIds)
        .eq('type', 'income')
        .not('payer_contact_id', 'is', null);

      if (incomeError) {
        console.error('Error fetching income totals:', incomeError);
      }

      // Fetch debt/loan transactions using specific subcategories
      const DEBT_SUBCATEGORIES = {
        LOANS_INCOME: 'e9fb73a7-86d4-44f0-bb40-dee112a5560d',
        COMMISSION: '6450a480-9d0c-4ae1-a08a-26e5d4b158a2',
        LOANS_EXPENSE: 'e3b4a085-a4da-4b24-b356-fd9a2b3113e5',
      };

      const { data: debtTransactions, error: debtError } = await supabase
        .from('transactions')
        .select('contact_id, payer_contact_id, amount, type, subcategory_id')
        .eq('user_id', user.id)
        .in('subcategory_id', Object.values(DEBT_SUBCATEGORIES))
        .or(`contact_id.in.(${contactIds.join(',')}),payer_contact_id.in.(${contactIds.join(',')})`);

      if (debtError) {
        console.error('Error fetching debt transactions:', debtError);
      }

      // Create lookup maps for O(1) access
      const expenseMap = new Map<string, number>();
      const incomeMap = new Map<string, number>();
      const debtMap = new Map<string, number>();
      const loanMap = new Map<string, number>();

      // Aggregate expenses by contact
      (expenseTotals || []).forEach(transaction => {
        const contactId = transaction.contact_id;
        const amount = Math.abs(Number(transaction.amount));
        expenseMap.set(contactId, (expenseMap.get(contactId) || 0) + amount);
      });

      // Aggregate income by contact
      (incomeTotals || []).forEach(transaction => {
        const contactId = transaction.payer_contact_id;
        const amount = Math.abs(Number(transaction.amount));
        incomeMap.set(contactId, (incomeMap.get(contactId) || 0) + amount);
      });

      // Process debt/loan transactions
      (debtTransactions || []).forEach(transaction => {
        const contactId = transaction.contact_id || transaction.payer_contact_id;
        if (!contactId) return;

        const amount = Math.abs(Number(transaction.amount));
        
        // Determine if it's a debt (they owe me) or loan (I owe them)
        if (transaction.type === 'income' && transaction.subcategory_id === DEBT_SUBCATEGORIES.LOANS_INCOME) {
          // Income from loans = They owe me (debt)
          debtMap.set(contactId, (debtMap.get(contactId) || 0) + amount);
        } else if (transaction.type === 'expense' && 
                  (transaction.subcategory_id === DEBT_SUBCATEGORIES.COMMISSION || 
                   transaction.subcategory_id === DEBT_SUBCATEGORIES.LOANS_EXPENSE)) {
          // Expense for loans/commission = I owe them (loan)
          loanMap.set(contactId, (loanMap.get(contactId) || 0) + amount);
        }
      });

      // Map contacts with their totals
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

    // Create contact
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .insert({
        ...contactInfo,
        user_id: user.id,
      })
      .select()
      .single();

    if (contactError) throw contactError;

    // Create contact-tag relationships
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

    // Update contact
    const { error: contactError } = await supabase
      .from('contacts')
      .update(contactUpdates)
      .eq('id', contactId)
      .eq('user_id', user.id);

    if (contactError) throw contactError;

    // Update tags if provided
    if (tagIds !== undefined) {
      // Delete existing tag relationships
      await supabase
        .from('contact_tags')
        .delete()
        .eq('contact_id', contactId);

      // Create new tag relationships
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

    // Delete contact (tags will be deleted by cascade)
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', contactId)
      .eq('user_id', user.id);

    if (error) throw error;

    await fetchContacts();
  };

  // Setup realtime subscriptions
  useEffect(() => {
    if (!user) return;

    fetchContacts();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('contacts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contacts',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Contact change detected:', payload);
          fetchContacts(true);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contact_tags'
        },
        (payload) => {
          console.log('Contact tags change detected:', payload);
          fetchContacts(true);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Transaction change detected (contacts):', payload);
          fetchContacts(true);
        }
      )
      .subscribe((status) => {
        console.log('Contacts subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    contacts,
    loading,
    createContact,
    updateContact,
    deleteContact,
    refetch: () => fetchContacts(true),
  };
}