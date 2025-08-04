import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Transaction } from "@/hooks/useTransactions";
import { StatisticsFilters } from "@/pages/Statistics";
import { format, eachDayOfInterval, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";

interface FundFlowChartProps {
  transactions: Transaction[];
  filters: StatisticsFilters;
}

export function FundFlowChart({ transactions, filters }: FundFlowChartProps) {
  const chartData = useMemo(() => {
    if (!filters.dateRange.from || !filters.dateRange.to) return [];

    // Get all days in the range
    const days = eachDayOfInterval({
      start: filters.dateRange.from,
      end: filters.dateRange.to
    });

    // Calculate daily income and expenses
    const data = days.map(day => {
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);
      
      // Get transactions for this day
      const dayTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.transaction_date);
        return transactionDate >= dayStart && transactionDate <= dayEnd;
      });

      // Calculate income and expenses
      const income = dayTransactions
        .filter(t => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0);
      
      const expenses = dayTransactions
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      return {
        date: format(day, 'dd/MM', { locale: es }),
        fullDate: format(day, 'dd MMMM yyyy', { locale: es }),
        income: income,
        expenses: expenses,
        net: income - expenses
      };
    });

    return data;
  }, [transactions, filters.dateRange]);

  const chartConfig = {
    income: {
      label: "Ingresos",
      color: "hsl(142, 76%, 36%)",
    },
    expenses: {
      label: "Gastos",
      color: "hsl(0, 84%, 60%)",
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Flujo de Fondos</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
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
                formatter={(value: number, name: string) => [
                  `$${value.toFixed(2)}`, 
                  name === 'income' ? 'Ingresos' : 'Gastos'
                ]}
              />
              <Bar dataKey="income" fill="var(--color-income)" radius={[2, 2, 0, 0]} />
              <Bar dataKey="expenses" fill="var(--color-expenses)" radius={[2, 2, 0, 0]} />
            </BarChart>
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