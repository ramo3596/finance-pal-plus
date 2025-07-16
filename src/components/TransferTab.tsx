import { Wallet, CreditCard, Banknote, ArrowRightLeft } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TransferTabProps {
  amount: string;
  setAmount: (amount: string) => void;
  selectedAccount: string;
  setSelectedAccount: (account: string) => void;
  toAccount: string;
  setToAccount: (account: string) => void;
}

export function TransferTab({ 
  amount, 
  setAmount, 
  selectedAccount, 
  setSelectedAccount, 
  toAccount, 
  setToAccount 
}: TransferTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fromAccount">Cuenta origen</Label>
          <Select value={selectedAccount} onValueChange={setSelectedAccount}>
            <SelectTrigger>
              <div className="flex items-center space-x-2">
                <Wallet className="h-4 w-4" />
                <SelectValue placeholder="Desde cuenta" />
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
              <SelectItem value="credit">
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-4 w-4" />
                  <span>Tarjeta de Crédito</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="toAccount">Cuenta destino</Label>
          <Select value={toAccount} onValueChange={setToAccount}>
            <SelectTrigger>
              <div className="flex items-center space-x-2">
                <Wallet className="h-4 w-4" />
                <SelectValue placeholder="Hacia cuenta" />
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
              <SelectItem value="credit">
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-4 w-4" />
                  <span>Tarjeta de Crédito</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Importe a transferir</Label>
        <div className="relative">
          <Input 
            id="amount" 
            type="number" 
            placeholder="0" 
            value={amount} 
            onChange={e => setAmount(e.target.value)} 
            className="text-right text-lg font-semibold text-blue-600" 
          />
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
            $
          </span>
        </div>
      </div>

      <div className="flex items-center justify-center py-2">
        <div className="flex items-center space-x-2 bg-blue-50 dark:bg-blue-950/20 px-3 py-2 rounded-lg border border-blue-200 dark:border-blue-800">
          <ArrowRightLeft className="h-4 w-4 text-blue-600" />
          <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">Transferencia entre cuentas</span>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          🔄 <strong>Transferencia:</strong> Movimiento de dinero entre tus propias cuentas.
        </p>
      </div>
    </div>
  );
}