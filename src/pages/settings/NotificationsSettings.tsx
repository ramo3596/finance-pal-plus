import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, 
  Calendar,
  DollarSign,
  AlertTriangle,
  Trash2,
  CheckCircle2,
  X
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/hooks/useSettings";
import { useNotifications } from "@/hooks/useNotifications";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export default function NotificationsSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { userSettings, updateUserSettings } = useSettings();
  const {
    notifications,
    loading: notificationsLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch: refetchNotifications
  } = useNotifications();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'payment_reminder':
        return <Calendar className="h-4 w-4" />;
      case 'debt_reminder':
        return <AlertTriangle className="h-4 w-4" />;
      case 'income_alert':
        return <DollarSign className="h-4 w-4" />;
      case 'wallet_reminder':
        return <Bell className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'payment_reminder':
        return 'text-blue-600';
      case 'debt_reminder':
        return 'text-red-600';
      case 'income_alert':
        return 'text-green-600';
      case 'wallet_reminder':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      toast({
        title: "Notificaciones marcadas",
        description: "Todas las notificaciones han sido marcadas como leídas.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudieron marcar las notificaciones.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      await deleteNotification(id);
      toast({
        title: "Notificación eliminada",
        description: "La notificación ha sido eliminada correctamente.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la notificación.",
        variant: "destructive"
      });
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Configuración de Notificaciones</h1>
            <p className="text-muted-foreground">
              Gestiona tus preferencias de notificaciones y revisa las notificaciones recientes.
            </p>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Configuración de Notificaciones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Preferencias de Notificaciones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {userSettings && (
                <>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="font-medium">Recordatorio de Cartera</Label>
                      <p className="text-sm text-muted-foreground">
                        Recibe notificaciones sobre el estado de tu cartera
                      </p>
                    </div>
                    <Switch
                      checked={userSettings.wallet_reminder || false}
                      onCheckedChange={(checked) =>
                        updateUserSettings({ wallet_reminder: checked })
                      }
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="font-medium">Pagos Programados</Label>
                      <p className="text-sm text-muted-foreground">
                        Alertas sobre próximos pagos programados
                      </p>
                    </div>
                    <Switch
                      checked={userSettings.scheduled_payments || false}
                      onCheckedChange={(checked) =>
                        updateUserSettings({ scheduled_payments: checked })
                      }
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="font-medium">Deudas</Label>
                      <p className="text-sm text-muted-foreground">
                        Recordatorios sobre deudas pendientes
                      </p>
                    </div>
                    <Switch
                      checked={userSettings.debts || false}
                      onCheckedChange={(checked) =>
                        updateUserSettings({ debts: checked })
                      }
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="font-medium">Ingresos</Label>
                      <p className="text-sm text-muted-foreground">
                        Notificaciones sobre ingresos importantes
                      </p>
                    </div>
                    <Switch
                      checked={userSettings.income || false}
                      onCheckedChange={(checked) =>
                        updateUserSettings({ income: checked })
                      }
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Lista de Notificaciones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notificaciones Recientes
                </span>
                {notifications && notifications.length > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleMarkAllAsRead}
                    disabled={notificationsLoading}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Marcar todas como leídas
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {notificationsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-muted-foreground">Cargando notificaciones...</div>
                  </div>
                ) : notifications && notifications.length > 0 ? (
                  <div className="space-y-4">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`flex items-start gap-3 p-4 rounded-lg border transition-colors ${
                          notification.isNew ? 'bg-primary/5 border-primary/20' : 'bg-muted/30'
                        }`}
                      >
                        <div className={`p-2 rounded-full bg-background ${getNotificationColor(notification.type)}`}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-start justify-between">
                            <h4 className="font-medium text-sm">{notification.title}</h4>
                            <div className="flex items-center gap-2">
                              {notification.isNew && (
                                <Badge variant="secondary" className="text-xs">
                                  Nuevo
                                </Badge>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteNotification(notification.id)}
                                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">{notification.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.date), {
                              addSuffix: true,
                              locale: es
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-medium text-lg mb-2">No hay notificaciones</h3>
                    <p className="text-muted-foreground text-sm">
                      Cuando tengas notificaciones, aparecerán aquí.
                    </p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}