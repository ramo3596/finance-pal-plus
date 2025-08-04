import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EnhancedDateSelector } from "@/components/records/EnhancedDateSelector";
import { StatisticsFilters, StatisticsReportType } from "@/pages/Statistics";
import { BarChart3 } from "lucide-react";

interface StatisticsHeaderProps {
  filters: StatisticsFilters;
  onFilterChange: (filters: Partial<StatisticsFilters>) => void;
  selectedReport: StatisticsReportType;
  onReportChange: (report: StatisticsReportType) => void;
}

const reportOptions = [
  { value: "income-expense-table", label: "Informe de ingresos y gastos (TABLA)" },
  { value: "balance-chart", label: "Saldo (Gráfica)" },
  { value: "fund-flow-chart", label: "Flujo de fondos (Gráfica)" },
  { value: "accumulated-cash-flow-chart", label: "Flujo de efectivo acumulado (Gráfica)" },
  { value: "income-chart", label: "Ingreso (Gráfica)" },
  { value: "expense-chart", label: "Gasto (Gráfica)" },
  { value: "accumulated-variation-chart", label: "Variación acumulada (Gráfica)" },
  { value: "accumulated-expenses-chart", label: "Gastos acumulados (Gráfica)" },
] as const;

export function StatisticsHeader({ 
  filters, 
  onFilterChange, 
  selectedReport, 
  onReportChange 
}: StatisticsHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Page Title */}
      <div className="flex items-center gap-2">
        <BarChart3 className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Estadísticas</h1>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Report Selector */}
        <div className="flex-1 max-w-md">
          <Select value={selectedReport} onValueChange={(value) => onReportChange(value as StatisticsReportType)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar informe" />
            </SelectTrigger>
            <SelectContent>
              {reportOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center gap-4">
          <EnhancedDateSelector
            dateRange={filters.dateRange}
            onDateRangeChange={(range) => onFilterChange({ dateRange: range })}
          />
        </div>
      </div>
    </div>
  );
}