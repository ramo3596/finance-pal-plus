import { useState } from 'react';
import { toast } from 'sonner';
import { useTransactions } from './useTransactions';
import { useContacts } from './useContacts';
import { useInventory } from './useInventory';
import { useScheduledPayments } from './useScheduledPayments';
import { useDebts } from './useDebts';
import { useSettings } from './useSettings';
import { useLocalCache } from './useLocalCache';

export const useSync = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  
  const { refetch: refetchTransactions } = useTransactions();
  const { refetch: refetchContacts } = useContacts();
  const { fetchProducts } = useInventory();
  const { fetchScheduledPayments } = useScheduledPayments();
  const { refetch: refetchDebts } = useDebts();
  const { refetch: refetchSettings } = useSettings();
  const { clearCache } = useLocalCache();

  const syncAll = async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    toast.info('Limpiando caché y sincronizando datos...');
    
    try {
      // Primero limpiar todo el cache local para forzar la carga desde el servidor
      clearCache();
      
      // Ejecutar todas las sincronizaciones en paralelo forzando el refresh
      await Promise.all([
        refetchTransactions(),
        refetchContacts(), // Ya fuerza refresh internamente
        fetchProducts(true), // Forzar refresh
        fetchScheduledPayments(true), // Forzar refresh
        refetchDebts(),
        refetchSettings(true), // Forzar refresh pasando true a fetchData
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