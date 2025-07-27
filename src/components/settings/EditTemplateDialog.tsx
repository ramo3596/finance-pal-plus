import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Edit } from "lucide-react";
import { Template } from "@/hooks/useSettings";

interface EditTemplateDialogProps {
  template: Template;
  onUpdate: (id: string, template: Partial<Template>) => void;
  accounts: Array<{ id: string; name: string }>;
  categories: Array<{ id: string; name: string }>;
}

export function EditTemplateDialog({ template, onUpdate, accounts, categories }: EditTemplateDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: template.name,
    amount: template.amount,
    account_id: template.account_id || "",
    category_id: template.category_id || "",
    payment_method: template.payment_method || "Dinero en efectivo",
    type: template.type,
    beneficiary: template.beneficiary || "",
    note: template.note || ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(template.id, {
      ...formData,
      account_id: formData.account_id || undefined,
      category_id: formData.category_id || undefined,
      beneficiary: formData.beneficiary || undefined,
      note: formData.note || undefined
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
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
            <Select value={formData.payment_method} onValueChange={(value) => setFormData({ ...formData, payment_method: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
               <SelectContent>
                 <SelectItem value="Dinero en efectivo">Dinero en efectivo</SelectItem>
                 <SelectItem value="Tarjeta de Débito">Tarjeta de Débito</SelectItem>
                 <SelectItem value="Tarjeta de crédito">Tarjeta de crédito</SelectItem>
                 <SelectItem value="Cupón">Cupón</SelectItem>
                 <SelectItem value="Pago por móvil">Pago por móvil</SelectItem>
                 <SelectItem value="Pago por web">Pago por web</SelectItem>
               </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="beneficiary">Beneficiario (opcional)</Label>
            <Input
              id="beneficiary"
              value={formData.beneficiary}
              onChange={(e) => setFormData({ ...formData, beneficiary: e.target.value })}
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