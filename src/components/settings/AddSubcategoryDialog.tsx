import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { Subcategory } from "@/hooks/useSettings";

interface AddSubcategoryDialogProps {
  categoryId: string;
  categoryName: string;
  onAdd: (subcategory: Omit<Subcategory, 'id' | 'created_at'>) => Promise<void>;
}

export function AddSubcategoryDialog({ categoryId, categoryName, onAdd }: AddSubcategoryDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    icon: ""
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setLoading(true);
    try {
      await onAdd({
        name: formData.name.trim(),
        icon: formData.icon || "📦",
        category_id: categoryId,
      });
      setFormData({ name: "", icon: "" });
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
          <Plus className="h-4 w-4 mr-1" />
          Añadir subcategoría
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Añadir Subcategoría</DialogTitle>
          <DialogDescription>
            Agregar una nueva subcategoría a "{categoryName}"
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nombre de la subcategoría</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Supermercado, Gasolina, etc."
              required
            />
          </div>
          <div>
            <Label htmlFor="icon">Icono</Label>
            <Input
              id="icon"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              placeholder="Ej: 🏪, ⛽, 🍕 (opcional)"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !formData.name.trim()}>
              {loading ? "Creando..." : "Crear subcategoría"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}