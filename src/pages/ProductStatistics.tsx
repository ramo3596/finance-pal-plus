import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useInventory } from "@/hooks/useInventory";
import { useTransactions } from "@/hooks/useTransactions";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Loader2, Package, TrendingUp, DollarSign, BarChart3 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RecordsFilters as RecordsFiltersComponent } from "@/components/records/RecordsFilters";
import { StatisticsFilters } from "@/pages/Statistics";
import { subDays, isWithinInterval } from "date-fns";

interface ProductSale {
  productId: string;
  productName: string;
  quantity: number;
  revenue: number;
  profit: number;
  cost: number;
}

export default function ProductStatistics() {
  const { user, loading: authLoading } = useAuth();
  const { products, loading: productsLoading } = useInventory();
  const { transactions, loading: transactionsLoading } = useTransactions();
  const navigate = useNavigate();

  const [filters, setFilters] = useState<StatisticsFilters>({
    searchTerm: "",
    selectedAccounts: [],
    selectedCategories: [],
    selectedTags: [],
    selectedTypes: [],
    dateRange: {
      from: subDays(new Date(), 30),
      to: new Date()
    },
    amountRange: { min: 0, max: 0 },
    selectedPaymentMethods: [],
    status: "all",
    sortBy: "date-desc"
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  if (authLoading || productsLoading || transactionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Helper function to apply all filters
  const handleFilterChange = (newFilters: Partial<StatisticsFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  };

  // Filtrar transacciones de venta aplicando todos los filtros
  const salesTransactions = transactions.filter(transaction => {
    // Solo transacciones de venta (gastos con descripción "Venta:")
    if (transaction.type !== 'expense' || !transaction.description.includes('Venta:')) return false;
    
    // Filtro de fecha
    if (filters.dateRange?.from && filters.dateRange?.to) {
      const transactionDate = new Date(transaction.transaction_date);
      if (!isWithinInterval(transactionDate, {
        start: filters.dateRange.from,
        end: filters.dateRange.to
      })) return false;
    }

    // Filtro de texto de búsqueda
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      if (!transaction.description.toLowerCase().includes(searchTerm)) return false;
    }

    // Filtro de cuentas
    if (filters.selectedAccounts.length > 0) {
      if (!filters.selectedAccounts.includes(transaction.account_id)) return false;
    }

    // Filtro de categorías
    if (filters.selectedCategories.length > 0) {
      if (!transaction.category_id || !filters.selectedCategories.includes(transaction.category_id)) return false;
    }

    // Filtro de etiquetas
    if (filters.selectedTags.length > 0) {
      if (!transaction.tags || !transaction.tags.some(tag => filters.selectedTags.includes(tag))) return false;
    }

    // Filtro de métodos de pago
    if (filters.selectedPaymentMethods.length > 0) {
      if (!transaction.payment_method || !filters.selectedPaymentMethods.includes(transaction.payment_method)) return false;
    }

    // Filtro de rango de cantidad
    const amount = Math.abs(transaction.amount);
    if (amount < filters.amountRange.min || amount > filters.amountRange.max) return false;

    return true;
  });

  // Calcular estadísticas de productos
  const productSales: ProductSale[] = [];
  const productSalesMap = new Map<string, ProductSale>();

  salesTransactions.forEach(transaction => {
    // Extraer información del producto de la descripción
    const match = transaction.description.match(/Venta: (.+) \((\d+) unidades?\)/);
    if (match) {
      const productName = match[1];
      const quantity = parseInt(match[2]);
      const revenue = Math.abs(transaction.amount);
      
      // Buscar el producto en el inventario para obtener costo
      const product = products.find(p => p.name === productName);
      const cost = product ? product.cost * quantity : 0;
      const profit = revenue - cost;

      const key = product?.id || productName;
      
      if (productSalesMap.has(key)) {
        const existing = productSalesMap.get(key)!;
        existing.quantity += quantity;
        existing.revenue += revenue;
        existing.cost += cost;
        existing.profit += profit;
      } else {
        productSalesMap.set(key, {
          productId: key,
          productName,
          quantity,
          revenue,
          cost,
          profit
        });
      }
    }
  });

  productSalesMap.forEach(sale => productSales.push(sale));
  
  // Ordenar por ingresos
  productSales.sort((a, b) => b.revenue - a.revenue);

  // Calcular totales
  const totalRevenue = productSales.reduce((sum, sale) => sum + sale.revenue, 0);
  const totalProfit = productSales.reduce((sum, sale) => sum + sale.profit, 0);
  const totalUnitsSold = productSales.reduce((sum, sale) => sum + sale.quantity, 0);

  return (
    <Layout>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filters Sidebar */}
        <div className="w-full lg:w-80 flex-shrink-0">
          <RecordsFiltersComponent
            filters={filters}
            onFilterChange={handleFilterChange}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Estadísticas de Venta de Productos</h1>
            <p className="text-muted-foreground">
              Analíticas y métricas de las ventas de productos del inventario
            </p>
          </div>

          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${totalRevenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground">
                  Por ventas de productos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ganancias Netas</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${totalProfit.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground">
                  Ingresos - Costos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unidades Vendidas</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalUnitsSold}</div>
                <p className="text-xs text-muted-foreground">
                  Total de productos vendidos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Productos Vendidos</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{productSales.length}</div>
                <p className="text-xs text-muted-foreground">
                  Productos diferentes
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Top Products Table */}
          <Card>
            <CardHeader>
              <CardTitle>Productos Más Vendidos</CardTitle>
              <CardDescription>
                Ranking de productos por ingresos generados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {productSales.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No hay ventas de productos en el período seleccionado
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {productSales.slice(0, 10).map((sale, index) => (
                    <div key={sale.productId} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-xs">
                          #{index + 1}
                        </Badge>
                        <div>
                          <h3 className="font-medium">{sale.productName}</h3>
                          <p className="text-sm text-muted-foreground">
                            {sale.quantity} unidades vendidas
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-semibold">
                          ${sale.revenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Ganancia: ${sale.profit.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
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
    </Layout>
  );
}