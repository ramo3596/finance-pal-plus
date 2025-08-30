import { Wallet } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Autocomplete } from "@/components/ui/autocomplete";
import { Account } from "@/hooks/useSettings";

interface IncomeTabProps {
  amount: string;
  setAmount: (amount: string) => void;
  selectedAccount: string;
  setSelectedAccount: (account: string) => void;
  accounts: Account[];
}

export function IncomeTab({ amount, setAmount, selectedAccount, setSelectedAccount, accounts }: IncomeTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="account">Cuenta de depósito</Label>
          <Autocomplete
            value={selectedAccount}
            onValueChange={setSelectedAccount}
            options={accounts.map(account => ({
              id: account.id,
              name: `${account.icon} ${account.name} ($${account.balance?.toFixed(2) || '0.00'})`
            }))}
            placeholder="Seleccionar cuenta"
          />
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