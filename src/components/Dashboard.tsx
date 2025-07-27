import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Plus, 
  Wallet, 
  CreditCard, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  PiggyBank,
  Building2
} from "lucide-react"
import { AddTransaction } from "./AddTransaction"
import { DashboardCard } from "./DashboardCard"
import { useTransactions } from "@/hooks/useTransactions"
import { useSettings } from "@/hooks/useSettings"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'

// Mock expenses for calculation
const mockExpenses = [
  { category: "Alimentación", amount: 1580.59, percentage: 35, color: "expense-red" },
  { category: "Transporte", amount: 995, percentage: 22, color: "expense-orange" },
  { category: "Entretenimiento", amount: 654, percentage: 15, color: "expense-purple" },
  { category: "Compras", amount: 440, percentage: 10, color: "expense-blue" },
  { category: "Otros", amount: 880, percentage: 18, color: "expense-cyan" },
]

export function Dashboard() {
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false)
  const { transactions, cards, updateCardPosition } = useTransactions()
  const { accounts } = useSettings()
  
  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0)
  const totalExpenses = mockExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  const recentTransactions = transactions.slice(0, 5)

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = cards.findIndex((card) => card.id === active.id)
      const newIndex = cards.findIndex((card) => card.id === over.id)
      
      if (oldIndex !== -1 && newIndex !== -1) {
        updateCardPosition(active.id as string, newIndex)
      }
    }
  }

  const sortedCards = [...cards].sort((a, b) => a.position - b.position).filter(card => card.visible)

  const renderOverviewCard = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Balance Total</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-foreground">
            ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="flex items-center mt-2 text-success">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span className="text-sm">+12.5% este mes</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Gastos del Mes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-foreground">
            ${totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="flex items-center mt-2 text-expense-red">
            <TrendingDown className="w-4 h-4 mr-1" />
            <span className="text-sm">+8.2% vs mes anterior</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Presupuesto Restante</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-foreground">$1,340.00</div>
          <Progress value={67} className="mt-2" />
          <span className="text-sm text-muted-foreground">67% del presupuesto usado</span>
        </CardContent>
      </Card>
    </div>
  )

  const renderAccountsCard = () => (
    <div className="space-y-4">
      {accounts.map((account) => (
        <div key={account.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg bg-primary/20`}>
              <Building2 className={`w-5 h-5 text-primary`} />
            </div>
            <div>
              <p className="font-medium text-foreground">{account.name}</p>
              <p className="text-sm text-muted-foreground">{account.icon}</p>
            </div>
          </div>
          <div className="text-right">
            <p className={`font-bold ${account.balance >= 0 ? 'text-success' : 'text-expense-red'}`}>
              {account.balance >= 0 ? '+' : ''}${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-muted-foreground">USD</p>
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" className="w-full">
        <Plus className="w-4 h-4 mr-2" />
        Agregar Cuenta
      </Button>
    </div>
  )

  const renderTransactionsCard = () => (
    <div className="space-y-4">
      {recentTransactions.length > 0 ? (
        recentTransactions.map((transaction) => (
          <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg bg-primary/20`}>
                <DollarSign className={`w-4 h-4 text-primary`} />
              </div>
              <div>
                <p className="font-medium text-foreground">{transaction.description}</p>
                <p className="text-sm text-muted-foreground">{transaction.type}</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`font-bold ${transaction.amount >= 0 ? 'text-success' : 'text-foreground'}`}>
                {transaction.amount >= 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground">
                {new Date(transaction.transaction_date).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))
      ) : (
        <p className="text-muted-foreground text-center py-4">No hay transacciones recientes</p>
      )}
      <Button variant="outline" size="sm" className="w-full">Ver Todas</Button>
    </div>
  )

  const renderExpensesCard = () => (
    <div className="space-y-4">
      {mockExpenses.map((expense, index) => (
        <div key={index} className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full bg-${expense.color}`}></div>
              <span className="font-medium text-foreground">{expense.category}</span>
            </div>
            <div className="text-right">
              <span className="font-bold text-foreground">${expense.amount.toLocaleString()}</span>
              <span className="text-sm text-muted-foreground ml-2">({expense.percentage}%)</span>
            </div>
          </div>
          <Progress value={expense.percentage} className="h-2" />
        </div>
      ))}
      <div className="mt-6 text-center">
        <div className="inline-flex items-center justify-center w-32 h-32 rounded-full border-8 border-muted relative">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">${totalExpenses.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="p-6 space-y-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Panel Financiero</h1>
          <p className="text-muted-foreground">Gestiona tus finanzas personales</p>
        </div>
        <Button 
          className="bg-primary hover:bg-primary/90"
          onClick={() => setIsAddTransactionOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Transacción
        </Button>
      </div>

      {/* Draggable Dashboard Cards */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={sortedCards.map(card => card.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-6">
            {sortedCards.map((card) => {
              switch (card.type) {
                case 'overview':
                  return (
                    <DashboardCard key={card.id} id={card.id} title={card.title}>
                      {renderOverviewCard()}
                    </DashboardCard>
                  )
                case 'accounts':
                  return (
                    <DashboardCard key={card.id} id={card.id} title={card.title}>
                      {renderAccountsCard()}
                    </DashboardCard>
                  )
                case 'transactions':
                  return (
                    <DashboardCard key={card.id} id={card.id} title={card.title}>
                      {renderTransactionsCard()}
                    </DashboardCard>
                  )
                case 'expenses':
                  return (
                    <DashboardCard key={card.id} id={card.id} title={card.title}>
                      {renderExpensesCard()}
                    </DashboardCard>
                  )
                default:
                  return null
              }
            })}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add Transaction Modal */}
      <AddTransaction 
        open={isAddTransactionOpen} 
        onOpenChange={setIsAddTransactionOpen} 
      />
    </div>
  )
}