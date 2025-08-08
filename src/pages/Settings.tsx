
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  CreditCard, 
  FolderOpen, 
  Tag, 
  FileText, 
  Filter, 
  Bell,
  Trash2,
  Upload,
  Save,
  Loader2,
  RotateCcw,
  CheckCircle2
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/hooks/useSettings";
import { supabase } from "@/integrations/supabase/client";

// Import dialogs
import { AddAccountDialog } from "@/components/settings/AddAccountDialog";
import { EditAccountDialog } from "@/components/settings/EditAccountDialog";
import { AddCategoryDialog } from "@/components/settings/AddCategoryDialog";
import { AddSubcategoryDialog } from "@/components/settings/AddSubcategoryDialog";
import { EditCategoryDialog } from "@/components/settings/EditCategoryDialog";
import { EditSubcategoryDialog } from "@/components/settings/EditSubcategoryDialog";
import { AddTagDialog } from "@/components/settings/AddTagDialog";
import { EditTagDialog } from "@/components/settings/EditTagDialog";
import { AddTemplateDialog } from "@/components/settings/AddTemplateDialog";
import { EditTemplateDialog } from "@/components/settings/EditTemplateDialog";
import { AddFilterDialog } from "@/components/settings/AddFilterDialog";
import { EditFilterDialog } from "@/components/settings/EditFilterDialog";

// Import draggable lists
import { DraggableAccountList } from "@/components/settings/DraggableAccountList";
import { DraggableCategoryList } from "@/components/settings/DraggableCategoryList";
import { DraggableTagList } from "@/components/settings/DraggableTagList";

