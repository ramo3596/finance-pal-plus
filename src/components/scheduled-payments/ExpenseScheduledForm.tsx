import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Autocomplete } from '@/components/ui/autocomplete';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useScheduledPayments } from '@/hooks/useScheduledPayments';
import { useSettings } from '@/hooks/useSettings';
import { useContacts } from '@/hooks/useContacts';
import { RecurrenceDialog } from './RecurrenceDialog';

const formSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  category_id: z.string().optional(),
  account_id: z.string().min(1, 'La cuenta es requerida'),
  amount: z.number().min(0.01, 'El importe debe ser mayor a 0'),
  payment_method: z.string().optional(),
  contact_id: z.string().optional(),
  frequency_type: z.enum(['once', 'recurring']),
  start_date: z.date({ required_error: 'La fecha de inicio es requerida' }),
  notification_days: z.number().default(0),
  recurrence_pattern: z.string().optional(),
  recurrence_interval: z.number().optional(),
  recurrence_day_option: z.string().optional(),
  end_type: z.enum(['never', 'date', 'count']).optional(),
  end_date: z.date().optional(),
  end_count: z.number().optional(),
  note: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

type FormData = z.infer<typeof formSchema>;

interface ExpenseScheduledFormProps {
  onClose: () => void;
}

export const ExpenseScheduledForm = ({ onClose }: ExpenseScheduledFormProps) => {
  const { createScheduledPayment } = useScheduledPayments();
  const { categories, accounts, tags } = useSettings();
  const { contacts } = useContacts();
  const [isRecurrenceDialogOpen, setIsRecurrenceDialogOpen] = useState(false);
  const [recurrenceData, setRecurrenceData] = useState<any>(null);


  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      frequency_type: 'once',
      notification_days: 0,
      tags: [],
    },
  });

  const expenseCategories = categories.filter(cat => cat.nature === 'Necesitar' || cat.nature === 'Deseos' || cat.nature === 'Deber');
  
  // Obtener todas las subcategorías de gastos
  const expenseSubcategories = categories
    .filter(cat => cat.nature === 'Necesitar' || cat.nature === 'Deseos' || cat.nature === 'Deber')
    .flatMap(category => 
      (category.subcategories || []).map(subcategory => ({
        ...subcategory,
        parentCategory: category
      }))
    );
    
  const paymentMethods = [
    { value: "cash", label: "Dinero en efectivo" },
    { value: "debit", label: "Tarjeta de débito" },
    { value: "credit", label: "Tarjeta de crédito" },
    { value: "transfer", label: "Transferencia bancaria" },
    { value: "coupon", label: "Cupón" },
    { value: "mobile", label: "Pago por móvil" },
    { value: "web", label: "Pago por web" }
  ];
  const notificationOptions = [
    { value: 0, label: 'Ninguno' },
    { value: 1, label: 'Fecha límite' },
    { value: 2, label: 'Un día antes' },
    { value: 3, label: 'Tres días antes' },
    { value: 7, label: 'Una semana antes' },
  ];

  const watchFrequencyType = form.watch('frequency_type');

  const onSubmit = async (data: FormData) => {
    try {
      const scheduledPayment = {
        ...data,
        type: 'expense' as const,
        start_date: data.start_date.toISOString(),
        next_payment_date: data.start_date.toISOString(),
        end_date: data.end_date?.toISOString(),
        is_active: true,
        ...recurrenceData,
      };

      await createScheduledPayment(scheduledPayment);
      onClose();
    } catch (error) {
      console.error('Error creating scheduled payment:', error);
    }
  };

  const handleRecurrenceConfirm = (data: any) => {
    setRecurrenceData(data);
    form.setValue('recurrence_pattern', data.recurrence_pattern);
    form.setValue('recurrence_interval', data.recurrence_interval);
    form.setValue('recurrence_day_option', data.recurrence_day_option);
    form.setValue('end_type', data.end_type);
    if (data.end_date) {
      form.setValue('end_date', new Date(data.end_date));
    }
    if (data.end_count) {
      form.setValue('end_count', data.end_count);
    }
    setIsRecurrenceDialogOpen(false);
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre/Descripción *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre del pago programado" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category */}
            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría</FormLabel>
                  <FormControl>
                    <Autocomplete
                      options={[
                        // Incluir todas las categorías
                        ...expenseCategories.map(category => ({
                          id: category.id,
                          name: `${category.icon} ${category.name}`,
                          icon: category.icon,
                          isCategory: true
                        })),
                        // Incluir todas las subcategorías
                        ...expenseSubcategories.map(subcategory => ({
                          id: subcategory.id,
                          name: `${subcategory.icon || subcategory.parentCategory.icon} ${subcategory.name} (${subcategory.parentCategory.name})`,
                          icon: subcategory.icon || subcategory.parentCategory.icon,
                          isSubcategory: true,
                          categoryId: subcategory.parentCategory.id
                        }))
                      ]}
                      value={field.value}
                      onValueChange={(value) => {
                        // Buscar si la opción seleccionada es una subcategoría
                        const selectedOption = [
                          ...expenseCategories.map(c => ({ id: c.id, isCategory: true })),
                          ...expenseSubcategories.map(s => ({ id: s.id, isSubcategory: true, categoryId: s.parentCategory.id }))
                        ].find(option => option.id === value);
                        
                        // Si es una subcategoría, también establecemos la categoría padre
                        if (selectedOption && 'isSubcategory' in selectedOption && selectedOption.isSubcategory) {
                          // Aquí podrías establecer la subcategoría en otro campo si es necesario
                          // form.setValue('subcategory_id', value);
                          // form.setValue('category_id', selectedOption.categoryId);
                          field.onChange(value);
                        } else {
                          field.onChange(value);
                        }
                      }}
                      placeholder="Seleccionar categoría"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Account */}
            <FormField
              control={form.control}
              name="account_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cuenta *</FormLabel>
                  <FormControl>
                    <Autocomplete
                      options={accounts.map(account => ({
                        id: account.id,
                        name: account.name
                      }))}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Seleccionar cuenta"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Amount */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Importe *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Payment Method */}
            <FormField
              control={form.control}
              name="payment_method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Forma de pago</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar forma de pago" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {paymentMethods.map((method) => (
                        <SelectItem key={method.value} value={method.value}>
                          {method.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Contact */}
            <FormField
              control={form.control}
              name="contact_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Beneficiario</FormLabel>
                  <Autocomplete
                    options={contacts.map((contact) => ({
                      id: contact.id,
                      name: contact.name,
                    }))}
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder="Seleccionar contacto"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Frequency Type */}
          <FormField
            control={form.control}
            name="frequency_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Frecuencia</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="once">Una vez</SelectItem>
                    <SelectItem value="recurring">Pago recurrente</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Start Date */}
          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Fecha de inicio *</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: es })
                        ) : (
                          <span>Seleccionar fecha</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Notifications */}
          <FormField
            control={form.control}
            name="notification_days"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notificaciones</FormLabel>
                <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {notificationOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Periodicity for recurring payments */}
          {watchFrequencyType === 'recurring' && (
            <div className="space-y-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsRecurrenceDialogOpen(true)}
                className="w-full"
              >
                {recurrenceData ? 'Editar periodicidad' : 'Definir periodicidad'}
              </Button>
              {recurrenceData && (
                <div className="text-sm text-muted-foreground">
                  <p>Repetir {recurrenceData.recurrence_pattern} cada {recurrenceData.recurrence_interval} {recurrenceData.recurrence_pattern === 'daily' ? 'días' : recurrenceData.recurrence_pattern === 'weekly' ? 'semanas' : recurrenceData.recurrence_pattern === 'monthly' ? 'meses' : 'años'}</p>
                </div>
              )}
            </div>
          )}

          {/* Tags */}
          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Etiquetas</FormLabel>
                <Select 
                  value={field.value?.join(',')} 
                  onValueChange={(value) => {
                    if (value) {
                      const currentTags = field.value || [];
                      const tagId = value.split(',').pop() || '';
                      if (!currentTags.includes(tagId)) {
                        field.onChange([...currentTags, tagId]);
                      }
                    }
                  }}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar etiquetas" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {tags.map((tag) => (
                      <SelectItem key={tag.id} value={tag.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: tag.color }}
                          />
                          <span>{tag.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-1 mt-2">
                  {field.value?.map((tagId) => {
                    const tag = tags.find(t => t.id === tagId);
                    return tag ? (
                      <span 
                        key={tagId}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs"
                      >
                        <div 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: tag.color }}
                        />
                        {tag.name}
                        <button
                          type="button"
                          onClick={() => {
                            field.onChange(field.value?.filter(id => id !== tagId) || []);
                          }}
                          className="ml-1 hover:text-destructive"
                        >
                          ×
                        </button>
                      </span>
                    ) : null;
                  })}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Note */}
          <FormField
            control={form.control}
            name="note"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nota</FormLabel>
                <FormControl>
                  <Textarea placeholder="Notas adicionales..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">Guardar</Button>
          </div>
        </form>
      </Form>

      <RecurrenceDialog
        open={isRecurrenceDialogOpen}
        onOpenChange={setIsRecurrenceDialogOpen}
        onConfirm={handleRecurrenceConfirm}
        initialData={recurrenceData}
      />
    </>
  );
};