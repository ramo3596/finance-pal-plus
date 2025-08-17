import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { TrendingUp, TrendingDown, Edit, Trash2, X } from "lucide-react"
import { type Debt, type DebtPayment } from "@/hooks/useDebts"
import { useDebts } from "@/hooks/useDebts"
import { EditPaymentDialog } from "./EditPaymentDialog"

interface DebtHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  debt: Debt
}

export function DebtHistoryDialog({ open, onOpenChange, debt }: DebtHistoryDialogProps) {
  const [payments, setPayments] = useState<DebtPayment[]>([])
  const [editingPayment, setEditingPayment] = useState<DebtPayment | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const { fetchDebtPayments, deleteDebtPayment, deleteDebt, reactivateDebt } = useDebts()

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
    setEditingPayment(payment)
    setIsEditDialogOpen(true)
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
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
              Historial de {isDebt ? 'Deuda' : 'Préstamo'} - {contactName}
            </DialogTitle>
            <div className="flex items-center space-x-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar {isDebt ? 'Deuda' : 'Préstamo'}
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
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Resumen de la deuda */}
          <div className="bg-muted/50 rounded-lg p-4">
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
                <p className={`font-semibold ${isDebt ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(Math.abs(debt.current_balance))}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Fecha:</span>
                <p className="font-medium">{format(new Date(debt.debt_date), 'dd/MM/yyyy')}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Estado:</span>
                <Badge variant={debt.status === 'active' ? 'default' : 'secondary'}>
                  {debt.status === 'active' ? 'Activo' : 'Cerrado'}
                </Badge>
                {debt.status === 'closed' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => reactivateDebt(debt.id)}
                    className="text-xs"
                  >
                    Reactivar
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Historial de pagos */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Historial de Movimientos</h3>
            <ScrollArea className="h-[300px] border rounded-lg p-4">
              {payments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No hay historial de pagos disponible
                </p>
              ) : (
                <div className="space-y-3">
                  {payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors">
                      <div className="flex items-center space-x-3 flex-1">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                          style={{ 
                            backgroundColor: payment.transactions?.categories?.color || 'hsl(var(--primary))' 
                          }}
                        >
                          {payment.transactions?.categories?.icon && (
                            <span className="text-sm">
                              {payment.transactions.categories.icon}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">
                            {payment.transactions?.categories?.name || getPaymentType(payment.amount)}
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
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
        
        {editingPayment && (
          <EditPaymentDialog
            open={isEditDialogOpen}
            onOpenChange={(open) => {
              setIsEditDialogOpen(open)
              if (!open) {
                setEditingPayment(null)
                refreshPayments()
              }
            }}
            payment={editingPayment}
            debtId={debt.id}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}