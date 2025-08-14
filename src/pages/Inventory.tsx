import { useState } from "react";
import { Layout } from "@/components/Layout";
import { InventoryHeader } from "@/components/inventory/InventoryHeader";
import { InventoryFilters } from "@/components/inventory/InventoryFilters";
import { InventoryList } from "@/components/inventory/InventoryList";
import { FloatingActionButton } from "@/components/shared/FloatingActionButton";
import { AddProductDialog } from "@/components/inventory/AddProductDialog";
import { RegisterPurchaseDialog } from "@/components/inventory/RegisterPurchaseDialog";
import { RegisterSaleDialog } from "@/components/inventory/RegisterSaleDialog";

export default function Inventory() {
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);
  const [isSaleOpen, setIsSaleOpen] = useState(false);
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
        
        <InventoryList filters={filters} />
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
    </Layout>
  );
}