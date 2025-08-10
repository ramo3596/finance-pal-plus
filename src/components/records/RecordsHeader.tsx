import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { AddTransaction } from "@/components/AddTransaction";
import { useState } from "react";
import { RecordsFilters } from "@/pages/Records";
import { EnhancedDateSelector } from "./EnhancedDateSelector";

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
          
          {/* Enhanced Date Range Filter */}
          <EnhancedDateSelector
            dateRange={filters.dateRange}
            onDateRangeChange={(range) => onFilterChange({ dateRange: range })}
          />

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