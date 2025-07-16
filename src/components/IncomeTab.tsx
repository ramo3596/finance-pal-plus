import { Wallet, CreditCard, Banknote, TrendingUp } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface IncomeTabProps {
  amount: string;
  setAmount: (amount: string) => void;
  selectedAccount: string;
  setSelectedAccount: (account: string) => void;
}

export function IncomeTab({ amount, setAmount, selectedAccount, setSelectedAccount }: IncomeTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="account">Cuenta de depósito</Label>
          <Select value={selectedAccount} onValueChange={setSelectedAccount}>
            <SelectTrigger>
              <div className="flex items-center space-x-2">
                <Wallet className="h-4 w-4" />
                <SelectValue placeholder="Seleccionar cuenta" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">
                <div className="flex items-center space-x-2">
                  <Banknote className="h-4 w-4" />
                  <span>Efectivo</span>
                </div>
              </SelectItem>
              <SelectItem value="main">
                <div className="flex items-center space-x-2">
                  <Wallet className="h-4 w-4" />
                  <span>Cuenta Principal</span>
                </div>
              </SelectItem>
              <SelectItem value="savings">
                <div className="flex items-center space-x-2">
                  <Wallet className="h-4 w-4" />
                  <span>Ahorros</span>
                </div>
              </SelectItem>
              <SelectItem value="investment">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>Inversiones</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Importe del ingreso</Label>
          <div className="relative">
            <Input 
              id="amount" 
              type="number" 
              placeholder="0" 
              value={amount} 
              onChange={e => setAmount(e.target.value)} 
              className="text-right text-lg font-semibold text-emerald-600" 
            />
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
              $
            </span>
          </div>
        </div>
      </div>

      <div className="bg-emerald-50 dark:bg-emerald-950/20 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800">
        <p className="text-sm text-emerald-700 dark:text-emerald-300">
          💰 <strong>Ingreso:</strong> Dinero que entra a tu cuenta como salario, ventas o ganancias.
        </p>
      </div>
    </div>
  );
}