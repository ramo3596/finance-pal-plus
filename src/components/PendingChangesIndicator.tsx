import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { usePendingChanges } from '@/hooks/usePendingChanges';
import { Database, Loader2, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PendingChangesIndicatorProps {
  onSyncClick?: () => void;
  showSyncButton?: boolean;
  className?: string;
}

export const PendingChangesIndicator = ({ 
  onSyncClick, 
  showSyncButton = false,
  className 
}: PendingChangesIndicatorProps) => {
  const { hasPendingChanges, counts, isLoading } = usePendingChanges();

  if (isLoading) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Verificando cambios...</span>
      </div>
    );
  }

  if (!hasPendingChanges) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Database className="h-4 w-4 text-green-600" />
        <span className="text-sm text-green-600">Todo sincronizado</span>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-orange-600" />
            <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
              {counts.total} cambios pendientes
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-medium">Cambios pendientes de sincronización:</p>
            {counts.creates > 0 && (
              <p className="text-sm">• {counts.creates} creaciones</p>
            )}
            {counts.updates > 0 && (
              <p className="text-sm">• {counts.updates} actualizaciones</p>
            )}
            {counts.deletes > 0 && (
              <p className="text-sm">• {counts.deletes} eliminaciones</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
      
      {showSyncButton && onSyncClick && (
        <Button
          size="sm"
          variant="outline"
          onClick={onSyncClick}
          className="h-7 px-2 text-xs"
        >
          <Upload className="h-3 w-3 mr-1" />
          Sincronizar
        </Button>
      )}
    </div>
  );
};