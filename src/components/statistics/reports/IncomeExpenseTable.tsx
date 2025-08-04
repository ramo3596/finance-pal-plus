import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Transaction } from "@/hooks/useTransactions";
import { StatisticsFilters } from "@/pages/Statistics";
import { useSettings } from "@/hooks/useSettings";
import { format, startOfMonth, endOfMonth, eachMonthOfInterval } from "date-fns";
import { es } from "date-fns/locale";
import { useMemo } from "react";

interface IncomeExpenseTableProps {
  transactions: Transaction[];
  filters: StatisticsFilters;
}

export function IncomeExpenseTable({ transactions, filters }: IncomeExpenseTableProps) {
  const { categories } = useSettings();

  // Calculate data by month and category
  const tableData = useMemo(() => {
    if (!filters.dateRange.from || !filters.dateRange.to) return [];

    // Get all months in the date range
    const months = eachMonthOfInterval({
      start: filters.dateRange.from,
      end: filters.dateRange.to
    });

    // Group transactions by month and category
    const monthlyData: Array<{
      month: string;
      monthDate: Date;
      categories: Array<{
        categoryId: string;
        categoryName: string;
        income: number;
        expense: number;
        total: number;
      }>;
      totalIncome: number;
      totalExpense: number;
      netTotal: number;
    }> = [];

    months.forEach(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      // Filter transactions for this month
      const monthTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.transaction_date);
        return transactionDate >= monthStart && transactionDate <= monthEnd;
      });

      // Group by category
      const categoryMap = new Map<string, { income: number; expense: number }>();
      
      monthTransactions.forEach(transaction => {
        const categoryId = transaction.category_id || 'uncategorized';
        const amount = transaction.amount;
        
        if (!categoryMap.has(categoryId)) {
          categoryMap.set(categoryId, { income: 0, expense: 0 });
        }
        
        const categoryData = categoryMap.get(categoryId)!;
        if (amount > 0) {
          categoryData.income += amount;
        } else {
          categoryData.expense += Math.abs(amount);
        }
      });

      // Convert to array format
      const categoriesData: Array<{
        categoryId: string;
        categoryName: string;
        income: number;
        expense: number;
        total: number;
      }> = [];

      categoryMap.forEach((data, categoryId) => {
        const category = categories.find(c => c.id === categoryId);
        const categoryName = category?.name || 'Sin categoría';
        
        categoriesData.push({
          categoryId,
          categoryName,
          income: data.income,
          expense: data.expense,
          total: data.income - data.expense
        });
      });

      // Sort by category name
      categoriesData.sort((a, b) => a.categoryName.localeCompare(b.categoryName));

      // Calculate totals
      const totalIncome = categoriesData.reduce((sum, cat) => sum + cat.income, 0);
      const totalExpense = categoriesData.reduce((sum, cat) => sum + cat.expense, 0);

      monthlyData.push({
        month: format(month, 'MMMM yyyy', { locale: es }),
        monthDate: month,
        categories: categoriesData,
        totalIncome,
        totalExpense,
        netTotal: totalIncome - totalExpense
      });
    });

    return monthlyData;
  }, [transactions, filters.dateRange, categories]);

  // Get all unique categories across all months
  const allCategories = useMemo(() => {
    const categorySet = new Set<string>();
    tableData.forEach(monthData => {
      monthData.categories.forEach(cat => {
        categorySet.add(cat.categoryId);
      });
    });
    
    return Array.from(categorySet).map(categoryId => {
      const category = categories.find(c => c.id === categoryId);
      return {
        id: categoryId,
        name: category?.name || 'Sin categoría'
      };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [tableData, categories]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informe de Ingresos y Gastos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-48">Categoría</TableHead>
                {tableData.map(monthData => (
                  <TableHead key={monthData.month} className="text-center min-w-32">
                    {monthData.month}
                  </TableHead>
                ))}
                <TableHead className="text-center min-w-32 font-bold">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Income Section */}
              <TableRow className="bg-green-50 dark:bg-green-950/20">
                <TableCell className="font-bold text-green-700 dark:text-green-400">INGRESOS</TableCell>
                {tableData.map(monthData => (
                  <TableCell key={monthData.month} className="text-center font-bold text-green-600">
                    ${monthData.totalIncome.toFixed(2)}
                  </TableCell>
                ))}
                <TableCell className="text-center font-bold text-green-600">
                  ${tableData.reduce((sum, m) => sum + m.totalIncome, 0).toFixed(2)}
                </TableCell>
              </TableRow>

              {/* Income Categories */}
              {allCategories.map(category => {
                const totalIncome = tableData.reduce((sum, monthData) => {
                  const catData = monthData.categories.find(c => c.categoryId === category.id);
                  return sum + (catData?.income || 0);
                }, 0);

                if (totalIncome === 0) return null;

                return (
                  <TableRow key={`income-${category.id}`}>
                    <TableCell className="pl-6">{category.name}</TableCell>
                    {tableData.map(monthData => {
                      const catData = monthData.categories.find(c => c.categoryId === category.id);
                      const income = catData?.income || 0;
                      return (
                        <TableCell key={monthData.month} className="text-center">
                          {income > 0 ? `$${income.toFixed(2)}` : '-'}
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-center font-medium text-green-600">
                      ${totalIncome.toFixed(2)}
                    </TableCell>
                  </TableRow>
                );
              })}

              {/* Expense Section */}
              <TableRow className="bg-red-50 dark:bg-red-950/20">
                <TableCell className="font-bold text-red-700 dark:text-red-400">GASTOS</TableCell>
                {tableData.map(monthData => (
                  <TableCell key={monthData.month} className="text-center font-bold text-red-600">
                    $({monthData.totalExpense.toFixed(2)})
                  </TableCell>
                ))}
                <TableCell className="text-center font-bold text-red-600">
                  $({tableData.reduce((sum, m) => sum + m.totalExpense, 0).toFixed(2)})
                </TableCell>
              </TableRow>

              {/* Expense Categories */}
              {allCategories.map(category => {
                const totalExpense = tableData.reduce((sum, monthData) => {
                  const catData = monthData.categories.find(c => c.categoryId === category.id);
                  return sum + (catData?.expense || 0);
                }, 0);

                if (totalExpense === 0) return null;

                return (
                  <TableRow key={`expense-${category.id}`}>
                    <TableCell className="pl-6">{category.name}</TableCell>
                    {tableData.map(monthData => {
                      const catData = monthData.categories.find(c => c.categoryId === category.id);
                      const expense = catData?.expense || 0;
                      return (
                        <TableCell key={monthData.month} className="text-center">
                          {expense > 0 ? `$(${expense.toFixed(2)})` : '-'}
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-center font-medium text-red-600">
                      $(${totalExpense.toFixed(2)})
                    </TableCell>
                  </TableRow>
                );
              })}

              {/* Net Total */}
              <TableRow className="bg-blue-50 dark:bg-blue-950/20 border-t-2">
                <TableCell className="font-bold text-blue-700 dark:text-blue-400">TOTAL NETO</TableCell>
                {tableData.map(monthData => (
                  <TableCell key={monthData.month} className={`text-center font-bold ${
                    monthData.netTotal >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    ${monthData.netTotal.toFixed(2)}
                  </TableCell>
                ))}
                <TableCell className={`text-center font-bold ${
                  tableData.reduce((sum, m) => sum + m.netTotal, 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  ${tableData.reduce((sum, m) => sum + m.netTotal, 0).toFixed(2)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {tableData.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No hay datos para el período seleccionado
          </div>
        )}
      </CardContent>
    </Card>
  );
}