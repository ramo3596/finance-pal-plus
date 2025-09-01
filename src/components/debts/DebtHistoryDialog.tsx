import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { TrendingUp, TrendingDown, Edit, Trash2, X, ArrowLeft } from "lucide-react"
import { type Debt, type DebtPayment } from "@/hooks/useDebts"
import { useDebts } from "@/hooks/useDebts"
import { EditTransaction } from "@/components/EditTransaction"
import { useTransactions } from "@/hooks/useTransactions"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

interface DebtHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  debt: Debt
}

export function DebtHistoryDialog({ open, onOpenChange, debt }: DebtHistoryDialogProps) {
  const [payments, setPayments] = useState<DebtPayment[]>([])
  const [editingTransaction, setEditingTransaction] = useState<any | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const { fetchDebtPayments, deleteDebtPayment, deleteDebt, reactivateDebt } = useDebts()
  const { transactions } = useTransactions()
  const isMobile = useIsMobile()

  const refreshPayments = async () => {
    if (debt.id) {
      const updatedPayments = await fetchDebtPayments(debt.id)
      setPayments(updatedPayments)
    }
  }

  useEffect(() => {
    if (open) {
      refreshPayments()
    }
  }, [open, debt.id])

  const isDebt = debt.type === 'debt'
  const contactName = debt.contacts?.name || 'Contacto'

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getPaymentType = (amount: number) => {
    if (amount > 0) {
      return isDebt ? 'Pago' : 'Cobro'
    } else {
      return 'Aumento'
    }
  }

  const getPaymentColor = (amount: number) => {
    if (amount > 0) {
      return isDebt ? 'text-success' : 'text-success'
    } else {
      return 'text-expense-red'
    }
  }

  const handleEditPayment = (payment: DebtPayment) => {
    if (payment.transaction_id) {
      const transaction = transactions.find(t => t.id === payment.transaction_id)
      if (transaction) {
        setEditingTransaction(transaction)
        setIsEditDialogOpen(true)
      }
    }
  }

  const handleDeletePayment = async (paymentId: string) => {
    await deleteDebtPayment(paymentId, debt.id)
    refreshPayments()
  }

  const handleDeleteDebt = async () => {
    await deleteDebt(debt.id)
    onOpenChange(false)
  }

  const isInitialRecord = (payment: DebtPayment) => {
    return payment.description?.includes('Registro inicial')
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

          {/* Historial de pagos */}
          <div>
            {!isMobile && <h3 className="font-semibold mb-3 text-lg">Historial de Movimientos</h3>}
            <ScrollArea className={cn("border rounded-lg p-4", isMobile ? "h-[calc(100vh-300px)] border-0 p-2" : "h-[300px]")}>
              {payments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No hay historial de pagos disponible
                </p>
              ) : (
                <div className="space-y-3">
                  {payments.map((payment) => (
                    <div key={payment.id} className={cn(
                      "rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors",
                      isMobile ? "p-3" : "p-3 flex items-center justify-between"
                    )}>
                      {isMobile ? (
                        /* Layout móvil - Vertical */
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 flex-1">
                              <div 
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-white flex-shrink-0"
                                style={{ 
                                  backgroundColor: payment.transactions?.categories?.color || 'hsl(var(--primary))' 
                                }}
                              >
                                {(payment.transactions?.subcategories?.icon || payment.transactions?.categories?.icon) && (
                                  <span className="text-xs">
                                    {payment.transactions?.subcategories?.icon || payment.transactions?.categories?.icon}
                                  </span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-foreground text-sm truncate">
                                  {payment.transactions?.subcategories?.name || payment.transactions?.categories?.name || getPaymentType(payment.amount)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(payment.payment_date), 'dd/MM/yyyy')}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <p className={`font-bold text-sm ${getPaymentColor(payment.amount)}`}>
                                {payment.amount > 0 ? '+' : ''}{formatCurrency(payment.amount)}
                              </p>
                              <div className="flex items-center space-x-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditPayment(payment)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                {!isInitialRecord(payment) && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>¿Eliminar registro?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Esta acción eliminará permanentemente este registro de pago. Esta acción no se puede deshacer.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction 
                                          onClick={() => handleDeletePayment(payment.id)}
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                          Eliminar
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
                              </div>
                            </div>
                          </div>
                          {payment.description && (
                            <p className="text-xs text-muted-foreground pl-11">
                              {payment.description}
                            </p>
                          )}
                        </div>
                      ) : (
                        /* Layout escritorio - Horizontal */
                        <>
                          <div className="flex items-center space-x-3 flex-1">
                            <div 
                              className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                              style={{ 
                                backgroundColor: payment.transactions?.categories?.color || 'hsl(var(--primary))' 
                              }}
                            >
                              {(payment.transactions?.subcategories?.icon || payment.transactions?.categories?.icon) && (
                                <span className="text-sm">
                                  {payment.transactions?.subcategories?.icon || payment.transactions?.categories?.icon}
                                </span>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-foreground">
                                {payment.transactions?.subcategories?.name || payment.transactions?.categories?.name || getPaymentType(payment.amount)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {payment.transactions?.accounts?.name}
                              </p>
                              {payment.description && (
                                <p className="text-sm text-muted-foreground">
                                  {payment.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="text-right">
                              <p className={`font-bold ${getPaymentColor(payment.amount)}`}>
                                {payment.amount > 0 ? '+' : ''}{formatCurrency(payment.amount)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(payment.payment_date), 'dd/MM/yyyy')}
                              </p>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditPayment(payment)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              {!isInitialRecord(payment) && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>¿Eliminar registro?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Esta acción eliminará permanentemente este registro de pago. Esta acción no se puede deshacer.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction 
                                        onClick={() => handleDeletePayment(payment.id)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Eliminar
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
        
        {editingTransaction && (
          <EditTransaction
            open={isEditDialogOpen}
            onOpenChange={(open) => {
              setIsEditDialogOpen(open)
              if (!open) {
                setEditingTransaction(null)
                refreshPayments()
              }
            }}
            transaction={editingTransaction}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}