export default function Settings() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("profile");
  const [showAddAccountDialog, setShowAddAccountDialog] = useState(false);
  const [editAccountId, setEditAccountId] = useState<string | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    username: "",
    email: "",
    newPassword: ""
  });

  // Handle URL parameters
  useEffect(() => {
    const tab = searchParams.get('tab');
    const add = searchParams.get('add');
    const edit = searchParams.get('edit');
    
    if (tab) {
      setActiveTab(tab);
    }
    
    if (add === 'true') {
      setShowAddAccountDialog(true);
    }
    
    if (edit) {
      setEditAccountId(edit);
    }
  }, [searchParams]);

  const handleCloseAddAccountDialog = () => {
    setShowAddAccountDialog(false);
    // Remove the add parameter from URL
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('add');
    setSearchParams(newParams);
  };

  const handleCloseEditAccountDialog = () => {
    setEditAccountId(null);
    // Remove the edit parameter from URL
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('edit');
    setSearchParams(newParams);
  };
  
  const {
    accounts,
    categories,
    tags,
    templates,
    filters,
    userSettings,
    loading,
    createAccount,
    updateAccount,
    deleteAccount,
    reorderAccounts,
    createCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    createTag,
    updateTag,
    deleteTag,
    reorderTags,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    createFilter,
    updateFilter,
    deleteFilter,
    updateUserSettings,
    createSubcategory,
    updateSubcategory,
    deleteSubcategory,
    refetch,
  } = useSettings();

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

  const handleSave = () => {
    toast({
      title: "Configuración guardada",
      description: "Los cambios se han guardado exitosamente.",
    });
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleDeleteAccount = async (id: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar esta cuenta?")) {
      await deleteAccount(id);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar esta categoría?")) {
      await deleteCategory(id);
    }
  };

  const handleDeleteTag = async (id: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar esta etiqueta?")) {
      await deleteTag(id);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar esta plantilla?")) {
      await deleteTemplate(id);
    }
  };

  const handleDeleteFilter = async (id: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar este filtro?")) {
      await deleteFilter(id);
    }
  };

  // Reorder functions
  const handleReorderAccounts = (newOrder: any[]) => {
    reorderAccounts(newOrder);
  };

  const handleReorderCategories = (newOrder: any[]) => {
    reorderCategories(newOrder);
  };

  const handleReorderTags = (newOrder: any[]) => {
    reorderTags(newOrder);
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </Layout>
    );
  }

  const ProfileSection = () => (
    <div className="space-y-6">
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
        <CardContent className="space-y-4">
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
          
          <div className="flex flex-col sm:flex-row gap-2">
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
            <Button variant="outline" onClick={handleSignOut}>
              Cerrar sesión
            </Button>
            <Button variant="destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar datos
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const AccountsSection = () => {
    const editAccount = editAccountId ? accounts.find(acc => acc.id === editAccountId) : null;
    
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Gestión de Cuentas
              </span>
              <AddAccountDialog onAdd={createAccount} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            {accounts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No hay cuentas configuradas. Agrega tu primera cuenta.
              </p>
            ) : (
              <DraggableAccountList
                accounts={accounts}
                onUpdate={updateAccount}
                onDelete={handleDeleteAccount}
                onReorder={handleReorderAccounts}
              />
            )}
          </CardContent>
        </Card>
        
        {/* Controlled edit dialog for URL-based navigation */}
        {editAccount && (
          <EditAccountDialog
            account={editAccount}
            onUpdate={updateAccount}
            open={true}
            onOpenChange={handleCloseEditAccountDialog}
          />
        )}
      </div>
    );
  };

  const CategoriesSection = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Administrar Categorías
            </span>
            <AddCategoryDialog onAdd={createCategory} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay categorías configuradas. Agrega tu primera categoría.
            </p>
          ) : (
            <DraggableCategoryList
              categories={categories}
              onUpdate={updateCategory}
              onDelete={handleDeleteCategory}
              onReorder={handleReorderCategories}
              onCreateSubcategory={createSubcategory}
              onUpdateSubcategory={updateSubcategory}
              onDeleteSubcategory={async (id) => {
                if (confirm("¿Estás seguro de que quieres eliminar esta subcategoría?")) {
                  await deleteSubcategory(id);
                }
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );

  const TagsSection = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Definir Etiquetas
            </span>
            <AddTagDialog onAdd={createTag} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tags.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay etiquetas configuradas. Agrega tu primera etiqueta.
            </p>
          ) : (
            <DraggableTagList
              tags={tags}
              onUpdate={updateTag}
              onDelete={handleDeleteTag}
              onReorder={handleReorderTags}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );

  const TemplatesSection = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Administrar Plantillas
            </span>
            <AddTemplateDialog 
              onAdd={createTemplate}
              accounts={accounts}
              categories={categories}
              tags={tags}
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-y-auto space-y-4">
            {templates.map((template) => (
              <div key={template.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{template.name}</h3>
                    <p className="text-sm text-muted-foreground">${template.amount.toFixed(2)} - {template.type}</p>
                    {template.tags && template.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {template.tags.map((tag) => (
                          <span 
                            key={tag.id}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs"
                            style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                          >
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }}></div>
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <EditTemplateDialog 
                      template={template} 
                      onUpdate={updateTemplate}
                      accounts={accounts}
                      categories={categories}
                      tags={tags}
                    />
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteTemplate(template.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {templates.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No hay plantillas configuradas. Agrega tu primera plantilla.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const FiltersSection = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Administrar Filtros
            </span>
            <AddFilterDialog 
              onAdd={createFilter}
              accounts={accounts}
              categories={categories}
              tags={tags}
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filters.map((filter) => (
              <div key={filter.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-medium">{filter.name}</h3>
                    <Badge variant="secondary">{filter.type}</Badge>
                  </div>
                  <div className="flex gap-2">
                    <EditFilterDialog 
                      filter={filter} 
                      onUpdate={updateFilter}
                      accounts={accounts}
                      categories={categories}
                      tags={tags}
                    />
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteFilter(filter.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {filters.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No hay filtros configurados. Agrega tu primer filtro.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const NotificationsSection = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificaciones
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {userSettings && (
            <>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">Recordatorio de Wallet</p>
                  <p className="text-sm text-muted-foreground">
                    Recibe una notificación a las 20:00 para recordarte que anotes tus gastos del día.
                  </p>
                </div>
                <Switch 
                  checked={userSettings.wallet_reminder}
                  onCheckedChange={(checked) => updateUserSettings({ wallet_reminder: checked })}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">Pagos Programados</p>
                  <p className="text-sm text-muted-foreground">
                    Notifica sobre los próximos pagos programados.
                  </p>
                </div>
                <Switch 
                  checked={userSettings.scheduled_payments}
                  onCheckedChange={(checked) => updateUserSettings({ scheduled_payments: checked })}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">Deudas</p>
                  <p className="text-sm text-muted-foreground">
                    Recuerda las próximas fechas de vencimiento de deudas.
                  </p>
                </div>
                <Switch 
                  checked={userSettings.debts}
                  onCheckedChange={(checked) => updateUserSettings({ debts: checked })}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">Ingresos</p>
                  <p className="text-sm text-muted-foreground">
                    Informa sobre un ingreso importante en tus cuentas.
                  </p>
                </div>
                <Switch 
                  checked={userSettings.income}
                  onCheckedChange={(checked) => updateUserSettings({ income: checked })}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Configuración</h1>
          <p className="text-muted-foreground">Gestiona todas las configuraciones de tu aplicación financiera</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-7 mb-6">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Perfil</span>
            </TabsTrigger>
            <TabsTrigger value="accounts" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Cuentas</span>
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Categorías</span>
            </TabsTrigger>
            <TabsTrigger value="tags" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              <span className="hidden sm:inline">Etiquetas</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Plantillas</span>
            </TabsTrigger>
            <TabsTrigger value="filters" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filtros</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notificaciones</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <ProfileSection />
          </TabsContent>

          <TabsContent value="accounts">
            <AccountsSection />
          </TabsContent>

          <TabsContent value="categories">
            <CategoriesSection />
          </TabsContent>

          <TabsContent value="tags">
            <TagsSection />
          </TabsContent>

          <TabsContent value="templates">
            <TemplatesSection />
          </TabsContent>

          <TabsContent value="filters">
            <FiltersSection />
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationsSection />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
