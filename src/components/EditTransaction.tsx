import { useState, useEffect } from "react";
import { X, Search, MapPin, Wallet, CreditCard, Banknote, Smartphone, Globe, Receipt, Trash2 } from "lucide-react";
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
import { useTransactions, Transaction } from "@/hooks/useTransactions";
import { useContacts } from "@/hooks/useContacts";
import { Autocomplete } from "@/components/ui/autocomplete";

interface EditTransactionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
}

export function EditTransaction({
  open,
  onOpenChange,
  transaction
}: EditTransactionProps) {
  const { 
    accounts, 
    categories, 
    tags, 
    loading 
  } = useSettings();
  
  const { contacts } = useContacts();
  const { updateTransaction, updateTransferPair, deleteTransaction } = useTransactions();
  
  const [transactionType, setTransactionType] = useState<"expense" | "income" | "transfer">("expense");
  const [amount, setAmount] = useState("0");
  const [selectedAccount, setSelectedAccount] = useState("");
  const [toAccount, setToAccount] = useState(""); // For transfers
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [selectedContact, setSelectedContact] = useState("");
  const [beneficiary, setBeneficiary] = useState("");
  const [description, setDescription] = useState("");
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [location, setLocation] = useState("");

  // Reset form when transaction changes
  useEffect(() => {
    if (transaction && open) {
      setTransactionType(transaction.type);
      setAmount(Math.abs(transaction.amount).toString());
      setSelectedAccount(transaction.account_id || "");
      setToAccount(transaction.to_account_id || "");
      setSelectedCategory(transaction.category_id || "");
      setSelectedTags(Array.isArray(transaction.tags) ? transaction.tags : []);
      
      const transactionDate = new Date(transaction.transaction_date);
      // Use getFullYear, getMonth, getDate to avoid timezone issues
      const year = transactionDate.getFullYear();
      const month = String(transactionDate.getMonth() + 1).padStart(2, '0');
      const day = String(transactionDate.getDate()).padStart(2, '0');
      setDate(`${year}-${month}-${day}`);
      setTime(transactionDate.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      }));
      
      setBeneficiary(transaction.beneficiary || "");
      setDescription(transaction.description || "");
      setNote(transaction.note || "");
      setPaymentMethod(transaction.payment_method || "");
      setLocation(transaction.location || "");
    }
  }, [transaction, open]);

  const handleSubmit = async () => {
    if (!transaction) return;

    try {
      // For transfers, we need special handling since they're stored as paired transactions
      if (transactionType === 'transfer') {
        // Update both records of the transfer
        await updateTransferPair(transaction.id, {
          type: transactionType,
          amount: parseFloat(amount),
          account_id: selectedAccount,
          to_account_id: toAccount || undefined,
          category_id: selectedCategory || undefined,
          description: description || 'Transferencia',
          beneficiary,
          note,
          payment_method: paymentMethod,
          location,
          tags: selectedTags,
          transaction_date: new Date(`${date}T${time}`).toISOString(),
        });
      } else {
        // For regular transactions
        const adjustedAmount = transactionType === 'expense' 
          ? -Math.abs(parseFloat(amount)) 
          : Math.abs(parseFloat(amount));

        await updateTransaction(transaction.id, {
          type: transactionType,
          amount: adjustedAmount,
          account_id: selectedAccount,
          category_id: selectedCategory || undefined,
          description: description || beneficiary || `${transactionType} transaction`,
          beneficiary,
          note,
          payment_method: paymentMethod,
          location,
          tags: selectedTags,
          transaction_date: new Date(`${date}T${time}`).toISOString(),
        });
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Error updating transaction:', error);
    }
  };

  // Handle location detection
  const handleLocationDetection = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            // Try to get address using a free geocoding service
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=es`
            );
            if (response.ok) {
              const data = await response.json();
              if (data.display_name) {
                setLocation(data.display_name);
              } else {
                setLocation(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
              }
            } else {
              setLocation(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
            }
          } catch (error) {
            console.error('Error getting address:', error);
            setLocation(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          let errorMessage = 'No se pudo obtener la ubicación.';
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Permisos de ubicación denegados. Habilita la ubicación en tu navegador.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Información de ubicación no disponible.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Tiempo de espera agotado para obtener la ubicación.';
              break;
          }
          alert(errorMessage);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 300000
        }
      );
    } else {
      alert('La geolocalización no está soportada en este navegador.');
    }
  };

  const handleDelete = async () => {
    if (!transaction) return;
    
    if (window.confirm('¿Estás seguro de que quieres eliminar esta transacción?')) {
      try {
        await deleteTransaction(transaction.id);
        onOpenChange(false);
      } catch (error) {
        console.error('Error deleting transaction:', error);
      }
    }
  };

  if (!transaction) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">Editar Transacción</DialogTitle>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
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
              <Select value={Array.isArray(selectedTags) ? selectedTags.join(',') : ''} onValueChange={(value) => {
                if (value) {
                  const newTags = value.split(',');
                  setSelectedTags(newTags);
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact">
                  {transactionType === "expense" ? "Beneficiario (Contacto)" : transactionType === "income" ? "Pagador (Contacto)" : "Contacto"}
                </Label>
                <Autocomplete
                  options={contacts.map(contact => ({
                    id: contact.id,
                    name: `${contact.name} (${contact.contact_type})`
                  }))}
                  value={selectedContact}
                  onValueChange={setSelectedContact}
                  placeholder="Buscar contacto..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="beneficiary">
                  {transactionType === "expense" ? "Beneficiario (Manual)" : transactionType === "income" ? "Pagador (Manual)" : "Nombre Manual"}
                </Label>
                <Input 
                  id="beneficiary" 
                  placeholder={transactionType === "expense" ? "O escribir nombre del beneficiario" : transactionType === "income" ? "O escribir nombre del pagador" : "O escribir nombre manual"} 
                  value={beneficiary} 
                  onChange={e => setBeneficiary(e.target.value)} 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Input 
                id="description" 
                placeholder="Descripción de la transacción" 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
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
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute right-1 top-1 h-8 w-8"
                  onClick={handleLocationDetection}
                  title="Obtener ubicación actual"
                >
                  <MapPin className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col space-y-2 pt-4">
            <Button onClick={handleSubmit} className="w-full">
              Actualizar Transacción
            </Button>
            <Button onClick={handleDelete} variant="destructive" className="w-full">
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar Transacción
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}