
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Edit } from "lucide-react";
import { Account } from "@/hooks/useSettings";

interface EditAccountDialogProps {
  account: Account;
  onUpdate: (id: string, updates: Partial<Account>) => void;
}

export function EditAccountDialog({ account, onUpdate }: EditAccountDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: account.name,
    color: account.color,
    icon: account.icon,
    balance: account.balance
  });

  useEffect(() => {
    setFormData({
      name: account.name,
      color: account.color,
      icon: account.icon,
      balance: account.balance
    });
  }, [account]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(account.id, formData);
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
          <DialogTitle>Editar Cuenta</DialogTitle>
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
            <Label htmlFor="balance">Saldo</Label>
            <Input
              id="balance"
              type="number"
              step="0.01"
              value={formData.balance}
              onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })}
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
