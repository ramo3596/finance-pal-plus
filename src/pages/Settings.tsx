
import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  ChevronRight,
  Calendar,
  DollarSign,
  AlertTriangle,
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
  const {
    notifications,
    loading: notificationsLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch: refetchNotifications
  } = useNotifications();

  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
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



  // Mobile Settings Navigation Items
  const settingsNavItems = [
    {
      title: "Perfil",
      description: "Configura tu perfil y preferencias",
      icon: User,
      href: "/settings/profile",
      count: null
    },
    {
      title: "Cuentas", 
      description: "Gestiona tus cuentas bancarias y tarjetas",
      icon: CreditCard,
      href: "/settings/accounts",
      count: accounts?.length || 0
    },
    {
      title: "Categorías",
      description: "Organiza tus gastos e ingresos", 
      icon: FolderOpen,
      href: "/settings/categories",
      count: categories?.length || 0
    },
    {
      title: "Etiquetas",
      description: "Personaliza tus transacciones",
      icon: Tag,
      href: "/settings/tags", 
      count: tags?.length || 0
    },
    {
      title: "Plantillas",
      description: "Crea plantillas para transacciones frecuentes",
      icon: FileText,
      href: "/settings/templates",
      count: templates?.length || 0
    },
    {
      title: "Filtros",
      description: "Configura filtros personalizados", 
      icon: Filter,
      href: "/settings/filters",
      count: filters?.length || 0
    },
    {
      title: "Notificaciones",
      description: "Gestiona tus preferencias de notificaciones",
      icon: Bell,
      href: "/settings/notifications",
      count: null
    }
  ];

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

  // Notification helper functions
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
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
              {user?.user_metadata?.avatar_url ? (
                <img 
                  src={user.user_metadata.avatar_url} 
                  alt="Foto de perfil" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="h-8 w-8 text-primary" />
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link to="/settings/profile">
                  <Upload className="h-4 w-4 mr-2" />
                  Cambiar imagen
                </Link>
              </Button>
              <p className="text-xs text-muted-foreground">
                Ir a configuración de perfil
              </p>
            </div>
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

  const CategoriesSection = () => {
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);
    const subcategories = selectedCategory?.subcategories || [];

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Administrar Categorías</h2>
          </div>
          <AddCategoryDialog onAdd={createCategory} />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Panel Izquierdo - Categorías Principales */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Categorías Principales</CardTitle>
            </CardHeader>
            <CardContent>
              {categories.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No hay categorías configuradas. Agrega tu primera categoría.
                </p>
              ) : (
                <div className="space-y-2">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedCategoryId === category.id
                          ? 'bg-primary/10 border-primary'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedCategoryId(category.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                            style={{ backgroundColor: category.color }}
                          >
                            {category.icon}
                          </div>
                          <span className="font-medium">{category.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {category.subcategories?.length || 0} subcategorías
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <EditCategoryDialog
                            category={category}
                            onUpdate={updateCategory}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCategory(category.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Panel Derecho - Subcategorías */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>
                  {selectedCategory ? `Subcategorías de "${selectedCategory.name}"` : 'Subcategorías'}
                </span>
                 {selectedCategory && (
                    <AddSubcategoryDialog
                      categoryId={selectedCategory.id}
                      categoryName={selectedCategory.name}
                      onAdd={async (subcategory) => {
                        await createSubcategory(subcategory);
                      }}
                    />
                  )}
               </CardTitle>
             </CardHeader>
             <CardContent>
               {!selectedCategory ? (
                 <div className="text-center text-muted-foreground py-12">
                   <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                   <p>Selecciona una categoría del panel izquierdo para ver sus subcategorías</p>
                 </div>
               ) : subcategories.length === 0 ? (
                 <div className="text-center text-muted-foreground py-12">
                   <p className="mb-4">Esta categoría no tiene subcategorías.</p>
                   <AddSubcategoryDialog
                      categoryId={selectedCategory.id}
                      categoryName={selectedCategory.name}
                      onAdd={async (subcategory) => {
                        await createSubcategory(subcategory);
                      }}
                    />
                 </div>
              ) : (
                <div className="space-y-2">
                  {subcategories.map((subcategory) => (
                    <div
                      key={subcategory.id}
                      className="p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                            style={{ backgroundColor: selectedCategory.color }}
                          >
                            {subcategory.icon || '📦'}
                          </div>
                          <span className="font-medium">{subcategory.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <EditSubcategoryDialog
                            subcategory={subcategory}
                            onUpdate={updateSubcategory}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              if (confirm("¿Estás seguro de que quieres eliminar esta subcategoría?")) {
                                await deleteSubcategory(subcategory.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

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



  return (
    <Layout>
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Configuración</h1>
          <p className="text-muted-foreground">Gestiona todas las configuraciones de tu aplicación financiera</p>
        </div>

        {/* Mobile Navigation - Vertical List */}
        {isMobile ? (
          <div className="space-y-3">
            {settingsNavItems.map((item) => (
              <Card key={item.href}>
                <CardContent className="p-4">
                  <Link
                    to={item.href}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-primary/10">
                        <item.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.count !== null && (
                        <Badge variant="secondary">{item.count}</Badge>
                      )}
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                </CardContent>
              </Card>
            ))}


          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-8 mb-6">
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

            <TabsContent value="profile"><ProfileSection /></TabsContent>
            <TabsContent value="notifications">
              {isMobile ? (
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">Configuración de Notificaciones</h3>
                  <p className="text-muted-foreground mb-4">Gestiona tus preferencias de notificaciones en una página dedicada</p>
                  <Link to="/settings/notifications">
                    <Button>
                      <Bell className="h-4 w-4 mr-2" />
                      Ir a Notificaciones
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
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
              )}
            </TabsContent>
            <TabsContent value="accounts"><AccountsSection /></TabsContent>
            <TabsContent value="categories"><CategoriesSection /></TabsContent>
            <TabsContent value="tags"><TagsSection /></TabsContent>
            <TabsContent value="templates"><TemplatesSection /></TabsContent>
            <TabsContent value="filters"><FiltersSection /></TabsContent>

          </Tabs>
        )}
      </div>
    </Layout>
  );
}
