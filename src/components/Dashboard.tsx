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
import { format, subDays, isAfter, isBefore, isEqual, subMonths, startOfMonth, endOfMonth } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useNavigate } from "react-router-dom"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TransactionItem } from "@/components/shared/TransactionItem"
import { useIsMobile } from "@/hooks/use-mobile"

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
  | 'expenses-by-tag'
  | 'balance-per-account'
  | 'upcoming-payments'
  | 'income-expense-table'

interface DateRange {
  from: Date
  to: Date
}

export function Dashboard() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false)
  const [isEditTransactionOpen, setIsEditTransactionOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null)
  const [isCardManagerOpen, setIsCardManagerOpen] = useState(false)
  
  // Date range filter state
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date()
  })
  
  const { transactions, cards, updateCardPosition, toggleCardVisibility, saveCardPreferences } = useTransactions()
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
      <div className="grid grid-cols-4 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        {accounts.map((account) => (
          <Card 
            key={account.id} 
            className="p-3 md:p-6 hover:shadow-lg transition-all duration-200 cursor-pointer relative overflow-hidden min-h-[80px] md:min-h-[120px] border-none"
            style={{
              backgroundColor: account.color || '#6b7280'
            }}
            onClick={() => navigate(`/settings?tab=accounts&edit=${account.id}`)}
          >
            <div className="text-center space-y-1 md:space-y-3 relative z-10">
              <div>
                <p className="font-semibold text-sm md:text-lg truncate text-white drop-shadow-sm">
                  {account.name}
                </p>
              </div>
              <div className="pt-1 md:pt-2">
                <p className="font-bold text-sm md:text-xl text-white drop-shadow-sm">
                  {account.balance >= 0 ? '+' : ''}${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs md:text-sm text-white/90 drop-shadow-sm">USD</p>
              </div>
            </div>
          </Card>
        ))}
        <Card className="p-3 md:p-6 border-dashed border-2 hover:border-primary/50 transition-colors cursor-pointer min-h-[80px] md:min-h-[120px]" onClick={() => navigate('/settings?tab=accounts&add=true')}>
          <div className="text-center space-y-1 md:space-y-3 h-full flex flex-col justify-center">
            <div className="mx-auto p-2 md:p-3 rounded-lg bg-muted w-fit">
              <Plus className="w-4 h-4 md:w-6 md:h-6 text-muted-foreground" />
            </div>
            <p className="text-sm md:text-base text-muted-foreground">Agregar Cuenta</p>
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
          recentTransactions.map((transaction) => (
            <TransactionItem
              key={transaction.id}
              transaction={transaction}
              onEdit={(transaction) => {
                setSelectedTransaction(transaction);
                setIsEditTransactionOpen(true);
              }}
            />
          ))
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

  // Nueva tarjeta: Tendencias de Saldo
  const renderBalanceTrendsCard = () => {
    // Generar datos de los últimos 30 días
    const days = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), 29 - i)
      
      // Calcular balance acumulado hasta esa fecha
      const transactionsUntilDate = transactions.filter(t => 
        new Date(t.transaction_date) <= date
      )
      
      const balance = transactionsUntilDate.reduce((sum, t) => sum + t.amount, 0)
      
      return {
        date: format(date, 'dd/MM'),
        balance: balance + accounts.reduce((sum, acc) => sum + acc.balance, 0) - transactions.reduce((sum, t) => sum + t.amount, 0)
      }
    })

    return (
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={days}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="date" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip 
              formatter={(value: number) => [`$${value.toFixed(2)}`, 'Balance']}
              labelFormatter={(label) => `Fecha: ${label}`}
            />
            <Line 
              type="monotone" 
              dataKey="balance" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    )
  }

  // Nueva tarjeta: Comparación de Periodo
  const renderPeriodComparisonCard = () => {
    const currentPeriod = { from: dateRange.from, to: dateRange.to }
    const periodDuration = Math.abs(dateRange.to.getTime() - dateRange.from.getTime())
    const previousPeriod = {
      from: new Date(dateRange.from.getTime() - periodDuration),
      to: dateRange.from
    }

    const getCurrentPeriodData = () => {
      const transactions = filteredTransactions
      const income = transactions.filter(t => t.amount > 0 && t.type !== 'transfer').reduce((sum, t) => sum + t.amount, 0)
      const expenses = Math.abs(transactions.filter(t => t.amount < 0 && t.type !== 'transfer').reduce((sum, t) => sum + Math.abs(t.amount), 0))
      return { income, expenses, netFlow: income - expenses }
    }

    const getPreviousPeriodData = () => {
      const previousTransactions = transactions.filter(transaction => {
        const transactionDate = new Date(transaction.transaction_date)
        return transactionDate >= previousPeriod.from && transactionDate <= previousPeriod.to
      })
      const income = previousTransactions.filter(t => t.amount > 0 && t.type !== 'transfer').reduce((sum, t) => sum + t.amount, 0)
      const expenses = Math.abs(previousTransactions.filter(t => t.amount < 0 && t.type !== 'transfer').reduce((sum, t) => sum + Math.abs(t.amount), 0))
      return { income, expenses, netFlow: income - expenses }
    }

    const current = getCurrentPeriodData()
    const previous = getPreviousPeriodData()

    const comparisonData = [
      {
        name: 'Periodo Anterior',
        flujo: previous.netFlow,
        ingresos: previous.income,
        gastos: previous.expenses
      },
      {
        name: 'Periodo Actual',
        flujo: current.netFlow,
        ingresos: current.income,
        gastos: current.expenses
      }
    ]

    return (
      <div className="space-y-4">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
              <Legend />
              <Bar dataKey="ingresos" fill="hsl(var(--success))" name="Ingresos" />
              <Bar dataKey="gastos" fill="hsl(var(--expense-red))" name="Gastos" />
              <Bar dataKey="flujo" fill="hsl(var(--primary))" name="Flujo Neto" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-muted-foreground">Cambio en Flujo</p>
            <p className={`font-bold ${current.netFlow >= previous.netFlow ? 'text-success' : 'text-expense-red'}`}>
              ${(current.netFlow - previous.netFlow).toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Cambio en Ingresos</p>
            <p className={`font-bold ${current.income >= previous.income ? 'text-success' : 'text-expense-red'}`}>
              ${(current.income - previous.income).toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Cambio en Gastos</p>
            <p className={`font-bold ${current.expenses <= previous.expenses ? 'text-success' : 'text-expense-red'}`}>
              ${(current.expenses - previous.expenses).toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Nueva tarjeta: Ingresos vs. Gastos por Etiqueta
  const renderIncomeExpenseByTagCard = () => {
    const tagData = tags.map(tag => {
      const tagTransactions = filteredTransactions.filter(t => 
        t.tags && t.tags.includes(tag.id) && t.type !== 'transfer'
      )
      
      const income = tagTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0)
      const expenses = Math.abs(tagTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0))
      
      return {
        name: tag.name,
        ingresos: income,
        gastos: expenses,
        neto: income - expenses
      }
    }).filter(item => item.ingresos > 0 || item.gastos > 0)
    .sort((a, b) => Math.abs(b.neto) - Math.abs(a.neto))
    .slice(0, 8)

    return (
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={tagData} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis type="number" className="text-xs" />
            <YAxis dataKey="name" type="category" width={100} className="text-xs" />
            <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
            <Legend />
            <Bar dataKey="ingresos" fill="hsl(var(--success))" name="Ingresos" />
            <Bar dataKey="gastos" fill="hsl(var(--expense-red))" name="Gastos" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  // Nueva tarjeta: Gastos por Etiqueta
  const renderExpensesByTagCard = () => {
    const expensesByTag = tags.map(tag => {
      const tagExpenses = filteredTransactions
        .filter(t => t.tags && t.tags.includes(tag.id) && t.amount < 0 && t.type !== 'transfer')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0)
      
      return {
        tag: tag.name,
        amount: tagExpenses,
        percentage: totalExpenses > 0 ? (tagExpenses / totalExpenses) * 100 : 0,
        color: tag.color || 'hsl(var(--expense-red))'
      }
    }).filter(item => item.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10)

    return (
      <div className="space-y-4">
        {expensesByTag.length > 0 ? (
          expensesByTag.map((expense, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: expense.color }}
                  ></div>
                  <span className="font-medium text-foreground">{expense.tag}</span>
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
          <p className="text-muted-foreground text-center py-4">No hay gastos por etiquetas en el periodo</p>
        )}
      </div>
    )
  }

  // Nueva tarjeta: Saldo Por Cuenta
  const renderBalancePerAccountCard = () => {
    const accountsWithTransactions = accounts.map(account => {
      const accountTransactions = filteredTransactions.filter(t => t.account_id === account.id)
      const periodBalance = accountTransactions.reduce((sum, t) => sum + t.amount, 0)
      
      return {
        ...account,
        periodBalance,
        transactionCount: accountTransactions.length
      }
    }).sort((a, b) => b.balance - a.balance)

    return (
      <div className="space-y-4">
        {accountsWithTransactions.map((account) => (
          <div key={account.id} className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
            <div className="flex items-center space-x-3">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: account.color }}
              ></div>
              <div>
                <p className="font-medium text-foreground">{account.name}</p>
                <p className="text-sm text-muted-foreground">
                  {account.transactionCount} transacciones en el periodo
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={`font-bold text-lg ${account.balance >= 0 ? 'text-success' : 'text-expense-red'}`}>
                ${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <p className={`text-sm ${account.periodBalance >= 0 ? 'text-success' : 'text-expense-red'}`}>
                {account.periodBalance >= 0 ? '+' : ''}${account.periodBalance.toFixed(2)} en periodo
              </p>
            </div>
          </div>
        ))}
        
        <div className="mt-4 p-4 rounded-lg bg-primary/10 border border-primary/20">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Balance Total</p>
            <p className="text-2xl font-bold text-primary">
              ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Nueva tarjeta: Tabla Ingresos y Gastos
  const renderIncomeExpenseTableCard = () => {
    const tableData = tags.map(tag => {
      const tagTransactions = filteredTransactions.filter(t => 
        t.tags && t.tags.includes(tag.id) && t.type !== 'transfer'
      )
      
      const income = tagTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0)
      const expenses = Math.abs(tagTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0))
      const net = income - expenses
      const transactionCount = tagTransactions.length
      
      return {
        tag: tag.name,
        income,
        expenses,
        net,
        transactionCount,
        color: tag.color
      }
    }).filter(item => item.transactionCount > 0)
    .sort((a, b) => Math.abs(b.net) - Math.abs(a.net))

    return (
      <div className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Etiqueta</TableHead>
              <TableHead className="text-right">Ingresos</TableHead>
              <TableHead className="text-right">Gastos</TableHead>
              <TableHead className="text-right">Neto</TableHead>
              <TableHead className="text-right">Transacciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableData.map((row, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: row.color || 'hsl(var(--muted))' }}
                    ></div>
                    <span>{row.tag}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right text-success">
                  ${row.income.toFixed(2)}
                </TableCell>
                <TableCell className="text-right text-expense-red">
                  ${row.expenses.toFixed(2)}
                </TableCell>
                <TableCell className={`text-right font-bold ${row.net >= 0 ? 'text-success' : 'text-expense-red'}`}>
                  {row.net >= 0 ? '+' : ''}${row.net.toFixed(2)}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {row.transactionCount}
                </TableCell>
              </TableRow>
            ))}
            {tableData.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No hay datos para mostrar en el periodo seleccionado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        
        {tableData.length > 0 && (
          <div className="flex justify-between items-center pt-4 border-t">
            <span className="text-sm font-medium text-muted-foreground">Totales:</span>
            <div className="flex space-x-6 text-sm">
              <span className="text-success">
                Ingresos: ${tableData.reduce((sum, row) => sum + row.income, 0).toFixed(2)}
              </span>
              <span className="text-expense-red">
                Gastos: ${tableData.reduce((sum, row) => sum + row.expenses, 0).toFixed(2)}
              </span>
              <span className={`font-bold ${(tableData.reduce((sum, row) => sum + row.net, 0)) >= 0 ? 'text-success' : 'text-expense-red'}`}>
                Neto: ${tableData.reduce((sum, row) => sum + row.net, 0).toFixed(2)}
              </span>
            </div>
          </div>
        )}
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
      { id: 'balance-trends', type: 'balance-trends' as DashboardCardType, title: 'Tendencias de Saldo' },
      { id: 'period-comparison', type: 'period-comparison' as DashboardCardType, title: 'Comparación de Periodo' },
      { id: 'income-expense-by-tag', type: 'income-expense-by-tag' as DashboardCardType, title: 'Ingresos vs. Gastos por Etiqueta' },
      { id: 'expenses-by-tag', type: 'expenses-by-tag' as DashboardCardType, title: 'Gastos por Etiqueta' },
      { id: 'balance-per-account', type: 'balance-per-account' as DashboardCardType, title: 'Saldo Por Cuenta' },
      { id: 'income-expense-table', type: 'income-expense-table' as DashboardCardType, title: 'Tabla Ingresos y Gastos' },
    ]

    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Selecciona qué tarjetas quieres mostrar en tu dashboard:
        </p>
        
        <ScrollArea className="h-60">
          <div className="space-y-3 pr-4">
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
        </ScrollArea>
        
        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t">
          <Button 
            onClick={async () => {
              await saveCardPreferences();
              setIsCardManagerOpen(false);
            }}
            className="bg-primary hover:bg-primary/90"
          >
            Guardar Configuración
          </Button>
        </div>
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
            <DialogContent className="max-w-md max-h-[80vh] flex flex-col overflow-hidden">
              <DialogHeader className="flex-shrink-0">
                <DialogTitle>Personalizar Dashboard</DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-hidden">
                {renderCardManager()}
              </div>
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
          <div className={cn("space-y-6", isMobile ? "w-full" : "")}>
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
                case 'balance-trends':
                  return (
                    <DashboardCard key={card.id} id={card.id} title={card.title}>
                      {renderBalanceTrendsCard()}
                    </DashboardCard>
                  )
                case 'period-comparison':
                  return (
                    <DashboardCard key={card.id} id={card.id} title={card.title}>
                      {renderPeriodComparisonCard()}
                    </DashboardCard>
                  )
                case 'income-expense-by-tag':
                  return (
                    <DashboardCard key={card.id} id={card.id} title={card.title}>
                      {renderIncomeExpenseByTagCard()}
                    </DashboardCard>
                  )
                case 'expenses-by-tag':
                  return (
                    <DashboardCard key={card.id} id={card.id} title={card.title}>
                      {renderExpensesByTagCard()}
                    </DashboardCard>
                  )
                case 'balance-per-account':
                  return (
                    <DashboardCard key={card.id} id={card.id} title={card.title}>
                      {renderBalancePerAccountCard()}
                    </DashboardCard>
                  )
                case 'income-expense-table':
                  return (
                    <DashboardCard key={card.id} id={card.id} title={card.title}>
                      {renderIncomeExpenseTableCard()}
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