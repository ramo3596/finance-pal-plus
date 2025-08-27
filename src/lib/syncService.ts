import { supabase } from '@/integrations/supabase/client';
import { cacheService, PendingChange } from './cache';
import type { Database } from '@/integrations/supabase/types';

export interface SyncResult {
  success: boolean;
  uploadedCount: number;
  downloadedCount: number;
  errors: string[];
}

export class SyncService {
  private static instance: SyncService;
  
  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  // Upload pending local changes to Supabase
  async uploadPendingChanges(userId: string): Promise<{ success: boolean; uploadedCount: number; errors: string[] }> {
    const pendingChanges = await cacheService.getPendingChanges();
    const errors: string[] = [];
    let uploadedCount = 0;

    console.log(`Found ${pendingChanges.length} pending changes to upload`);

    for (const change of pendingChanges) {
      try {
        await this.uploadSingleChange(change, userId);
        await cacheService.removePendingChange(change.id);
        uploadedCount++;
        console.log(`Successfully uploaded change: ${change.operation} on ${change.store}`);
      } catch (error: any) {
        const errorMsg = `Failed to upload ${change.operation} on ${change.store}: ${error.message}`;
        errors.push(errorMsg);
        console.error(errorMsg, error);
      }
    }

    return {
      success: errors.length === 0,
      uploadedCount,
      errors
    };
  }

  // Upload a single change to Supabase
  private async uploadSingleChange(change: PendingChange, userId: string): Promise<void> {
    const { store, operation, data, originalId } = change;
    
    // Ensure data has user_id
    const dataWithUserId = { ...data, user_id: userId };

    switch (operation) {
      case 'create':
        await this.handleCreateOperation(store, dataWithUserId);
        break;

      case 'update':
        if (!originalId) {
          throw new Error('Original ID required for update operation');
        }
        await this.handleUpdateOperation(store, dataWithUserId, originalId, userId);
        break;

      case 'delete':
        if (!originalId) {
          throw new Error('Original ID required for delete operation');
        }
        await this.handleDeleteOperation(store, originalId, userId);
        break;

      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }

  private async handleCreateOperation(store: string, data: any): Promise<void> {
    switch (store) {
      case 'transactions':
        const { error: transactionError } = await supabase.from('transactions').insert(data);
        if (transactionError) throw transactionError;
        break;
      case 'products':
        const { error: productError } = await supabase.from('products').insert(data);
        if (productError) throw productError;
        break;
      case 'contacts':
        const { error: contactError } = await supabase.from('contacts').insert(data);
        if (contactError) throw contactError;
        break;
      case 'accounts':
        const { error: accountError } = await supabase.from('accounts').insert(data);
        if (accountError) throw accountError;
        break;
      case 'categories':
        const { error: categoryError } = await supabase.from('categories').insert(data);
        if (categoryError) throw categoryError;
        break;
      case 'tags':
        const { error: tagError } = await supabase.from('tags').insert(data);
        if (tagError) throw tagError;
        break;
      case 'scheduled_payments':
        const { error: scheduledError } = await supabase.from('scheduled_payments').insert(data);
        if (scheduledError) throw scheduledError;
        break;
      case 'debts':
        const { error: debtError } = await supabase.from('debts').insert(data);
        if (debtError) throw debtError;
        break;
      default:
        throw new Error(`Unknown store: ${store}`);
    }
  }

  private async handleUpdateOperation(store: string, data: any, originalId: string, userId: string): Promise<void> {
    switch (store) {
      case 'transactions':
        const { error: transactionError } = await supabase
          .from('transactions')
          .update(data)
          .eq('id', originalId)
          .eq('user_id', userId);
        if (transactionError) throw transactionError;
        break;
      case 'products':
        const { error: productError } = await supabase
          .from('products')
          .update(data)
          .eq('id', originalId)
          .eq('user_id', userId);
        if (productError) throw productError;
        break;
      case 'contacts':
        const { error: contactError } = await supabase
          .from('contacts')
          .update(data)
          .eq('id', originalId)
          .eq('user_id', userId);
        if (contactError) throw contactError;
        break;
      case 'accounts':
        const { error: accountError } = await supabase
          .from('accounts')
          .update(data)
          .eq('id', originalId)
          .eq('user_id', userId);
        if (accountError) throw accountError;
        break;
      case 'categories':
        const { error: categoryError } = await supabase
          .from('categories')
          .update(data)
          .eq('id', originalId)
          .eq('user_id', userId);
        if (categoryError) throw categoryError;
        break;
      case 'tags':
        const { error: tagError } = await supabase
          .from('tags')
          .update(data)
          .eq('id', originalId)
          .eq('user_id', userId);
        if (tagError) throw tagError;
        break;
      case 'scheduled_payments':
        const { error: scheduledError } = await supabase
          .from('scheduled_payments')
          .update(data)
          .eq('id', originalId)
          .eq('user_id', userId);
        if (scheduledError) throw scheduledError;
        break;
      case 'debts':
        const { error: debtError } = await supabase
          .from('debts')
          .update(data)
          .eq('id', originalId)
          .eq('user_id', userId);
        if (debtError) throw debtError;
        break;
      default:
        throw new Error(`Unknown store: ${store}`);
    }
  }

  private async handleDeleteOperation(store: string, originalId: string, userId: string): Promise<void> {
    switch (store) {
      case 'transactions':
        const { error: transactionError } = await supabase
          .from('transactions')
          .delete()
          .eq('id', originalId)
          .eq('user_id', userId);
        if (transactionError) throw transactionError;
        break;
      case 'products':
        const { error: productError } = await supabase
          .from('products')
          .delete()
          .eq('id', originalId)
          .eq('user_id', userId);
        if (productError) throw productError;
        break;
      case 'contacts':
        const { error: contactError } = await supabase
          .from('contacts')
          .delete()
          .eq('id', originalId)
          .eq('user_id', userId);
        if (contactError) throw contactError;
        break;
      case 'accounts':
        const { error: accountError } = await supabase
          .from('accounts')
          .delete()
          .eq('id', originalId)
          .eq('user_id', userId);
        if (accountError) throw accountError;
        break;
      case 'categories':
        const { error: categoryError } = await supabase
          .from('categories')
          .delete()
          .eq('id', originalId)
          .eq('user_id', userId);
        if (categoryError) throw categoryError;
        break;
      case 'tags':
        const { error: tagError } = await supabase
          .from('tags')
          .delete()
          .eq('id', originalId)
          .eq('user_id', userId);
        if (tagError) throw tagError;
        break;
      case 'scheduled_payments':
        const { error: scheduledError } = await supabase
          .from('scheduled_payments')
          .delete()
          .eq('id', originalId)
          .eq('user_id', userId);
        if (scheduledError) throw scheduledError;
        break;
      case 'debts':
        const { error: debtError } = await supabase
          .from('debts')
          .delete()
          .eq('id', originalId)
          .eq('user_id', userId);
        if (debtError) throw debtError;
        break;
      default:
        throw new Error(`Unknown store: ${store}`);
    }
  }

  // Download fresh data from Supabase and repopulate cache
  async downloadAndCacheData(userId: string): Promise<{ success: boolean; downloadedCount: number; errors: string[] }> {
    const errors: string[] = [];
    let downloadedCount = 0;

    // Download transactions
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      if (data && data.length > 0) {
        for (const record of data) {
          await cacheService.set('transactions', record.id, record, 24 * 60 * 60 * 1000);
        }
        downloadedCount += data.length;
        console.log(`Downloaded and cached ${data.length} records from transactions`);
      }
    } catch (error: any) {
      const errorMsg = `Failed to download data from transactions: ${error.message}`;
      errors.push(errorMsg);
      console.error(errorMsg, error);
    }

    // Download products
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      if (data && data.length > 0) {
        for (const record of data) {
          await cacheService.set('products', record.id, record, 24 * 60 * 60 * 1000);
        }
        downloadedCount += data.length;
        console.log(`Downloaded and cached ${data.length} records from products`);
      }
    } catch (error: any) {
      const errorMsg = `Failed to download data from products: ${error.message}`;
      errors.push(errorMsg);
      console.error(errorMsg, error);
    }

