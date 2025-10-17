import { useEffect } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelectAutocomplete } from "@/components/ui/multi-select-autocomplete";
import { useSettings } from "@/hooks/useSettings";
import { useInventory, Product } from "@/hooks/useInventory";

interface EditProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product;
}

const formSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "El precio debe ser un número positivo"),
  cost: z.coerce.number().min(0, "El costo debe ser un número positivo"),
  quantity: z.coerce.number().min(0, "La cantidad debe ser un número positivo"),
  category_id: z.string().optional(),
  subcategory_id: z.string().optional(),
  barcode: z.string().optional(),
  image_url: z.string().url("URL de imagen inválida").optional().or(z.literal("")),
  tags: z.array(z.string()).optional(),
});

type FormData = z.infer<typeof formSchema>;

export function EditProductDialog({ open, onOpenChange, product }: EditProductDialogProps) {
  const { categories, tags } = useSettings();
  const { updateProduct } = useInventory();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: product.name,
      description: product.description || "",
      price: product.price,
      cost: product.cost,
      quantity: product.quantity,
      category_id: product.category_id || "",
      subcategory_id: product.subcategory_id || "",
      barcode: product.barcode || "",
      image_url: product.image_url || "",
      tags: product.tags || [],
    },
  });

  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name,
        description: product.description || "",
        price: product.price,
        cost: product.cost,
        quantity: product.quantity,
        category_id: product.category_id || "",
        subcategory_id: product.subcategory_id || "",
        barcode: product.barcode || "",
        image_url: product.image_url || "",
        tags: product.tags || [],
      });
    }
  }, [product, form]);

  const onSubmit = async (data: FormData) => {
    try {
      await updateProduct(product.id, data);
      toast.success("Producto actualizado exitosamente");
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Error al actualizar el producto");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Producto</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Nombre</Label>
            <Input id="name" {...form.register("name")} className="col-span-3" />
            {form.formState.errors.name && (
              <p className="col-span-4 text-right text-red-500 text-sm">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">Descripción</Label>
            <Textarea id="description" {...form.register("description")} className="col-span-3" />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="price" className="text-right">Precio</Label>
            <Input id="price" type="number" step="0.01" {...form.register("price")} className="col-span-3" />
            {form.formState.errors.price && (
              <p className="col-span-4 text-right text-red-500 text-sm">{form.formState.errors.price.message}</p>
            )}
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="cost" className="text-right">Costo</Label>
            <Input id="cost" type="number" step="0.01" {...form.register("cost")} className="col-span-3" />
            {form.formState.errors.cost && (
              <p className="col-span-4 text-right text-red-500 text-sm">{form.formState.errors.cost.message}</p>
            )}
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="quantity" className="text-right">Cantidad</Label>
            <Input id="quantity" type="number" {...form.register("quantity")} className="col-span-3" />
            {form.formState.errors.quantity && (
              <p className="col-span-4 text-right text-red-500 text-sm">{form.formState.errors.quantity.message}</p>
            )}
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category_id" className="text-right">Categoría</Label>
            <Select onValueChange={(value) => {
              form.setValue("category_id", value);
              form.setValue("subcategory_id", "");
            }} value={form.watch("category_id")}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="subcategory_id" className="text-right">Subcategoría</Label>
            <Select 
              onValueChange={(value) => form.setValue("subcategory_id", value)} 
              value={form.watch("subcategory_id")}
              disabled={!form.watch("category_id")}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecciona una subcategoría" />
              </SelectTrigger>
              <SelectContent>
                {categories
                  .find(c => c.id === form.watch("category_id"))
                  ?.subcategories?.map((subcategory) => (
                    <SelectItem key={subcategory.id} value={subcategory.id}>
                      {subcategory.icon} {subcategory.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="barcode" className="text-right">Código de barras</Label>
            <Input id="barcode" {...form.register("barcode")} className="col-span-3" />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="tags" className="text-right">Etiquetas</Label>
            <div className="col-span-3">
              <MultiSelectAutocomplete
                options={tags.map(tag => ({
                  id: tag.id,
                  name: tag.name,
                  color: tag.color
                }))}
                value={form.watch("tags") || []}
                onValueChange={(value) => form.setValue("tags", value)}
                placeholder="Selecciona etiquetas"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="image_url" className="text-right">URL de Imagen</Label>
            <Input id="image_url" {...form.register("image_url")} className="col-span-3" />
            {form.formState.errors.image_url && (
              <p className="col-span-4 text-right text-red-500 text-sm">{form.formState.errors.image_url.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}