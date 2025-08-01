import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface RecurrenceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: any) => void;
  initialData?: any;
}

export const RecurrenceDialog = ({ open, onOpenChange, onConfirm, initialData }: RecurrenceDialogProps) => {
  const [frequency, setFrequency] = useState('monthly');
  const [interval, setInterval] = useState(1);
  const [dayOption, setDayOption] = useState('same_day');
  const [endType, setEndType] = useState('never');
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [endCount, setEndCount] = useState(1);

  useEffect(() => {
    if (initialData) {
      setFrequency(initialData.recurrence_pattern || 'monthly');
      setInterval(initialData.recurrence_interval || 1);
      setDayOption(initialData.recurrence_day_option || 'same_day');
      setEndType(initialData.end_type || 'never');
      if (initialData.end_date) {
        setEndDate(new Date(initialData.end_date));
      }
      if (initialData.end_count) {
        setEndCount(initialData.end_count);
      }
    }
  }, [initialData]);

  const handleConfirm = () => {
    const data = {
      recurrence_pattern: frequency,
      recurrence_interval: interval,
      recurrence_day_option: dayOption,
      end_type: endType,
      end_date: endDate?.toISOString(),
      end_count: endType === 'count' ? endCount : undefined,
    };
    onConfirm(data);
  };

  const getFrequencyLabel = (freq: string) => {
    switch (freq) {
      case 'daily': return 'día';
      case 'weekly': return 'semana';
      case 'monthly': return 'mes';
      case 'yearly': return 'año';
      default: return 'mes';
    }
  };

  const getFrequencyPluralLabel = (freq: string) => {
    switch (freq) {
      case 'daily': return 'días';
      case 'weekly': return 'semanas';
      case 'monthly': return 'meses';
      case 'yearly': return 'años';
      default: return 'meses';
    }
  };

  const getDayOptions = () => {
    switch (frequency) {
      case 'weekly':
        return [
          { value: 'same_day', label: 'El mismo día de la semana' },
          { value: 'monday', label: 'Cada lunes' },
          { value: 'tuesday', label: 'Cada martes' },
          { value: 'wednesday', label: 'Cada miércoles' },
          { value: 'thursday', label: 'Cada jueves' },
          { value: 'friday', label: 'Cada viernes' },
          { value: 'saturday', label: 'Cada sábado' },
          { value: 'sunday', label: 'Cada domingo' },
        ];
      case 'monthly':
        return [
          { value: 'same_day', label: 'El mismo día de cada mes' },
          { value: 'first_monday', label: 'Cada primer lunes' },
          { value: 'last_day', label: 'El último día del mes' },
        ];
      case 'yearly':
        return [
          { value: 'same_day', label: 'El mismo día del año' },
        ];
      default:
        return [
          { value: 'same_day', label: 'El mismo día' },
        ];
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Definir periodicidad</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Frequency Selector */}
          <div className="space-y-2">
            <Label>Frecuencia</Label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Diariamente</SelectItem>
                <SelectItem value="weekly">Semanalmente</SelectItem>
                <SelectItem value="monthly">Mensualmente</SelectItem>
                <SelectItem value="yearly">Anualmente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Interval */}
          <div className="space-y-2">
            <Label>Cada</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="1"
                value={interval}
                onChange={(e) => setInterval(parseInt(e.target.value) || 1)}
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">
                {interval === 1 ? getFrequencyLabel(frequency) : getFrequencyPluralLabel(frequency)}
              </span>
            </div>
          </div>

          {/* Day Options */}
          <div className="space-y-2">
            <Label>Opciones de día</Label>
            <Select value={dayOption} onValueChange={setDayOption}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getDayOptions().map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* End Options */}
          <div className="space-y-4">
            <Label>Finalización</Label>
            <RadioGroup value={endType} onValueChange={setEndType}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="never" id="never" />
                <Label htmlFor="never">Para siempre</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="date" id="date" />
                <Label htmlFor="date">Hasta cierta fecha</Label>
              </div>
              {endType === 'date' && (
                <div className="ml-6">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP", { locale: es }) : "Seleccionar fecha"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        disabled={(date) => date < new Date()}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="count" id="count" />
                <Label htmlFor="count">Durante un número de veces</Label>
              </div>
              {endType === 'count' && (
                <div className="ml-6 flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    value={endCount}
                    onChange={(e) => setEndCount(parseInt(e.target.value) || 1)}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">veces</span>
                </div>
              )}
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            CANCELAR
          </Button>
          <Button onClick={handleConfirm}>
            CORRECTO
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};