import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MultiSelectAutocomplete } from "@/components/ui/multi-select-autocomplete";
import { Edit } from "lucide-react";
import { Filter } from "@/hooks/useSettings";

interface EditFilterDialogProps {
  filter: Filter;
  onUpdate: (id: string, filter: Partial<Filter>) => void;
  accounts: Array<{ id: string; name: string }>;
  categories: Array<{ id: string; name: string }>;
  tags: Array<{ id: string; name: string; color: string }>;
}

export function EditFilterDialog({ filter, onUpdate, accounts, categories, tags }: EditFilterDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: filter.name,
    type: filter.type,
    payment_method: filter.payment_method || "Todos",
    transfers: filter.transfers || "Excluir",
    debts: filter.debts || "Excluir",
    account_ids: (filter as any).account_ids || [],
    category_ids: filter.categories?.map(c => c.id) || [],
    tag_ids: filter.tags?.map(t => t.id) || []
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(filter.id, {
      ...formData,
      payment_method: formData.payment_method !== "Todos" ? formData.payment_method : undefined,
      account_ids: formData.account_ids.length > 0 ? formData.account_ids : undefined,
      category_ids: formData.category_ids.length > 0 ? formData.category_ids : undefined,
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
            <Label htmlFor="accounts">Cuentas (opcional)</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {accounts.map((account) => (
                <div key={account.id} className="flex items-center gap-2 p-2 border rounded-lg">
                  <input
                    type="checkbox"
                    id={`account-${account.id}`}
                    checked={formData.account_ids.includes(account.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({ 
                          ...formData, 
                          account_ids: [...formData.account_ids, account.id] 
                        });
                      } else {
                        setFormData({ 
                          ...formData, 
                          account_ids: formData.account_ids.filter(id => id !== account.id) 
                        });
                      }
                    }}
                    className="rounded"
                  />
                  <Label htmlFor={`account-${account.id}`} className="text-sm">{account.name}</Label>
                </div>
              ))}
            </div>
            {accounts.length === 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                No hay cuentas disponibles. Crea cuentas en la sección de Cuentas.
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="categories">Categorías (opcional)</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center gap-2 p-2 border rounded-lg">
                  <input
                    type="checkbox"
                    id={`category-${category.id}`}
                    checked={formData.category_ids.includes(category.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({ 
                          ...formData, 
                          category_ids: [...formData.category_ids, category.id] 
                        });
                      } else {
                        setFormData({ 
                          ...formData, 
                          category_ids: formData.category_ids.filter(id => id !== category.id) 
                        });
                      }
                    }}
                    className="rounded"
                  />
                  <Label htmlFor={`category-${category.id}`} className="text-sm">{category.name}</Label>
                </div>
              ))}
            </div>
            {categories.length === 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                No hay categorías disponibles. Crea categorías en la sección de Categorías.
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="tags">Etiquetas (opcional)</Label>
            <MultiSelectAutocomplete
              options={tags.map(tag => ({ id: tag.id, name: tag.name, color: tag.color }))}
              value={formData.tag_ids}
              onValueChange={(value) => setFormData({ ...formData, tag_ids: value })}
              placeholder="Buscar etiquetas..."
              className="mt-2"
              disabled={tags.length === 0}
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