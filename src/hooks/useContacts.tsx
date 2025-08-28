import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { cacheService } from "@/lib/cache";
import { contactTagsAutoSync } from "@/lib/contactTagsAutoSync";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

  const loadContactTags = async (contactId: string) => {
    try {
      // Obtener etiquetas en tiempo real desde Supabase
      const contactTags = await contactTagsAutoSync.getContactTagsByContactId(contactId);
      const cachedTags = await cacheService.get('tags').catch(() => []);
      
      // Mapear las etiquetas con su información completa
      return contactTags.map(ct => {
        const tag = cachedTags.find((t: any) => t.id === ct.tag_id);
        return tag ? { id: tag.id, name: tag.name, color: tag.color } : null;
      }).filter(Boolean);
    } catch (error) {
      console.error('Error loading contact tags:', error);
      return [];
    }
  };

  const fetchContacts = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Load contacts from cache with individual error handling
      const cachedContacts = await cacheService.get('contacts').catch(err => {
        console.warn('Error loading contacts from cache:', err);
        return [];
      });
      
      const cachedTransactions = await cacheService.get('transactions').catch(err => {
        console.warn('Error loading transactions from cache:', err);
        return [];
      });
      
      // Filter contacts by user_id and calculate totals
      const userContacts = await Promise.all(
        cachedContacts
          .filter((contact: any) => contact.user_id === user.id)
          .map(async (contact: any) => {
            // Calculate totals from cached transactions
            const expenseTransactions = cachedTransactions.filter((t: any) => 
              t.user_id === user.id && t.contact_id === contact.id && t.type === 'expense'
            );
            const incomeTransactions = cachedTransactions.filter((t: any) => 
              t.user_id === user.id && t.payer_contact_id === contact.id && t.type === 'income'
            );

            const totalExpenses = expenseTransactions.reduce((sum: number, t: any) => sum + Math.abs(Number(t.amount)), 0);
            const totalIncome = incomeTransactions.reduce((sum: number, t: any) => sum + Math.abs(Number(t.amount)), 0);

            // Cargar etiquetas en tiempo real
            const tags = await loadContactTags(contact.id);

            return {
              ...contact,
              contact_type: contact.contact_type as 'persona' | 'empresa',
              tags,
              totalExpenses,
              totalIncome,
            };
          })
      );

      const sortedContacts = userContacts.sort((a: any, b: any) => a.name.localeCompare(b.name));
      setContacts(sortedContacts);
    } catch (error) {
      console.error('Error loading contacts from cache:', error);
      toast.error('Error al cargar contactos desde caché');
    } finally {
      setLoading(false);
    }
  };

  const createContact = async (contactData: CreateContactData) => {
    if (!user) throw new Error('User not authenticated');

    const { tagIds, ...contactInfo } = contactData;

    // Create contact with cache
    const newContact = {
      id: crypto.randomUUID(),
      ...contactInfo,
      user_id: user.id,
      tags: [],
      totalExpenses: 0,
      totalIncome: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Get tags from cache and add them to contact
    if (tagIds.length > 0) {
      const cachedTags = await cacheService.get('tags') || [];
      newContact.tags = cachedTags.filter((tag: any) => tagIds.includes(tag.id));
    }

    // Update cache
    await cacheService.updateCacheItem('contacts', newContact);
    
    // Register pending change for contact
    await cacheService.addPendingChange({
      table: 'contacts',
      operation: 'create',
      record_id: newContact.id,
      data: newContact
    });

    // Register pending changes for contact tags
    if (tagIds.length > 0) {
      for (const tagId of tagIds) {
        const contactTagData = {
          id: `${newContact.id}-${tagId}`,
          contact_id: newContact.id,
          tag_id: tagId
        };
        
        // Add to contact_tags cache
        await cacheService.updateCacheItem('contact_tags', contactTagData);
        
        await cacheService.addPendingChange({
          table: 'contact_tags',
          operation: 'create',
          record_id: `${newContact.id}-${tagId}`,
          data: contactTagData
        });
      }
    }

    await fetchContacts();
  };

  const updateContact = async (contactId: string, updates: UpdateContactData) => {
    if (!user) throw new Error('User not authenticated');

    const { tagIds, ...contactUpdates } = updates;

    // First, verify if the contact exists in Supabase
    const { data: existingContact, error: fetchError } = await supabase
      .from('contacts')
      .select('id')
      .eq('id', contactId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingContact) {
      toast.error('Por favor primero cree el contacto');
      return;
    }

    // Get current contact from cache
    const cachedContacts = await cacheService.get('contacts') || [];
    const contactIndex = cachedContacts.findIndex((c: any) => c.id === contactId && c.user_id === user.id);
    
    if (contactIndex === -1) {
      throw new Error('Contact not found in cache');
    }

    const updatedContact = {
      ...cachedContacts[contactIndex],
      ...contactUpdates,
      updated_at: new Date().toISOString(),
    };

    // Update tags if provided
    if (tagIds !== undefined) {
      const cachedTags = await cacheService.get('tags') || [];
      updatedContact.tags = cachedTags.filter((tag: any) => tagIds.includes(tag.id));
    }

    // Update cache
    cachedContacts[contactIndex] = updatedContact;
    await cacheService.set('contacts', cachedContacts);
    
    // Register pending change for contact
    await cacheService.addPendingChange({
      table: 'contacts',
      operation: 'update',
      record_id: contactId,
      data: updatedContact
    });

    // Handle contact tags changes if provided - use direct Supabase sync
    if (tagIds !== undefined) {
      try {
        // Delete existing contact tags from Supabase
        const { error: deleteError } = await supabase
          .from('contact_tags')
          .delete()
          .eq('contact_id', contactId);

        if (deleteError) {
          console.error('Error deleting contact tags:', deleteError);
          toast.error('Error al actualizar etiquetas');
          return;
        }

        // Add new tags to Supabase
        if (tagIds.length > 0) {
          const contactTagsData = tagIds.map(tagId => ({
            contact_id: contactId,
            tag_id: tagId
          }));

          const { error: insertError } = await supabase
            .from('contact_tags')
            .insert(contactTagsData);

          if (insertError) {
            console.error('Error inserting contact tags:', insertError);
            toast.error('Error al actualizar etiquetas');
            return;
          }
        }

        // The contactTagsAutoSync service will handle cache updates automatically
        toast.success('Etiquetas actualizadas correctamente');
      } catch (error) {
        console.error('Error updating contact tags:', error);
        toast.error('Error al actualizar etiquetas');
        return;
      }
    }

    await fetchContacts();
  };

  const deleteContact = async (contactId: string) => {
    if (!user) throw new Error('User not authenticated');

    // Get contact from cache before deleting
    const cachedContacts = await cacheService.get('contacts') || [];
    const contactToDelete = cachedContacts.find((c: any) => c.id === contactId && c.user_id === user.id);
    
    if (!contactToDelete) {
      throw new Error('Contact not found');
    }

    // Remove from cache
    await cacheService.deleteCacheItem('contacts', contactId);
    
    // Register pending change for contact
    await cacheService.addPendingChange({
      table: 'contacts',
      operation: 'delete',
      record_id: contactId,
      data: { id: contactId, user_id: user.id }
    });

    // Register pending changes to delete contact tags
    if (contactToDelete.tags && contactToDelete.tags.length > 0) {
      for (const tag of contactToDelete.tags) {
        // Remove from contact_tags cache
        await cacheService.deleteCacheItem('contact_tags', `${contactId}-${tag.id}`);
        
        await cacheService.addPendingChange({
          table: 'contact_tags',
          operation: 'delete',
          record_id: `${contactId}-${tag.id}`,
          data: {
            contact_id: contactId,
            tag_id: tag.id
          }
        });
      }
    }

    await fetchContacts();
  };

  useEffect(() => {
    if (user) {
      fetchContacts();
      // Iniciar sincronización automática de etiquetas de contactos
      contactTagsAutoSync.startAutoSync();
    }
    
    // Cleanup: detener sincronización automática al desmontar
    return () => {
      contactTagsAutoSync.stopAutoSync();
    };
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