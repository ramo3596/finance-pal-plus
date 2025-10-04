import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Edit, Trash2, Check, Calendar, User, DollarSign, Clock, AlertCircle } from 'lucide-react';
import { format, addDays, addWeeks, addMonths, addYears, differenceInDays, isBefore, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';
import { ScheduledPayment, useScheduledPayments } from '@/hooks/useScheduledPayments';
import { useTransactions } from '@/hooks/useTransactions';
import { useSettings } from '@/hooks/useSettings';
import { EditScheduledPaymentDialog } from './EditScheduledPaymentDialog';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ScheduledPaymentDetailProps {
  payment: ScheduledPayment;
  onBack: () => void;
  onDelete: () => void;
}

interface PaymentOccurrence {
  id: string;
  date: Date;
  status: 'pending' | 'paid' | 'deleted';
  paidDate?: Date;
  amount: number;
}

export const ScheduledPaymentDetail = ({ payment, onBack, onDelete }: ScheduledPaymentDetailProps) => {
  const [occurrences, setOccurrences] = useState<PaymentOccurrence[]>([]);
  const [confirmedPayments, setConfirmedPayments] = useState<Map<string, Date>>(new Map());
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { updateScheduledPayment } = useScheduledPayments();
  const { createTransaction } = useTransactions();
  const { tags } = useSettings();

  // Load confirmed payments from database
  useEffect(() => {
    const loadConfirmedPayments = async () => {
      try {
        const { data, error } = await supabase
          .from('transactions')
          .select('scheduled_occurrence_date')
          .eq('scheduled_payment_id', payment.id)
          .not('scheduled_occurrence_date', 'is', null);

        if (error) throw error;

        const paymentsMap = new Map<string, Date>();
        data?.forEach((transaction) => {
          if (transaction.scheduled_occurrence_date) {
            const occurrenceDate = new Date(transaction.scheduled_occurrence_date);
            const occurrenceId = `${payment.id}-${format(occurrenceDate, 'yyyy-MM-dd')}`;
            paymentsMap.set(occurrenceId, occurrenceDate);
          }
        });

        setConfirmedPayments(paymentsMap);
      } catch (error) {
        console.error('Error loading confirmed payments:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConfirmedPayments();
  }, [payment.id]);

  // Generate payment occurrences based on recurrence pattern
  const generateOccurrences = () => {
    const occurrences: PaymentOccurrence[] = [];
    const startDate = new Date(payment.start_date);
    const today = new Date();
    let currentDate = new Date(startDate);
    let count = 0;
    const maxOccurrences = payment.end_type === 'count' ? payment.end_count || 12 : 12;
    const endDate = payment.end_type === 'date' && payment.end_date ? new Date(payment.end_date) : addYears(today, 1);

    // Generate past and future occurrences
    while (count < maxOccurrences && (payment.end_type !== 'date' || isBefore(currentDate, endDate))) {
      const occurrenceId = `${payment.id}-${format(currentDate, 'yyyy-MM-dd')}`;
      
      // Determine status based on confirmed payments from database
      let status: 'pending' | 'paid' | 'deleted' = 'pending';
      let paidDate: Date | undefined = undefined;
      
      if (confirmedPayments.has(occurrenceId)) {
        status = 'paid';
        paidDate = confirmedPayments.get(occurrenceId);
      }
      
      occurrences.push({
        id: occurrenceId,
        date: new Date(currentDate),
        status,
        paidDate,
        amount: payment.amount
      });

      // Move to next occurrence based on pattern
      if (payment.frequency_type === 'once') {
        break;
      }

      const interval = payment.recurrence_interval || 1;
      switch (payment.recurrence_pattern) {
        case 'daily':
          currentDate = addDays(currentDate, interval);
          break;
        case 'weekly':
          currentDate = addWeeks(currentDate, interval);
          break;
        case 'monthly':
          currentDate = addMonths(currentDate, interval);
          break;
        case 'yearly':
          currentDate = addYears(currentDate, interval);
          break;
        default:
          currentDate = addMonths(currentDate, interval);
      }

      count++;
    }

    return occurrences;
  };

  useEffect(() => {
    setOccurrences(generateOccurrences());
  }, [payment, confirmedPayments]);

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

  const getFrequencyLabel = () => {
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

  const getTagById = (tagId: string) => {
    return tags.find(tag => tag.id === tagId);
  };

  const handleConfirmPayment = async (occurrence: PaymentOccurrence) => {
    try {
      // Handle both tag names and tag IDs, convert to names for consistency
      const tagNames = payment.tags ? payment.tags.map(tagIdentifier => {
        // First try to find by ID
        let tag = getTagById(tagIdentifier);
        if (tag) {
          return tag.name;
        }
        // If not found by ID, try to find by name
        tag = tags.find(t => t.name === tagIdentifier);
        if (tag) {
          return tag.name;
        }
        // Fallback to the identifier itself
        return tagIdentifier;
      }) : [];

      // Create transaction in the main records with scheduled payment tracking
      const transactionData = {
        type: payment.type,
        description: payment.name,
        amount: payment.type === 'expense' ? -Math.abs(payment.amount) : Math.abs(payment.amount),
        account_id: payment.account_id,
        to_account_id: payment.to_account_id,
        category_id: payment.category_id,
        subcategory_id: payment.subcategory_id,
        contact_id: payment.contact_id,
        payment_method: payment.payment_method,
        note: payment.note,
        tags: tagNames,
        transaction_date: new Date().toISOString(),
        scheduled_payment_id: payment.id,
        scheduled_occurrence_date: occurrence.date.toISOString(),
      };

      await createTransaction(transactionData);

      // Update confirmed payments map
      const newConfirmedPayments = new Map(confirmedPayments);
      newConfirmedPayments.set(occurrence.id, new Date());
      setConfirmedPayments(newConfirmedPayments);

      toast({
        title: "Pago confirmado",
        description: "Se ha registrado el pago y creado la transacción correspondiente",
      });
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast({
        title: "Error",
        description: "No se pudo confirmar el pago",
        variant: "destructive",
      });
    }
  };

  const handlePostponePayment = (occurrence: PaymentOccurrence) => {
    // For this example, we'll just show a toast
    // In a real implementation, you might want to open a dialog to select new date
    toast({
      title: "Función no implementada",
      description: "La función de posponer pago se implementará próximamente",
    });
  };

  const handleRejectPayment = (occurrence: PaymentOccurrence) => {
    setOccurrences(prev => 
      prev.map(occ => 
        occ.id === occurrence.id 
          ? { ...occ, status: 'deleted' }
          : occ
      )
    );

    toast({
      title: "Pago rechazado",
      description: "El pago ha sido marcado como eliminado",
    });
  };

  const getDaysRemaining = (date: Date) => {
    const today = new Date();
    return differenceInDays(date, today);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Detalle del Pago Programado</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsEditDialogOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button variant="outline" size="sm" onClick={onDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar
          </Button>
        </div>
      </div>

      {/* Payment Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              {payment.name}
              <Badge className={getTypeColor(payment.type)}>
                {getTypeLabel(payment.type)}
              </Badge>
            </CardTitle>
            <span className="text-2xl font-bold">{formatAmount(payment.amount)}</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {payment.description && (
            <p className="text-muted-foreground">{payment.description}</p>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            {/* Category */}
            {payment.category_name && (
              <div className="flex items-center gap-2">
                <span className="text-lg">{payment.category_icon}</span>
                <span className="font-medium">Categoría:</span>
                <span>{payment.category_name}</span>
              </div>
            )}

            {/* Account */}
            {payment.account_name && (
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                <span className="font-medium">Cuenta:</span>
                <span>{payment.account_name}</span>
              </div>
            )}

            {/* To Account (for transfers) */}
            {payment.to_account_name && (
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                <span className="font-medium">Cuenta destino:</span>
                <span>{payment.to_account_name}</span>
              </div>
            )}

            {/* Contact */}
            {payment.contact_name && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="font-medium">Contacto:</span>
                <span>{payment.contact_name}</span>
              </div>
            )}

            {/* Frequency */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="font-medium">Frecuencia:</span>
              <span>{getFrequencyLabel()}</span>
            </div>

            {/* Payment Method */}
            {payment.payment_method && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="font-medium">Método de pago:</span>
                <span>{payment.payment_method}</span>
              </div>
            )}

            {/* Start Date */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="font-medium">Fecha inicio:</span>
              <span>{format(new Date(payment.start_date), 'dd/MM/yyyy', { locale: es })}</span>
            </div>

            {/* End Date */}
            {payment.end_date && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">Fecha fin:</span>
                <span>{format(new Date(payment.end_date), 'dd/MM/yyyy', { locale: es })}</span>
              </div>
            )}
          </div>

          {/* Tags */}
          {payment.tags && payment.tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">Etiquetas:</span>
              {payment.tags.map((tagIdentifier, index) => {
                // Handle both tag names and tag IDs
                let tag = getTagById(tagIdentifier);
                if (!tag) {
                  tag = tags.find(t => t.name === tagIdentifier);
                }
                return (
                  <Badge 
                    key={index} 
                    variant="secondary"
                    style={tag?.color ? { backgroundColor: tag.color, color: 'white' } : { backgroundColor: '#6b7280', color: 'white' }}
                  >
                    {tag?.name || tagIdentifier}
                  </Badge>
                );
              })}
            </div>
          )}

          {/* Note */}
          {payment.note && (
            <div>
              <span className="font-medium text-sm">Nota:</span>
              <p className="text-muted-foreground text-sm mt-1">{payment.note}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Summary */}
      <Card>
        <CardHeader>
          <CardTitle>RESUMEN DE LOS PAGOS</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {occurrences.map((occurrence) => {
              const daysRemaining = getDaysRemaining(occurrence.date);
              const isPending = occurrence.status === 'pending' && daysRemaining >= 0;
              const isOverdue = occurrence.status === 'pending' && daysRemaining < 0;
              
              return (
                <div key={occurrence.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">
                        {format(occurrence.date, 'dd/MM/yyyy', { locale: es })}
                      </span>
                      
                      {occurrence.status === 'paid' && (
                        <div className="flex items-center gap-2 text-green-600">
                          <Check className="h-4 w-4" />
                          <span>Pagado {occurrence.paidDate && format(occurrence.paidDate, 'dd/MM/yyyy', { locale: es })}</span>
                        </div>
                      )}
                      
                      {occurrence.status === 'deleted' && (
                        <div className="flex items-center gap-2 text-red-600">
                          <AlertCircle className="h-4 w-4" />
                          <span>Eliminado</span>
                        </div>
                      )}
                      
                      {occurrence.status === 'pending' && isPending && (
                        <div className="flex items-center gap-2 text-blue-600">
                          <Clock className="h-4 w-4" />
                          <span>Quedan {daysRemaining} días</span>
                        </div>
                      )}
                      
                      {occurrence.status === 'pending' && isOverdue && (
                        <div className="flex items-center gap-2 text-red-600">
                          <AlertCircle className="h-4 w-4" />
                          <span>Vencido hace {Math.abs(daysRemaining)} días</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="font-semibold">{formatAmount(occurrence.amount)}</span>
                    
                    {(isPending || isOverdue) && (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleConfirmPayment(occurrence)}>
                          CONFIRMAR
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handlePostponePayment(occurrence)}>
                          Posponer
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleRejectPayment(occurrence)}>
                          Rechazar
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Edit Scheduled Payment Dialog */}
      <EditScheduledPaymentDialog 
        open={isEditDialogOpen} 
        onOpenChange={setIsEditDialogOpen}
        payment={payment}
      />
    </div>
  );
};