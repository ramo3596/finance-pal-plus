import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { useCachedContacts } from './useCache';

export interface Contact {
  id: string;
  user_id: string;
  name: string;
  contact_type: 'customer' | 'supplier' | 'both';
  email?: string;
  phone?: string;
  mobile?: string;
  address?: string;
  website?: string;
  identification_number?: string;
  image_url?: string;
  internal_notes?: string;
  created_at: string;
  updated_at: string;
  // Related data
  tags?: {
    id: string;
    name: string;
    color: string;
  }[];
  total_expenses?: number;
  total_income?: number;
}

export interface CreateContactData {
  name: string;
  contact_type: 'customer' | 'supplier' | 'both';
  email?: string;
  phone?: string;
  mobile?: string;
  address?: string;
  website?: string;
  identification_number?: string;
  image_url?: string;
  internal_notes?: string;
  tag_ids?: string[];
}

export interface UpdateContactData {
  name?: string;
  contact_type?: 'customer' | 'supplier' | 'both';
  email?: string;
  phone?: string;
  mobile?: string;
  address?: string;
  website?: string;
  identification_number?: string;
  image_url?: string;
  internal_notes?: string;
  tag_ids?: string[];
}

export function useCachedContactsHook() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  const fetchContactsFromDB = async (): Promise<Contact[]> => {
    if (!user) return [];

    try {
      // Fetch contacts with tags
      const { data: contactsData, error: contactsError } = await supabase
        .from('contacts')
        .select(`
          *,
          contact_tags (
            tags (
              id,
              name,
              color
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (contactsError) throw contactsError;

      // Calculate totals for each contact
      const contactsWithTotals = await Promise.all(
        (contactsData || []).map(async (contact: any) => {
          // Get expense total
          const { data: expenseData } = await supabase
            .from('transactions')
            .select('amount')
            .eq('user_id', user.id)
            .eq('contact_id', contact.id)
            .eq('type', 'expense');

          // Get income total
          const { data: incomeData } = await supabase
            .from('transactions')
            .select('amount')
            .eq('user_id', user.id)
            .eq('payer_contact_id', contact.id)
            .eq('type', 'income');

          const total_expenses = expenseData?.reduce((sum: number, t: any) => sum + (t.amount || 0), 0) || 0;
          const total_income = incomeData?.reduce((sum: number, t: any) => sum + (t.amount || 0), 0) || 0;

          return {
            ...contact,
            tags: contact.contact_tags?.map((ct: any) => ct.tags) || [],
            total_expenses,
            total_income,
          };
        })
      );

      return contactsWithTotals;
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast.error('Error al cargar los contactos');
      throw error;
    }
  };

  const cachedContacts = useCachedContacts(fetchContactsFromDB);
  const contacts = cachedContacts.data || [];

  const isLoading = loading || cachedContacts.loading;

  const createContact = async (contactData: CreateContactData) => {
    if (!user) return;

    try {
      const { tag_ids, ...contactInfo } = contactData;

      const { data, error } = await supabase
        .from('contacts')
        .insert([{
          ...contactInfo,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      // Associate tags if provided
      if (tag_ids && tag_ids.length > 0) {
        const tagAssociations = tag_ids.map(tagId => ({
          contact_id: data.id,
          tag_id: tagId
        }));

        const { error: tagError } = await supabase
          .from('contact_tags')
          .insert(tagAssociations);

        if (tagError) throw tagError;
      }

      // Update cache with new contact
      const newContacts = [{ ...data, tags: [], total_expenses: 0, total_income: 0 }, ...contacts];
      await cachedContacts.updateCache(newContacts);

      toast.success('Contacto creado exitosamente');
      return data;
    } catch (error) {
      console.error('Error creating contact:', error);
      toast.error('Error al crear el contacto');
      throw error;
    }
  };

  const updateContact = async (contactId: string, updates: UpdateContactData) => {
    try {
      const { tag_ids, ...contactUpdates } = updates;

      const { error } = await supabase
        .from('contacts')
        .update(contactUpdates)
        .eq('id', contactId);

      if (error) throw error;

      // Update tags if provided
      if (tag_ids !== undefined) {
        // Remove existing tags
        await supabase
          .from('contact_tags')
          .delete()
          .eq('contact_id', contactId);

        // Add new tags
        if (tag_ids.length > 0) {
          const tagAssociations = tag_ids.map(tagId => ({
            contact_id: contactId,
            tag_id: tagId
          }));

          const { error: tagError } = await supabase
            .from('contact_tags')
            .insert(tagAssociations);

          if (tagError) throw tagError;
        }
      }

      // Update cache
      const updatedContacts = contacts.map(c => 
        c.id === contactId ? { ...c, ...contactUpdates } : c
      );
      await cachedContacts.updateCache(updatedContacts);

      toast.success('Contacto actualizado');
    } catch (error) {
      console.error('Error updating contact:', error);
      toast.error('Error al actualizar el contacto');
      throw error;
    }
  };

  const deleteContact = async (contactId: string) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contactId);

      if (error) throw error;

      // Update cache
      const updatedContacts = contacts.filter(c => c.id !== contactId);
      await cachedContacts.updateCache(updatedContacts);

      toast.success('Contacto eliminado');
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast.error('Error al eliminar el contacto');
      throw error;
    }
  };

  const refetch = async () => {
    await cachedContacts.refresh();
  };

  useEffect(() => {
    if (user) {
      setLoading(false);
    }
  }, [user]);

  return {
    contacts,
    loading: isLoading,
    createContact,
    updateContact,
    deleteContact,
    refetch,
  };
}