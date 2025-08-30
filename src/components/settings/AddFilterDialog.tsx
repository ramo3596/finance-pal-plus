import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Autocomplete } from "@/components/ui/autocomplete";
import { Plus } from "lucide-react";
import { Filter } from "@/hooks/useSettings";

interface AddFilterDialogProps {
  onAdd: (filter: Omit<Filter, 'id' | 'created_at' | 'updated_at'>) => void;
  accounts: Array<{ id: string; name: string }>;
  categories: Array<{ id: string; name: string }>;
  tags: Array<{ id: string; name: string; color: string }>;
}

export function AddFilterDialog({ onAdd, accounts, categories, tags }: AddFilterDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "Todo",
    payment_method: "Todos",
    transfers: "Excluir",
    debts: "Excluir",
    account_id: "",
    category_id: "",
    tag_id: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      ...formData,
      payment_method: formData.payment_method !== "Todos" ? formData.payment_method : undefined,
      account_ids: formData.account_id ? [formData.account_id] : undefined,
      category_ids: formData.category_id ? [formData.category_id] : undefined,
      tag_ids: formData.tag_id ? [formData.tag_id] : undefined
    } as any);
    setFormData({ 
      name: "", 
      type: "Todo", 
      payment_method: "Todos", 
      transfers: "Excluir", 
      debts: "Excluir",
      account_id: "",
      category_id: "",
      tag_id: ""
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Agregar filtro
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar Nuevo Filtro</DialogTitle>
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
          <div>
            <Label htmlFor="accounts">Cuenta (opcional)</Label>
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
            {accounts.length === 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                No hay cuentas disponibles. Crea cuentas en la sección de Cuentas.
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="categories">Categoría (opcional)</Label>
            <Autocomplete
              options={categories.map(category => ({
                id: category.id,
                name: category.name
              }))}
              value={formData.category_id}
              onValueChange={(value) => setFormData({ ...formData, category_id: value })}
              placeholder="Buscar categoría..."
              className="mt-2"
            />
            {categories.length === 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                No hay categorías disponibles. Crea categorías en la sección de Categorías.
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="tags">Etiqueta (opcional)</Label>
            <Autocomplete
              options={tags.map(tag => ({
                id: tag.id,
                name: tag.name
              }))}
              value={formData.tag_id}
              onValueChange={(value) => setFormData({ ...formData, tag_id: value })}
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
            <Button type="submit">Agregar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}