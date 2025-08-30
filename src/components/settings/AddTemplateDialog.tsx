import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { Template } from "@/hooks/useSettings";
import { PaymentMethodSelect } from "@/components/shared/PaymentMethodSelect";
import { useContacts } from "@/hooks/useContacts";
import { Autocomplete } from "@/components/ui/autocomplete";
import { MultiSelectAutocomplete } from "@/components/ui/multi-select-autocomplete";

interface AddTemplateDialogProps {
  onAdd: (template: Omit<Template, 'id' | 'created_at' | 'updated_at'>) => void;
  accounts: Array<{ id: string; name: string }>;
  categories: Array<{ id: string; name: string }>;
  tags: Array<{ id: string; name: string; color: string }>;
}

export function AddTemplateDialog({ onAdd, accounts, categories, tags }: AddTemplateDialogProps) {
  const [open, setOpen] = useState(false);
  const { contacts } = useContacts();
  const [formData, setFormData] = useState({
    name: "",
    amount: 0,
    account_id: "",
    category_id: "",
    payment_method: "Dinero en efectivo",
    type: "Gastos",
    beneficiary: "",
    note: "",
    tag_ids: [] as string[]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      ...formData,
      account_id: formData.account_id || undefined,
      category_id: formData.category_id || undefined,
      beneficiary: formData.beneficiary || undefined,
      note: formData.note || undefined,
      tag_ids: formData.tag_ids.length > 0 ? formData.tag_ids : undefined
    } as any);
    setFormData({ 
      name: "", 
      amount: 0, 
      account_id: "", 
      category_id: "", 
      payment_method: "Dinero en efectivo", 
      type: "Gastos",
      beneficiary: "",
      note: "",
      tag_ids: []
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Agregar plantilla
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agregar Nueva Plantilla</DialogTitle>
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
            <Label htmlFor="account_id">Cuenta</Label>
            <Autocomplete
              options={accounts.map(account => ({ id: account.id, name: account.name }))}
              value={formData.account_id}
              onValueChange={(value) => setFormData({ ...formData, account_id: value })}
              placeholder="Buscar y seleccionar cuenta..."
            />
          </div>
          <div>
            <Label htmlFor="category_id">Categoría</Label>
            <Autocomplete
              options={categories.map(category => ({ id: category.id, name: category.name }))}
              value={formData.category_id}
              onValueChange={(value) => setFormData({ ...formData, category_id: value })}
              placeholder="Buscar y seleccionar categoría..."
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
                id: contact.id, 
                name: `${contact.name} (${contact.contact_type})` 
              }))}
              value={contacts.find(c => c.name === formData.beneficiary)?.id || ""}
              onValueChange={(value) => {
                const contact = contacts.find(c => c.id === value);
                if (contact) {
                  setFormData({ ...formData, beneficiary: contact.name });
                }
              }}
              placeholder="Buscar contacto o escribir manual..."
            />
            <Input
              placeholder="O escribir nombre manual"
              value={formData.beneficiary}
              onChange={(e) => setFormData({ ...formData, beneficiary: e.target.value })}
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
            <Label htmlFor="tags">Etiquetas (opcional)</Label>
            <MultiSelectAutocomplete
              options={tags.map(tag => ({ 
                id: tag.id, 
                name: tag.name, 
                color: tag.color 
              }))}
              selectedValues={formData.tag_ids}
              onSelectionChange={(values) => setFormData({ ...formData, tag_ids: values })}
              placeholder="Buscar y seleccionar etiquetas..."
              showColors={true}
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
            <Button type="submit">Agregar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}