// IndexedDB cache service for client-side data storage
interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export interface PendingChange {
  id: string;
  store: keyof CacheStore;
  operation: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  originalId?: string; // For updates and deletes
}

interface CacheStore {
  transactions: any;
  products: any;
  contacts: any;
  accounts: any;
  categories: any;
  tags: any;
  scheduled_payments: any;
  debts: any;
  dashboard_cards: any;
  pending_changes: PendingChange;
}

export class CacheService {
  private dbName = 'FinancialAppCache';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;
  private defaultTTL = 5 * 60 * 1000; // 5 minutes default TTL

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores for different data types
        const stores = [
          'transactions',
          'products', 
          'contacts',
          'accounts',
          'categories',
          'tags',
          'scheduled_payments',
          'debts',
          'dashboard_cards',
          'pending_changes'
        ];

        stores.forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: 'key' });
          }
        });
      };
    });
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    return this.db!;
  }

  async set<K extends keyof CacheStore>(
    store: K, 
    key: string, 
    data: CacheStore[K], 
    ttl?: number
  ): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction([store], 'readwrite');
    const objectStore = transaction.objectStore(store);
    
    const now = Date.now();
    const expiresAt = now + (ttl || this.defaultTTL);
    
    const cacheItem: CacheItem<CacheStore[K]> = {
      data,
      timestamp: now,
      expiresAt
    };

    return new Promise((resolve, reject) => {
      const request = objectStore.put({ key, ...cacheItem });
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async get<K extends keyof CacheStore>(
    store: K, 
    key: string
  ): Promise<CacheStore[K] | null> {
    const db = await this.ensureDB();
    const transaction = db.transaction([store], 'readonly');
    const objectStore = transaction.objectStore(store);

    return new Promise((resolve, reject) => {
      const request = objectStore.get(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        if (!result) {
          resolve(null);
          return;
        }

        const cacheItem = result as CacheItem<CacheStore[K]> & { key: string };
        
        // Check if expired
        if (Date.now() > cacheItem.expiresAt) {
          this.delete(store, key); // Clean up expired data
          resolve(null);
          return;
        }

        resolve(cacheItem.data);
      };
    });
  }

  async delete<K extends keyof CacheStore>(store: K, key: string): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction([store], 'readwrite');
    const objectStore = transaction.objectStore(store);

    return new Promise((resolve, reject) => {
      const request = objectStore.delete(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clear<K extends keyof CacheStore>(store: K): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction([store], 'readwrite');
    const objectStore = transaction.objectStore(store);

    return new Promise((resolve, reject) => {
      const request = objectStore.clear();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clearAll(): Promise<void> {
    const db = await this.ensureDB();
    const stores = Array.from(db.objectStoreNames);
    
    for (const storeName of stores) {
      await this.clear(storeName as keyof CacheStore);
    }
  }

  // Check if data is fresh (not expired)
  async isFresh<K extends keyof CacheStore>(store: K, key: string): Promise<boolean> {
    const db = await this.ensureDB();
    const transaction = db.transaction([store], 'readonly');
    const objectStore = transaction.objectStore(store);

    return new Promise((resolve, reject) => {
      const request = objectStore.get(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        if (!result) {
          resolve(false);
          return;
        }

        const cacheItem = result as CacheItem<any> & { key: string };
        resolve(Date.now() <= cacheItem.expiresAt);
      };
    });
  }

  // Track pending changes for offline sync
  async addPendingChange(change: Omit<PendingChange, 'id' | 'timestamp'>): Promise<void> {
    const pendingChange: PendingChange = {
      ...change,
      id: `${change.store}_${change.operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };

    await this.set('pending_changes', pendingChange.id, pendingChange, 24 * 60 * 60 * 1000); // 24 hours TTL
  }

  // Get all pending changes
  async getPendingChanges(): Promise<PendingChange[]> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['pending_changes'], 'readonly');
    const objectStore = transaction.objectStore('pending_changes');

    return new Promise((resolve, reject) => {
      const request = objectStore.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const results = request.result || [];
        const pendingChanges = results
          .filter(item => Date.now() <= item.expiresAt)
          .map(item => item.data as PendingChange)
          .sort((a, b) => a.timestamp - b.timestamp);
        resolve(pendingChanges);
      };
    });
  }

  // Remove a pending change after successful sync
  async removePendingChange(changeId: string): Promise<void> {
    await this.delete('pending_changes', changeId);
  }

  // Clear all pending changes
  async clearPendingChanges(): Promise<void> {
    await this.clear('pending_changes');
  }

  // Enhanced set method that tracks changes
  async setWithTracking<K extends keyof CacheStore>(
    store: K,
    key: string,
    data: CacheStore[K],
    operation: 'create' | 'update',
    originalId?: string,
    ttl?: number
  ): Promise<void> {
    // First save to cache
    await this.set(store, key, data, ttl);
    
    // Then track the change for sync
    if (store !== 'pending_changes') {
      await this.addPendingChange({
        store,
        operation,
        data,
        originalId
      });
    }
  }

  // Enhanced delete method that tracks changes
  async deleteWithTracking<K extends keyof CacheStore>(
    store: K,
    key: string,
    originalData?: any
  ): Promise<void> {
    // First delete from cache
    await this.delete(store, key);
    
    // Then track the change for sync
    if (store !== 'pending_changes') {
      await this.addPendingChange({
        store,
        operation: 'delete',
        data: originalData,
        originalId: key
      });
    }
  }
}

// Singleton instance
export const cacheService = new CacheService();