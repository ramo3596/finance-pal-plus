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
import { useSettings } from "@/hooks/useSettings";
import { useContacts } from "@/hooks/useContacts";
import { useTransactions } from "@/hooks/useTransactions";
import { useDebts } from "@/hooks/useDebts";
import { useInventory, Product } from "@/hooks/useInventory";
import { PaymentMethodSelect } from "@/components/shared/PaymentMethodSelect";
import { ProductSelectionDialog } from "./ProductSelectionDialog";
import { toast } from "@/hooks/use-toast";
import { ShoppingCart } from "lucide-react";
import { getCurrentLocalDate } from "@/utils/dateUtils";

// Schema for paid transactions
const paidPurchaseSchema = z.object({
  date: z.string().min(1, "La fecha es obligatoria"),
  category_id: z.string().min(1, "La categoría es obligatoria"),
  subcategory_id: z.string().optional(),
  total_amount: z.number().min(0.01, "El valor total debe ser mayor a 0"),
  supplier_id: z.string().min(1, "El proveedor es obligatorio"),
  account_id: z.string().min(1, "La cuenta es obligatoria"),
  payment_method: z.string().min(1, "La forma de pago es obligatoria"),
  concept: z.string().optional(),
});

// Schema for debt transactions
const debtPurchaseSchema = z.object({
  date: z.string().min(1, "La fecha es obligatoria"),
  category_id: z.string().min(1, "La categoría es obligatoria"),
  subcategory_id: z.string().optional(),
  total_amount: z.number().min(0.01, "El valor total debe ser mayor a 0"),
  supplier_id: z.string().min(1, "El proveedor es obligatorio"),
  account_id: z.string().optional(),
  payment_method: z.string().optional(),
  concept: z.string().optional(),
});

// Dynamic schema based on transaction type
const getPurchaseSchema = (transactionType: "paid" | "debt") => {
  return transactionType === "paid" ? paidPurchaseSchema : debtPurchaseSchema;
};

type PurchaseFormData = z.infer<typeof paidPurchaseSchema>;

interface RegisterPurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SelectedProduct {
  product: Product;
  quantity: number;
  cost: number;
}

