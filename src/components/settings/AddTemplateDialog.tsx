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
    type: "Gasto",
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
      type: "Gasto",
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
                <SelectItem value="Gasto">Gasto</SelectItem>
                <SelectItem value="Ingreso">Ingreso</SelectItem>
                <SelectItem value="Transferencia">Transferencia</SelectItem>
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
              value={formData.beneficiary} 
              onValueChange={(value) => {
                const contact = contacts.find(c => c.id === value);
                setFormData({ ...formData, beneficiary: contact?.name || value });
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
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag) => (
                <div key={tag.id} className="flex items-center gap-2 p-2 border rounded-lg">
                  <input
                    type="checkbox"
                    id={`tag-${tag.id}`}
                    checked={formData.tag_ids.includes(tag.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({ 
                          ...formData, 
                          tag_ids: [...formData.tag_ids, tag.id] 
                        });
                      } else {
                        setFormData({ 
                          ...formData, 
                          tag_ids: formData.tag_ids.filter(id => id !== tag.id) 
                        });
                      }
                    }}
                    className="rounded"
                  />
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }}></div>
                  <Label htmlFor={`tag-${tag.id}`} className="text-sm">{tag.name}</Label>
                </div>
              ))}
            </div>
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