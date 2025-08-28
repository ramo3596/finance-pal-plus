// Synchronization service for bidirectional data sync with Supabase

import { supabase } from '@/integrations/supabase/client';
import { cacheService, PendingChange } from './cache';

export interface SyncResult {
  success: boolean;
  uploadedChanges: number;
  downloadedRecords: number;
  errors: string[];
}

class SyncService {
  private readonly tables = [
    'transactions', 'accounts', 'categories', 'tags',
    'contacts', 'contact_tags', 'debts', 'scheduled_payments', 'products'
  ];

  async init(): Promise<void> {
    await cacheService.init();
  }

  async performFullSync(): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      uploadedChanges: 0,
      downloadedRecords: 0,
      errors: []
    };

    try {
      // Step 1: Upload pending local changes
      const uploadResult = await this.uploadPendingChanges();
      result.uploadedChanges = uploadResult.uploadedChanges;
      result.errors.push(...uploadResult.errors);

      // Only proceed to download if upload was successful or had no changes
      if (uploadResult.success || uploadResult.uploadedChanges === 0) {
        // Step 2: Clear local cache and download fresh data
        const downloadResult = await this.downloadAllData();
        result.downloadedRecords = downloadResult.downloadedRecords;
        result.errors.push(...downloadResult.errors);
        result.success = downloadResult.success;
      } else {
        result.errors.push('Upload failed, skipping download to prevent data loss');
      }
    } catch (error) {
      result.errors.push(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  private async uploadPendingChanges(): Promise<{ success: boolean; uploadedChanges: number; errors: string[] }> {
    const result = { success: true, uploadedChanges: 0, errors: [] as string[] };

    try {
      const pendingChanges = await cacheService.getPendingChanges();
      
      if (pendingChanges.length === 0) {
        return result;
      }

      // Group changes by table and operation for batch processing
      const changesByTable = this.groupChangesByTable(pendingChanges);

      for (const [tableName, changes] of Object.entries(changesByTable)) {
        try {
          await this.processTableChanges(tableName, changes);
          result.uploadedChanges += changes.length;
        } catch (error) {
          result.success = false;
          result.errors.push(`Failed to sync ${tableName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Clear pending changes only if all uploads were successful
      if (result.success) {
        await cacheService.clearPendingChanges();
      }
    } catch (error) {
      result.success = false;
      result.errors.push(`Upload preparation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  private async downloadAllData(): Promise<{ success: boolean; downloadedRecords: number; errors: string[] }> {
    const result = { success: true, downloadedRecords: 0, errors: [] as string[] };

    try {
      // Clear all cached data first
      await cacheService.clearAll();

      // Download fresh data for each table using correct table names
      const tableDownloads = [
        this.downloadTableData('transactions'),
        this.downloadTableData('accounts'),
        this.downloadTableData('categories'),
        this.downloadTableData('tags'),
        this.downloadTableData('contacts'),
        this.downloadTableData('contact_tags'), // This was missing and was using 'inventory' instead
        this.downloadTableData('debts'),
        this.downloadTableData('scheduled_payments'),
        this.downloadTableData('products') // Changed from 'inventory' to 'products'
      ];

      const results = await Promise.allSettled(tableDownloads);
      
      results.forEach((tableResult, index) => {
        const tableName = this.tables[index];
        if (tableResult.status === 'fulfilled') {
          result.downloadedRecords += tableResult.value;
        } else {
          result.errors.push(`Error downloading ${tableName}: ${tableResult.reason}`);
          result.success = false;
        }
      });
    } catch (error) {
      result.success = false;
      result.errors.push(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  private async downloadTableData(tableName: string): Promise<number> {
    console.log(`Downloading data for table: ${tableName}`);
    
    const { data, error } = await (supabase as any)
      .from(tableName)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error(`Failed to download ${tableName}:`, error);
      throw new Error(`Failed to download ${tableName}: ${error.message}`);
    }

    if (data && data.length > 0) {
      console.log(`Downloaded ${data.length} records for ${tableName}`);
      await cacheService.set(tableName as any, data);
      return data.length;
    }

    console.log(`No data found for table: ${tableName}`);
    return 0;
  }

  private groupChangesByTable(changes: PendingChange[]): Record<string, PendingChange[]> {
    return changes.reduce((acc, change) => {
      if (!acc[change.table]) {
        acc[change.table] = [];
      }
      acc[change.table].push(change);
      return acc;
    }, {} as Record<string, PendingChange[]>);
  }

  private async processTableChanges(tableName: string, changes: PendingChange[]): Promise<void> {
    // Sort changes by timestamp to maintain order
    const sortedChanges = changes.sort((a, b) => a.timestamp - b.timestamp);

    for (const change of sortedChanges) {
      try {
        switch (change.operation) {
          case 'create':
            await this.createRecord(tableName, change.data);
            break;
          case 'update':
            await this.updateRecord(tableName, change.record_id, change.data);
            break;
          case 'delete':
            await this.deleteRecord(tableName, change.record_id);
            break;
        }
      } catch (error) {
        throw new Error(`Failed to ${change.operation} record ${change.record_id} in ${tableName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  private cleanDataForTable(tableName: string, data: any): any {
    const cleanedData = { ...data };
    
    // Remove computed/virtual fields that don't exist in Supabase tables
    switch (tableName) {
      case 'contacts':
        // Remove virtual fields that are computed on the frontend
        delete cleanedData.tags;
        delete cleanedData.totalExpenses;
        delete cleanedData.totalIncome;
        break;
      case 'products':
        // Remove any virtual fields for products if they exist
        delete cleanedData.category;
        delete cleanedData.subcategory;
        break;
      case 'transactions':
        // Remove any virtual fields for transactions if they exist
        delete cleanedData.account;
        delete cleanedData.category;
        delete cleanedData.subcategory;
        break;
      // Add more cases as needed for other tables
    }
    
    return cleanedData;
  }

  private async createRecord(tableName: string, data: any): Promise<void> {
    // Clean data before sending to Supabase
    const cleanedData = this.cleanDataForTable(tableName, data);
    
    // Handle tables with composite primary keys (like contact_tags)
    if (tableName === 'contact_tags') {
      // For contact_tags, use upsert to handle potential duplicates
      const { error } = await (supabase as any)
        .from(tableName)
        .upsert(cleanedData, { onConflict: 'contact_id,tag_id' });

      if (error) {
        throw new Error(error.message);
      }
    } else {
      const { error } = await (supabase as any)
        .from(tableName)
        .insert(cleanedData);

      if (error) {
        throw new Error(error.message);
      }
    }
  }

  private async updateRecord(tableName: string, recordId: string, data: any): Promise<void> {
    // Clean data before sending to Supabase
    const cleanedData = this.cleanDataForTable(tableName, data);
    
    const { error } = await (supabase as any)
      .from(tableName)
      .update(cleanedData)
      .eq('id', recordId);

    if (error) {
      throw new Error(error.message);
    }
  }

  private async deleteRecord(tableName: string, recordId: string): Promise<void> {
    // Handle tables with composite primary keys (like contact_tags)
    if (tableName === 'contact_tags') {
      // For contact_tags, recordId is in format "contact_id-tag_id"
      const [contactId, tagId] = recordId.split('-');
      const { error } = await (supabase as any)
        .from(tableName)
        .delete()
        .eq('contact_id', contactId)
        .eq('tag_id', tagId);

      if (error) {
        throw new Error(error.message);
      }
    } else {
      const { error } = await (supabase as any)
        .from(tableName)
        .delete()
        .eq('id', recordId);

      if (error) {
        throw new Error(error.message);
      }
    }
  }

  // Utility method to check if there are pending changes
  async hasPendingChanges(): Promise<boolean> {
    const changes = await cacheService.getPendingChanges();
    return changes.length > 0;
  }

  // Get count of pending changes by type
  async getPendingChangesCount(): Promise<{ creates: number; updates: number; deletes: number; total: number }> {
    const changes = await cacheService.getPendingChanges();
    const counts = {
      creates: changes.filter(c => c.operation === 'create').length,
      updates: changes.filter(c => c.operation === 'update').length,
      deletes: changes.filter(c => c.operation === 'delete').length,
      total: changes.length
    };
    return counts;
  }
}

// Export singleton instance
export const syncService = new SyncService();

// Helper function to track changes in hooks
export const trackChange = async (table: string, recordId: string, operation: 'create' | 'update' | 'delete', data?: any) => {
  await cacheService.addPendingChange({
    table,
    record_id: recordId,
    operation,
    data
  });
};
