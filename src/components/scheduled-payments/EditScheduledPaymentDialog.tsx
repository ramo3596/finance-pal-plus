import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Autocomplete } from '@/components/ui/autocomplete';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScheduledPayment, useScheduledPayments } from '@/hooks/useScheduledPayments';
import { useSettings } from '@/hooks/useSettings';
import { useContacts } from '@/hooks/useContacts';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface EditScheduledPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: ScheduledPayment | null;
}

export const EditScheduledPaymentDialog = ({ open, onOpenChange, payment }: EditScheduledPaymentDialogProps) => {
  const { updateScheduledPayment } = useScheduledPayments();
  const { categories, accounts, tags } = useSettings();
  const { contacts } = useContacts();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'expense' as 'income' | 'expense' | 'transfer',
    category_id: '',
    subcategory_id: '',
    account_id: '',
    to_account_id: '',
    amount: '',
    payment_method: '',
    contact_id: '',
    frequency_type: 'once' as 'once' | 'recurring',
    start_date: new Date(),
    notification_days: 0,
    recurrence_pattern: 'monthly',
    recurrence_interval: 1,
    recurrence_day_option: '',
    end_type: 'never' as 'never' | 'date' | 'count',
    end_date: undefined as Date | undefined,
    end_count: undefined as number | undefined,
    note: '',
    tags: [] as string[],
    is_active: true,
  });

  const [isStartDateOpen, setIsStartDateOpen] = useState(false);
  const [isEndDateOpen, setIsEndDateOpen] = useState(false);

  useEffect(() => {
    if (payment) {
      setFormData({
        name: payment.name,
        description: payment.description || '',
        type: payment.type,
        category_id: payment.category_id || '',
        subcategory_id: payment.subcategory_id || '',
        account_id: payment.account_id || '',
        to_account_id: payment.to_account_id || '',
        amount: payment.amount.toString(),
        payment_method: payment.payment_method || '',
        contact_id: payment.contact_id || '',
        frequency_type: payment.frequency_type,
        start_date: new Date(payment.start_date),
        notification_days: payment.notification_days,
        recurrence_pattern: payment.recurrence_pattern || 'monthly',
        recurrence_interval: payment.recurrence_interval || 1,
        recurrence_day_option: payment.recurrence_day_option || '',
        end_type: payment.end_type || 'never',
        end_date: payment.end_date ? new Date(payment.end_date) : undefined,
        end_count: payment.end_count || undefined,
        note: payment.note || '',
        tags: payment.tags || [],
        is_active: payment.is_active,
      });
    }
  }, [payment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payment) return;

    try {
      const updateData = {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        category_id: formData.category_id || null,
        subcategory_id: formData.subcategory_id || null,
        account_id: formData.account_id || null,
        to_account_id: formData.to_account_id || null,
        amount: parseFloat(formData.amount),
        payment_method: formData.payment_method || null,
        contact_id: formData.contact_id || null,
        frequency_type: formData.frequency_type,
        start_date: formData.start_date.toISOString(),
        notification_days: formData.notification_days,
        recurrence_pattern: formData.frequency_type === 'recurring' ? formData.recurrence_pattern : null,
        recurrence_interval: formData.frequency_type === 'recurring' ? formData.recurrence_interval : null,
        recurrence_day_option: formData.frequency_type === 'recurring' ? formData.recurrence_day_option : null,
        end_type: formData.frequency_type === 'recurring' ? formData.end_type : null,
        end_date: formData.frequency_type === 'recurring' && formData.end_date ? formData.end_date.toISOString() : null,
        end_count: formData.frequency_type === 'recurring' && formData.end_count ? formData.end_count : null,
        note: formData.note || null,
        tags: formData.tags,
        is_active: formData.is_active,
      };

      await updateScheduledPayment(payment.id, updateData);
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating scheduled payment:', error);
    }
  };

  const resetForm = () => {
    if (payment) {
      setFormData({
        name: payment.name,
        description: payment.description || '',
        type: payment.type,
        category_id: payment.category_id || '',
        subcategory_id: payment.subcategory_id || '',
        account_id: payment.account_id || '',
        to_account_id: payment.to_account_id || '',
        amount: payment.amount.toString(),
        payment_method: payment.payment_method || '',
        contact_id: payment.contact_id || '',
        frequency_type: payment.frequency_type,
        start_date: new Date(payment.start_date),
        notification_days: payment.notification_days,
        recurrence_pattern: payment.recurrence_pattern || 'monthly',
        recurrence_interval: payment.recurrence_interval || 1,
        recurrence_day_option: payment.recurrence_day_option || '',
        end_type: payment.end_type || 'never',
        end_date: payment.end_date ? new Date(payment.end_date) : undefined,
        end_count: payment.end_count || undefined,
        note: payment.note || '',
        tags: payment.tags || [],
        is_active: payment.is_active,
      });
    }
  };

  if (!payment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Pago Programado</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Tipo *</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as any }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Ingresos</SelectItem>
                    <SelectItem value="expense">Gasto</SelectItem>
                    <SelectItem value="transfer">Transferencia</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="amount">Monto *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  required
                />
              </div>
            </div>

            {/* Category */}
            {formData.type !== 'transfer' && (
              <div>
                <Label htmlFor="category">Categoría</Label>
                <Autocomplete
                  options={[
                    // Incluir todas las categorías
                    ...categories.map(category => ({
                      id: category.id,
                      name: `${category.icon} ${category.name}`,
                      isCategory: true
                    })),
                    // Incluir todas las subcategorías
                    ...categories.flatMap(category => 
                      category.subcategories?.map(subcategory => ({
                        id: subcategory.id,
                        name: `${subcategory.icon} ${subcategory.name} (${category.name})`,
                        categoryId: category.id,
                        isSubcategory: true
                      })) || []
                    )
                  ]}
                  value={(() => {
                    // Si hay subcategoría seleccionada, mostrar la subcategoría
                    if (formData.subcategory_id) {
                      return formData.subcategory_id;
                    }
                    // Si no, mostrar la categoría
                    return formData.category_id;
                  })()}
                  onValueChange={(value) => {
                    // Verificar si la selección es una subcategoría
                    const selectedOption = [
                      ...categories.map(category => ({
                        id: category.id,
                        isCategory: true
                      })),
                      ...categories.flatMap(category => 
                        category.subcategories?.map(subcategory => ({
                          id: subcategory.id,
                          categoryId: category.id,
                          isSubcategory: true
                        })) || []
                      )
                    ].find(option => option.id === value);
                    
                    if (selectedOption && 'isSubcategory' in selectedOption && selectedOption.isSubcategory) {
                      // Si es subcategoría, establecer tanto la categoría como la subcategoría
                      setFormData(prev => ({
                        ...prev,
                        category_id: ('categoryId' in selectedOption) ? selectedOption.categoryId : '',
                        subcategory_id: value
                      }));
                    } else {
                      // Si es categoría, establecer solo la categoría y resetear subcategoría
                      setFormData(prev => ({
                        ...prev,
                        category_id: value,
                        subcategory_id: ''
                      }));
                    }
                  }}
                  placeholder="Buscar categoría o subcategoría..."
                />
              </div>
            )}

            {/* Accounts */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="account">Cuenta {formData.type === 'transfer' ? 'origen' : ''} *</Label>
                <Select value={formData.account_id} onValueChange={(value) => setFormData(prev => ({ ...prev, account_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cuenta" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.type === 'transfer' && (
                <div>
                  <Label htmlFor="to_account">Cuenta destino *</Label>
                  <Select value={formData.to_account_id} onValueChange={(value) => setFormData(prev => ({ ...prev, to_account_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar cuenta destino" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Contact and Payment Method */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contact">Contacto</Label>
                <Select value={formData.contact_id} onValueChange={(value) => setFormData(prev => ({ ...prev, contact_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar contacto" />
                  </SelectTrigger>
                  <SelectContent>
                    {contacts.map((contact) => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {contact.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="payment_method">Método de pago</Label>
                <Select value={formData.payment_method} onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar método" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Dinero en efectivo</SelectItem>
                    <SelectItem value="debit">Tarjeta de débito</SelectItem>
                    <SelectItem value="credit">Tarjeta de crédito</SelectItem>
                    <SelectItem value="transfer">Transferencia</SelectItem>
                    <SelectItem value="check">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Frequency */}
            <div>
              <Label htmlFor="frequency_type">Frecuencia *</Label>
              <Select value={formData.frequency_type} onValueChange={(value) => setFormData(prev => ({ ...prev, frequency_type: value as any }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="once">Una vez</SelectItem>
                  <SelectItem value="recurring">Recurrente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Recurrence settings */}
            {formData.frequency_type === 'recurring' && (
              <div className="space-y-4 p-4 border rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="recurrence_pattern">Patrón</Label>
                    <Select value={formData.recurrence_pattern} onValueChange={(value) => setFormData(prev => ({ ...prev, recurrence_pattern: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Diario</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="monthly">Mensual</SelectItem>
                        <SelectItem value="yearly">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="recurrence_interval">Intervalo</Label>
                    <Input
                      id="recurrence_interval"
                      type="number"
                      min="1"
                      value={formData.recurrence_interval}
                      onChange={(e) => setFormData(prev => ({ ...prev, recurrence_interval: parseInt(e.target.value) }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="end_type">Termina</Label>
                  <Select value={formData.end_type} onValueChange={(value) => setFormData(prev => ({ ...prev, end_type: value as any }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="never">Nunca</SelectItem>
                      <SelectItem value="date">En fecha</SelectItem>
                      <SelectItem value="count">Después de X ocurrencias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.end_type === 'date' && (
                  <div>
                    <Label>Fecha fin</Label>
                    <Popover open={isEndDateOpen} onOpenChange={setIsEndDateOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.end_date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.end_date ? format(formData.end_date, "dd/MM/yyyy", { locale: es }) : "Seleccionar fecha"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.end_date}
                          onSelect={(date) => {
                            setFormData(prev => ({ ...prev, end_date: date }));
                            setIsEndDateOpen(false);
                          }}
                          initialFocus
                          locale={es}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}

                {formData.end_type === 'count' && (
                  <div>
                    <Label htmlFor="end_count">Número de ocurrencias</Label>
                    <Input
                      id="end_count"
                      type="number"
                      min="1"
                      value={formData.end_count || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, end_count: parseInt(e.target.value) }))}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Start Date */}
            <div>
              <Label>Fecha de inicio *</Label>
              <Popover open={isStartDateOpen} onOpenChange={setIsStartDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.start_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.start_date ? format(formData.start_date, "dd/MM/yyyy", { locale: es }) : "Seleccionar fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.start_date}
                    onSelect={(date) => {
                      if (date) {
                        setFormData(prev => ({ ...prev, start_date: date }));
                        setIsStartDateOpen(false);
                      }
                    }}
                    initialFocus
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Notification Days */}
            <div>
              <Label htmlFor="notification_days">Días de notificación anticipada</Label>
              <Input
                id="notification_days"
                type="number"
                min="0"
                value={formData.notification_days}
                onChange={(e) => setFormData(prev => ({ ...prev, notification_days: parseInt(e.target.value) }))}
              />
            </div>

            {/* Note */}
            <div>
              <Label htmlFor="note">Nota</Label>
              <Textarea
                id="note"
                value={formData.note}
                onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                rows={2}
              />
            </div>

            {/* Active Status */}
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor="is_active">Pago activo</Label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="button" variant="outline" onClick={resetForm}>
              Restablecer
            </Button>
            <Button type="submit">
              Actualizar Pago
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};