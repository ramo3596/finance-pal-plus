import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Transaction } from "@/hooks/useTransactions";
import { StatisticsFilters } from "@/pages/Statistics";
import { useSettings } from "@/hooks/useSettings";
import { format, eachDayOfInterval, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts";

interface BalanceChartProps {
  transactions: Transaction[];
  filters: StatisticsFilters;
}

export function BalanceChart({ transactions, filters }: BalanceChartProps) {
  const { accounts } = useSettings();

  const chartData = useMemo(() => {
    if (!filters.dateRange.from || !filters.dateRange.to) return [];

    // Get all days in the range
    const days = eachDayOfInterval({
      start: filters.dateRange.from,
      end: filters.dateRange.to
    });

    // Calculate running balance for each day
    const data = days.map(day => {
      const dayStart = startOfDay(day);
      
      // Get all transactions up to this day
      const transactionsUpToDay = transactions.filter(t => {
        const transactionDate = new Date(t.transaction_date);
        return transactionDate <= dayStart;
      });

      // Calculate total balance
      const balance = transactionsUpToDay.reduce((sum, t) => sum + t.amount, 0);

      return {
        date: format(day, 'dd/MM', { locale: es }),
        fullDate: format(day, 'dd MMMM yyyy', { locale: es }),
        balance: balance,
        formattedBalance: `$${balance.toFixed(2)}`
      };
    });

    return data;
  }, [transactions, filters.dateRange]);

  const chartConfig = {
    balance: {
      label: "Saldo",
      color: "hsl(var(--primary))",
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Saldo</CardTitle>
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
                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Saldo']}
              />
              <Line
                type="monotone"
                dataKey="balance"
                stroke="var(--color-balance)"
                strokeWidth={2}
                dot={{ fill: "var(--color-balance)", r: 4 }}
                activeDot={{ r: 6 }}
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