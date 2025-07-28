import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { AddTransaction } from "@/components/AddTransaction";
import { useState } from "react";
import { RecordsFilters } from "@/pages/Records";

interface RecordsHeaderProps {
  filters: RecordsFilters;
  onFilterChange: (filters: Partial<RecordsFilters>) => void;
}

export function RecordsHeader({ filters, onFilterChange }: RecordsHeaderProps) {
  const [showAddTransaction, setShowAddTransaction] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Registros</h1>
        
        <div className="flex items-center gap-4">
          <Button 
            onClick={() => setShowAddTransaction(true)}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Transacción
          </Button>
          
          {/* Date Range Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !filters.dateRange.from && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.dateRange.from ? (
                  filters.dateRange.to ? (
                    <>
                      {format(filters.dateRange.from, "dd MMM", { locale: es })} -{" "}
                      {format(filters.dateRange.to, "dd MMM yyyy", { locale: es })}
                    </>
                  ) : (
                    format(filters.dateRange.from, "dd MMM yyyy", { locale: es })
                  )
                ) : (
                  <span>Seleccionar fechas</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                selected={{
                  from: filters.dateRange.from || undefined,
                  to: filters.dateRange.to || undefined,
                }}
                onSelect={(range) => {
                  onFilterChange({
                    dateRange: {
                      from: range?.from || null,
                      to: range?.to || null,
                    }
                  });
                }}
                numberOfMonths={2}
                locale={es}
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          {/* Sort By */}
          <Select 
            value={filters.sortBy} 
            onValueChange={(value) => onFilterChange({ sortBy: value })}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent className="bg-background border border-border">
              <SelectItem value="date-desc">Fecha (más reciente)</SelectItem>
              <SelectItem value="date-asc">Fecha (más antigua)</SelectItem>
              <SelectItem value="amount-desc">Monto (mayor a menor)</SelectItem>
              <SelectItem value="amount-asc">Monto (menor a mayor)</SelectItem>
              <SelectItem value="description">Descripción (A-Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {showAddTransaction && (
        <AddTransaction 
          open={showAddTransaction}
          onOpenChange={setShowAddTransaction}
        />
      )}
    </>
  );
}