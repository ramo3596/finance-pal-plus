import { useState, useEffect, useMemo } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Trash2, X, ArrowLeft } from "lucide-react"
import { type Debt } from "@/hooks/useDebts"
import { useDebts } from "@/hooks/useDebts"
import { EditTransaction } from "@/components/EditTransaction"
import { useTransactions, Transaction } from "@/hooks/useTransactions"
import { TransactionItem } from "@/components/shared/TransactionItem"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface DebtHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  debt: Debt
}

export function DebtHistoryDialog({ open, onOpenChange, debt }: DebtHistoryDialogProps) {
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const { deleteDebt, reactivateDebt } = useDebts()
  const { transactions, deleteTransaction } = useTransactions()
  const isMobile = useIsMobile()

  // Filtrar transacciones relacionadas con esta deuda/préstamo por contact_id
  const debtTransactions = useMemo(() => {
    if (!transactions || !debt.contact_id) return []
    
    // Subcategorías que identifican transacciones de deudas/préstamos
    const DEBT_SUBCATEGORIES = [
      'e9fb73a7-86d4-44f0-bb40-dee112a5560d', // Préstamos, alquileres (para cobros de préstamo - tipo income)
      '6450a480-9d0c-4ae1-a08a-26e5d4b158a2', // Comisión (para pagos de deuda - tipo expense)
      'e3b4a085-a4da-4b24-b356-fd9a2b3113e5', // Préstamos (para nuevas deudas - tipo expense)
    ]
    
    // Filtrar transacciones que pertenecen a este contacto y son de tipo deuda/préstamo
    const contactTransactions = transactions.filter(transaction => 
      transaction.contact_id === debt.contact_id &&
      DEBT_SUBCATEGORIES.includes(transaction.subcategory_id || '')
    )
    
    // Ordenar por fecha (más reciente primero)
    return contactTransactions.sort((a, b) => 
      new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
    )
  }, [transactions, debt.contact_id])

  const isDebt = debt.type === 'debt'
  const contactName = debt.contacts?.name || 'Contacto'

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }



  const handleDeleteDebt = async () => {
    await deleteDebt(debt.id)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        isMobile ? "max-w-full w-full h-full m-0 rounded-none" : "max-w-2xl max-h-[80vh]"
      )}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            {isMobile && (
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="mr-2">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <DialogTitle className={cn("flex-1 min-w-0", isMobile ? "text-lg" : "text-xl")}>
              {isMobile ? (
                <span className="truncate block">{debt.description}</span>
              ) : (
                <span className="truncate block">{`${isDebt ? 'Historial de Deuda' : 'Historial de Préstamo'} - ${contactName}`}</span>
              )}
            </DialogTitle>
            <div className="flex items-center space-x-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size={isMobile ? "sm" : "default"}>
                    <Trash2 className="h-4 w-4" />
                    {!isMobile && <span className="ml-2">Eliminar</span>}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar {isDebt ? 'deuda' : 'préstamo'}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción eliminará permanentemente {isDebt ? 'la deuda' : 'el préstamo'} y todo su historial de movimientos. Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteDebt} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              {!isMobile && (
                <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Desktop: Información completa de la deuda */}
          {!isMobile && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Descripción:</span>
                  <p className="font-medium">{debt.description}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Cuenta:</span>
                  <p className="font-medium">{debt.accounts?.name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Monto inicial:</span>
                  <p className="font-medium">{formatCurrency(debt.initial_amount)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Saldo actual:</span>
                  <p className={cn(
                    "font-medium",
                    debt.current_balance < 0 ? 'text-red-600' : 'text-green-600'
                  )}>
                    {formatCurrency(debt.current_balance)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Fecha:</span>
                  <p className="font-medium">{format(new Date(debt.debt_date), 'dd/MM/yyyy')}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Estado:</span>
                  <Badge variant={debt.status === 'active' ? 'default' : 'secondary'}>
                    {debt.status === 'active' ? 'Activo' : 'Cerrado'}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Mobile: Saldo prominente */}
          {isMobile && (
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {isDebt ? 'DEBO' : 'ME DEBEN'} a {contactName}
                </p>
                <p className={cn(
                  "font-bold text-3xl",
                  debt.current_balance < 0 ? 'text-red-600' : 'text-green-600'
                )}>
                  {formatCurrency(debt.current_balance)}
                </p>
                {debt.status === 'closed' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => reactivateDebt(debt.id)}
                    className="text-xs ml-2"
                  >
                    Reactivar
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Registros de Transacciones */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg">Registros de Transacciones</h3>
              <span className="text-sm text-muted-foreground">
                {debtTransactions.length} registros
              </span>
            </div>
            <ScrollArea className={cn("border rounded-lg p-4", isMobile ? "h-[calc(100vh-300px)] border-0 p-2" : "h-[300px]")}>
              {debtTransactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No hay transacciones registradas</p>
                  <p className="text-sm mt-1">Las transacciones con este contacto aparecerán aquí</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {debtTransactions.map((transaction) => (
                    <TransactionItem
                      key={transaction.id}
                      transaction={transaction}
                      onEdit={setEditingTransaction}
                      onDelete={async (transactionId) => {
                        try {
                          await deleteTransaction(transactionId)
                          toast.success('Transacción eliminada')
                        } catch (error) {
                          console.error('Error deleting transaction:', error)
                          toast.error('Error al eliminar la transacción')
                        }
                      }}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
        
        {editingTransaction && (
          <EditTransaction
            open={!!editingTransaction}
            onOpenChange={(open) => {
              if (!open) {
                setEditingTransaction(null)
              }
            }}
            transaction={editingTransaction}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}