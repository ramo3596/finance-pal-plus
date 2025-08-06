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

    // Filter accounts based on user selection
    const selectedAccountIds = filters.selectedAccounts.length > 0 
      ? filters.selectedAccounts 
      : accounts.map(a => a.id);

    // Get initial balance from selected accounts
    const initialBalance = accounts
      .filter(account => selectedAccountIds.includes(account.id))
      .reduce((sum, account) => sum + (account.balance || 0), 0);

    // Get all days in the range
    const days = eachDayOfInterval({
      start: filters.dateRange.from,
      end: filters.dateRange.to
    });

    // Filter transactions based on selected accounts and date range
    const filteredTransactions = transactions.filter(t => {
      // Filter by account if specified
      if (filters.selectedAccounts.length > 0) {
        return filters.selectedAccounts.includes(t.account_id) ||
               (t.to_account_id && filters.selectedAccounts.includes(t.to_account_id));
      }
      return true;
    });

    // Calculate running balance for each day
    const data = days.map(day => {
      const dayStart = startOfDay(day);
      
      // Get all transactions up to this day (including the day)
      const transactionsUpToDay = filteredTransactions.filter(t => {
        const transactionDate = new Date(t.transaction_date);
        return transactionDate <= dayStart;
      });

      // Calculate balance from transactions
      const transactionBalance = transactionsUpToDay.reduce((sum, t) => {
        // For transfers, only count if both accounts are selected or no filter is applied
        if (t.type === 'transfer' && t.to_account_id) {
          if (filters.selectedAccounts.length > 0) {
            const fromAccountSelected = filters.selectedAccounts.includes(t.account_id);
            const toAccountSelected = filters.selectedAccounts.includes(t.to_account_id);
            
            if (fromAccountSelected && toAccountSelected) {
              // Both accounts selected, transfer is neutral
              return sum;
            } else if (fromAccountSelected) {
              // Only source account selected, it's an outflow
              return sum - Math.abs(t.amount);
            } else if (toAccountSelected) {
              // Only destination account selected, it's an inflow
              return sum + Math.abs(t.amount);
            }
            return sum;
          }
          // No filter applied, transfer is neutral
          return sum;
        }
        
        // For income and expense transactions
        return sum + t.amount;
      }, 0);

      // Total balance = initial balance + transaction changes
      const totalBalance = initialBalance + transactionBalance;

      return {
        date: format(day, 'dd/MM', { locale: es }),
        fullDate: format(day, 'dd MMMM yyyy', { locale: es }),
        balance: totalBalance,
        formattedBalance: `$${totalBalance.toFixed(2)}`
      };
    });

    return data;
  }, [transactions, filters.dateRange, filters.selectedAccounts, accounts]);

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