import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Edit } from "lucide-react";
import { Filter } from "@/hooks/useSettings";

interface EditFilterDialogProps {
  filter: Filter;
  onUpdate: (id: string, filter: Partial<Filter>) => void;
}

export function EditFilterDialog({ filter, onUpdate }: EditFilterDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: filter.name,
    type: filter.type,
    payment_method: filter.payment_method || "Todos",
    transfers: filter.transfers || "Excluir",
    debts: filter.debts || "Excluir"
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(filter.id, {
      ...formData,
      payment_method: formData.payment_method !== "Todos" ? formData.payment_method : undefined,
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
          <DialogTitle>Editar Filtro</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nombre del filtro</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                <SelectItem value="Todo">Todo</SelectItem>
                <SelectItem value="Gasto">Gasto</SelectItem>
                <SelectItem value="Ingreso">Ingreso</SelectItem>
                <SelectItem value="Transferencia">Transferencia</SelectItem>
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
                <SelectItem value="Todos">Todos</SelectItem>
                <SelectItem value="Efectivo">Efectivo</SelectItem>
                <SelectItem value="Tarjeta de Débito">Tarjeta de Débito</SelectItem>
                <SelectItem value="Tarjeta de Crédito">Tarjeta de Crédito</SelectItem>
                <SelectItem value="Transferencia">Transferencia</SelectItem>
                <SelectItem value="Otro">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="transfers">Transferencias</Label>
            <Select value={formData.transfers} onValueChange={(value) => setFormData({ ...formData, transfers: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Incluir">Incluir</SelectItem>
                <SelectItem value="Excluir">Excluir</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="debts">Deudas</Label>
            <Select value={formData.debts} onValueChange={(value) => setFormData({ ...formData, debts: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Incluir">Incluir</SelectItem>
                <SelectItem value="Excluir">Excluir</SelectItem>
              </SelectContent>
            </Select>
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