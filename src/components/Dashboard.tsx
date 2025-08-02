import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { 
  Plus, 
  Wallet, 
  CreditCard, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  PiggyBank,
  Building2,
  CalendarIcon,
  Settings,
  Eye,
  EyeOff,
  icons
} from "lucide-react"
import { AddTransaction } from "./AddTransaction"
import { EditTransaction } from "./EditTransaction"
import { DashboardCard } from "./DashboardCard"
import { useTransactions } from "@/hooks/useTransactions"
import { useSettings } from "@/hooks/useSettings"
import { useScheduledPayments } from "@/hooks/useScheduledPayments"
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
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import { format, subDays, isAfter, isBefore, isEqual } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useNavigate } from "react-router-dom"

// Dashboard card types with new widgets
export type DashboardCardType = 
  | 'overview'
  | 'accounts' 
  | 'transactions'
  | 'expenses'
  | 'balance-trends'
  | 'cash-flow'
  | 'period-comparison'
  | 'income-expense-by-tag'
  | 'expenses-by-category'
  | 'balance-per-account'
  | 'upcoming-payments'
  | 'income-expense-table'

interface DateRange {
  from: Date
  to: Date
}

export function Dashboard() {
  const navigate = useNavigate()
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false)
  const [isEditTransactionOpen, setIsEditTransactionOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null)
  const [isCardManagerOpen, setIsCardManagerOpen] = useState(false)
  
  // Date range filter state
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date()
  })
  
  const { transactions, cards, updateCardPosition, toggleCardVisibility } = useTransactions()
  const { accounts, categories, tags } = useSettings()
  const { scheduledPayments } = useScheduledPayments()
  
  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Filter transactions by date range
  const filteredTransactions = transactions.filter(transaction => {
    const transactionDate = new Date(transaction.transaction_date)
    return (isAfter(transactionDate, dateRange.from) || isEqual(transactionDate, dateRange.from)) &&
           (isBefore(transactionDate, dateRange.to) || isEqual(transactionDate, dateRange.to))
  })

  // Calculate metrics based on filtered data
  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0)
  const totalIncome = filteredTransactions
    .filter(t => t.amount > 0 && t.type !== 'transfer')
    .reduce((sum, t) => sum + t.amount, 0)
  const totalExpenses = Math.abs(filteredTransactions
    .filter(t => t.amount < 0 && t.type !== 'transfer')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0))
  const netFlow = totalIncome - totalExpenses
  const recentTransactions = filteredTransactions.slice(0, 5)

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
            <span className="text-sm">Balance actual</span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-success/20 to-success/5 border-success/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Flujo de Fondos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-3xl font-bold ${netFlow >= 0 ? 'text-success' : 'text-expense-red'}`}>
            ${netFlow.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="flex items-center mt-2 text-muted-foreground">
            {netFlow >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
            <span className="text-sm">Ingresos - Gastos</span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-expense-red/20 to-expense-red/5 border-expense-red/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Gastado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-expense-red">
            ${totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="flex items-center mt-2 text-muted-foreground">
            <TrendingDown className="w-4 h-4 mr-1" />
            <span className="text-sm">Periodo seleccionado</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderAccountsCard = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-3 lg:grid-cols-5 gap-4">
        {accounts.map((account) => (
          <Card key={account.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="text-center space-y-2">
              <div className="mx-auto p-2 rounded-lg bg-primary/20 w-fit">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground text-sm truncate">{account.name}</p>
                <p className="text-xs text-muted-foreground">{account.icon}</p>
              </div>
              <div className="pt-1">
                <p className={`font-bold text-sm ${account.balance >= 0 ? 'text-success' : 'text-expense-red'}`}>
                  {account.balance >= 0 ? '+' : ''}${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-muted-foreground">USD</p>
              </div>
            </div>
          </Card>
        ))}
        <Card className="p-4 border-dashed border-2 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => navigate('/settings')}>
          <div className="text-center space-y-2 h-full flex flex-col justify-center">
            <div className="mx-auto p-2 rounded-lg bg-muted w-fit">
              <Plus className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Agregar Cuenta</p>
          </div>
        </Card>
      </div>
    </div>
  )

  const renderTransactionsCard = () => {
    const getTransactionIcon = (transaction: any, category?: any) => {
      if (transaction.description === 'Transferencia') {
        return <Plus className="w-4 h-4 text-primary rotate-45" />;
      }
      
      if (category?.icon) {
        const IconComponent = icons[category.icon as keyof typeof icons];
        if (IconComponent) {
          return <IconComponent className="w-4 h-4 text-primary" />;
        }
      }
      
      return <DollarSign className="w-4 h-4 text-primary" />;
    };

    const getTransactionInfo = (transaction: any) => {
      if (transaction.description === 'Transferencia') {
        const isOutgoing = transaction.amount < 0;
        const sourceAccountId = transaction.account_id;
        const destAccountId = transaction.to_account_id;
        const sourceAccount = accounts.find(acc => acc.id === sourceAccountId);
        const destAccount = accounts.find(acc => acc.id === destAccountId);
        
        if (isOutgoing) {
          return {
            title: 'Transferencia',
            subtitle: (
              <span>
                <strong>{sourceAccount?.name || 'Cuenta'}</strong> → {destAccount?.name || 'Cuenta'}
              </span>
            ),
          };
        } else {
          return {
            title: 'Transferencia',
            subtitle: (
              <span>
                {destAccount?.name || 'Cuenta'} → <strong>{sourceAccount?.name || 'Cuenta'}</strong>
              </span>
            ),
          };
        }
      } else {
        const category = categories.find(cat => cat.id === transaction.category_id);
        const account = accounts.find(acc => acc.id === transaction.account_id);
        const transactionTags = transaction.tags || [];
        const tagNames = transactionTags.map(tagId => {
          const tag = tags.find(t => t.id === tagId);
          return tag?.name || tagId;
        }).join(', ');
        
        return {
          title: category?.name || transaction.description,
          subtitle: `${account?.name || 'Cuenta'}${tagNames ? `, ${tagNames}` : ''}`,
          category
        };
      }
    };

    return (
      <div className="space-y-4">
        {recentTransactions.length > 0 ? (
          recentTransactions.map((transaction) => {
            const transactionInfo = getTransactionInfo(transaction);
            return (
              <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                <div className="flex items-center space-x-3">
                  <div 
                    className="p-2 rounded-lg bg-primary/20 cursor-pointer hover:bg-primary/30 transition-colors" 
                    onClick={() => {
                      setSelectedTransaction(transaction);
                      setIsEditTransactionOpen(true);
                    }}
                  >
                    {getTransactionIcon(transaction, transactionInfo.category)}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{transactionInfo.title}</p>
                    <p className="text-sm text-muted-foreground">{transactionInfo.subtitle}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${transaction.amount >= 0 ? 'text-success' : 'text-expense-red'}`}>
                    {transaction.amount >= 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(transaction.transaction_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-muted-foreground text-center py-4">No hay transacciones en el periodo</p>
        )}
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full"
          onClick={() => navigate('/records')}
        >
          Ver Todas
        </Button>
      </div>
    );
  }

  const renderExpensesCard = () => {
    // Calculate expenses by category for the filtered period
    const expensesByCategory = categories.map(category => {
      const categoryExpenses = filteredTransactions
        .filter(t => t.category_id === category.id && t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0)
      
      return {
        category: category.name,
        amount: categoryExpenses,
        percentage: totalExpenses > 0 ? (categoryExpenses / totalExpenses) * 100 : 0,
        color: category.color || 'expense-red'
      }
    }).filter(item => item.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5) // Top 5 categories

    return (
      <div className="space-y-4">
        {expensesByCategory.length > 0 ? (
          expensesByCategory.map((expense, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full bg-expense-red`}></div>
                  <span className="font-medium text-foreground">{expense.category}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-foreground">${expense.amount.toLocaleString()}</span>
                  <span className="text-sm text-muted-foreground ml-2">({expense.percentage.toFixed(1)}%)</span>
                </div>
              </div>
              <Progress value={expense.percentage} className="h-2" />
            </div>
          ))
        ) : (
          <p className="text-muted-foreground text-center py-4">No hay gastos en el periodo</p>
        )}
        
        {totalExpenses > 0 && (
          <div className="mt-6 text-center">
            <div className="inline-flex items-center justify-center w-32 h-32 rounded-full border-8 border-muted relative">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">${totalExpenses.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderCashFlowCard = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-success/10 border-success/20">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-success">
                ${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-sm text-muted-foreground">Ingresos</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-expense-red/10 border-expense-red/20">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-expense-red">
                ${totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-sm text-muted-foreground">Gastos</div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Card className={`${netFlow >= 0 ? 'bg-success/10 border-success/20' : 'bg-expense-red/10 border-expense-red/20'}`}>
        <CardContent className="p-4">
          <div className="text-center">
            <div className={`text-3xl font-bold ${netFlow >= 0 ? 'text-success' : 'text-expense-red'}`}>
              ${Math.abs(netFlow).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-sm text-muted-foreground">
              {netFlow >= 0 ? 'Superávit' : 'Déficit'}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderUpcomingPaymentsCard = () => {
    const upcomingPayments = scheduledPayments
      .filter(payment => payment.is_active && payment.next_payment_date)
      .filter(payment => {
        const paymentDate = new Date(payment.next_payment_date!)
        return isAfter(paymentDate, new Date()) && 
               isBefore(paymentDate, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) // Next 30 days
      })
      .sort((a, b) => new Date(a.next_payment_date!).getTime() - new Date(b.next_payment_date!).getTime())
      .slice(0, 5)

    return (
      <div className="space-y-4">
        {upcomingPayments.length > 0 ? (
          upcomingPayments.map((payment) => (
            <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <CreditCard className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{payment.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(payment.next_payment_date!).toLocaleDateString('es-ES', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-expense-red">
                  ${payment.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-muted-foreground">{payment.frequency_type}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-muted-foreground text-center py-4">No hay pagos próximos</p>
        )}
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full"
          onClick={() => navigate('/scheduled-payments')}
        >
          Ver Todos los Pagos
        </Button>
      </div>
    )
  }

  const renderCardManager = () => {
    const availableCards = [
      { id: 'overview', type: 'overview' as DashboardCardType, title: 'Resumen General' },
      { id: 'accounts', type: 'accounts' as DashboardCardType, title: 'Mis Cuentas' },
      { id: 'transactions', type: 'transactions' as DashboardCardType, title: 'Transacciones Recientes' },
      { id: 'expenses', type: 'expenses' as DashboardCardType, title: 'Estructura de Gastos' },
      { id: 'cash-flow', type: 'cash-flow' as DashboardCardType, title: 'Flujo de Efectivo' },
      { id: 'upcoming-payments', type: 'upcoming-payments' as DashboardCardType, title: 'Próximos Pagos' },
    ]

    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Selecciona qué tarjetas quieres mostrar en tu dashboard:
        </p>
        {availableCards.map((card) => {
          const currentCard = cards.find(c => c.id === card.id)
          const isVisible = currentCard?.visible ?? false
          
          return (
            <div key={card.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
              <span className="font-medium">{card.title}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleCardVisibility(card.id)}
                className="flex items-center gap-2"
              >
                {isVisible ? (
                  <>
                    <Eye className="w-4 h-4" />
                    Visible
                  </>
                ) : (
                  <>
                    <EyeOff className="w-4 h-4" />
                    Oculta
                  </>
                )}
              </Button>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-background min-h-screen">
      {/* Header with date filter */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Panel Financiero</h1>
          <p className="text-muted-foreground">Gestiona tus finanzas personales</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Date Range Filter */}
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange ? (
                    <>
                      {format(dateRange.from, "dd MMM", { locale: es })} -{" "}
                      {format(dateRange.to, "dd MMM", { locale: es })}
                    </>
                  ) : (
                    <span>Seleccionar periodo</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="p-4 space-y-3">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDateRange({
                        from: subDays(new Date(), 7),
                        to: new Date()
                      })}
                    >
                      7 días
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDateRange({
                        from: subDays(new Date(), 30),
                        to: new Date()
                      })}
                    >
                      30 días
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDateRange({
                        from: subDays(new Date(), 90),
                        to: new Date()
                      })}
                    >
                      90 días
                    </Button>
                  </div>
                  <Calendar
                    mode="range"
                    selected={{
                      from: dateRange.from,
                      to: dateRange.to
                    }}
                    onSelect={(range) => {
                      if (range?.from && range?.to) {
                        setDateRange({ from: range.from, to: range.to })
                      }
                    }}
                    numberOfMonths={2}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Card Manager */}
          <Dialog open={isCardManagerOpen} onOpenChange={setIsCardManagerOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Configurar Tarjetas
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Personalizar Dashboard</DialogTitle>
              </DialogHeader>
              {renderCardManager()}
            </DialogContent>
          </Dialog>

          {/* Add Transaction Button */}
          <Button 
            className="bg-primary hover:bg-primary/90"
            onClick={() => setIsAddTransactionOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Transacción
          </Button>
        </div>
      </div>

      {/* Draggable Dashboard Cards */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={sortedCards.map(card => card.id)} strategy={horizontalListSortingStrategy}>
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
                case 'cash-flow':
                  return (
                    <DashboardCard key={card.id} id={card.id} title={card.title}>
                      {renderCashFlowCard()}
                    </DashboardCard>
                  )
                case 'upcoming-payments':
                  return (
                    <DashboardCard key={card.id} id={card.id} title={card.title}>
                      {renderUpcomingPaymentsCard()}
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

      {/* Edit Transaction Modal */}
      <EditTransaction 
        open={isEditTransactionOpen} 
        onOpenChange={setIsEditTransactionOpen}
        transaction={selectedTransaction}
      />
    </div>
  )
}