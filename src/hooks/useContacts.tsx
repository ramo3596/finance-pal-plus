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

      // Fetch contacts with their tags
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

      // Fetch transaction totals for each contact
      const contactsWithTotals = await Promise.all(
        (contactsData || []).map(async (contact) => {
          // Get expenses (where this contact is the beneficiary - contact_id field)
          const { data: expenseData, error: expenseError } = await supabase
            .from('transactions')
            .select('amount')
            .eq('user_id', user.id)
            .eq('contact_id', contact.id)
            .eq('type', 'expense');

          if (expenseError) {
            console.error('Error fetching expense data for contact:', contact.id, expenseError);
          }

          // Get income (where this contact is the payer - payer_contact_id field)
          const { data: incomeData, error: incomeError } = await supabase
            .from('transactions')
            .select('amount')
            .eq('user_id', user.id)
            .eq('payer_contact_id', contact.id)
            .eq('type', 'income');

          if (incomeError) {
            console.error('Error fetching income data for contact:', contact.id, incomeError);
          }

          // Calculate totals
          const totalExpenses = expenseData?.reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0) || 0;
          const totalIncome = incomeData?.reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0) || 0;

          return {
            ...contact,
            contact_type: contact.contact_type as 'persona' | 'empresa',
            tags: Array.isArray(contact.contact_tags) 
              ? contact.contact_tags.map((ct: any) => ct.tags).filter(Boolean) 
              : [],
            totalExpenses,
            totalIncome,
          };
        })
      );

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

  useEffect(() => {
    if (user) {
      fetchContacts();
    }
  }, [user]);

  return {
    contacts,
    loading,
    createContact,
    updateContact,
    deleteContact,
    refetch: fetchContacts,
  };
}