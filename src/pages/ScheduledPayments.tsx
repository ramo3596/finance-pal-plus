import { useState, useEffect, useRef, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Search, Plus, Calendar, User, DollarSign, ArrowUpDown, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Layout } from "@/components/Layout"
import { useAuth } from "@/hooks/useAuth"
import { useScheduledPayments } from "@/hooks/useScheduledPayments"
import { ScheduledPaymentDetail } from "@/components/scheduled-payments/ScheduledPaymentDetail"
import { AddScheduledPaymentDialog } from "@/components/scheduled-payments/AddScheduledPaymentDialog"
import { EditScheduledPaymentDialog } from "@/components/scheduled-payments/EditScheduledPaymentDialog"
import { FloatingActionButton } from "@/components/shared/FloatingActionButton"
import { useIsMobile } from "@/hooks/use-mobile"
import { formatAmount } from "@/lib/utils"
import type { ScheduledPayment } from "@/hooks/useScheduledPayments"

const ScheduledPayments = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense' | 'transfer'>('all');
  const [selectedPayment, setSelectedPayment] = useState<ScheduledPayment | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [displayedCount, setDisplayedCount] = useState(15);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { scheduledPayments, loading, deleteScheduledPayment } = useScheduledPayments();
  const isMobile = useIsMobile();
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const filteredPayments = scheduledPayments.filter(payment => {
    const matchesSearch = payment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (payment.description && payment.description.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesType = filterType === 'all' || payment.type === filterType
    return matchesSearch && matchesType
  })

  const displayedPayments = filteredPayments.slice(0, displayedCount)
  const hasMore = displayedCount < filteredPayments.length

  // Reset pagination when filters change
  useEffect(() => {
    setDisplayedCount(15)
  }, [searchTerm, filterType])

  // Load more function
  const loadMore = useCallback(() => {
    if (hasMore && !isLoadingMore) {
      setIsLoadingMore(true)
      setTimeout(() => {
        setDisplayedCount(prev => prev + 15)
        setIsLoadingMore(false)
      }, 500)
    }
  }, [hasMore, isLoadingMore])

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current)
    }

    return () => {
      if (sentinelRef.current) {
        observer.unobserve(sentinelRef.current)
      }
    }
  }, [loadMore, hasMore, isLoadingMore]);

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'income': return 'Ingresos';
      case 'expense': return 'Gasto';
      case 'transfer': return 'Transferencia';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'income': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'expense': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'transfer': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getFrequencyLabel = (payment: any) => {
    if (payment.frequency_type === 'once') {
      return 'Una vez';
    } else {
      const pattern = payment.recurrence_pattern || 'monthly';
      const interval = payment.recurrence_interval || 1;
      
      switch (pattern) {
        case 'daily':
          return interval === 1 ? 'Diariamente' : `Cada ${interval} días`;
        case 'weekly':
          return interval === 1 ? 'Semanalmente' : `Cada ${interval} semanas`;
        case 'monthly':
          return interval === 1 ? 'Mensualmente' : `Cada ${interval} meses`;
        case 'yearly':
          return interval === 1 ? 'Anualmente' : `Cada ${interval} años`;
        default:
          return 'Recurrente';
      }
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handlePaymentClick = (payment: ScheduledPayment) => {
    setSelectedPayment(payment);
  };

  const handleBackToList = () => {
    setSelectedPayment(null);
  };

  const handleEditPayment = () => {
    setIsEditDialogOpen(true);
  };

  const handleEditDialogClose = (open: boolean) => {
    setIsEditDialogOpen(open);
    if (!open) {
      // Refresh the current payment data when closing edit dialog
      const updatedPayment = scheduledPayments.find(p => p.id === selectedPayment?.id);
      if (updatedPayment) {
        setSelectedPayment(updatedPayment);
      }
    }
  };

  const handleDeletePayment = async () => {
    if (selectedPayment) {
      try {
        await deleteScheduledPayment(selectedPayment.id);
        setSelectedPayment(null);
      } catch (error) {
        console.error('Error deleting payment:', error);
      }
    }
  };

  // If a payment is selected, show detail view
  if (selectedPayment) {
    return (
      <Layout>
        <ScheduledPaymentDetail
          payment={selectedPayment}
          onBack={handleBackToList}
          onEdit={handleEditPayment}
          onDelete={handleDeletePayment}
        />
        
        {/* Edit Scheduled Payment Dialog - Also available in detail view */}
        <EditScheduledPaymentDialog 
          open={isEditDialogOpen} 
          onOpenChange={handleEditDialogClose}
          payment={selectedPayment}
        />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold text-foreground">Pagos programados</h1>
          {!isMobile && (
            <Button onClick={() => setIsAddDialogOpen(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Añadir Pago Programado
            </Button>
          )}
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar pagos programados..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Sort button */}
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4" />
            Ordenar
          </Button>

          {/* Type filters */}
          <div className="flex gap-2">
            {[
              { key: 'all', label: 'Todos' },
              { key: 'income', label: 'Ingresos' },
              { key: 'expense', label: 'Gasto' },
              { key: 'transfer', label: 'Transferencia' },
            ].map((filter) => (
              <Button
                key={filter.key}
                variant={filterType === filter.key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType(filter.key as any)}
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Payments List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Cargando pagos programados...</p>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No se encontraron pagos programados</p>
            </div>
          ) : (
            <>
              {displayedPayments.map((payment) => (
              <Card 
                key={payment.id} 
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handlePaymentClick(payment)}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    {/* Left side - Main info */}
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">{payment.name}</h3>
                        <Badge className={getTypeColor(payment.type)}>
                          {getTypeLabel(payment.type)}
                        </Badge>
                      </div>
                      
                      {payment.description && (
                        <p className="text-muted-foreground text-sm">{payment.description}</p>
                      )}

                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        {/* Category */}
                        {payment.category_name && (
                          <div className="flex items-center gap-1">
                            <span className="text-lg">{payment.category_icon}</span>
                            <span>{payment.category_name}</span>
                          </div>
                        )}

                        {/* Frequency */}
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{getFrequencyLabel(payment)}</span>
                        </div>

                        {/* Contact */}
                        {payment.contact_name && (
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            <span>{payment.contact_name}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right side - Amount and date */}
                    <div className="text-right space-y-1">
                      <div className="flex items-center gap-1 justify-end">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold text-lg">
                          {formatAmount(payment.amount)}
                        </span>
                      </div>
                      {payment.next_payment_date && (
                        <p className="text-sm text-muted-foreground">
                          Próximo: {format(new Date(payment.next_payment_date), 'dd/MM/yyyy', { locale: es })}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
              
              {/* Sentinel element for infinite scroll */}
              {hasMore && (
                <div ref={sentinelRef} className="flex justify-center py-4">
                  {isLoadingMore && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Cargando más pagos...</span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Add Scheduled Payment Dialog */}
        <AddScheduledPaymentDialog 
          open={isAddDialogOpen} 
          onOpenChange={setIsAddDialogOpen}
        />

        {/* Edit Scheduled Payment Dialog */}
        <EditScheduledPaymentDialog 
          open={isEditDialogOpen} 
          onOpenChange={handleEditDialogClose}
          payment={selectedPayment}
        />

        <FloatingActionButton 
          onClick={() => setIsAddDialogOpen(true)}
        />
      </div>
    </Layout>
  );
};

export default ScheduledPayments;