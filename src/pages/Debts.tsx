import { useState, useEffect, useRef, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { Search, Plus, Loader2 } from "lucide-react"
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
import { SelectTransactionDialog } from "@/components/debts/SelectTransactionDialog"
import { FloatingActionButton } from "@/components/shared/FloatingActionButton"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

export default function Debts() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"active" | "closed">("active")
  const [isAddDebtOpen, setIsAddDebtOpen] = useState(false)
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false)
  const [isSelectTransactionOpen, setIsSelectTransactionOpen] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null)
  const [displayedDebtsCount, setDisplayedDebtsCount] = useState(20)
  const [displayedLoansCount, setDisplayedLoansCount] = useState(20)
  const [isLoadingMoreDebts, setIsLoadingMoreDebts] = useState(false)
  const [isLoadingMoreLoans, setIsLoadingMoreLoans] = useState(false)

  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const { debts, loading } = useDebts()
  const { contacts } = useContacts()
  const { accounts } = useSettings()
  const isMobile = useIsMobile()
  const debtsSentinelRef = useRef<HTMLDivElement>(null)
  const loansSentinelRef = useRef<HTMLDivElement>(null)

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

  // Paginated lists
  const displayedDebts = myDebts.slice(0, displayedDebtsCount)
  const displayedLoans = myLoans.slice(0, displayedLoansCount)
  const hasMoreDebts = displayedDebtsCount < myDebts.length
  const hasMoreLoans = displayedLoansCount < myLoans.length

  // Reset pagination when filters change
  useEffect(() => {
    setDisplayedDebtsCount(20)
    setDisplayedLoansCount(20)
  }, [searchTerm, statusFilter])

  const handleAddPayment = (debt: Debt) => {
    setSelectedDebt(debt)
    setIsAddPaymentOpen(true)
  }

  const handleSelectTransaction = (debt: Debt) => {
    setSelectedDebt(debt)
    setIsSelectTransactionOpen(true)
  }

  const handleViewHistory = (debt: Debt) => {
    setSelectedDebt(debt)
    setIsHistoryOpen(true)
  }

  // Load more functions
  const loadMoreDebts = useCallback(() => {
    if (hasMoreDebts && !isLoadingMoreDebts) {
      setIsLoadingMoreDebts(true)
      setTimeout(() => {
        setDisplayedDebtsCount(prev => prev + 20)
        setIsLoadingMoreDebts(false)
      }, 500)
    }
  }, [hasMoreDebts, isLoadingMoreDebts])

  const loadMoreLoans = useCallback(() => {
    if (hasMoreLoans && !isLoadingMoreLoans) {
      setIsLoadingMoreLoans(true)
      setTimeout(() => {
        setDisplayedLoansCount(prev => prev + 20)
        setIsLoadingMoreLoans(false)
      }, 500)
    }
  }, [hasMoreLoans, isLoadingMoreLoans])

  // Intersection Observers for infinite scroll
  useEffect(() => {
    const debtsObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreDebts && !isLoadingMoreDebts) {
          loadMoreDebts()
        }
      },
      { threshold: 0.1 }
    )

    if (debtsSentinelRef.current) {
      debtsObserver.observe(debtsSentinelRef.current)
    }

    return () => {
      if (debtsSentinelRef.current) {
        debtsObserver.unobserve(debtsSentinelRef.current)
      }
    }
  }, [loadMoreDebts, hasMoreDebts, isLoadingMoreDebts])

  useEffect(() => {
    const loansObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreLoans && !isLoadingMoreLoans) {
          loadMoreLoans()
        }
      },
      { threshold: 0.1 }
    )

    if (loansSentinelRef.current) {
      loansObserver.observe(loansSentinelRef.current)
    }

    return () => {
      if (loansSentinelRef.current) {
        loansObserver.unobserve(loansSentinelRef.current)
      }
    }
  }, [loadMoreLoans, hasMoreLoans, isLoadingMoreLoans])

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
      <div className={cn("container mx-auto space-y-6", isMobile ? "w-full max-w-none px-0" : "")}>
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
            
            {/* New Debt Button - Hide on mobile */}
            {!isMobile && (
              <Button onClick={() => setIsAddDebtOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Deuda
              </Button>
            )}
          </div>
        </div>

        {/* Status Filter */}
        <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as "active" | "closed")}>
          <TabsList>
            <TabsTrigger value="active">ACTIVO</TabsTrigger>
            <TabsTrigger value="closed">CERRADO</TabsTrigger>
          </TabsList>

          <TabsContent value={statusFilter} className={cn(isMobile ? "space-y-6 w-full" : "space-y-6")}>
            <div className={cn(isMobile ? "space-y-6 w-full" : "grid gap-6 grid-cols-1 lg:grid-cols-2")}>
              {/* Debts Section */}
              <div className={cn("space-y-4", isMobile ? "w-full" : "")}>
                <h2 className="text-xl font-semibold text-red-600">Me prestaron</h2>
                {myDebts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No tienes deudas {statusFilter === 'active' ? 'activas' : 'cerradas'}
                  </div>
                ) : (
                  <div className={cn("space-y-3", isMobile ? "w-full" : "grid grid-cols-1 gap-3")}>
                    {displayedDebts.map((debt) => (
                      <DebtCard
                        key={debt.id}
                        debt={debt}
                        onAddPayment={() => handleAddPayment(debt)}
                        onSelectTransaction={() => handleSelectTransaction(debt)}
                        onViewHistory={() => handleViewHistory(debt)}
                      />
                    ))}
                    {hasMoreDebts && (
                      <div ref={debtsSentinelRef} className="flex justify-center py-4">
                        {isLoadingMoreDebts && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Cargando más deudas...</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Loans Section */}
              <div className={cn("space-y-4", isMobile ? "w-full" : "")}>
                <h2 className="text-xl font-semibold text-green-600">Prestó</h2>
                {myLoans.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No tienes préstamos {statusFilter === 'active' ? 'activos' : 'cerrados'}
                  </div>
                ) : (
                  <div className={cn("space-y-3", isMobile ? "w-full" : "grid grid-cols-1 gap-3")}>
                    {displayedLoans.map((debt) => (
                      <DebtCard
                        key={debt.id}
                        debt={debt}
                        onAddPayment={() => handleAddPayment(debt)}
                        onSelectTransaction={() => handleSelectTransaction(debt)}
                        onViewHistory={() => handleViewHistory(debt)}
                      />
                    ))}
                    {hasMoreLoans && (
                      <div ref={loansSentinelRef} className="flex justify-center py-4">
                        {isLoadingMoreLoans && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Cargando más préstamos...</span>
                          </div>
                        )}
                      </div>
                    )}
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

            <SelectTransactionDialog
              open={isSelectTransactionOpen}
              onOpenChange={setIsSelectTransactionOpen}
              debt={selectedDebt}
            />

            <DebtHistoryDialog
              open={isHistoryOpen}
              onOpenChange={setIsHistoryOpen}
              debt={selectedDebt}
            />
          </>
        )}
      </div>

      <FloatingActionButton 
        onClick={() => setIsAddDebtOpen(true)}
      />
    </Layout>
  )
}
