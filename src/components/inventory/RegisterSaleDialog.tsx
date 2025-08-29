import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Autocomplete } from "@/components/ui/autocomplete";
import { Badge } from "@/components/ui/badge";
import { useSettings } from "@/hooks/useSettings";
import { useContacts } from "@/hooks/useContacts";
import { useTransactions } from "@/hooks/useTransactions";
import { useDebts } from "@/hooks/useDebts";
import { useInventory, Product } from "@/hooks/useInventory";
import { PaymentMethodSelect } from "@/components/shared/PaymentMethodSelect";
import { ProductSelectionDialog } from "./ProductSelectionDialog";
import { toast } from "@/hooks/use-toast";
import { ShoppingCart, ArrowLeft, CheckCircle2, AlertTriangle } from "lucide-react";
import { getCurrentLocalDate } from "@/utils/dateUtils";

// Schema for paid sales
const paidSaleSchema = z.object({
  date: z.string().min(1, "La fecha es obligatoria"),
  customer_id: z.string().min(1, "El cliente es obligatorio"),
  account_id: z.string().min(1, "La cuenta es obligatoria"),
  payment_method: z.string().min(1, "La forma de pago es obligatoria"),
  description: z.string().optional(),
  discount_percentage: z.number().min(0).max(100).optional(),
  discount_amount: z.number().min(0).optional(),
});

// Schema for debt sales
const debtSaleSchema = z.object({
  date: z.string().min(1, "La fecha es obligatoria"),
  customer_id: z.string().min(1, "El cliente es obligatorio"),
  description: z.string().optional(),
  discount_percentage: z.number().min(0).max(100).optional(),
  discount_amount: z.number().min(0).optional(),
});

// Dynamic schema based on transaction type
const getSaleSchema = (saleType: "paid" | "debt") => {
  return saleType === "paid" ? paidSaleSchema : debtSaleSchema;
};

type SaleFormData = z.infer<typeof paidSaleSchema>;

interface RegisterSaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SelectedProduct {
  product: Product;
  quantity: number;
  unitPrice: number;
}

type FlowStep = "selectProducts" | "confirmPrices" | "registerSale";

