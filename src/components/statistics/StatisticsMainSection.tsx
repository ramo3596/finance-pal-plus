import { Transaction } from "@/hooks/useTransactions";
import { StatisticsFilters, StatisticsReportType } from "@/pages/Statistics";
import { IncomeExpenseTable } from "@/components/statistics/reports/IncomeExpenseTable";
import { BalanceChart } from "@/components/statistics/reports/BalanceChart";
import { FundFlowChart } from "@/components/statistics/reports/FundFlowChart";
import { AccumulatedCashFlowChart } from "@/components/statistics/reports/AccumulatedCashFlowChart";
import { IncomeChart } from "@/components/statistics/reports/IncomeChart";
import { ExpenseChart } from "@/components/statistics/reports/ExpenseChart";
import { AccumulatedVariationChart } from "@/components/statistics/reports/AccumulatedVariationChart";
import { AccumulatedExpensesChart } from "@/components/statistics/reports/AccumulatedExpensesChart";
import { useMemo } from "react";
import { useSettings } from "@/hooks/useSettings";
import { format, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";

interface StatisticsMainSectionProps {
  transactions: Transaction[];
  filters: StatisticsFilters;
  selectedReport: StatisticsReportType;
}

export function StatisticsMainSection({ 
  transactions, 
  filters, 
  selectedReport 
}: StatisticsMainSectionProps) {
  const { tags } = useSettings();

  // Filter transactions based on applied filters
  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      // Search term filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        if (!transaction.description.toLowerCase().includes(searchLower) &&
            !transaction.beneficiary?.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Account filter
      if (filters.selectedAccounts.length > 0) {
        if (!filters.selectedAccounts.includes(transaction.account_id)) {
          return false;
        }
      }

      // Category filter
      if (filters.selectedCategories.length > 0) {
        if (!transaction.category_id || !filters.selectedCategories.includes(transaction.category_id)) {
          return false;
        }
      }

      // Tag filter
      if (filters.selectedTags.length > 0) {
        const hasMatchingTag = transaction.tags.some(tagName => {
          const tag = tags.find(t => t.name === tagName);
          return tag && filters.selectedTags.includes(tag.id);
        });
        if (!hasMatchingTag) {
          return false;
        }
      }

      // Type filter
      if (filters.selectedTypes.length > 0) {
        if (!filters.selectedTypes.includes(transaction.type)) {
          return false;
        }
      }

      // Payment method filter
      if (filters.selectedPaymentMethods.length > 0) {
        if (!transaction.payment_method || !filters.selectedPaymentMethods.includes(transaction.payment_method)) {
          return false;
        }
      }

      // Date range filter
      if (filters.dateRange.from || filters.dateRange.to) {
        const transactionDate = new Date(transaction.transaction_date);
        if (filters.dateRange.from && isBefore(transactionDate, startOfDay(filters.dateRange.from))) {
          return false;
        }
        if (filters.dateRange.to && isAfter(transactionDate, endOfDay(filters.dateRange.to))) {
          return false;
        }
      }

      // Amount range filter
      const absAmount = Math.abs(transaction.amount);
      if (filters.amountRange.max > filters.amountRange.min) {
        if (absAmount < filters.amountRange.min || absAmount > filters.amountRange.max) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, filters, tags]);

  // Render the selected report
  const renderReport = () => {
    switch (selectedReport) {
      case "income-expense-table":
        return <IncomeExpenseTable transactions={filteredTransactions} filters={filters} />;
      case "balance-chart":
        return <BalanceChart transactions={filteredTransactions} filters={filters} />;
      case "fund-flow-chart":
        return <FundFlowChart transactions={filteredTransactions} filters={filters} />;
      case "accumulated-cash-flow-chart":
        return <AccumulatedCashFlowChart transactions={filteredTransactions} filters={filters} />;
      case "income-chart":
        return <IncomeChart transactions={filteredTransactions} filters={filters} />;
      case "expense-chart":
        return <ExpenseChart transactions={filteredTransactions} filters={filters} />;
      case "accumulated-variation-chart":
        return <AccumulatedVariationChart transactions={filteredTransactions} filters={filters} />;
      case "accumulated-expenses-chart":
        return <AccumulatedExpensesChart transactions={filteredTransactions} filters={filters} />;
      default:
        return <IncomeExpenseTable transactions={filteredTransactions} filters={filters} />;
    }
  };

  return (
    <div className="space-y-6">
      {renderReport()}
    </div>
  );
}