import { useState, useEffect } from 'react';
import { syncService } from '@/lib/syncService';
import { useAuth } from './useAuth';

export interface PendingChangesStatus {
  hasPendingChanges: boolean;
  counts: {
    creates: number;
    updates: number;
    deletes: number;
    total: number;
  };
  isLoading: boolean;
}

export const usePendingChanges = () => {
  const [status, setStatus] = useState<PendingChangesStatus>({
    hasPendingChanges: false,
    counts: { creates: 0, updates: 0, deletes: 0, total: 0 },
    isLoading: true
  });
  const { user } = useAuth();

  const refreshPendingChanges = async () => {
    if (!user) {
      setStatus({
        hasPendingChanges: false,
        counts: { creates: 0, updates: 0, deletes: 0, total: 0 },
        isLoading: false
      });
      return;
    }

    try {
      setStatus(prev => ({ ...prev, isLoading: true }));
      
      const [hasPending, counts] = await Promise.all([
        syncService.hasPendingChanges(),
        syncService.getPendingChangesCount()
      ]);

      setStatus({
        hasPendingChanges: hasPending,
        counts,
        isLoading: false
      });
    } catch (error) {
      console.error('Error checking pending changes:', error);
      setStatus(prev => ({ ...prev, isLoading: false }));
    }
  };

  useEffect(() => {
    refreshPendingChanges();
  }, [user]);

  // Refresh every 30 seconds to keep status updated
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(refreshPendingChanges, 30000);
    return () => clearInterval(interval);
  }, [user]);

  return {
    ...status,
    refreshPendingChanges
  };
};