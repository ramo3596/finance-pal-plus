// IndexedDB cache service for client-side data storage
interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
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
          'dashboard_cards'
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
}

// Singleton instance
export const cacheService = new CacheService();