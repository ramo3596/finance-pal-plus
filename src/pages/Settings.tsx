
import { useState } from "react";
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
  Loader2
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/hooks/useSettings";

// Import dialogs
import { AddAccountDialog } from "@/components/settings/AddAccountDialog";
import { EditAccountDialog } from "@/components/settings/EditAccountDialog";
import { AddCategoryDialog } from "@/components/settings/AddCategoryDialog";
import { EditCategoryDialog } from "@/components/settings/EditCategoryDialog";
import { AddTagDialog } from "@/components/settings/AddTagDialog";
import { EditTagDialog } from "@/components/settings/EditTagDialog";
import { AddTemplateDialog } from "@/components/settings/AddTemplateDialog";
import { EditTemplateDialog } from "@/components/settings/EditTemplateDialog";
import { AddFilterDialog } from "@/components/settings/AddFilterDialog";
import { EditFilterDialog } from "@/components/settings/EditFilterDialog";

export default function Settings() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  
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
    createCategory,
    updateCategory,
    deleteCategory,
    createTag,
    updateTag,
    deleteTag,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    createFilter,
    updateFilter,
    deleteFilter,
    updateUserSettings,
  } = useSettings();

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
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Perfil de Usuario
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
              <Input id="username" defaultValue={user?.email?.split('@')[0]} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" defaultValue={user?.email} disabled />
            </div>
          </div>
          
          <div>
            <Label htmlFor="password">Cambiar contraseña</Label>
            <Input id="password" type="password" placeholder="Nueva contraseña" />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
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

  const AccountsSection = () => (
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
          <div className="space-y-4">
            {accounts.map((account) => (
              <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl" style={{ backgroundColor: account.color + '20' }}>
                    {account.icon}
                  </div>
                  <div>
                    <h3 className="font-medium">{account.name}</h3>
                    <p className="text-sm text-muted-foreground">Saldo: ${account.balance?.toFixed(2) || '0.00'}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <EditAccountDialog account={account} onUpdate={updateAccount} />
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteAccount(account.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {accounts.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No hay cuentas configuradas. Agrega tu primera cuenta.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

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
          <div className="space-y-4">
            {categories.map((category) => (
              <div key={category.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl" style={{ backgroundColor: category.color + '20' }}>
                      {category.icon}
                    </div>
                    <div>
                      <h3 className="font-medium">{category.name}</h3>
                      <Badge variant="secondary">{category.nature}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <EditCategoryDialog category={category} onUpdate={updateCategory} />
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteCategory(category.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {category.subcategories && category.subcategories.length > 0 && (
                  <div className="ml-13">
                    <p className="text-sm text-muted-foreground mb-2">Subcategorías:</p>
                    <div className="flex flex-wrap gap-2">
                      {category.subcategories.map((sub) => (
                        <Badge key={sub.id} variant="outline">{sub.name}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {categories.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No hay categorías configuradas. Agrega tu primera categoría.
              </p>
            )}
          </div>
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
          <div className="space-y-4">
            {tags.map((tag) => (
              <div key={tag.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: tag.color }}></div>
                  <span className="font-medium">{tag.name}</span>
                </div>
                <div className="flex gap-2">
                  <EditTagDialog tag={tag} onUpdate={updateTag} />
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteTag(tag.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {tags.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No hay etiquetas configuradas. Agrega tu primera etiqueta.
              </p>
            )}
          </div>
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
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {templates.map((template) => (
              <div key={template.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-medium">{template.name}</h3>
                    <p className="text-sm text-muted-foreground">${template.amount.toFixed(2)} - {template.type}</p>
                  </div>
                  <div className="flex gap-2">
                    <EditTemplateDialog 
                      template={template} 
                      onUpdate={updateTemplate}
                      accounts={accounts}
                      categories={categories}
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
            <AddFilterDialog onAdd={createFilter} />
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
                    <EditFilterDialog filter={filter} onUpdate={updateFilter} />
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
