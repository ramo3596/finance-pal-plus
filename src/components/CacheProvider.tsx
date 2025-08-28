import { ReactNode } from 'react';
import { useCacheInitializer } from '@/hooks/useCacheInitializer';
import { useAuth } from '@/hooks/useAuth';

interface CacheProviderProps {
  children: ReactNode;
}

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      <p className="text-muted-foreground">Inicializando aplicación...</p>
    </div>
  </div>
);

export const CacheProvider = ({ children }: CacheProviderProps) => {
  const { user, loading: authLoading } = useAuth();
  const { isLoading: cacheLoading } = useCacheInitializer();

  // Show loading screen while auth or cache is loading
  if (authLoading || (user && cacheLoading)) {
    return <LoadingScreen />;
  }

  // If user is not authenticated, render children normally (auth pages)
  if (!user) {
    return <>{children}</>;
  }

  // User is authenticated and cache is ready, render the app
  return <>{children}</>;
};