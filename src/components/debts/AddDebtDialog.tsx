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
import { Autocomplete } from "@/components/ui/autocomplete"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { useDebts } from "@/hooks/useDebts"
import { useSettings } from "@/hooks/useSettings"
import { useIsMobile } from "@/hooks/use-mobile"

const debtSchema = z.object({
  type: z.enum(['debt', 'loan']),
  contact_id: z.string().min(1, "Selecciona un contacto"),
  description: z.string().min(1, "La descripción es requerida"),
  account_id: z.string().min(1, "Selecciona una cuenta"),
  initial_amount: z.number().positive("El monto debe ser positivo"),
  debt_date: z.date(),
  due_date: z.date().optional(),
  tags: z.array(z.string()).optional(),
})

type DebtFormData = z.infer<typeof debtSchema>

interface AddDebtDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contacts: Array<{ id: string; name: string }>
  accounts: Array<{ id: string; name: string; icon?: string; balance?: number }>
}

export function AddDebtDialog({ open, onOpenChange, contacts, accounts }: AddDebtDialogProps) {
  const [debtType, setDebtType] = useState<'debt' | 'loan'>('debt')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const { createDebt } = useDebts()
  const { tags } = useSettings()
  const isMobile = useIsMobile()

  const form = useForm<DebtFormData>({
    resolver: zodResolver(debtSchema),
    defaultValues: {
      type: 'debt',
      debt_date: new Date(),
      tags: [],
    },
  })

  const onSubmit = async (data: DebtFormData) => {
    const result = await createDebt({
      type: data.type,
      contact_id: data.contact_id,
      account_id: data.account_id,
      description: data.description,
      initial_amount: data.initial_amount,
      current_balance: data.initial_amount,
      debt_date: data.debt_date.toISOString(),
      due_date: data.due_date?.toISOString(),
      status: 'active' as const,
    }, selectedTags)

    if (result) {
      form.reset()
      setSelectedTags([])
      onOpenChange(false)
    }
  }

  const handleTabChange = (value: string) => {
    const type = value as 'debt' | 'loan'
    setDebtType(type)
    form.setValue('type', type)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        isMobile ? "max-w-full w-full h-full m-0 rounded-none" : "max-w-md max-h-[90vh]",
        "overflow-y-auto"
      )}>
        <DialogHeader>
          <DialogTitle>Nueva Deuda</DialogTitle>
        </DialogHeader>

        <Tabs value={debtType} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="debt">Deudas</TabsTrigger>
            <TabsTrigger value="loan">Préstamos</TabsTrigger>
          </TabsList>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
              <TabsContent value="debt" className="space-y-4 mt-0">
                <div className="text-sm text-muted-foreground">
                  Registra dinero que debes a alguien
                </div>
              </TabsContent>

              <TabsContent value="loan" className="space-y-4 mt-0">
                <div className="text-sm text-muted-foreground">
                  Registra dinero que te deben
                </div>
              </TabsContent>

              <FormField
                control={form.control}
                name="contact_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {debtType === 'debt' ? 'Quien me ha prestado' : 'A quien he prestado'}
                    </FormLabel>
                    <FormControl>
                      <Autocomplete
                        options={contacts}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Selecciona un contacto"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder={debtType === 'debt' ? "¿Para qué era?" : "¿Para qué era?"} 
                        {...field} 
                      />
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
                    <FormControl>
                      <Autocomplete
                        options={accounts.map(account => ({
                          id: account.id,
                          name: `${account.icon || '💳'} ${account.name} ($${account.balance?.toFixed(2) || '0.00'})`
                        }))}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Buscar cuenta..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="initial_amount"
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="debt_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>
                      {debtType === 'debt' ? 'Fecha de deuda' : 'Fecha de préstamo'}
                    </FormLabel>
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
                name="due_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha de vencimiento (opcional)</FormLabel>
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
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tags */}
              <div className="space-y-2">
                <Label>Etiquetas</Label>
                <Autocomplete
                  options={tags
                    .filter(tag => !selectedTags.includes(tag.name))
                    .map(tag => ({ id: tag.name, name: tag.name }))
                  }
                  value=""
                  onValueChange={(value) => {
                    if (value && !selectedTags.includes(value)) {
                      setSelectedTags([...selectedTags, value])
                    }
                  }}
                  placeholder="Seleccionar etiqueta"
                />
                
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
                  Crear {debtType === 'debt' ? 'Deuda' : 'Préstamo'}
                </Button>
              </div>
            </form>
          </Form>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}