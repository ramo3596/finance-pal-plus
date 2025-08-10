import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Search, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Layout } from "@/components/Layout"
import { useAuth } from "@/hooks/useAuth"
import { useDebts, type Debt } from "@/hooks/useDebts"
import { useContacts } from "@/hooks/useContacts"
import { useSettings } from "@/hooks/useSettings"
import { DebtCard } from "@/components/debts/DebtCard"
import { AddDebtDialog } from "@/components/debts/AddDebtDialog"
import { AddPaymentDialog } from "@/components/debts/AddPaymentDialog"
import { DebtHistoryDialog } from "@/components/debts/DebtHistoryDialog"

export default function Debts() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"active" | "closed">("active")
  const [isAddDebtOpen, setIsAddDebtOpen] = useState(false)
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null)

  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const { debts, loading } = useDebts()
  const { contacts } = useContacts()
  const { accounts } = useSettings()

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth")
    }
  }, [user, authLoading, navigate])

  // Filter debts based on search and status
  const filteredDebts = debts.filter(debt => {
    const matchesSearch = debt.contacts?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         debt.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = debt.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Separate debts and loans
  const myDebts = filteredDebts.filter(debt => debt.type === 'debt')
  const myLoans = filteredDebts.filter(debt => debt.type === 'loan')

  const handleAddPayment = (debt: Debt) => {
    setSelectedDebt(debt)
    setIsAddPaymentOpen(true)
  }

  const handleViewHistory = (debt: Debt) => {
    setSelectedDebt(debt)
    setIsHistoryOpen(true)
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Cargando deudas...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <Layout>
      <div className="container mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center md:space-y-0">
          <h1 className="text-3xl font-bold">Deudas</h1>
          
          <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar deudas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full md:w-64"
              />
            </div>
            
            {/* New Debt Button */}
            <Button onClick={() => setIsAddDebtOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Deuda
            </Button>
          </div>
        </div>

        {/* Status Filter */}
        <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as "active" | "closed")}>
          <TabsList>
            <TabsTrigger value="active">ACTIVO</TabsTrigger>
            <TabsTrigger value="closed">CERRADO</TabsTrigger>
          </TabsList>

          <TabsContent value={statusFilter} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Debts Section */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-red-600">Deudas</h2>
                {myDebts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No tienes deudas {statusFilter === 'active' ? 'activas' : 'cerradas'}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myDebts.map((debt) => (
                      <DebtCard
                        key={debt.id}
                        debt={debt}
                        onAddPayment={() => handleAddPayment(debt)}
                        onViewHistory={() => handleViewHistory(debt)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Loans Section */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-green-600">Préstamos</h2>
                {myLoans.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No tienes préstamos {statusFilter === 'active' ? 'activos' : 'cerrados'}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myLoans.map((debt) => (
                      <DebtCard
                        key={debt.id}
                        debt={debt}
                        onAddPayment={() => handleAddPayment(debt)}
                        onViewHistory={() => handleViewHistory(debt)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <AddDebtDialog
          open={isAddDebtOpen}
          onOpenChange={setIsAddDebtOpen}
          contacts={contacts}
          accounts={accounts}
        />

        {selectedDebt && (
          <>
            <AddPaymentDialog
              open={isAddPaymentOpen}
              onOpenChange={setIsAddPaymentOpen}
              debt={selectedDebt}
              accounts={accounts}
            />

            <DebtHistoryDialog
              open={isHistoryOpen}
              onOpenChange={setIsHistoryOpen}
              debt={selectedDebt}
            />
          </>
        )}
      </div>
    </Layout>
  )
}