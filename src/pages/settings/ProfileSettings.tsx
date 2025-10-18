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
  Plus,
  ArrowLeft
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/hooks/useSettings";
import { useNotifications } from "@/hooks/useNotifications";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export default function ProfileSettings() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [profileData, setProfileData] = useState({
    username: "",
    email: "",
    newPassword: "",
    webhookUrl: ""
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
        newPassword: "",
        webhookUrl: ""
      });
      // Cargar imagen de perfil si existe
      const avatarUrl = user.user_metadata?.avatar_url;
      if (avatarUrl) {
        setProfileImage(avatarUrl);
      }
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
          username: profile.username || prev.username,
          webhookUrl: profile.webhook_url || "https://n8n1.avfservicios.site/webhook/b49538ed-b1bd-4be4-be13-4d9e7da516a4"
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
          webhook_url: profileData.webhookUrl,
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

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Error",
        description: "Formato de archivo no soportado. Use JPG, PNG, GIF o WebP.",
        variant: "destructive"
      });
      return;
    }

    // Validar tamaño de archivo (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "El archivo es demasiado grande. Máximo 5MB.",
        variant: "destructive"
      });
      return;
    }

    setIsUploadingImage(true);

    try {
      // Crear nombre único para el archivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `profile-images/${fileName}`;

      // Subir archivo a Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Actualizar perfil del usuario con la nueva imagen
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      });

      if (updateError) {
        throw updateError;
      }

      setProfileImage(publicUrl);
      toast({
        title: "Éxito",
        description: "Imagen de perfil actualizada correctamente."
      });

    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: error.message || "Error al subir la imagen.",
        variant: "destructive"
      });
    } finally {
      setIsUploadingImage(false);
      // Limpiar el input
      event.target.value = '';
    }
  };

  const triggerImageUpload = () => {
    const input = document.getElementById('image-upload') as HTMLInputElement;
    input?.click();
  };

  // Custom floating action buttons for mobile
  const FloatingActionButton = () => {
    if (!isMobile) return null;

    return (
      <>
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
        <Button
          onClick={handleSyncConfiguration}
          disabled={isLoadingProfile}
          className="fixed bottom-6 right-24 z-50 h-14 w-14 rounded-full bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-lg"
          size="icon"
        >
          {isLoadingProfile ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <RotateCcw className="h-6 w-6" />
          )}
        </Button>
      </>
    );
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 pb-24">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                {isMobile && (
                  <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mr-2">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                )}
                <User className="h-5 w-5" />
                Perfil de Usuario
              </span>
              {!isMobile && (
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
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                {profileImage ? (
                  <img 
                    src={profileImage} 
                    alt="Foto de perfil" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="h-8 w-8 text-primary" />
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={triggerImageUpload}
                  disabled={isUploadingImage}
                >
                  {isUploadingImage ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  {isUploadingImage ? 'Subiendo...' : 'Cambiar imagen'}
                </Button>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG, GIF o WebP. Máximo 5MB.
                </p>
              </div>
              <input
                id="image-upload"
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleImageUpload}
                className="hidden"
              />
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

            <div>
              <Label htmlFor="webhook">Webhook</Label>
              <Input 
                id="webhook" 
                type="url"
                placeholder="https://n8n1.avfservicios.site/webhook/..."
                value={profileData.webhookUrl}
                onChange={(e) => setProfileData(prev => ({ ...prev, webhookUrl: e.target.value }))}
              />
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