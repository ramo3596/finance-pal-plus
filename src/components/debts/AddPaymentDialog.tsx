import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { useDebts, type Debt } from "@/hooks/useDebts"
import { useSettings } from "@/hooks/useSettings"

const paymentSchema = z.object({
  action: z.enum(['payment', 'increase']),
  account_id: z.string().min(1, "Selecciona una cuenta"),
  amount: z.number().positive("El monto debe ser positivo"),
  payment_date: z.date(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

type PaymentFormData = z.infer<typeof paymentSchema>

interface AddPaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  debt: Debt
  accounts: Array<{ id: string; name: string }>
}

export function AddPaymentDialog({ open, onOpenChange, debt, accounts }: AddPaymentDialogProps) {
  const { addDebtPayment } = useDebts()
  const { tags } = useSettings()
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      action: 'payment',
      payment_date: new Date(),
      tags: [],
    },
  })

  const watchedAction = form.watch('action')
  const isDebt = debt.type === 'debt'
  const contactName = debt.contacts?.name || 'Contacto'

  const onSubmit = async (data: PaymentFormData) => {
    // En la nueva implementación, simplemente enviamos el monto positivo
    // La lógica de determinar el tipo correcto de transacción está en addDebtPayment
    const result = await addDebtPayment(debt.id, {
      amount: data.amount, // Siempre positivo
      account_id: data.account_id,
      payment_date: data.payment_date.toISOString(),
      description: data.description,
    }, selectedTags)

    if (result) {
      form.reset()
      setSelectedTags([])
      onOpenChange(false)
    }
  }

  const getActionLabel = () => {
    if (isDebt) {
      return watchedAction === 'payment' ? 'Pago de deuda' : 'Aumento de deuda'
    } else {
      return watchedAction === 'payment' ? 'Cobro de préstamo' : 'Aumento de préstamo'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Añadir Registro</DialogTitle>
          <div className="text-sm text-muted-foreground">
            {isDebt ? 'DEBO' : 'ME DEBEN'} {contactName}
          </div>
          <div className="text-sm font-medium">
            Saldo actual: {formatCurrency(debt.current_balance)}
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="action"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Acción</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="payment" id="payment" />
                        <Label htmlFor="payment">
                          {isDebt ? 'Reembolsar deuda' : 'Cobrar préstamo'}
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="increase" id="increase" />
                        <Label htmlFor="increase">
                          {isDebt ? 'Aumento de deuda' : 'Aumento de préstamo'}
                        </Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="account_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cuenta</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una cuenta" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cantidad</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <div className="text-xs text-muted-foreground">
                    {getActionLabel()}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="payment_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha</FormLabel>
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
                            format(field.value, "dd/MM/yyyy")
                          ) : (
                            <span>Selecciona fecha</span>
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
                        disabled={(date) => date > new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción (opcional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Notas adicionales..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tags */}
            <div className="space-y-2">
              <Label>Etiquetas</Label>
              <Select
                onValueChange={(value) => {
                  if (value && !selectedTags.includes(value)) {
                    setSelectedTags([...selectedTags, value])
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar etiqueta" />
                </SelectTrigger>
                <SelectContent>
                  {tags
                    .filter(tag => !selectedTags.includes(tag.name))
                    .map((tag) => (
                      <SelectItem key={tag.id} value={tag.name}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: tag.color }}
                          />
                          {tag.name}
                        </div>
                      </SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
              
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedTags.map((tagName) => {
                    const tag = tags.find(t => t.name === tagName)
                    return (
                      <span
                        key={tagName}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full text-white"
                        style={{ backgroundColor: tag?.color || '#6b7280' }}
                      >
                        {tagName}
                        <button
                          type="button"
                          onClick={() => setSelectedTags(selectedTags.filter(t => t !== tagName))}
                          className="ml-1 hover:bg-black/20 rounded-full p-0.5"
                        >
                          ×
                        </button>
                      </span>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Registrar {getActionLabel()}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
