import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useInventory, Product } from "@/hooks/useInventory";
import { Search, Plus, Minus } from "lucide-react";

interface SelectedProduct {
  product: Product;
  quantity: number;
  cost: number;
}

interface ProductSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId?: string;
  onProductsSelected: (products: SelectedProduct[]) => void;
  selectedProducts: SelectedProduct[];
}

export function ProductSelectionDialog({
  open,
  onOpenChange,
  categoryId,
  onProductsSelected,
  selectedProducts,
}: ProductSelectionDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [localSelectedProducts, setLocalSelectedProducts] = useState<SelectedProduct[]>(selectedProducts);
  const { products } = useInventory();

  useEffect(() => {
    setLocalSelectedProducts(selectedProducts);
  }, [selectedProducts]);

  // Filter products by category and search term
  const filteredProducts = products.filter(product => {
    const matchesCategory = !categoryId || product.category_id === categoryId;
    const matchesSearch = !searchTerm || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  const handleQuantityChange = (product: Product, quantity: number) => {
    if (quantity <= 0) {
      // Remove product if quantity is 0 or negative
      setLocalSelectedProducts(prev => 
        prev.filter(item => item.product.id !== product.id)
      );
    } else {
      setLocalSelectedProducts(prev => {
        const existingIndex = prev.findIndex(item => item.product.id === product.id);
        
        if (existingIndex >= 0) {
          // Update existing product
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity,
          };
          return updated;
        } else {
          // Add new product
          return [...prev, {
            product,
            quantity,
            cost: product.cost,
          }];
        }
      });
    }
  };

  const handleCostChange = (product: Product, cost: number) => {
    setLocalSelectedProducts(prev => {
      const existingIndex = prev.findIndex(item => item.product.id === product.id);
      
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          cost,
        };
        return updated;
      }
      return prev;
    });
  };

  const getSelectedQuantity = (productId: string) => {
    const selected = localSelectedProducts.find(item => item.product.id === productId);
    return selected ? selected.quantity : 0;
  };

  const getSelectedCost = (productId: string) => {
    const selected = localSelectedProducts.find(item => item.product.id === productId);
    return selected ? selected.cost : 0;
  };

  const handleConfirm = () => {
    onProductsSelected(localSelectedProducts);
    onOpenChange(false);
  };

  const total = localSelectedProducts.reduce((sum, item) => sum + (item.quantity * item.cost), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Seleccionar productos</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>

          {/* Selected Products Summary */}
          {localSelectedProducts.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">Productos seleccionados: {localSelectedProducts.length}</h4>
                  <span className="font-bold">Total: ${total.toFixed(2)}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {localSelectedProducts.map(item => (
                    <div key={item.product.id} className="flex justify-between">
                      <span>{item.product.name} x{item.quantity}</span>
                      <span>${(item.quantity * item.cost).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Products List */}
          <div className="space-y-2 max-h-[50vh] overflow-y-auto">
            {filteredProducts.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                {searchTerm ? "No se encontraron productos" : "No hay productos disponibles"}
              </div>
            ) : (
              filteredProducts.map((product) => {
                const selectedQuantity = getSelectedQuantity(product.id);
                const selectedCost = getSelectedCost(product.id) || product.cost;
                
                return (
                  <Card key={product.id} className={selectedQuantity > 0 ? "ring-2 ring-primary" : ""}>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                        {/* Product Info */}
                        <div className="md:col-span-2">
                          <h4 className="font-medium">{product.name}</h4>
                          {product.description && (
                            <p className="text-sm text-muted-foreground">{product.description}</p>
                          )}
                          <div className="text-sm text-muted-foreground">
                            Stock actual: {product.quantity} | Costo: ${product.cost.toFixed(2)}
                          </div>
                        </div>

                        {/* Quantity Controls */}
                        <div className="space-y-2">
                          <Label className="text-xs">Cantidad</Label>
                          <div className="flex items-center space-x-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleQuantityChange(product, Math.max(0, selectedQuantity - 1))}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Input
                              type="number"
                              min="0"
                              value={selectedQuantity}
                              onChange={(e) => handleQuantityChange(product, parseInt(e.target.value) || 0)}
                              className="w-16 text-center"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleQuantityChange(product, selectedQuantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        {/* Cost Input */}
                        <div className="space-y-2">
                          <Label className="text-xs">Costo unitario</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={selectedCost}
                            onChange={(e) => handleCostChange(product, parseFloat(e.target.value) || 0)}
                            className="w-full"
                            disabled={selectedQuantity === 0}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirm} disabled={localSelectedProducts.length === 0}>
              Confirmar selección ({localSelectedProducts.length})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}