import { useState } from "react";
import { X, Search, MapPin, Wallet, CreditCard, Banknote, Smartphone, Globe, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExpenseTab } from "./ExpenseTab";
import { IncomeTab } from "./IncomeTab";
import { TransferTab } from "./TransferTab";
interface AddTransactionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
export function AddTransaction({
  open,
  onOpenChange
}: AddTransactionProps) {
  const [transactionType, setTransactionType] = useState<"expense" | "income" | "transfer">("expense");
  const [amount, setAmount] = useState("0");
  const [selectedAccount, setSelectedAccount] = useState("");
  const [toAccount, setToAccount] = useState(""); // For transfers
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedTags, setSelectedTags] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(() => new Date().toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  }));
  const [beneficiary, setBeneficiary] = useState("");
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [location, setLocation] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const handleSubmit = (createAnother = false) => {
    // Here you would submit the transaction data
    console.log("Transaction data:", {
      type: transactionType,
      amount: parseFloat(amount),
      account: selectedAccount,
      toAccount: toAccount,
      category: selectedCategory,
      tags: selectedTags,
      date,
      time,
      beneficiary,
      note,
      paymentMethod,
      location,
      template: selectedTemplate
    });
    if (!createAnother) {
      onOpenChange(false);
    } else {
      // Reset form for new transaction
      setAmount("0");
      setSelectedAccount("");
      setToAccount("");
      setSelectedCategory("");
      setSelectedTags("");
      setBeneficiary("");
      setNote("");
      setPaymentMethod("");
      setLocation("");
    }
  };
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">Nueva Transacción</DialogTitle>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Template Selector */}
          <div className="pt-4">
            <Label htmlFor="template">Plantilla</Label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione una plantilla" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="grocery">Compra de supermercado</SelectItem>
                <SelectItem value="salary">Salario mensual</SelectItem>
                <SelectItem value="bills">Facturas</SelectItem>
                <SelectItem value="transfer">Transferencia</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Transaction Type Tabs */}
          <Tabs value={transactionType} onValueChange={value => setTransactionType(value as "expense" | "income" | "transfer")}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="expense" className="text-sm">Gasto</TabsTrigger>
              <TabsTrigger value="income" className="text-sm">Ingreso</TabsTrigger>
              <TabsTrigger value="transfer" className="text-sm">Transferencia</TabsTrigger>
            </TabsList>

            <TabsContent value="expense" className="space-y-4 mt-4">
              <ExpenseTab 
                amount={amount} 
                setAmount={setAmount} 
                selectedAccount={selectedAccount} 
                setSelectedAccount={setSelectedAccount} 
              />
            </TabsContent>

            <TabsContent value="income" className="space-y-4 mt-4">
              <IncomeTab 
                amount={amount} 
                setAmount={setAmount} 
                selectedAccount={selectedAccount} 
                setSelectedAccount={setSelectedAccount} 
              />
            </TabsContent>

            <TabsContent value="transfer" className="space-y-4 mt-4">
              <TransferTab 
                amount={amount} 
                setAmount={setAmount} 
                selectedAccount={selectedAccount} 
                setSelectedAccount={setSelectedAccount}
                toAccount={toAccount}
                setToAccount={setToAccount}
              />
            </TabsContent>
          </Tabs>

          {/* Categorization and Date/Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="food">Alimentación</SelectItem>
                  <SelectItem value="transport">Transporte</SelectItem>
                  <SelectItem value="entertainment">Entretenimiento</SelectItem>
                  <SelectItem value="shopping">Compras</SelectItem>
                  <SelectItem value="bills">Facturas</SelectItem>
                  <SelectItem value="salary">Salario</SelectItem>
                  <SelectItem value="other">Otros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Etiquetas</Label>
              <Select value={selectedTags} onValueChange={setSelectedTags}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">Urgente</SelectItem>
                  <SelectItem value="recurring">Recurrente</SelectItem>
                  <SelectItem value="business">Negocio</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="vacation">Vacaciones</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Fecha</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Hora</Label>
              <Input type="time" value={time} onChange={e => setTime(e.target.value)} />
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="beneficiary">
                {transactionType === "expense" ? "Beneficiario" : transactionType === "income" ? "Pagador" : "Beneficiario"}
              </Label>
              <Input 
                id="beneficiary" 
                placeholder={transactionType === "expense" ? "Nombre del beneficiario" : transactionType === "income" ? "Nombre del pagador" : "Nombre del beneficiario"} 
                value={beneficiary} 
                onChange={e => setBeneficiary(e.target.value)} 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Nota</Label>
              <Textarea id="note" placeholder="Agregar nota..." value={note} onChange={e => setNote(e.target.value)} rows={3} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Forma de pago</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar forma de pago" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">
                    <div className="flex items-center space-x-2">
                      <Banknote className="h-4 w-4" />
                      <span>Dinero en efectivo</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="debit">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="h-4 w-4" />
                      <span>Tarjeta de débito</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="credit">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="h-4 w-4" />
                      <span>Tarjeta de crédito</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="transfer">
                    <div className="flex items-center space-x-2">
                      <Wallet className="h-4 w-4" />
                      <span>Transferencia bancaria</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="coupon">
                    <div className="flex items-center space-x-2">
                      <Receipt className="h-4 w-4" />
                      <span>Cupón</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="mobile">
                    <div className="flex items-center space-x-2">
                      <Smartphone className="h-4 w-4" />
                      <span>Pago por móvil</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="web">
                    <div className="flex items-center space-x-2">
                      <Globe className="h-4 w-4" />
                      <span>Pago por web</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Lugar</Label>
              <div className="relative">
                <Input id="location" placeholder="Ubicación" value={location} onChange={e => setLocation(e.target.value)} className="pr-10" />
                <Button variant="ghost" size="icon" className="absolute right-1 top-1 h-8 w-8">
                  <MapPin className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col space-y-2 pt-4">
            <Button onClick={() => handleSubmit(false)} className="w-full">
              Añadir registro
            </Button>
            <Button variant="outline" onClick={() => handleSubmit(true)} className="w-full">
              Añadir y crear otro
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>;
}