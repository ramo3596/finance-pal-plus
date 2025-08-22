import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  User, 
  Upload,
  Save,
  Loader2,
  RotateCcw,
  Trash2,
  Plus
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/hooks/useSettings";
import { useNotifications } from "@/hooks/useNotifications";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";

export default function ProfileSettings() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    username: "",
    email: "",
    newPassword: ""
  });

  const {
    userSettings,
    updateUserSettings,
    refetch,
  } = useSettings();

  const {
    refetch: refetchNotifications
  } = useNotifications();

  // Load profile data on component mount
  useEffect(() => {
    if (user) {
      setProfileData({
        username: user.email?.split('@')[0] || "",
        email: user.email || "",
        newPassword: ""
      });
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        setProfileData(prev => ({
          ...prev,
          username: profile.username || prev.username
        }));
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setIsLoadingProfile(true);
    try {
      // Update profile in database
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username: profileData.username,
          updated_at: new Date().toISOString()
        });

      if (profileError) throw profileError;

      // Update password if provided
      if (profileData.newPassword) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: profileData.newPassword
        });
        
        if (passwordError) throw passwordError;
        
        setProfileData(prev => ({ ...prev, newPassword: "" }));
      }

      toast({
        title: "Perfil actualizado",
        description: "Los cambios en tu perfil se han guardado exitosamente.",
      });
      
      // Refresh profile data
      await fetchUserProfile();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudieron guardar los cambios.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleSyncConfiguration = async () => {
    setIsLoadingProfile(true);
    try {
      // Force refresh all settings data
      await refetch();
      
      // Enable all notification settings
      await updateUserSettings({ 
        wallet_reminder: true,
        scheduled_payments: true,
        debts: true,
        income: true
      });

      await refetchNotifications();

      toast({
        title: "Configuración sincronizada",
        description: "Todas las configuraciones han sido sincronizadas y habilitadas.",
        duration: 3000,
      });
    } catch (error: any) {
      toast({
        title: "Error de sincronización",
        description: error.message || "No se pudo sincronizar la configuración.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleDeleteAllData = async () => {
    if (!confirm("¿Estás seguro de que quieres eliminar todos tus datos? Esta acción no se puede deshacer.")) {
      return;
    }

    setIsLoadingProfile(true);
    try {
      // This would need to be implemented as an RPC function in Supabase
      // For now, we'll just show a message
      toast({
        title: "Función no disponible",
        description: "La eliminación completa de datos debe ser solicitada al administrador.",
        variant: "destructive"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudieron eliminar los datos.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  // Custom floating action button for mobile
  const FloatingActionButton = () => {
    if (!isMobile) return null;

    return (
      <Button
        onClick={handleSaveProfile}
        disabled={isLoadingProfile}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
        size="icon"
      >
        {isLoadingProfile ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : (
          <Save className="h-6 w-6" />
        )}
      </Button>
    );
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 pb-24">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Perfil de Usuario
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSyncConfiguration}
                disabled={isLoadingProfile}
              >
                {isLoadingProfile ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4 mr-2" />
                )}
                Sincronizar configuración
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Cambiar imagen
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="username">Nombre de usuario</Label>
                <Input 
                  id="username" 
                  value={profileData.username}
                  onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  value={profileData.email}
                  disabled 
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="password">Cambiar contraseña</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="Nueva contraseña"
                value={profileData.newPassword}
                onChange={(e) => setProfileData(prev => ({ ...prev, newPassword: e.target.value }))}
              />
            </div>

            {/* Notification Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Configuración de Notificaciones</h3>
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Recordatorio de Cartera</Label>
                    <p className="text-sm text-muted-foreground">
                      Recibe notificaciones sobre el estado de tu cartera
                    </p>
                  </div>
                  <Switch
                    checked={userSettings?.wallet_reminder || false}
                    onCheckedChange={(checked) =>
                      updateUserSettings({ wallet_reminder: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Pagos Programados</Label>
                    <p className="text-sm text-muted-foreground">
                      Alertas sobre próximos pagos programados
                    </p>
                  </div>
                  <Switch
                    checked={userSettings?.scheduled_payments || false}
                    onCheckedChange={(checked) =>
                      updateUserSettings({ scheduled_payments: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Deudas</Label>
                    <p className="text-sm text-muted-foreground">
                      Recordatorios sobre deudas pendientes
                    </p>
                  </div>
                  <Switch
                    checked={userSettings?.debts || false}
                    onCheckedChange={(checked) =>
                      updateUserSettings({ debts: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Ingresos</Label>
                    <p className="text-sm text-muted-foreground">
                      Notificaciones sobre ingresos importantes
                    </p>
                  </div>
                  <Switch
                    checked={userSettings?.income || false}
                    onCheckedChange={(checked) =>
                      updateUserSettings({ income: checked })
                    }
                  />
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="hidden md:block">
                <Button 
                  onClick={handleSaveProfile}
                  disabled={isLoadingProfile}
                >
                  {isLoadingProfile ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Guardar cambios
                </Button>
              </div>
              <Button variant="outline" onClick={handleSignOut}>
                Cerrar sesión
              </Button>
              <Button variant="destructive" onClick={handleDeleteAllData}>
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar datos
              </Button>
            </div>
          </CardContent>
        </Card>

        <FloatingActionButton />
      </div>
    </Layout>
  );
}