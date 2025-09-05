import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MultiSelectAutocomplete } from "@/components/ui/multi-select-autocomplete";
import { Edit } from "lucide-react";
import { Template } from "@/hooks/useSettings";
import { PaymentMethodSelect } from "@/components/shared/PaymentMethodSelect";
import { useContacts } from "@/hooks/useContacts";

interface EditTemplateDialogProps {
  template: Template;
  onUpdate: (id: string, template: Partial<Template>) => void;
  accounts: Array<{ id: string; name: string }>;
  categories: Array<{ id: string; name: string }>;
  tags: Array<{ id: string; name: string; color: string }>;
}

export function EditTemplateDialog({ template, onUpdate, accounts, categories, tags }: EditTemplateDialogProps) {
  const [open, setOpen] = useState(false);
  const { contacts } = useContacts();
  const [formData, setFormData] = useState({
    name: template.name,
    amount: template.amount,
    account_id: template.account_id || "",
    category_id: template.category_id || "",
    payment_method: template.payment_method || "Dinero en efectivo",
    type: template.type,
    beneficiary: template.beneficiary || "",
    note: template.note || "",
    tag_ids: template.tags?.map(tag => tag.id) || []
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(template.id, {
      ...formData,
      account_id: formData.account_id || undefined,
      category_id: formData.category_id || undefined,
      beneficiary: formData.beneficiary || undefined,
      note: formData.note || undefined,
      tag_ids: formData.tag_ids.length > 0 ? formData.tag_ids : undefined
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
            <Label htmlFor="account_id">Cuenta</Label>
            <Select value={formData.account_id} onValueChange={(value) => setFormData({ ...formData, account_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar cuenta" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="category_id">Categoría</Label>
            <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar categoría" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <Select 
              value={contacts.find(c => c.name === formData.beneficiary)?.id || ""} 
              onValueChange={(value) => {
                const contact = contacts.find(c => c.id === value);
                if (contact) {
                  setFormData({ ...formData, beneficiary: contact.name });
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar contacto o escribir manual" />
              </SelectTrigger>
              <SelectContent>
                {contacts.map((contact) => (
                  <SelectItem key={contact.id} value={contact.id}>
                    <div className="flex items-center gap-2">
                      <span>{contact.name}</span>
                      <span className="text-xs text-muted-foreground">({contact.contact_type})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              value={formData.tag_ids}
              onValueChange={(value) => setFormData({ ...formData, tag_ids: value })}
              placeholder="Buscar etiquetas..."
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