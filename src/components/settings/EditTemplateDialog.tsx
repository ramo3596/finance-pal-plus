import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Autocomplete } from "@/components/ui/autocomplete";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Edit } from "lucide-react";
import { Template, Category } from "@/hooks/useSettings";
import { PaymentMethodSelect } from "@/components/shared/PaymentMethodSelect";
import { useContacts } from "@/hooks/useContacts";

interface EditTemplateDialogProps {
  template: Template;
  onUpdate: (id: string, template: Partial<Template>) => void;
  accounts: Array<{ id: string; name: string }>;
  categories: Category[];
  tags: Array<{ id: string; name: string; color: string }>;
}

export function EditTemplateDialog({ template, onUpdate, accounts, categories, tags }: EditTemplateDialogProps) {
  const [open, setOpen] = useState(false);
  const { contacts } = useContacts();
  const [formData, setFormData] = useState({
    name: template.name,
    amount: template.amount,
    account_id: template.account_id || "",
    to_account_id: template.to_account_id || "",
    category_id: template.category_id || "",
    subcategory_id: template.subcategory_id || "",
    payment_method: template.payment_method || "Dinero en efectivo",
    type: template.type,
    beneficiary: template.beneficiary || "",
    note: template.note || "",
    tag_ids: template.tags?.length ? template.tags[0].id : ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(template.id, {
      ...formData,
      account_id: formData.account_id || undefined,
      to_account_id: formData.to_account_id || undefined,
      category_id: formData.category_id || undefined,
      subcategory_id: formData.subcategory_id || undefined,
      beneficiary: formData.beneficiary || undefined,
      note: formData.note || undefined,
      tag_ids: formData.tag_ids ? [formData.tag_ids] : undefined
    } as any);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Plantilla</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nombre de la plantilla</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="amount">Monto</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
              required
            />
          </div>
          <div>
            <Label htmlFor="type">Tipo</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Gastos">Gasto</SelectItem>
                <SelectItem value="Ingresos">Ingreso</SelectItem>
                <SelectItem value="Transferencias">Transferencia</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="account_id">{formData.type === "Transferencias" ? "Cuenta origen" : "Cuenta"}</Label>
            <Autocomplete
              options={accounts.map(account => ({
                id: account.id,
                name: account.name
              }))}
              value={formData.account_id}
              onValueChange={(value) => setFormData({ ...formData, account_id: value })}
              placeholder="Buscar cuenta..."
              className="mt-2"
            />
          </div>
          {formData.type === "Transferencias" && (
            <div>
              <Label htmlFor="to_account_id">Cuenta destino</Label>
              <Autocomplete
                options={accounts.filter(account => account.id !== formData.account_id).map(account => ({
                  id: account.id,
                  name: account.name
                }))}
                value={formData.to_account_id}
                onValueChange={(value) => setFormData({ ...formData, to_account_id: value })}
                placeholder="Buscar cuenta destino..."
                className="mt-2"
              />
            </div>
          )}
          <div>
            <Label htmlFor="category_id">Categoría</Label>
            <Autocomplete
              options={[
                // Incluir todas las categorías
                ...categories.map(category => ({
                  id: category.id,
                  name: `${category.icon} ${category.name}`,
                  isCategory: true
                })),
                // Incluir todas las subcategorías
                ...categories.flatMap(category => 
                  category.subcategories?.map(subcategory => ({
                    id: subcategory.id,
                    name: `${subcategory.icon} ${subcategory.name} (${category.name})`,
                    categoryId: category.id,
                    isSubcategory: true
                  })) || []
                )
              ]}
              value={formData.subcategory_id || formData.category_id}
              onValueChange={(value) => {
                // Verificar si la selección es una subcategoría
                const selectedOption = [
                  ...categories.map(category => ({
                    id: category.id,
                    isCategory: true
                  })),
                  ...categories.flatMap(category => 
                    category.subcategories?.map(subcategory => ({
                      id: subcategory.id,
                      categoryId: category.id,
                      isSubcategory: true
                    })) || []
                  )
                ].find(option => option.id === value);
                
                if (selectedOption && 'isSubcategory' in selectedOption && selectedOption.isSubcategory) {
                  // Si es subcategoría, establecer tanto la categoría como la subcategoría
                  setFormData({ 
                    ...formData, 
                    category_id: ('categoryId' in selectedOption) ? selectedOption.categoryId : '',
                    subcategory_id: value
                  });
                } else {
                  // Si es categoría, establecer solo la categoría y resetear subcategoría
                  setFormData({ 
                    ...formData, 
                    category_id: value,
                    subcategory_id: ''
                  });
                }
              }}
              placeholder="Buscar categoría o subcategoría..."
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="payment_method">Método de pago</Label>
            <PaymentMethodSelect 
              value={formData.payment_method} 
              onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
            />
          </div>
          <div>
            <Label htmlFor="beneficiary">Beneficiario</Label>
            <Autocomplete
              options={contacts.map(contact => ({
                id: contact.name,
                name: `${contact.name} (${contact.contact_type})`
              }))}
              value={formData.beneficiary}
              onValueChange={(value) => setFormData({ ...formData, beneficiary: value })}
              placeholder="Buscar o escribir beneficiario..."
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="note">Nota (opcional)</Label>
            <Textarea
              id="note"
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="tags">Etiqueta (opcional)</Label>
            <Autocomplete
              options={tags.map(tag => ({
                id: tag.id,
                name: tag.name
              }))}
              value={formData.tag_ids}
              onValueChange={(value) => setFormData({ ...formData, tag_ids: value })}
              placeholder="Buscar etiqueta..."
              className="mt-2"
            />
            {tags.length === 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                No hay etiquetas disponibles. Crea etiquetas en la sección de Etiquetas.
              </p>
            )}
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Actualizar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}