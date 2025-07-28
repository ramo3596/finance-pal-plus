import { useState, useEffect } from "react"
import { format } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useDebts, type Debt, type DebtPayment } from "@/hooks/useDebts"

interface DebtHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  debt: Debt
}

export function DebtHistoryDialog({ open, onOpenChange, debt }: DebtHistoryDialogProps) {
  const [payments, setPayments] = useState<DebtPayment[]>([])
  const { fetchDebtPayments } = useDebts()

  useEffect(() => {
    if (open && debt.id) {
      fetchDebtPayments(debt.id).then(setPayments)
    }
  }, [open, debt.id, fetchDebtPayments])

  const isDebt = debt.type === 'debt'
  const contactName = debt.contacts?.name || 'Contacto'

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const getPaymentType = (amount: number) => {
    if (amount > 0) {
      return isDebt ? 'Pago' : 'Cobro'
    } else {
      return isDebt ? 'Aumento' : 'Incremento'
    }
  }

  const getPaymentColor = (amount: number) => {
    return amount > 0 ? 'text-green-600' : 'text-red-600'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Historial de {isDebt ? 'Deuda' : 'Préstamo'}</DialogTitle>
          <div className="text-sm text-muted-foreground">
            {isDebt ? 'DEBO' : 'ME DEBEN'} {contactName}
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Debt Summary */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Descripción</div>
                  <div className="font-medium">{debt.description}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Cuenta</div>
                  <div className="font-medium">{debt.accounts?.name}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Monto inicial</div>
                  <div className="font-medium">{formatCurrency(debt.initial_amount)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Saldo actual</div>
                  <div className={`font-medium ${isDebt ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(Math.abs(debt.current_balance))}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Fecha</div>
                  <div className="font-medium">{format(new Date(debt.debt_date), 'dd/MM/yyyy')}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Estado</div>
                  <Badge variant={debt.status === 'active' ? 'default' : 'secondary'}>
                    {debt.status === 'active' ? 'Activo' : 'Cerrado'}
                  </Badge>
                </div>
                {debt.due_date && (
                  <div className="col-span-2">
                    <div className="text-muted-foreground">Fecha de vencimiento</div>
                    <div className="font-medium">
                      {format(new Date(debt.due_date), 'dd/MM/yyyy')}
                      {new Date(debt.due_date) < new Date() && (
                        <Badge variant="destructive" className="ml-2">
                          Vencida
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Payment History */}
          <div>
            <h3 className="font-semibold mb-3">Historial de Movimientos</h3>
            {payments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay movimientos registrados
              </div>
            ) : (
              <div className="space-y-3">
                {payments.map((payment) => (
                  <Card key={payment.id}>
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <Badge variant="outline">
                              {getPaymentType(payment.amount)}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(payment.payment_date), 'dd/MM/yyyy')}
                            </span>
                          </div>
                          {payment.description && (
                            <p className="text-sm text-muted-foreground">
                              {payment.description}
                            </p>
                          )}
                        </div>
                        <div className={`font-semibold ${getPaymentColor(payment.amount)}`}>
                          {payment.amount > 0 ? '+' : ''}{formatCurrency(payment.amount)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}