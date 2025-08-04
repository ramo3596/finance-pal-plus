import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Transaction } from "@/hooks/useTransactions";
import { StatisticsFilters } from "@/pages/Statistics";
import { format, eachDayOfInterval, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts";

interface AccumulatedCashFlowChartProps {
  transactions: Transaction[];
  filters: StatisticsFilters;
}

export function AccumulatedCashFlowChart({ transactions, filters }: AccumulatedCashFlowChartProps) {
  const chartData = useMemo(() => {
    if (!filters.dateRange.from || !filters.dateRange.to) return [];

    // Get all days in the range
    const days = eachDayOfInterval({
      start: filters.dateRange.from,
      end: filters.dateRange.to
    });

    let accumulatedIncome = 0;
    let accumulatedExpenses = 0;

    // Calculate accumulated cash flow for each day
    const data = days.map(day => {
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);
      
      // Get transactions for this day
      const dayTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.transaction_date);
        return transactionDate >= dayStart && transactionDate <= dayEnd;
      });

      // Calculate daily income and expenses
      const dailyIncome = dayTransactions
        .filter(t => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0);
      
      const dailyExpenses = dayTransactions
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      // Add to accumulated totals
      accumulatedIncome += dailyIncome;
      accumulatedExpenses += dailyExpenses;

      return {
        date: format(day, 'dd/MM', { locale: es }),
        fullDate: format(day, 'dd MMMM yyyy', { locale: es }),
        accumulatedIncome: accumulatedIncome,
        accumulatedExpenses: accumulatedExpenses,
        netCashFlow: accumulatedIncome - accumulatedExpenses
      };
    });

    return data;
  }, [transactions, filters.dateRange]);

  const chartConfig = {
    accumulatedIncome: {
      label: "Ingresos Acumulados",
      color: "hsl(142, 76%, 36%)",
    },
    accumulatedExpenses: {
      label: "Gastos Acumulados",
      color: "hsl(0, 84%, 60%)",
    },
    netCashFlow: {
      label: "Flujo Neto",
      color: "hsl(var(--primary))",
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Flujo de Efectivo Acumulado</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
              />
              <ChartTooltip 
                content={<ChartTooltipContent />}
                labelFormatter={(_, payload) => {
                  if (payload && payload[0]) {
                    return payload[0].payload.fullDate;
                  }
                  return '';
                }}
                formatter={(value: number, name: string) => {
                  const labels = {
                    accumulatedIncome: 'Ingresos Acumulados',
                    accumulatedExpenses: 'Gastos Acumulados',
                    netCashFlow: 'Flujo Neto'
                  };
                  return [`$${value.toFixed(2)}`, labels[name as keyof typeof labels] || name];
                }}
              />
              <Line
                type="monotone"
                dataKey="accumulatedIncome"
                stroke="var(--color-accumulatedIncome)"
                strokeWidth={2}
                dot={{ fill: "var(--color-accumulatedIncome)", r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="accumulatedExpenses"
                stroke="var(--color-accumulatedExpenses)"
                strokeWidth={2}
                dot={{ fill: "var(--color-accumulatedExpenses)", r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="netCashFlow"
                stroke="var(--color-netCashFlow)"
                strokeWidth={3}
                dot={{ fill: "var(--color-netCashFlow)", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>

        {chartData.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No hay datos para el período seleccionado
          </div>
        )}
      </CardContent>
    </Card>
  );
}