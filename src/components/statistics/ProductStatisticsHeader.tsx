import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EnhancedDateSelector } from "@/components/records/EnhancedDateSelector";
import { StatisticsFilters } from "@/pages/Statistics";
import { useIsMobile } from "@/hooks/use-mobile";

interface ProductStatisticsHeaderProps {
  filters: StatisticsFilters;
  onFilterChange: (filters: Partial<StatisticsFilters>) => void;
}

export function ProductStatisticsHeader({ filters, onFilterChange }: ProductStatisticsHeaderProps) {
  const isMobile = useIsMobile();

  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-3xl font-bold">Estadísticas de Productos</h1>
      
      <div className="flex items-center gap-4">
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
            <SelectItem value="quantity-desc">Cantidad (mayor)</SelectItem>
            <SelectItem value="quantity-asc">Cantidad (menor)</SelectItem>
            <SelectItem value="revenue-desc">Ingresos (mayor)</SelectItem>
            <SelectItem value="revenue-asc">Ingresos (menor)</SelectItem>
            <SelectItem value="profit-desc">Ganancias (mayor)</SelectItem>
            <SelectItem value="profit-asc">Ganancias (menor)</SelectItem>
            <SelectItem value="name">Nombre del producto</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}