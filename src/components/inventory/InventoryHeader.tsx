import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, ShoppingCart, TrendingUp } from "lucide-react";
import { useInventory } from "@/hooks/useInventory";

interface InventoryHeaderProps {
  onAddProduct: () => void;
  onRegisterPurchase: () => void;
  onRegisterSale: () => void;
}

export function InventoryHeader({ onAddProduct, onRegisterPurchase, onRegisterSale }: InventoryHeaderProps) {
  const { products, loading } = useInventory();

  const totalProducts = products.length;
  const totalValue = products.reduce((sum, product) => sum + (product.quantity * product.cost), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Inventario</h1>
        
        <div className="hidden md:flex space-x-2">
          <Button onClick={onAddProduct} className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Crear producto</span>
          </Button>
          <Button onClick={onRegisterPurchase} variant="outline" className="flex items-center space-x-2">
            <ShoppingCart className="h-4 w-4" />
            <span>Registrar compras</span>
          </Button>
          <Button onClick={onRegisterSale} variant="outline" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Registrar ventas</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de referencias</p>
                <p className="text-2xl font-bold">{loading ? "..." : totalProducts}</p>
              </div>
              <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                <Plus className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Costo total</p>
                <p className="text-2xl font-bold">${loading ? "..." : totalValue.toLocaleString()}</p>
              </div>
              <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                <ShoppingCart className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="md:hidden">
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={onRegisterPurchase} variant="outline" className="flex items-center space-x-2">
            <ShoppingCart className="h-4 w-4" />
            <span>Compras</span>
          </Button>
          <Button onClick={onRegisterSale} variant="outline" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Ventas</span>
          </Button>
        </div>
      </div>
    </div>
  );
}