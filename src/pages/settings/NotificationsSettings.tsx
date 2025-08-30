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
  X,
  CreditCard,
  Package,
  Users,
  TrendingUp,
  Settings,
  Shield,
  ArrowLeft
} from "lucide-react";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
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
          <div className="flex items-center gap-3">
            {isMobile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="p-1 h-8 w-8"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Configuración de Notificaciones</h1>
              <p className="text-muted-foreground">
                Gestiona tus preferencias de notificaciones y revisa las notificaciones recientes.
              </p>
            </div>
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
            <CardContent className="space-y-4">
              {userSettings && (
                <div className="grid gap-4">
                  {/* Notificaciones Financieras */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                      <DollarSign className="h-4 w-4 text-primary" />
                      <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Finanzas</h4>
                    </div>
                    
                    <div className="grid gap-4 pl-6">
                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Bell className="h-4 w-4 text-primary" />
                          </div>
                          <div className="space-y-1">
                            <Label className="font-medium">Recordatorio de Cartera</Label>
                            <p className="text-sm text-muted-foreground">
                              Recibe notificaciones sobre el estado de tu cartera
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={userSettings.wallet_reminder || false}
                          onCheckedChange={(checked) =>
                            updateUserSettings({ wallet_reminder: checked })
                          }
                        />
                      </div>
                      
                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                            <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                          </div>
                          <div className="space-y-1">
                            <Label className="font-medium">Ingresos</Label>
                            <p className="text-sm text-muted-foreground">
                              Notificaciones sobre ingresos importantes
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={userSettings.income || false}
                          onCheckedChange={(checked) =>
                            updateUserSettings({ income: checked })
                          }
                        />
                      </div>
                      
                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/20">
                            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                          </div>
                          <div className="space-y-1">
                            <Label className="font-medium">Deudas</Label>
                            <p className="text-sm text-muted-foreground">
                              Recordatorios sobre deudas pendientes
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={userSettings.debts || false}
                          onCheckedChange={(checked) =>
                            updateUserSettings({ debts: checked })
                          }
                        />
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Notificaciones de Pagos */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Pagos y Programación</h4>
                    </div>
                    
                    <div className="grid gap-4 pl-6">
                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                            <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="space-y-1">
                            <Label className="font-medium">Pagos Programados</Label>
                            <p className="text-sm text-muted-foreground">
                              Alertas sobre próximos pagos programados
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={userSettings.scheduled_payments || false}
                          onCheckedChange={(checked) =>
                            updateUserSettings({ scheduled_payments: checked })
                          }
                        />
                      </div>
                      
                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                            <CreditCard className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div className="space-y-1">
                            <Label className="font-medium">Vencimientos de Tarjetas</Label>
                            <p className="text-sm text-muted-foreground">
                              Recordatorios de fechas de pago de tarjetas
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={userSettings.card_reminders || false}
                          onCheckedChange={(checked) =>
                            updateUserSettings({ card_reminders: checked })
                          }
                        />
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Notificaciones de Gestión */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Package className="h-4 w-4 text-orange-600" />
                      <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Gestión y Control</h4>
                    </div>
                    
                    <div className="grid gap-4 pl-6">
                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/20">
                            <Package className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                          </div>
                          <div className="space-y-1">
                            <Label className="font-medium">Inventario</Label>
                            <p className="text-sm text-muted-foreground">
                              Alertas sobre stock bajo y productos
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={userSettings.inventory_alerts || false}
                          onCheckedChange={(checked) =>
                            updateUserSettings({ inventory_alerts: checked })
                          }
                        />
                      </div>
                      
                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-900/20">
                            <Users className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                          </div>
                          <div className="space-y-1">
                            <Label className="font-medium">Contactos</Label>
                            <p className="text-sm text-muted-foreground">
                              Notificaciones sobre actividad de contactos
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={userSettings.contact_notifications || false}
                          onCheckedChange={(checked) =>
                            updateUserSettings({ contact_notifications: checked })
                          }
                        />
                      </div>
                      
                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/20">
                            <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <div className="space-y-1">
                            <Label className="font-medium">Reportes y Estadísticas</Label>
                            <p className="text-sm text-muted-foreground">
                              Resúmenes periódicos de tu actividad financiera
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={userSettings.reports_notifications || false}
                          onCheckedChange={(checked) =>
                            updateUserSettings({ reports_notifications: checked })
                          }
                        />
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Notificaciones del Sistema */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Settings className="h-4 w-4 text-gray-600" />
                      <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Sistema</h4>
                    </div>
                    
                    <div className="grid gap-4 pl-6">
                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                            <Settings className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                          </div>
                          <div className="space-y-1">
                            <Label className="font-medium">Actualizaciones del Sistema</Label>
                            <p className="text-sm text-muted-foreground">
                              Notificaciones sobre nuevas funciones y mejoras
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={userSettings.system_updates || false}
                          onCheckedChange={(checked) =>
                            updateUserSettings({ system_updates: checked })
                          }
                        />
                      </div>
                      
                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/20">
                            <Shield className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                          </div>
                          <div className="space-y-1">
                            <Label className="font-medium">Seguridad</Label>
                            <p className="text-sm text-muted-foreground">
                              Alertas de seguridad y accesos inusuales
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={userSettings.security_alerts || false}
                          onCheckedChange={(checked) =>
                            updateUserSettings({ security_alerts: checked })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
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