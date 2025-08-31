import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search } from "lucide-react";
import { AddTransaction } from "@/components/AddTransaction";
import { useState } from "react";
import { RecordsFilters } from "@/pages/Records";
import { EnhancedDateSelector } from "./EnhancedDateSelector";
import { useIsMobile } from "@/hooks/use-mobile";

interface RecordsHeaderProps {
  filters: RecordsFilters;
  onFilterChange: (filters: Partial<RecordsFilters>) => void;
}

export function RecordsHeader({ filters, onFilterChange }: RecordsHeaderProps) {
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showSearchInput, setShowSearchInput] = useState(false);
  const isMobile = useIsMobile();

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold">Registros</h1>
          
          {/* Botón de búsqueda para móvil */}
          {isMobile && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 ml-2 hover:bg-accent hover:text-accent-foreground"
              onClick={() => setShowSearchInput(!showSearchInput)}
            >
              <Search className="h-5 w-5" />
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          {!isMobile && (
            <Button 
              onClick={() => setShowAddTransaction(true)}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Transacción
            </Button>
          )}
          
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

      {/* Input de búsqueda para móvil */}
      {isMobile && showSearchInput && (
        <div className="mt-4 mb-2">
          <input
            type="text"
            placeholder="Buscar transacciones..."
            value={filters.searchTerm}
            onChange={(e) => onFilterChange({ searchTerm: e.target.value })}
            className="w-full p-2 rounded-md bg-background border border-input focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            autoFocus
          />
        </div>
      )}

      {showAddTransaction && (
        <AddTransaction 
          open={showAddTransaction}
          onOpenChange={setShowAddTransaction}
        />
      )}
    </>
  );
}