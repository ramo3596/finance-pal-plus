import { useState } from 'react';
import { toast } from 'sonner';
import { useTransactions } from './useTransactions';
import { useContacts } from './useContacts';
import { useInventory } from './useInventory';
import { useScheduledPayments } from './useScheduledPayments';
import { useDebts } from './useDebts';
import { useSettings } from './useSettings';

export const useSync = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  
  const { refetch: refetchTransactions } = useTransactions();
  const { refetch: refetchContacts } = useContacts();
  const { fetchProducts } = useInventory();
  const { fetchScheduledPayments } = useScheduledPayments();
  const { refetch: refetchDebts } = useDebts();
  const { refetch: refetchSettings } = useSettings();

  const syncAll = async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    toast.info('Sincronizando datos...');
    
    try {
      // Ejecutar sincronizaciones en paralelo
      await Promise.all([
        refetchTransactions(),
        refetchContacts(),
        fetchProducts(),
        fetchScheduledPayments(),
        refetchDebts(),
        refetchSettings(),
      ]);
      
      toast.success('Sincronización completada');
    } catch (error) {
      console.error('Error during sync:', error);
      toast.error('Error al sincronizar datos');
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    syncAll,
    isSyncing
  };
};