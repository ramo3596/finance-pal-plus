import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Transaction } from "@/hooks/useTransactions";
import { StatisticsFilters } from "@/pages/Statistics";
import { format, eachDayOfInterval, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from "recharts";

interface AccumulatedExpensesChartProps {
  transactions: Transaction[];
  filters: StatisticsFilters;
}

export function AccumulatedExpensesChart({ transactions, filters }: AccumulatedExpensesChartProps) {
  const chartData = useMemo(() => {
    if (!filters.dateRange.from || !filters.dateRange.to) return [];

    // Get all days in the range
    const days = eachDayOfInterval({
      start: filters.dateRange.from,
      end: filters.dateRange.to
    });

    let accumulatedExpenses = 0;

    // Calculate accumulated expenses for each day
    const data = days.map(day => {
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);
      
      // Get transactions for this day
      const dayTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.transaction_date);
        return transactionDate >= dayStart && transactionDate <= dayEnd;
      });

      // Calculate daily expenses
      const dailyExpenses = dayTransactions
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      // Add to accumulated expenses
      accumulatedExpenses += dailyExpenses;

      return {
        date: format(day, 'dd/MM', { locale: es }),
        fullDate: format(day, 'dd MMMM yyyy', { locale: es }),
        accumulatedExpenses: accumulatedExpenses,
        dailyExpenses: dailyExpenses
      };
    });

    return data;
  }, [transactions, filters.dateRange]);

  const chartConfig = {
    accumulatedExpenses: {
      label: "Gastos Acumulados",
      color: "hsl(0, 84%, 60%)",
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gastos Acumulados</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
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
                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Gastos Acumulados']}
              />
              <Area
                type="monotone"
                dataKey="accumulatedExpenses"
                stroke="var(--color-accumulatedExpenses)"
                fill="var(--color-accumulatedExpenses)"
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </AreaChart>
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