import { useState, useEffect } from "react"
import { Search, FileText } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { useTransactions, type Transaction } from "@/hooks/useTransactions"
import { useSettings } from "@/hooks/useSettings"
import { useDebts, type Debt } from "@/hooks/useDebts"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface SelectTransactionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  debt: Debt
}

export function SelectTransactionDialog({ open, onOpenChange, debt }: SelectTransactionDialogProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const { transactions } = useTransactions()
  const { categories, accounts } = useSettings()
  const { refetch } = useDebts()

  // Reset selection when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSelectedTransaction(null)
      setSearchTerm("")
    }
  }, [open])

  // Filter transactions that are NOT already associated with debts and match search term
  const availableTransactions = transactions.filter(transaction => {
    // Exclude transactions already associated with debts
    if (transaction.debt_id) return false
    
    // Exclude transfers as they don't make sense for debt association
    if (transaction.type === 'transfer') return false
    
    // Search filter
    const matchesSearch = !searchTerm || 
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.beneficiary?.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  const getCategoryData = (categoryId?: string) => {
    return categories.find(cat => cat.id === categoryId)
  }

  const getAccountName = (accountId: string) => {
    return accounts.find(acc => acc.id === accountId)?.name || 'Cuenta'
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(Math.abs(amount))
  }

  const handleImportTransaction = async () => {
    if (!selectedTransaction) {
      toast.error('Selecciona una transacción para importar')
      return
    }

    try {
      // Buscar el registro de deuda real en Supabase por contact_id
      const { data: debtRecord, error: debtError } = await supabase
        .from('debts')
        .select('id')
        .eq('contact_id', debt.contact_id)
        .eq('user_id', debt.user_id)
        .eq('status', 'active')
        .single()

      if (debtError || !debtRecord) {
        console.error('Error finding debt record:', debtError)
        toast.error('No se encontró el registro de deuda')
        return
      }

      // Update the transaction to associate it with the debt
      const { error } = await supabase
        .from('transactions')
        .update({ 
          debt_id: debtRecord.id, // Use the real debt record ID
          contact_id: debt.contact_id 
        })
        .eq('id', selectedTransaction.id)

      if (error) {
        console.error('Error importing transaction:', error)
        toast.error('Error al importar la transacción')
        return
      }

      toast.success('Transacción importada exitosamente')
      refetch()
      onOpenChange(false)
    } catch (error) {
      console.error('Error importing transaction:', error)
      toast.error('Error al importar la transacción')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Seleccionar Registro</span>
          </DialogTitle>
          <div className="text-sm text-muted-foreground">
            Importar una transacción existente a {debt.type === 'debt' ? 'la deuda con' : 'el préstamo a'} {debt.contacts?.name}
          </div>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar transacciones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Transaction List */}
        <ScrollArea className="flex-1">
          <div className="space-y-2">
            {availableTransactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? 'No se encontraron transacciones' : 'No hay transacciones disponibles para importar'}
              </div>
            ) : (
              availableTransactions.map((transaction) => {
                const categoryData = getCategoryData(transaction.category_id)
                const accountName = getAccountName(transaction.account_id)
                const isSelected = selectedTransaction?.id === transaction.id

                return (
                  <div
                    key={transaction.id}
                    className={cn(
                      "flex items-center space-x-4 p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50",
                      isSelected ? "bg-primary/10 border-primary" : "bg-background"
                    )}
                    onClick={() => setSelectedTransaction(isSelected ? null : transaction)}
                  >
                    {/* Category Icon */}
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: categoryData?.color || '#6b7280' }}
                    >
                      {categoryData?.icon || '💰'}
                    </div>

                    {/* Transaction Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {accountName} • {categoryData?.name}
                          </p>
                          {transaction.beneficiary && (
                            <p className="text-sm text-muted-foreground">
                              Para: {transaction.beneficiary}
                            </p>
                          )}
                        </div>
                        
                        <div className="text-right">
                          <p className={cn(
                            "font-bold",
                            transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                          )}>
                            {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(transaction.transaction_date).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                      </div>
                      
                      {/* Transaction Type Badge */}
                      <div className="mt-2">
                        <Badge variant={transaction.type === 'income' ? 'default' : 'secondary'}>
                          {transaction.type === 'income' ? 'Ingreso' : 'Gasto'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>

        {/* Actions */}
        <div className="flex space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancelar
          </Button>
          <Button 
            onClick={handleImportTransaction} 
            disabled={!selectedTransaction}
            className="flex-1"
          >
            Importar Transacción
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}