    // Download contacts
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      if (data && data.length > 0) {
        for (const record of data) {
          await cacheService.set('contacts', record.id, record, 24 * 60 * 60 * 1000);
        }
        downloadedCount += data.length;
        console.log(`Downloaded and cached ${data.length} records from contacts`);
      }
    } catch (error: any) {
      const errorMsg = `Failed to download data from contacts: ${error.message}`;
      errors.push(errorMsg);
      console.error(errorMsg, error);
    }

    // Download accounts
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      if (data && data.length > 0) {
        for (const record of data) {
          await cacheService.set('accounts', record.id, record, 24 * 60 * 60 * 1000);
        }
        downloadedCount += data.length;
        console.log(`Downloaded and cached ${data.length} records from accounts`);
      }
    } catch (error: any) {
      const errorMsg = `Failed to download data from accounts: ${error.message}`;
      errors.push(errorMsg);
      console.error(errorMsg, error);
    }

    // Download categories
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      if (data && data.length > 0) {
        for (const record of data) {
          await cacheService.set('categories', record.id, record, 24 * 60 * 60 * 1000);
        }
        downloadedCount += data.length;
        console.log(`Downloaded and cached ${data.length} records from categories`);
      }
    } catch (error: any) {
      const errorMsg = `Failed to download data from categories: ${error.message}`;
      errors.push(errorMsg);
      console.error(errorMsg, error);
    }

    // Download tags
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      if (data && data.length > 0) {
        for (const record of data) {
          await cacheService.set('tags', record.id, record, 24 * 60 * 60 * 1000);
        }
        downloadedCount += data.length;
        console.log(`Downloaded and cached ${data.length} records from tags`);
      }
    } catch (error: any) {
      const errorMsg = `Failed to download data from tags: ${error.message}`;
      errors.push(errorMsg);
      console.error(errorMsg, error);
    }

    // Download scheduled_payments
    try {
      const { data, error } = await supabase
        .from('scheduled_payments')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      if (data && data.length > 0) {
        for (const record of data) {
          await cacheService.set('scheduled_payments', record.id, record, 24 * 60 * 60 * 1000);
        }
        downloadedCount += data.length;
        console.log(`Downloaded and cached ${data.length} records from scheduled_payments`);
      }
    } catch (error: any) {
      const errorMsg = `Failed to download data from scheduled_payments: ${error.message}`;
      errors.push(errorMsg);
      console.error(errorMsg, error);
    }

    // Download debts
    try {
      const { data, error } = await supabase
        .from('debts')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      if (data && data.length > 0) {
        for (const record of data) {
          await cacheService.set('debts', record.id, record, 24 * 60 * 60 * 1000);
        }
        downloadedCount += data.length;
        console.log(`Downloaded and cached ${data.length} records from debts`);
      }
    } catch (error: any) {
      const errorMsg = `Failed to download data from debts: ${error.message}`;
      errors.push(errorMsg);
      console.error(errorMsg, error);
    }

    return {
      success: errors.length === 0,
      downloadedCount,
      errors
    };
  }

  // Complete bidirectional sync process with rollback support
  async performBidirectionalSync(userId: string): Promise<SyncResult> {
    console.log('Starting bidirectional sync...');
    
    // Create a backup of pending changes before starting
    let pendingChangesBackup: PendingChange[] = [];
    let cacheCleared = false;
    
    try {
      // Backup pending changes for potential rollback
      pendingChangesBackup = await cacheService.getPendingChanges();
      console.log(`Backed up ${pendingChangesBackup.length} pending changes`);
      
      // Step 1: Upload pending local changes
      console.log('Step 1: Uploading pending changes...');
      const uploadResult = await this.uploadPendingChanges(userId);
      
      if (!uploadResult.success) {
        console.warn('Upload failed, but keeping local changes for retry');
        return {
          success: false,
          uploadedCount: uploadResult.uploadedCount,
          downloadedCount: 0,
          errors: [...uploadResult.errors, 'Sincronización interrumpida: los cambios locales se mantuvieron para reintento']
        };
      }

      // Step 2: Clear all cache (except pending_changes which should be empty now)
      console.log('Step 2: Clearing local cache...');
      const stores = ['transactions', 'products', 'contacts', 'accounts', 'categories', 'tags', 'scheduled_payments', 'debts', 'dashboard_cards'];
      
      try {
        for (const store of stores) {
          await cacheService.clear(store as any);
        }
        cacheCleared = true;
        console.log('Cache cleared successfully');
      } catch (clearError: any) {
        console.error('Failed to clear cache:', clearError);
        throw new Error(`Error al limpiar caché local: ${clearError.message}`);
      }

      // Step 3: Download fresh data from Supabase
      console.log('Step 3: Downloading fresh data...');
      const downloadResult = await this.downloadAndCacheData(userId);

      if (!downloadResult.success) {
        console.error('Download failed after cache was cleared');
        return {
          success: false,
          uploadedCount: uploadResult.uploadedCount,
          downloadedCount: downloadResult.downloadedCount,
          errors: [...downloadResult.errors, 'Advertencia: caché local fue limpiado pero la descarga falló parcialmente']
        };
      }

      console.log('Bidirectional sync completed successfully');
      return {
        success: true,
        uploadedCount: uploadResult.uploadedCount,
        downloadedCount: downloadResult.downloadedCount,
        errors: []
      };

    } catch (error: any) {
      console.error('Bidirectional sync failed:', error);
      
      // Attempt rollback if cache was cleared but sync failed
      if (cacheCleared && pendingChangesBackup.length > 0) {
        console.log('Attempting to restore pending changes after sync failure...');
        try {
          // Restore pending changes
          for (const change of pendingChangesBackup) {
            await cacheService.addPendingChange({
              store: change.store,
              operation: change.operation,
              data: change.data,
              originalId: change.originalId
            });
          }
          console.log(`Restored ${pendingChangesBackup.length} pending changes`);
          
          return {
            success: false,
            uploadedCount: 0,
            downloadedCount: 0,
            errors: [
              error.message || 'Error desconocido durante sincronización',
              `Se restauraron ${pendingChangesBackup.length} cambios locales pendientes`
            ]
          };
        } catch (rollbackError: any) {
          console.error('Rollback failed:', rollbackError);
          return {
            success: false,
            uploadedCount: 0,
            downloadedCount: 0,
            errors: [
              error.message || 'Error desconocido durante sincronización',
              `Error crítico: no se pudieron restaurar ${pendingChangesBackup.length} cambios locales: ${rollbackError.message}`
            ]
          };
        }
      }
      
      return {
        success: false,
        uploadedCount: 0,
        downloadedCount: 0,
        errors: [error.message || 'Error desconocido durante sincronización']
      };
    }
  }
}

// Export singleton instance
export const syncService = SyncService.getInstance();