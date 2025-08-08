import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Banknote, CreditCard, Wallet, Receipt, Smartphone, Globe } from "lucide-react";

interface PaymentMethodSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export function PaymentMethodSelect({ value, onValueChange, placeholder = "Seleccionar forma de pago" }: PaymentMethodSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="Dinero en efectivo">
          <div className="flex items-center space-x-2">
            <Banknote className="h-4 w-4" />
            <span>Dinero en efectivo</span>
          </div>
        </SelectItem>
        <SelectItem value="Tarjeta de Débito">
          <div className="flex items-center space-x-2">
            <CreditCard className="h-4 w-4" />
            <span>Tarjeta de Débito</span>
          </div>
        </SelectItem>
        <SelectItem value="Tarjeta de crédito">
          <div className="flex items-center space-x-2">
            <CreditCard className="h-4 w-4" />
            <span>Tarjeta de crédito</span>
          </div>
        </SelectItem>
        <SelectItem value="Cupón">
          <div className="flex items-center space-x-2">
            <Receipt className="h-4 w-4" />
            <span>Cupón</span>
          </div>
        </SelectItem>
        <SelectItem value="Pago por móvil">
          <div className="flex items-center space-x-2">
            <Smartphone className="h-4 w-4" />
            <span>Pago por móvil</span>
          </div>
        </SelectItem>
        <SelectItem value="Pago por web">
          <div className="flex items-center space-x-2">
            <Globe className="h-4 w-4" />
            <span>Pago por web</span>
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}