import { supabase } from '@/integrations/supabase/client';
import { cacheService } from './cache';

export interface ContactTag {
  contact_id: string;
  tag_id: string;
  id?: string; // Composite ID for IndexedDB
}

class ContactTagsAutoSyncService {
  private syncInterval: NodeJS.Timeout | null = null;
  private readonly SYNC_INTERVAL_MS = 30000; // 30 seconds

  /**
   * Inicia la sincronización automática de contact_tags
   */
  startAutoSync(): void {
    // Sincronización inicial
    this.syncContactTags();
    
    // Configurar sincronización periódica
    this.syncInterval = setInterval(() => {
      this.syncContactTags();
    }, this.SYNC_INTERVAL_MS);
  }

  /**
   * Detiene la sincronización automática
   */
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Sincroniza contact_tags directamente desde Supabase
   */
  private async syncContactTags(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('contact_tags')
        .select('*');

      if (error) {
        console.error('Error syncing contact_tags:', error);
        return;
      }

      if (data && data.length > 0) {
        // Agregar ID compuesto para IndexedDB
        const contactTagsWithId = data.map(tag => ({
          ...tag,
          id: `${tag.contact_id}-${tag.tag_id}`
        }));

        // Actualizar caché local
        await cacheService.set('contact_tags', contactTagsWithId);
      } else {
        // Si no hay datos, limpiar caché
        await cacheService.set('contact_tags', []);
      }
    } catch (error) {
      console.error('Error in contact_tags auto sync:', error);
    }
  }

  /**
   * Obtiene contact_tags directamente desde Supabase (consulta en tiempo real)
   */
  async getContactTagsRealTime(): Promise<ContactTag[]> {
    try {
      const { data, error } = await supabase
        .from('contact_tags')
        .select('*');

      if (error) {
        console.error('Error fetching contact_tags in real-time:', error);
        return [];
      }

      if (data) {
        // Agregar ID compuesto para compatibilidad
        return data.map(tag => ({
          ...tag,
          id: `${tag.contact_id}-${tag.tag_id}`
        }));
      }

      return [];
    } catch (error) {
      console.error('Error in real-time contact_tags fetch:', error);
      return [];
    }
  }

  /**
   * Obtiene etiquetas de un contacto específico en tiempo real
   */
  async getContactTagsByContactId(contactId: string): Promise<ContactTag[]> {
    try {
      const { data, error } = await supabase
        .from('contact_tags')
        .select('*')
        .eq('contact_id', contactId);

      if (error) {
        console.error('Error fetching contact tags by contact ID:', error);
        return [];
      }

      if (data) {
        return data.map(tag => ({
          ...tag,
          id: `${tag.contact_id}-${tag.tag_id}`
        }));
      }

      return [];
    } catch (error) {
      console.error('Error in contact tags fetch by contact ID:', error);
      return [];
    }
  }

  /**
   * Fuerza una sincronización inmediata
   */
  async forcSync(): Promise<void> {
    await this.syncContactTags();
  }
}

export const contactTagsAutoSync = new ContactTagsAutoSyncService();