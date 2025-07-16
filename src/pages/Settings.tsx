import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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
  Plus,
  Edit,
  Trash2,
  Upload,
  Save,
  MapPin,
  AlertCircle
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");

  // Mock data - in a real app, this would come from your backend
  const [accounts, setAccounts] = useState([
    { id: 1, name: "Cuenta Principal", color: "#3b82f6", icon: "💳" },
    { id: 2, name: "Ahorros", color: "#10b981", icon: "💰" },
  ]);

  const [categories, setCategories] = useState([
    { 
      id: 1, 
      name: "Alimentos y Bebidas", 
      color: "#f59e0b", 
      icon: "🍕", 
      nature: "Necesitar",
      subcategories: ["Bar, café", "Comestibles", "Restaurante, comida rápida"] 
    },
    { 
      id: 2, 
      name: "Compras", 
      color: "#ec4899", 
      icon: "🛍️", 
      nature: "Deseos",
      subcategories: ["Bebés, niños", "Casa y jardín", "Electrónica, accesorios", "Farmacia, droguería", "Joyas, accesorios", "Mascotas, animales", "Papelería, herramientas", "Regalos", "Ropa y calzado", "Salud y belleza", "Tiempo libre"] 
    },
    { 
      id: 3, 
      name: "Vivienda", 
      color: "#8b5cf6", 
      icon: "🏠", 
      nature: "Deber",
      subcategories: ["Energía, utilitarios", "Hipoteca", "Mantenimiento, reparaciones", "Renta", "Seguro de propiedad", "Servicios"] 
    },
    { 
      id: 4, 
      name: "Transporte", 
      color: "#ef4444", 
      icon: "🚌", 
      nature: "Necesitar",
      subcategories: ["Larga distancia", "Taxi", "Transporte público", "Viajes de negocio"] 
    },
    { 
      id: 5, 
      name: "Vehículos", 
      color: "#06b6d4", 
      icon: "🚗", 
      nature: "Necesitar",
      subcategories: ["Alquiler (de vehículos)", "Combustible", "Estacionamiento", "Mantenimiento de vehículos", "Seguro de vehículos"] 
    },
    { 
      id: 6, 
      name: "Vida y entretenimiento", 
      color: "#84cc16", 
      icon: "🎭", 
      nature: "Deseos",
      subcategories: ["Alcohol, cigarrillos", "Bienestar, belleza", "Caridad, regalos", "Cuidado de la salud, médico", "Cultura, eventos deportivos", "Deporte, fitness", "Educación, desarrollo", "Eventos cotidianos", "Libros, audio, suscripciones", "Lotería, juegos de azar", "Pasatiempos", "TV, transmisiones", "Vacaciones, viajes, hoteles"] 
    },
    { 
      id: 7, 
      name: "Comunicaciones, PC", 
      color: "#f97316", 
      icon: "💻", 
      nature: "Necesitar",
      subcategories: ["Internet", "Servicios Mantenimiento", "Software, aplicaciones, juegos", "Juegos", "Plataformas", "Software", "Teléfono, teléfono móvil"] 
    },
    { 
      id: 8, 
      name: "Gastos financieros", 
      color: "#dc2626", 
      icon: "💳", 
      nature: "Deber",
      subcategories: ["Asignación familiar", "Impuestos", "Multas", "Préstamos, Intereses", "Banco", "Comisión", "Seguros", "Servicios"] 
    },
    { 
      id: 9, 
      name: "Inversiones", 
      color: "#059669", 
      icon: "📈", 
      nature: "Deseos",
      subcategories: ["Ahorros", "Bienes raíces", "Colecciones", "Inversiones financieras", "Vehículos, propiedades"] 
    },
    { 
      id: 10, 
      name: "Ingreso", 
      color: "#10b981", 
      icon: "💰", 
      nature: "Deseos",
      subcategories: ["Asignación familiar", "Cheques, cupones", "Cuotas y subsidios", "Ingresos por alquiler", "Intereses, dividendos", "Lotería, juegos de azar", "Préstamos, alquileres", "Reembolsos (impuestos, compras)", "Salarios, facturas", "Comisión", "Facturas", "Servicios", "Venta", "Mercadería", "Streaming"] 
    },
  ]);

  const [tags, setTags] = useState([
    { id: 1, name: "Urgente", color: "#ef4444" },
    { id: 2, name: "Trabajo", color: "#3b82f6" },
  ]);

  const [templates, setTemplates] = useState([
    {
      id: 1,
      name: "Café matutino",
      amount: 5.00,
      account: "Cuenta Principal",
      category: "Alimentación",
      paymentMethod: "Dinero en efectivo",
      tags: ["Trabajo"],
      type: "Gastos",
      beneficiary: "Café Central",
      note: "Café diario"
    }
  ]);

  const [filters, setFilters] = useState([
    {
      id: 1,
      name: "Gastos del mes",
      type: "Gastos",
      categories: ["Alimentación", "Transporte"],
      tags: ["Urgente"],
      paymentMethod: "Todos",
      transfers: "Excluir",
      debts: "Excluir"
    }
  ]);

  const [notifications, setNotifications] = useState({
    walletReminder: true,
    scheduledPayments: true,
    debts: true,
    income: false
  });

  const handleSave = () => {
    toast({
      title: "Configuración guardada",
      description: "Los cambios se han guardado exitosamente.",
    });
  };

  const handleSignOut = async () => {
    await signOut();
  };

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
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Agregar cuenta
            </Button>
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
                    <p className="text-sm text-muted-foreground">Color: {account.color}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
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
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Agregar categoría
            </Button>
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
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="ml-13">
                  <p className="text-sm text-muted-foreground mb-2">Subcategorías:</p>
                  <div className="flex flex-wrap gap-2">
                    {category.subcategories.map((sub, idx) => (
                      <Badge key={idx} variant="outline">{sub}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
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
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Agregar etiqueta
            </Button>
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
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
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
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Agregar plantilla
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {templates.map((template) => (
              <div key={template.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-medium">{template.name}</h3>
                    <p className="text-sm text-muted-foreground">${template.amount.toFixed(2)} - {template.category}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Cuenta:</p>
                    <p>{template.account}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Pago:</p>
                    <p>{template.paymentMethod}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Tipo:</p>
                    <p>{template.type}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Beneficiario:</p>
                    <p>{template.beneficiary}</p>
                  </div>
                </div>
              </div>
            ))}
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
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Agregar filtro
            </Button>
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
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Categorías:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {filter.categories.map((cat, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">{cat}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Etiquetas:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {filter.tags.map((tag, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
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
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">Recordatorio de Wallet</p>
              <p className="text-sm text-muted-foreground">
                Recibe una notificación a las 20:00 para recordarte que anotes tus gastos del día.
              </p>
            </div>
            <Switch 
              checked={notifications.walletReminder}
              onCheckedChange={(checked) => setNotifications({...notifications, walletReminder: checked})}
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
              checked={notifications.scheduledPayments}
              onCheckedChange={(checked) => setNotifications({...notifications, scheduledPayments: checked})}
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
              checked={notifications.debts}
              onCheckedChange={(checked) => setNotifications({...notifications, debts: checked})}
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
              checked={notifications.income}
              onCheckedChange={(checked) => setNotifications({...notifications, income: checked})}
            />
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