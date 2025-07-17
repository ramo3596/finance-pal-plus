
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Edit } from "lucide-react";
import { Category } from "@/hooks/useSettings";

interface EditCategoryDialogProps {
  category: Category;
  onUpdate: (id: string, updates: Partial<Category>) => void;
}

export function EditCategoryDialog({ category, onUpdate }: EditCategoryDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: category.name,
    color: category.color,
    icon: category.icon,
    nature: category.nature
  });

  useEffect(() => {
    setFormData({
      name: category.name,
      color: category.color,
      icon: category.icon,
      nature: category.nature
    });
  }, [category]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(category.id, formData);
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
          <DialogTitle>Editar Categoría</DialogTitle>
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
            <Input
              id="icon"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
            />
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
            <Button type="submit">Actualizar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
