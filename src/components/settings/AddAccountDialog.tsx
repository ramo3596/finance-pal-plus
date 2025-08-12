
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { Account } from "@/hooks/useSettings";

interface AddAccountDialogProps {
  onAdd: (account: Omit<Account, 'id' | 'created_at' | 'updated_at'>) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AddAccountDialog({ onAdd, open: externalOpen, onOpenChange }: AddAccountDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  const [formData, setFormData] = useState({
    name: "",
    color: "#3b82f6",
    icon: "🏦",
    balance: 0,
    account_number: ""
  });

  const accountIcons = [
    { value: "🏦", label: "Cuenta Bancaria" },
    { value: "💰", label: "Dinero en efectivo" },
    { value: "💳", label: "Tarjeta de Débito" },
    { value: "💎", label: "Tarjeta de crédito" },
    { value: "🎫", label: "Cupón" },
    { value: "📱", label: "Pago por móvil" },
    { value: "🌐", label: "Pago por web" }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(formData);
    setFormData({ name: "", color: "#3b82f6", icon: "🏦", balance: 0, account_number: "" });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar Nueva Cuenta</DialogTitle>
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
                {accountIcons.map((icon) => (
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
            <Label htmlFor="account_number">Número de cuenta bancaria</Label>
            <Input
              id="account_number"
              value={formData.account_number}
              onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
              placeholder="Opcional"
            />
          </div>
          <div>
            <Label htmlFor="balance">Saldo inicial</Label>
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
            <Button type="submit">Agregar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
