import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTransactions } from "@/hooks/useTransactions";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Loader2 } from "lucide-react";
import { RecordsFilters } from "@/pages/Records";
import { StatisticsHeader } from "@/components/statistics/StatisticsHeader";
import { RecordsFilters as RecordsFiltersComponent } from "@/components/records/RecordsFilters";
import { StatisticsMainSection } from "@/components/statistics/StatisticsMainSection";
import { subDays } from "date-fns";

// Interface for statistics filters (reusing Records filters)
export interface StatisticsFilters extends RecordsFilters {}

export type StatisticsReportType = 
  | "income-expense-table"
  | "balance-chart"
  | "fund-flow-chart"
  | "accumulated-cash-flow-chart"
  | "income-chart"
  | "expense-chart"
  | "accumulated-variation-chart"
  | "accumulated-expenses-chart";

export default function Statistics() {
  const { user, loading: authLoading } = useAuth();
  const { transactions, loading: transactionsLoading } = useTransactions();
  const navigate = useNavigate();

  const [filters, setFilters] = useState<StatisticsFilters>({
    searchTerm: "",
    selectedAccounts: [],
    selectedCategories: [],
    selectedTags: [],
    selectedTypes: [],
    dateRange: {
      from: subDays(new Date(), 30),
      to: new Date()
    },
    amountRange: { min: 0, max: 0 },
    selectedPaymentMethods: [],
    status: "all",
    sortBy: "date-desc"
  });

  const [selectedReport, setSelectedReport] = useState<StatisticsReportType>("income-expense-table");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  if (authLoading || transactionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const handleFilterChange = (newFilters: Partial<StatisticsFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  };

  return (
    <Layout>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filters Sidebar */}
        <div className="w-full lg:w-80 flex-shrink-0">
          <RecordsFiltersComponent
            filters={filters}
            onFilterChange={handleFilterChange}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-6">
          <StatisticsHeader 
            filters={filters}
            onFilterChange={handleFilterChange}
            selectedReport={selectedReport}
            onReportChange={setSelectedReport}
          />
          
          <StatisticsMainSection
            transactions={transactions}
            filters={filters}
            selectedReport={selectedReport}
          />
        </div>
      </div>
    </Layout>
  );
}