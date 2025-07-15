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

// Mock data - this would come from Supabase in the real app
const mockAccounts = [
  { id: 1, name: "Cuenta Principal", type: "bank", balance: 9216.50, currency: "USD", icon: Building2, color: "expense-blue" },
  { id: 2, name: "Ahorros", type: "savings", balance: 26600, currency: "USD", icon: PiggyBank, color: "expense-green" },
  { id: 3, name: "Tarjeta de Crédito", type: "credit", balance: -1485, currency: "USD", icon: CreditCard, color: "expense-red" },
]

const mockTransactions = [
  { id: 1, description: "Supermercado", amount: -87.54, category: "Alimentación", date: "Mar 3", color: "expense-red" },
  { id: 2, description: "Salario", amount: 2500.00, category: "Ingresos", date: "Mar 1", color: "expense-green" },
  { id: 3, description: "Netflix", amount: -15.99, category: "Entretenimiento", date: "Feb 28", color: "expense-purple" },
]

const mockExpenses = [
  { category: "Alimentación", amount: 1580.59, percentage: 35, color: "expense-red" },
  { category: "Transporte", amount: 995, percentage: 22, color: "expense-orange" },
  { category: "Entretenimiento", amount: 654, percentage: 15, color: "expense-purple" },
  { category: "Compras", amount: 440, percentage: 10, color: "expense-blue" },
  { category: "Otros", amount: 880, percentage: 18, color: "expense-cyan" },
]

export function Dashboard() {
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false)
  const totalBalance = mockAccounts.reduce((sum, account) => sum + account.balance, 0)
  const totalExpenses = mockExpenses.reduce((sum, expense) => sum + expense.amount, 0)

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

      {/* Balance Overview */}
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

      {/* Accounts and Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Accounts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Mis Cuentas</span>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockAccounts.map((account) => (
              <div key={account.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg bg-${account.color}/20`}>
                    <account.icon className={`w-5 h-5 text-${account.color}`} />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{account.name}</p>
                    <p className="text-sm text-muted-foreground capitalize">{account.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${account.balance >= 0 ? 'text-success' : 'text-expense-red'}`}>
                    {account.balance >= 0 ? '+' : ''}${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-muted-foreground">{account.currency}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Transacciones Recientes</span>
              <Button variant="outline" size="sm">Ver Todas</Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg bg-${transaction.color}/20`}>
                    <DollarSign className={`w-4 h-4 text-${transaction.color}`} />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{transaction.description}</p>
                    <p className="text-sm text-muted-foreground">{transaction.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${transaction.amount >= 0 ? 'text-success' : 'text-foreground'}`}>
                    {transaction.amount >= 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground">{transaction.date}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Expense Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Estructura de Gastos - Últimos 30 Días</CardTitle>
        </CardHeader>
        <CardContent>
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
          </div>
          <div className="mt-6 text-center">
            <div className="inline-flex items-center justify-center w-32 h-32 rounded-full border-8 border-muted relative">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">${totalExpenses.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Transaction Modal */}
      <AddTransaction 
        open={isAddTransactionOpen} 
        onOpenChange={setIsAddTransactionOpen} 
      />
    </div>
  )
}