export function RegisterSaleDialog({ open, onOpenChange }: RegisterSaleDialogProps) {
  const [currentStep, setCurrentStep] = useState<FlowStep>("selectProducts");
  const [saleType, setSaleType] = useState<"paid" | "debt">("paid");
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [productSelectionOpen, setProductSelectionOpen] = useState(false);
  
  const { accounts, categories } = useSettings();
  const { contacts } = useContacts();
  const { createTransaction } = useTransactions();
  const { createDebt } = useDebts();
  const { updateProduct } = useInventory();

  const form = useForm<SaleFormData>({
    resolver: zodResolver(getSaleSchema(saleType)),
    defaultValues: {
      date: getCurrentLocalDate(),
      discount_percentage: 0,
      discount_amount: 0,
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = form;

  // Update form resolver when sale type changes
  useEffect(() => {
    form.clearErrors();
    // Clear account and payment method when switching to debt
    if (saleType === "debt") {
      setValue("account_id", "");
      setValue("payment_method", "");
    }
  }, [saleType, form, setValue]);

  const customers = contacts.filter(contact => contact.contact_type === "persona");

  const subtotal = selectedProducts.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const discountPercentage = watch("discount_percentage") || 0;
  const discountAmount = watch("discount_amount") || 0;
  const totalDiscount = (subtotal * discountPercentage / 100) + discountAmount;
  const totalAmount = subtotal - totalDiscount;
  const totalCost = selectedProducts.reduce((sum, item) => sum + (item.quantity * item.product.cost), 0);
  const profit = totalAmount - totalCost;

  const handleProductSelectionConfirm = (products: { product: Product; quantity: number; cost: number }[]) => {
    const selectedForSale = products.map(p => ({
      product: p.product,
      quantity: p.quantity,
      unitPrice: p.product.price, // Use product's selling price
    }));
    setSelectedProducts(selectedForSale);
    setCurrentStep("confirmPrices");
  };

  const handlePriceConfirmation = () => {
    setCurrentStep("registerSale");
  };

  const updateProductPrice = (index: number, newPrice: number) => {
    const updated = [...selectedProducts];
    updated[index].unitPrice = newPrice;
    setSelectedProducts(updated);
  };

  const updateProductQuantity = (index: number, newQuantity: number) => {
    const updated = [...selectedProducts];
    updated[index].quantity = newQuantity;
    setSelectedProducts(updated);
  };

  const onSubmit = async (data: SaleFormData) => {
    // Validate products selection
    if (selectedProducts.length === 0) {
      toast({
        title: "Error",
        description: "Debe seleccionar al menos un producto",
        variant: "destructive",
      });
      return;
    }

    // Validate inventory
    for (const item of selectedProducts) {
      if (item.product.quantity < item.quantity) {
        toast({
          title: "Error",
          description: `No hay suficiente inventario para ${item.product.name}. Disponible: ${item.product.quantity}, Solicitado: ${item.quantity}`,
          variant: "destructive",
        });
        return;
      }
    }

    try {
      const customer = customers.find(c => c.id === data.customer_id);
      
      // Find the "Ventas" subcategory in any category and get its parent category
      let ventasCategory = null;
      let ventasSubcategory = null;
      
      for (const category of categories) {
        const foundSubcategory = category.subcategories?.find(sub => sub.name.toLowerCase() === 'ventas');
        if (foundSubcategory) {
          ventasSubcategory = foundSubcategory;
          ventasCategory = category; // Use the parent category of the subcategory
          break;
        }
      }
      
      // If no "Ventas" subcategory found, fallback to finding a "Ventas" category
      if (!ventasCategory) {
        ventasCategory = categories.find(cat => cat.name.toLowerCase() === 'ventas');
      }

      if (saleType === "paid") {
        // For paid sales: Create income transaction AND update inventory
        
        // 1. Create income transaction for each product (for statistics tracking)
        for (const item of selectedProducts) {
          await createTransaction({
            type: "income",
            amount: item.quantity * item.unitPrice,
            description: `Venta: ${item.product.name} (${item.quantity} ${item.quantity === 1 ? 'unidad' : 'unidades'})`,
            category_id: ventasCategory?.id,
            subcategory_id: ventasSubcategory?.id,
            account_id: data.account_id!,
            payment_method: data.payment_method!,
            transaction_date: new Date(`${data.date}T${new Date().toTimeString().slice(0, 5)}`).toISOString(),
            tags: item.product.tags || [],
            beneficiary: customer?.name,
            payer_contact_id: data.customer_id,
            note: data.description || `Venta a ${customer?.name}${totalDiscount > 0 ? ` - Descuento aplicado: $${totalDiscount.toFixed(2)}` : ''}`,
          });
        }

        // 2. Reduce inventory quantities
        for (const item of selectedProducts) {
          await updateProduct(item.product.id, {
            quantity: item.product.quantity - item.quantity,
          });
        }
      } else {
        // For debt sales: Create income transactions, opposite transactions, debt AND update inventory
        
        // Find the "Colecciones" subcategory in any category and get its parent category
        let inversionesCategory = null;
        let coleccionesSubcategory = null;
        
        // Debug: Log available categories
        console.log('Available categories:', categories.map(c => ({ name: c.name, id: c.id, subcategories: c.subcategories?.map(s => s.name) })));
        
        for (const category of categories) {
          const foundSubcategory = category.subcategories?.find(sub => sub.name.toLowerCase() === 'colecciones');
          if (foundSubcategory) {
            coleccionesSubcategory = foundSubcategory;
            inversionesCategory = category; // Use the parent category of the subcategory
            break;
          }
        }
        
        // If no "Colecciones" subcategory found, fallback to finding an "Inversiones" category
        if (!inversionesCategory) {
          inversionesCategory = categories.find(cat => cat.name.toLowerCase() === 'inversiones');
        }
        
        // Debug: Log found categories
        console.log('Found Inversiones category:', inversionesCategory);
        console.log('Found Colecciones subcategory:', coleccionesSubcategory);
        
        // 1. Create income transaction for each product (for statistics tracking)
        for (const item of selectedProducts) {
          await createTransaction({
            type: "income",
            amount: item.quantity * item.unitPrice,
            description: `Venta: ${item.product.name} (${item.quantity} ${item.quantity === 1 ? 'unidad' : 'unidades'})`,
            category_id: ventasCategory?.id,
            subcategory_id: ventasSubcategory?.id,
            account_id: accounts[0]?.id || "", // Use first available account
            payment_method: "credito",
            transaction_date: new Date(`${data.date}T${new Date().toTimeString().slice(0, 5)}`).toISOString(),
            tags: item.product.tags || [],
            beneficiary: customer?.name,
            payer_contact_id: data.customer_id,
            note: data.description || `Venta a crédito a ${customer?.name}${totalDiscount > 0 ? ` - Descuento aplicado: $${totalDiscount.toFixed(2)}` : ''}`,
          });
          
          // 1.1. Create opposite transaction for accounting purposes (Colecciones)
          if (inversionesCategory && coleccionesSubcategory) {
            await createTransaction({
              type: "expense",
              amount: item.quantity * item.unitPrice,
              description: `Registro contable - Venta a crédito: ${item.product.name} (${item.quantity} ${item.quantity === 1 ? 'unidad' : 'unidades'})`,
              category_id: inversionesCategory.id,
              subcategory_id: coleccionesSubcategory.id,
              account_id: accounts[0]?.id || "", // Same account as the income transaction
              payment_method: "credito",
              transaction_date: new Date(`${data.date}T${new Date().toTimeString().slice(0, 5)}`).toISOString(),
              tags: item.product.tags || [],
              beneficiary: customer?.name,
              payer_contact_id: data.customer_id,
              note: `Registro contable opuesto - ${data.description || `Venta a crédito a ${customer?.name}`}${totalDiscount > 0 ? ` - Descuento aplicado: $${totalDiscount.toFixed(2)}` : ''}`,
            });
          }
        }

        // 2. Create debt (customer owes us money)
        await createDebt({
          type: "loan", // Loan = money they owe us
          initial_amount: totalAmount,
          current_balance: totalAmount,
          description: data.description || `Venta a crédito - ${customer?.name}`,
          contact_id: data.customer_id,
          account_id: accounts[0]?.id || "", // Optional for debts
          status: "active",
          debt_date: new Date(`${data.date}T${new Date().toTimeString().slice(0, 5)}`).toISOString(),
        }, [], { skipTransaction: true });

        // 3. Reduce inventory quantities (products are delivered)
        for (const item of selectedProducts) {
          await updateProduct(item.product.id, {
            quantity: item.product.quantity - item.quantity,
          });
        }
      }

      toast({
        title: "Éxito",
        description: saleType === "paid" 
          ? "Venta registrada exitosamente" 
          : "Venta a crédito registrada exitosamente",
      });

      // Reset form and flow
      reset();
      setSelectedProducts([]);
      setCurrentStep("selectProducts");
      onOpenChange(false);
    } catch (error) {
      console.error('Error registering sale:', error);
      toast({
        title: "Error",
        description: "No se pudo registrar la venta",
        variant: "destructive",
      });
    }
  };

  const resetFlow = () => {
    setCurrentStep("selectProducts");
    setSelectedProducts([]);
    reset();
  };

  // Step 1: Product Selection
  if (currentStep === "selectProducts") {
    return (
      <>
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registrar ventas - Paso 1: Seleccionar productos</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="text-center">
                <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Selecciona los productos a vender</h3>
                <p className="text-muted-foreground mb-4">
                  Busca y selecciona los productos que deseas vender, ajustando las cantidades según necesites.
                </p>
              </div>

              <Button
                onClick={() => setProductSelectionOpen(true)}
                className="w-full"
                size="lg"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Seleccionar productos
              </Button>

              {selectedProducts.length > 0 && (
                <div className="space-y-2 p-4 bg-muted rounded-md">
                  <h4 className="font-medium">Productos seleccionados:</h4>
                  {selectedProducts.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{item.product.name} x{item.quantity}</span>
                      <span>${(item.quantity * item.unitPrice).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 font-medium">
                    Total: ${selectedProducts.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0).toFixed(2)}
                  </div>
                  
                  <Button
                    onClick={handlePriceConfirmation}
                    className="w-full mt-4"
                  >
                    Continuar a confirmación
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <ProductSelectionDialog
          open={productSelectionOpen}
          onOpenChange={setProductSelectionOpen}
          onProductsSelected={handleProductSelectionConfirm}
          selectedProducts={selectedProducts.map(p => ({
            product: p.product,
            quantity: p.quantity,
            cost: p.product.cost
          }))}
        />
      </>
    );
  }

  // Step 2: Confirm Prices and Quantities
  if (currentStep === "confirmPrices") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar ventas - Paso 2: Confirmar precios y cantidades</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Button
              variant="ghost"
              onClick={() => setCurrentStep("selectProducts")}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a selección de productos
            </Button>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-blue-600" />
                <p className="text-sm text-blue-800">
                  <strong>Importante:</strong> Al crear la venta se descontarán las unidades seleccionadas de tu inventario.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {selectedProducts.map((item, index) => (
                <div key={index} className="p-4 border rounded-md">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium">{item.product.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Disponible: {item.product.quantity} unidades
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Cantidad</Label>
                      <Input
                        type="number"
                        min="1"
                        max={item.product.quantity}
                        value={item.quantity}
                        onChange={(e) => updateProductQuantity(index, parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div>
                      <Label>Precio unitario</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unitPrice}
                        onChange={(e) => updateProductPrice(index, parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                  
                  <div className="mt-2 text-right">
                    <span className="font-medium">
                      Subtotal: ${(item.quantity * item.unitPrice).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-muted rounded-md">
              <div className="text-right">
                <div className="text-lg font-bold">
                  Total: ${subtotal.toFixed(2)}
                </div>
              </div>
            </div>

            <Button
              onClick={handlePriceConfirmation}
              className="w-full"
              size="lg"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Confirmar y continuar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Step 3: Register Sale Form
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar ventas - Paso 3: Formulario de venta</DialogTitle>
        </DialogHeader>

        <Button
          variant="ghost"
          onClick={() => setCurrentStep("confirmPrices")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a confirmación
        </Button>

        <Tabs value={saleType} onValueChange={(value) => setSaleType(value as "paid" | "debt")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="paid">Pagado</TabsTrigger>
            <TabsTrigger value="debt">Deuda</TabsTrigger>
          </TabsList>

          <TabsContent value={saleType} className="mt-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor="date">Fecha de la venta *</Label>
                <Input
                  id="date"
                  type="date"
                  {...register("date")}
                />
                {errors.date && (
                  <p className="text-sm text-destructive">{errors.date.message}</p>
                )}
              </div>

              {/* Selected Products Display */}
              <div className="space-y-2">
                <Label>Productos seleccionados</Label>
                <div className="p-4 bg-muted rounded-md">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">
                      {selectedProducts.length} producto{selectedProducts.length > 1 ? 's' : ''}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentStep("selectProducts")}
                    >
                      Modificar
                    </Button>
                  </div>
                  {selectedProducts.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm py-1">
                      <span>{item.product.name} x{item.quantity}</span>
                      <span>${(item.quantity * item.unitPrice).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Customer */}
              <div className="space-y-2">
                <Label>Cliente *</Label>
                <Autocomplete
                  options={customers.filter(customer => customer.id && customer.id.trim() !== '').map(customer => ({
                    id: customer.id,
                    name: customer.name
                  }))}
                  value={watch("customer_id")}
                  onValueChange={(value) => setValue("customer_id", value)}
                  placeholder="Buscar cliente..."
                />
                {errors.customer_id && (
                  <p className="text-sm text-destructive">{errors.customer_id.message}</p>
                )}
              </div>

              {/* Discounts */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discount_percentage">Descuento (%)</Label>
                  <Input
                    id="discount_percentage"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    {...register("discount_percentage", { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discount_amount">Descuento ($)</Label>
                  <Input
                    id="discount_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    {...register("discount_amount", { valueAsNumber: true })}
                  />
                </div>
              </div>

              {/* Account - Only show for paid sales */}
              {saleType === "paid" && (
                <div className="space-y-2">
                  <Label>Método de pago *</Label>
                  <Select onValueChange={(value) => setValue("account_id", value)} value={watch("account_id") || ""}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar cuenta" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.filter(account => account.id && account.id.trim() !== '').map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          <div className="flex items-center space-x-2">
                            <span>{account.icon}</span>
                            <span>{account.name}</span>
                            <span className="text-muted-foreground">
                              ${account.balance.toFixed(2)}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.account_id && (
                    <p className="text-sm text-destructive">{errors.account_id.message}</p>
                  )}
                </div>
              )}

              {/* Payment Method - Only show for paid sales */}
              {saleType === "paid" && (
                <div className="space-y-2">
                  <Label>Forma de pago *</Label>
                  <PaymentMethodSelect
                    value={watch("payment_method") || ""}
                    onValueChange={(value) => setValue("payment_method", value)}
                  />
                  {errors.payment_method && (
                    <p className="text-sm text-destructive">{errors.payment_method.message}</p>
                  )}
                </div>
              )}

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  placeholder="Descripción de la venta..."
                  {...register("description")}
                  rows={3}
                />
              </div>

              {/* Payment Details */}
              <div className="p-4 bg-muted rounded-md space-y-2">
                <h3 className="font-medium">Detalle del pago</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  {totalDiscount > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Descuento:</span>
                      <span>-${totalDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-medium text-lg border-t pt-1">
                    <span>Total:</span>
                    <span>${totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Ganancia:</span>
                    <span>${profit.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Information message for debt sales */}
              {saleType === "debt" && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>Nota:</strong> Al registrar como deuda, se creará la transacción de ingreso, el registro de deuda y se actualizará el inventario.
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting || selectedProducts.length === 0}
                className="w-full"
                size="lg"
              >
                {isSubmitting ? "Creando venta..." : `Crear venta - ${selectedProducts.length} producto${selectedProducts.length !== 1 ? 's' : ''} - $${totalAmount.toFixed(2)}`}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={resetFlow}
                className="w-full"
              >
                Cancelar y reiniciar
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}