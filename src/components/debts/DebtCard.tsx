import { format } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Plus, Eye, Trash2 } from "lucide-react"
import { type Debt } from "@/hooks/useDebts"
import { useDebts } from "@/hooks/useDebts"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

interface DebtCardProps {
  debt: Debt
  onAddPayment: () => void
  onSelectTransaction: () => void
  onViewHistory: () => void
}

export function DebtCard({ debt, onAddPayment, onSelectTransaction, onViewHistory }: DebtCardProps) {
  const isMobile = useIsMobile()
  const { deleteDebt } = useDebts()
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
  }

  return (
    <Card 
      className={cn("cursor-pointer hover:shadow-md transition-shadow h-full", isMobile ? "w-full" : "")}
      onClick={onViewHistory}
    >
      <CardContent className="p-4 h-full flex flex-col">
        {/* Desktop Layout */}
        <div className="hidden md:flex items-start justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <Avatar className="h-12 w-12">
              <AvatarImage src={debt.contacts?.image_url} />
              <AvatarFallback>
                {contactName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-sm font-medium text-muted-foreground">
                  {isDebt ? 'DEBO' : 'ME DEBEN'}
                </span>
                <span className="font-semibold">{contactName}</span>
              </div>
              
              <p className="text-sm text-muted-foreground mb-2 truncate">
                {debt.description}
              </p>
              
              <div className="flex items-center justify-between text-sm">
                <div>
                  <span className="text-muted-foreground">Saldo: </span>
                  <span className={`font-semibold ${debt.current_balance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(debt.current_balance)}
                  </span>
                </div>
                
                <div className="text-right">
                  <div className="text-muted-foreground">
                    {format(new Date(debt.updated_at), 'dd/MM/yyyy')}
                  </div>
                  {debt.due_date && (
                    <Badge variant={new Date(debt.due_date) < new Date() ? "destructive" : "secondary"} className="text-xs mt-1">
                      Vence: {format(new Date(debt.due_date), 'dd/MM/yyyy')}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col space-y-2 ml-4">
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                onAddPayment()
              }}
              className="text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              Nuevo Registro
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                onSelectTransaction()
              }}
              className="text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              Seleccionar Registro
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation()
                onViewHistory()
              }}
              className="text-xs"
            >
              <Eye className="h-3 w-3 mr-1" />
              Ver Historial
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Eliminar
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
          </div>
        </div>

        {/* Mobile Layout - Simplified */}
        <div className="md:hidden flex items-center w-full space-x-3">
          {/* Avatar */}
          <Avatar className="h-12 w-12 flex-shrink-0">
            <AvatarImage src={debt.contacts?.image_url} />
            <AvatarFallback>
              {contactName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          {/* Content - Takes remaining space */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-sm font-medium text-muted-foreground">
                {isDebt ? 'DEBO' : 'ME DEBEN'}
              </span>
              <span className="font-semibold truncate">{contactName}</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className={`font-semibold ${debt.current_balance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(debt.current_balance)}
              </span>
              <span className="text-muted-foreground text-xs">
                {format(new Date(debt.updated_at), 'dd/MM/yyyy')}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}