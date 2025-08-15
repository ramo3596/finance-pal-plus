import { useState } from "react";
import { Layout } from "@/components/Layout";
import { InventoryHeader } from "@/components/inventory/InventoryHeader";
import { InventoryFilters } from "@/components/inventory/InventoryFilters";
import { InventoryList } from "@/components/inventory/InventoryList";
import { FloatingActionButton } from "@/components/shared/FloatingActionButton";
import { AddProductDialog } from "@/components/inventory/AddProductDialog";
import { RegisterPurchaseDialog } from "@/components/inventory/RegisterPurchaseDialog";
import { RegisterSaleDialog } from "@/components/inventory/RegisterSaleDialog";
import { EditProductDialog } from "@/components/inventory/EditProductDialog";
import { Product, useInventory } from "@/hooks/useInventory";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function Inventory() {
  const { deleteProduct } = useInventory();
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);
  const [isSaleOpen, setIsSaleOpen] = useState(false);
  const [isEditProductOpen, setIsEditProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDeleteProductOpen, setIsDeleteProductOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [filters, setFilters] = useState({
    category: "",
    tags: [] as string[],
    search: ""
  });

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <InventoryHeader 
          onAddProduct={() => setIsAddProductOpen(true)}
          onRegisterPurchase={() => setIsPurchaseOpen(true)}
          onRegisterSale={() => setIsSaleOpen(true)}
        />
        
        <InventoryFilters 
          filters={filters}
          onFilterChange={handleFilterChange}
        />
        
        <InventoryList 
          filters={filters}
          onEditProduct={(product) => {
            setEditingProduct(product);
            setIsEditProductOpen(true);
          }}
          onDeleteProduct={(product) => {
            setDeletingProduct(product);
            setIsDeleteProductOpen(true);
          }}
        />
      </div>

      <FloatingActionButton 
        onClick={() => setIsAddProductOpen(true)}
      />

      <AddProductDialog 
        open={isAddProductOpen}
        onOpenChange={setIsAddProductOpen}
      />

      <RegisterPurchaseDialog 
        open={isPurchaseOpen}
        onOpenChange={setIsPurchaseOpen}
      />

      <RegisterSaleDialog 
        open={isSaleOpen}
        onOpenChange={setIsSaleOpen}
      />

      {editingProduct && (
        <EditProductDialog
          open={isEditProductOpen}
          onOpenChange={setIsEditProductOpen}
          product={editingProduct}
        />
      )}

      <AlertDialog open={isDeleteProductOpen} onOpenChange={setIsDeleteProductOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el producto
              <span className="font-bold"> {deletingProduct?.name}</span> de tus registros.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              if (deletingProduct) {
                await deleteProduct(deletingProduct.id);
                setIsDeleteProductOpen(false);
                setDeletingProduct(null);
              }
            }}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}