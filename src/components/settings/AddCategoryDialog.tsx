
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { Category } from "@/hooks/useSettings";

interface AddCategoryDialogProps {
  onAdd: (category: Omit<Category, 'id' | 'created_at' | 'updated_at'>) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AddCategoryDialog({ onAdd, open: externalOpen, onOpenChange }: AddCategoryDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  const [formData, setFormData] = useState({
    name: "",
    color: "#f59e0b",
    icon: "📁",
    nature: "Necesitar"
  });

  const categoryIcons = [
    { value: "🍔", label: "Alimentos y Bebidas" },
    { value: "🛒", label: "Compras" },
    { value: "🏠", label: "Vivienda" },
    { value: "🚗", label: "Transporte" },
    { value: "🚙", label: "Vehículos" },
    { value: "🎮", label: "Vida y entretenimiento" },
    { value: "💻", label: "Comunicaciones, PC" },
    { value: "💰", label: "Gastos financieros" },
    { value: "📈", label: "Inversiones" },
    { value: "💵", label: "Ingreso" },
    { value: "📁", label: "Otros" }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(formData);
    setFormData({ name: "", color: "#f59e0b", icon: "📁", nature: "Necesitar" });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {externalOpen === undefined && (
        <DialogTrigger asChild>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Agregar categoría
          </Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar Nueva Categoría</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="icon">Icono</Label>
            <Select value={formData.icon} onValueChange={(value) => setFormData({ ...formData, icon: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categoryIcons.map((icon) => (
                  <SelectItem key={icon.value} value={icon.value}>
                    <div className="flex items-center gap-2">
                      <span>{icon.value}</span>
                      <span>{icon.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="color">Color</Label>
            <Input
              id="color"
              type="color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="nature">Naturaleza</Label>
            <Select value={formData.nature} onValueChange={(value) => setFormData({ ...formData, nature: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Necesitar">Necesitar</SelectItem>
                <SelectItem value="Deseos">Deseos</SelectItem>
                <SelectItem value="Deber">Deber</SelectItem>
              </SelectContent>
            </Select>
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
