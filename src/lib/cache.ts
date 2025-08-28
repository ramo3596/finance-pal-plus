// Cache service for tracking local changes and offline data storage

export interface CacheStore {
  transactions: any[];
  accounts: any[];
  categories: any[];
  tags: any[];
  templates: any[];
  filters: any[];
  contacts: any[];
  contact_tags: any[]; // Make sure this is included
  debts: any[];
  debt_payments: any[];
  scheduled_payments: any[];
  inventory: any[];
  pending_changes: PendingChange[];
}

export interface PendingChange {
  id: string;
  table: string;
  record_id: string;
  operation: 'create' | 'update' | 'delete';
  data?: any;
  timestamp: number;
}

class CacheService {
  private dbName = 'FinancePalCache';
  private dbVersion = 3;
  private db: IDBDatabase | null = null;
  private defaultTTL = 24 * 60 * 60 * 1000; // 24 hours

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = async () => {
        this.db = request.result;
        // Ensure all stores are initialized with empty arrays if they don't exist
        await this.ensureStoresInitialized();
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores for each data type
        const stores = [
          'transactions', 'accounts', 'categories', 'tags', 'templates', 'filters',
          'contacts', 'contact_tags', 'debts', 'debt_payments', 'scheduled_payments', 'inventory', 'pending_changes'
        ];
        
        stores.forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            // Handle different key configurations for different stores
            if (storeName === 'contact_tags') {
              // contact_tags uses composite key, so we'll use auto-increment
              const store = db.createObjectStore(storeName, { keyPath: null, autoIncrement: true });
              store.createIndex('contact_id', 'contact_id', { unique: false });
              store.createIndex('tag_id', 'tag_id', { unique: false });
              store.createIndex('composite', ['contact_id', 'tag_id'], { unique: true });
            } else {
              const store = db.createObjectStore(storeName, { keyPath: 'id' });
              if (storeName === 'pending_changes') {
                store.createIndex('table', 'table', { unique: false });
                store.createIndex('timestamp', 'timestamp', { unique: false });
              }
            }
          }
        });
      };
    });
  }

  private async ensureStoresInitialized(): Promise<void> {
    if (!this.db) return;
    
    const stores = [
      'transactions', 'accounts', 'categories', 'tags', 'templates', 'filters',
      'contacts', 'contact_tags', 'debts', 'debt_payments', 'scheduled_payments', 'inventory', 'pending_changes'
    ];
    
    for (const storeName of stores) {
      try {
        const data = await this.get(storeName as keyof CacheStore);
        // If store is empty or doesn't exist, this will ensure it's accessible
        if (!data) {
          await this.set(storeName as keyof CacheStore, []);
        }
      } catch (error) {
        // If there's an error accessing the store, initialize it with empty array
        console.warn(`Initializing empty store for ${storeName}:`, error);
        try {
          await this.set(storeName as keyof CacheStore, []);
        } catch (setError) {
          console.error(`Failed to initialize store ${storeName}:`, setError);
        }
      }
    }
  }

  async set(storeName: keyof CacheStore, data: any[]): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    
    // Clear existing data
    await store.clear();
    
    // Add new data
    for (const item of data) {
      await store.add(item);
    }
  }

  async get(storeName: keyof CacheStore): Promise<any[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => {
          console.warn(`Error reading from store ${storeName}:`, request.error);
          // Return empty array instead of rejecting to prevent app crashes
          resolve([]);
        };
        
        transaction.onerror = () => {
          console.warn(`Transaction error for store ${storeName}:`, transaction.error);
          resolve([]);
        };
      } catch (error) {
        console.warn(`Failed to access store ${storeName}:`, error);
        // Return empty array for non-existent stores
        resolve([]);
      }
    });
  }

  async addPendingChange(change: Omit<PendingChange, 'id' | 'timestamp'>): Promise<void> {
    if (!this.db) await this.init();
    
    const pendingChange: PendingChange = {
      ...change,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    };
    
    const transaction = this.db!.transaction(['pending_changes'], 'readwrite');
    const store = transaction.objectStore('pending_changes');
    await store.add(pendingChange);
  }

  async getPendingChanges(): Promise<PendingChange[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['pending_changes'], 'readonly');
      const store = transaction.objectStore('pending_changes');
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async clearPendingChanges(): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['pending_changes'], 'readwrite');
    const store = transaction.objectStore('pending_changes');
    await store.clear();
  }

  async clearAll(): Promise<void> {
    if (!this.db) await this.init();
    
    const stores = [
      'transactions', 'accounts', 'categories', 'tags', 
      'contacts', 'contact_tags', 'debts', 'scheduled_payments', 'inventory'
    ];
    
    const transaction = this.db!.transaction(stores, 'readwrite');
    
    for (const storeName of stores) {
      const store = transaction.objectStore(storeName);
      await store.clear();
    }
  }

  async updateCacheItem(storeName: keyof CacheStore, item: any): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(item);
        
        request.onsuccess = () => resolve();
        request.onerror = () => {
          console.warn(`Error updating item in store ${storeName}:`, request.error);
          reject(request.error);
        };
        
        transaction.onerror = () => {
          console.warn(`Transaction error updating store ${storeName}:`, transaction.error);
          reject(transaction.error);
        };
      } catch (error) {
        console.warn(`Failed to update item in store ${storeName}:`, error);
        reject(error);
      }
    });
  }

  async deleteCacheItem(storeName: keyof CacheStore, id: string): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(id);
        
        request.onsuccess = () => resolve();
        request.onerror = () => {
          console.warn(`Error deleting item from store ${storeName}:`, request.error);
          reject(request.error);
        };
        
        transaction.onerror = () => {
          console.warn(`Transaction error deleting from store ${storeName}:`, transaction.error);
          reject(transaction.error);
        };
      } catch (error) {
        console.warn(`Failed to delete item from store ${storeName}:`, error);
        reject(error);
      }
    });
  }

  async getRecord(storeName: keyof CacheStore, id: string): Promise<any | null> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);
      
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async updateRecord(storeName: keyof CacheStore, id: string, updates: any): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    
    // Get the existing record
    const getRequest = store.get(id);
    
    return new Promise((resolve, reject) => {
      getRequest.onsuccess = () => {
        const existingRecord = getRequest.result;
        if (existingRecord) {
          // Merge updates with existing record
          const updatedRecord = { ...existingRecord, ...updates };
          const putRequest = store.put(updatedRecord);
          
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          reject(new Error(`Record with id ${id} not found in ${storeName}`));
        }
      };
      
      getRequest.onerror = () => reject(getRequest.error);
    });
  }
}

// Export singleton instance
export const cacheService = new CacheService();
