import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useInventory } from "@/hooks/useInventory";
import { useTransactions } from "@/hooks/useTransactions";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Loader2, Package, TrendingUp, DollarSign, BarChart3 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { subDays, isWithinInterval } from "date-fns";
import { DateRange } from "react-day-picker";

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

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date()
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

  // Filtrar transacciones de venta en el rango de fechas
  const salesTransactions = transactions.filter(transaction => {
    if (transaction.type !== 'expense' || !transaction.description.includes('Venta:')) return false;
    
    if (dateRange?.from && dateRange?.to) {
      return isWithinInterval(new Date(transaction.transaction_date), {
        start: dateRange.from,
        end: dateRange.to
      });
    }
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Estadísticas de Venta de Productos</h1>
            <p className="text-muted-foreground">
              Analíticas y métricas de las ventas de productos del inventario
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant="outline"
                  className={cn(
                    "w-[300px] justify-start text-left font-normal",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Seleccionar fechas</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
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
    </Layout>
  );
}