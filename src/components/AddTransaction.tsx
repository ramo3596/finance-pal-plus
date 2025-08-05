import { useState, useEffect } from "react";
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
import { useSettings } from "@/hooks/useSettings";
import { useTransactions } from "@/hooks/useTransactions";
interface AddTransactionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
export function AddTransaction({
  open,
  onOpenChange
}: AddTransactionProps) {
  const { 
    accounts, 
    categories, 
    tags, 
    templates, 
    loading 
  } = useSettings();
  
  const { createTransaction } = useTransactions();
  
  const [transactionType, setTransactionType] = useState<"expense" | "income" | "transfer">("expense");
  const [amount, setAmount] = useState("0");
  const [selectedAccount, setSelectedAccount] = useState("");
  const [toAccount, setToAccount] = useState(""); // For transfers
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [date, setDate] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [time, setTime] = useState(() => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  });
  const [beneficiary, setBeneficiary] = useState("");
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [location, setLocation] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  // Function to apply template data
  const applyTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setAmount(template.amount.toString());
      setSelectedAccount(template.account_id || "");
      setSelectedCategory(template.category_id || "");
      setPaymentMethod(template.payment_method || "");
      setBeneficiary(template.beneficiary || "");
      setNote(template.note || "");
      setTransactionType(template.type.toLowerCase() as "expense" | "income" | "transfer");
    }
  };

  const handleSubmit = async (createAnother = false) => {
    if (!selectedAccount) {
      alert('Debe seleccionar una cuenta');
      return;
    }

    try {
      const transactionData = {
        type: transactionType,
        amount: parseFloat(amount),
        account_id: selectedAccount,
        to_account_id: toAccount || undefined,
        category_id: selectedCategory || undefined,
        description: beneficiary || `${transactionType} transaction`,
        beneficiary,
        note,
        payment_method: paymentMethod || undefined,
        location: location || undefined,
        tags: selectedTags,
        transaction_date: new Date(`${date}T${time}`).toISOString(),
      };

      await createTransaction(transactionData);

      if (!createAnother) {
        onOpenChange(false);
      } else {
        // Reset form for new transaction
        setAmount("0");
        setSelectedAccount("");
        setToAccount("");
        setSelectedCategory("");
        setSelectedTags([]);
        setBeneficiary("");
        setNote("");
        setPaymentMethod("");
        setLocation("");
      }
    } catch (error) {
      console.error('Error creating transaction:', error);
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
            <Select value={selectedTemplate} onValueChange={(value) => {
              setSelectedTemplate(value);
              if (value) applyTemplate(value);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione una plantilla" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name} - ${template.amount.toFixed(2)}
                  </SelectItem>
                ))}
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
                accounts={accounts} 
              />
            </TabsContent>

            <TabsContent value="income" className="space-y-4 mt-4">
              <IncomeTab 
                amount={amount} 
                setAmount={setAmount} 
                selectedAccount={selectedAccount} 
                setSelectedAccount={setSelectedAccount}
                accounts={accounts} 
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
                accounts={accounts}
              />
            </TabsContent>
          </Tabs>

          {/* Categorization and Date/Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center gap-2">
                        <span>{category.icon}</span>
                        <span>{category.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Etiquetas</Label>
              <Select value={selectedTags.length > 0 ? selectedTags[0] : ""} onValueChange={(value) => {
                if (value) {
                  const selectedTag = tags.find(tag => tag.id === value);
                  if (selectedTag && !selectedTags.includes(selectedTag.name)) {
                    setSelectedTags([...selectedTags, selectedTag.name]);
                  }
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar etiquetas" />
                </SelectTrigger>
                <SelectContent>
                  {tags.map((tag) => (
                    <SelectItem key={tag.id} value={tag.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: tag.color }}
                        />
                        <span>{tag.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedTags.map((tagName, index) => {
                    const tag = tags.find(t => t.name === tagName);
                    return tag ? (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded"
                        style={{ backgroundColor: tag.color, color: 'white' }}
                      >
                        {tag.name}
                        <button
                          type="button"
                          onClick={() => setSelectedTags(selectedTags.filter((_, i) => i !== index))}
                          className="ml-1 hover:bg-black/20 rounded-full w-4 h-4 flex items-center justify-center"
                        >
                          ×
                        </button>
                      </span>
                    ) : null;
                  })}
                </div>
              )}
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