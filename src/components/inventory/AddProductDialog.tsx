import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductInfoForm } from "./ProductInfoForm";
import { ProductVariantsForm } from "./ProductVariantsForm";

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddProductDialog({ open, onOpenChange }: AddProductDialogProps) {
  const [activeTab, setActiveTab] = useState("info");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear producto</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info">Información</TabsTrigger>
            <TabsTrigger value="variants">Agregar variantes</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="mt-4">
            <ProductInfoForm onSuccess={() => onOpenChange(false)} />
          </TabsContent>

          <TabsContent value="variants" className="mt-4">
            <ProductVariantsForm />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}