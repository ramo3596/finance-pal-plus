import { format } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Eye } from "lucide-react"
import { type Debt } from "@/hooks/useDebts"

interface DebtCardProps {
  debt: Debt
  onAddPayment: () => void
  onViewHistory: () => void
}

export function DebtCard({ debt, onAddPayment, onViewHistory }: DebtCardProps) {
  const isDebt = debt.type === 'debt'
  const contactName = debt.contacts?.name || 'Contacto'
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onViewHistory}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
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
                  <span className={`font-semibold ${isDebt ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(Math.abs(debt.current_balance))}
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
              Añadir Registro
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
          </div>
        </div>
      </CardContent>
    </Card>
  )
}