export function RegisterPurchaseDialog({ open, onOpenChange }: RegisterPurchaseDialogProps) {
  const [transactionType, setTransactionType] = useState<"paid" | "debt">("paid");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [productSelectionOpen, setProductSelectionOpen] = useState(false);
  
  const { categories, accounts } = useSettings();
  const { contacts } = useContacts();
  const { createTransaction } = useTransactions();
  const { createDebt } = useDebts();
  const { updateProduct } = useInventory();

  const form = useForm<PurchaseFormData>({
    resolver: zodResolver(getPurchaseSchema(transactionType)),
    defaultValues: {
      date: getCurrentLocalDate(),
      total_amount: 0,
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

  // Update form resolver when transaction type changes
  useEffect(() => {
    form.clearErrors();
    // Clear account and payment method when switching to debt
    if (transactionType === "debt") {
      setValue("account_id", "");
      setValue("payment_method", "");
    }
  }, [transactionType, form, setValue]);

  const selectedCategoryData = categories.find(cat => cat.id === selectedCategory);
  const subcategories = selectedCategoryData?.subcategories || [];
  const suppliers = contacts.filter(contact => contact.contact_type === "empresa"); // Filter only empresa type contacts for suppliers

  const totalAmount = selectedProducts.reduce((sum, item) => sum + (item.quantity * item.cost), 0);

  // Update total amount when products change
  useEffect(() => {
    setValue("total_amount", totalAmount);
  }, [selectedProducts, setValue, totalAmount]);

  const onSubmit = async (data: PurchaseFormData) => {
    // Validate products selection
    if (selectedProducts.length === 0) {
      toast({
        title: "Error",
        description: "Debe seleccionar al menos un producto",
        variant: "destructive",
      });
      return;
    }

    // Additional validation for debt transactions
    if (transactionType === "debt") {
      if (!data.supplier_id) {
        toast({
          title: "Error",
          description: "El proveedor es obligatorio para registrar una deuda",
          variant: "destructive",
        });
        return;
      }
    }

    // Additional validation for paid transactions
    if (transactionType === "paid") {
      if (!data.account_id) {
        toast({
          title: "Error",
          description: "La cuenta es obligatoria para transacciones pagadas",
          variant: "destructive",
        });
        return;
      }
      if (!data.payment_method) {
        toast({
          title: "Error",
          description: "La forma de pago es obligatoria para transacciones pagadas",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      const supplier = suppliers.find(s => s.id === data.supplier_id);
      const category = categories.find(c => c.id === data.category_id);

      if (transactionType === "paid") {
        // For paid transactions: Create transaction AND update inventory
        
        // 1. Create transaction first
        await createTransaction({
          type: "expense",
          amount: data.total_amount,
          description: data.concept || `Compra de productos - ${supplier?.name}`,
          category_id: data.category_id,
          subcategory_id: data.subcategory_id || undefined,
          account_id: data.account_id!,
          payment_method: data.payment_method!,
          transaction_date: new Date(`${data.date}T${new Date().toTimeString().slice(0, 5)}`).toISOString(),
          tags: selectedProducts.flatMap(p => p.product.tags || []),
          beneficiary: supplier?.name,
          note: `Productos: ${selectedProducts.map(p => `${p.product.name} (${p.quantity})`).join(', ')}`,
        });

        // 2. Update inventory quantities
        for (const item of selectedProducts) {
          await updateProduct(item.product.id, {
            quantity: item.product.quantity + item.quantity,
            cost: item.cost,
          });
        }
      } else {
        // For debt transactions: Create debt AND update inventory (NO transaction)
        
        // 1. Create debt (no money movement)
        await createDebt({
          type: "debt", // Debt = money we owe to supplier
          initial_amount: data.total_amount,
          current_balance: data.total_amount,
          description: data.concept || `Compra de productos - ${supplier?.name}`,
          contact_id: data.supplier_id,
          account_id: accounts[0]?.id || "", // Optional for debts
          status: "active",
          debt_date: new Date(`${data.date}T${new Date().toTimeString().slice(0, 5)}`).toISOString(),
        }, []);

        // 2. Update inventory quantities (inventory increases even though it's a debt)
        for (const item of selectedProducts) {
          await updateProduct(item.product.id, {
            quantity: item.product.quantity + item.quantity,
            cost: item.cost,
          });
        }
      }

      toast({
        title: "Éxito",
        description: transactionType === "paid" 
          ? "Compra registrada y transacción creada" 
          : "Compra registrada como deuda - El inventario se ha actualizado sin afectar las cuentas",
      });

      // Reset form
      reset();
      setSelectedProducts([]);
      setSelectedCategory("");
      onOpenChange(false);
    } catch (error) {
      console.error('Error registering purchase:', error);
      toast({
        title: "Error",
        description: "No se pudo registrar la compra",
        variant: "destructive",
      });
    }
  };

  const handleProductSelection = (products: SelectedProduct[]) => {
    setSelectedProducts(products);
    const total = products.reduce((sum, item) => sum + (item.quantity * item.cost), 0);
    setValue("total_amount", total);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registro de Compras</DialogTitle>
          </DialogHeader>

          <Tabs value={transactionType} onValueChange={(value) => setTransactionType(value as "paid" | "debt")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="paid">Pagado</TabsTrigger>
              <TabsTrigger value="debt">Deuda</TabsTrigger>
            </TabsList>

            <TabsContent value={transactionType} className="mt-4">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Date */}
                <div className="space-y-2">
                  <Label htmlFor="date">Fecha del gasto *</Label>
                  <Input
                    id="date"
                    type="date"
                    {...register("date")}
                  />
                  {errors.date && (
                    <p className="text-sm text-destructive">{errors.date.message}</p>
                  )}
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label>Categoría del gasto *</Label>
                  <Select
                    value={selectedCategory}
                    onValueChange={(value) => {
                      setSelectedCategory(value);
                      setValue("category_id", value);
                      setValue("subcategory_id", ""); // Reset subcategory
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.filter(category => category.id && category.id.trim() !== '').map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center space-x-2">
                            <span>{category.icon}</span>
                            <span>{category.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category_id && (
                    <p className="text-sm text-destructive">{errors.category_id.message}</p>
                  )}
                </div>

                {/* Subcategory */}
                {subcategories.length > 0 && (
                  <div className="space-y-2">
                    <Label>Subcategoría</Label>
                    <Select onValueChange={(value) => setValue("subcategory_id", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar subcategoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {subcategories.filter(subcategory => subcategory.id && subcategory.id.trim() !== '').map((subcategory) => (
                          <SelectItem key={subcategory.id} value={subcategory.id}>
                            <div className="flex items-center space-x-2">
                              <span>{subcategory.icon}</span>
                              <span>{subcategory.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Product Selection */}
                <div className="space-y-2">
                  <Label>Seleccionar productos</Label>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setProductSelectionOpen(true)}
                    className="w-full justify-between"
                  >
                    <div className="flex items-center space-x-2">
                      <ShoppingCart className="h-4 w-4" />
                      <span>
                        {selectedProducts.length > 0 
                          ? `${selectedProducts.length} producto${selectedProducts.length > 1 ? 's' : ''} seleccionado${selectedProducts.length > 1 ? 's' : ''}`
                          : "Seleccionar productos"
                        }
                      </span>
                    </div>
                    <span>→</span>
                  </Button>
                  
                  {selectedProducts.length > 0 && (
                    <div className="space-y-2 p-3 bg-muted rounded-md">
                      {selectedProducts.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{item.product.name} x{item.quantity}</span>
                          <span>${(item.quantity * item.cost).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Total Amount */}
                <div className="space-y-2">
                  <Label htmlFor="total_amount">Valor total *</Label>
                  <Input
                    id="total_amount"
                    type="number"
                    step="0.01"
                    value={totalAmount.toFixed(2)}
                    readOnly
                    className="bg-muted"
                  />
                  {errors.total_amount && (
                    <p className="text-sm text-destructive">{errors.total_amount.message}</p>
                  )}
                </div>

                {/* Supplier */}
                <div className="space-y-2">
                  <Label>Proveedor *</Label>
                  <Autocomplete
                    options={suppliers.filter(supplier => supplier.id && supplier.id.trim() !== '').map(supplier => ({
                      id: supplier.id,
                      name: supplier.name
                    }))}
                    value={watch("supplier_id")}
                    onValueChange={(value) => setValue("supplier_id", value)}
                    placeholder="Buscar proveedor..."
                  />
                  {errors.supplier_id && (
                    <p className="text-sm text-destructive">{errors.supplier_id.message}</p>
                  )}
                </div>

                {/* Account - Only show for paid transactions */}
                {transactionType === "paid" && (
                  <div className="space-y-2">
                    <Label>Cuenta *</Label>
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

                {/* Payment Method - Only show for paid transactions */}
                {transactionType === "paid" && (
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

                {/* Information message for debt transactions */}
                {transactionType === "debt" && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-800">
                      <strong>Nota:</strong> Al registrar como deuda, el inventario se actualizará pero no se afectarán las cuentas financieras. El movimiento de dinero se registrará cuando se pague la deuda.
                    </p>
                  </div>
                )}

                {/* Concept */}
                <div className="space-y-2">
                  <Label htmlFor="concept">Concepto</Label>
                  <Textarea
                    id="concept"
                    placeholder="Descripción o nota sobre el gasto"
                    {...register("concept")}
                  />
                </div>

                {/* Submit Button */}
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Creando..." : "Crear gasto"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <ProductSelectionDialog
        open={productSelectionOpen}
        onOpenChange={setProductSelectionOpen}
        categoryId={selectedCategory}
        onProductsSelected={handleProductSelection}
        selectedProducts={selectedProducts}
      />
    </>
  );
}