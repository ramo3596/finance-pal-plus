import { useState } from "react";
import { Layout } from "@/components/Layout";
import { RecordsHeader } from "@/components/records/RecordsHeader";
import { RecordsFilters } from "@/components/records/RecordsFilters";
import { RecordsMainSection } from "@/components/records/RecordsMainSection";
import { useAuth } from "@/hooks/useAuth";
import { useTransactions } from "@/hooks/useTransactions";
import { Loader } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { FloatingActionButton } from "@/components/shared/FloatingActionButton";
import { AddTransaction } from "@/components/AddTransaction";
import { useIsMobile } from "@/hooks/use-mobile";

export interface RecordsFilters {
  searchTerm: string;
  selectedAccounts: string[];
  selectedCategories: string[];
  selectedTags: string[];
  selectedTypes: string[];
  amountRange: { min: number; max: number };
  selectedPaymentMethods: string[];
  status: string;
  dateRange: { from: Date | null; to: Date | null };
  sortBy: string;
}

const Records = () => {
  const { user, loading: authLoading } = useAuth();
  const { transactions, loading: transactionsLoading } = useTransactions();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [filters, setFilters] = useState<RecordsFilters>(() => {
    // Set default date range to last 30 days
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 29);
    
    return {
      searchTerm: "",
      selectedAccounts: [],
      selectedCategories: [],
      selectedTags: [],
      selectedTypes: [],
      amountRange: { min: 0, max: 10000 },
      selectedPaymentMethods: [],
      status: "Todo",
      dateRange: { from: thirtyDaysAgo, to: now },
      sortBy: "date-desc"
    };
  });

  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [showAddTransaction, setShowAddTransaction] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  if (authLoading || transactionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleFilterChange = (newFilters: Partial<RecordsFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTransactions(transactions.map(t => t.id));
    } else {
      setSelectedTransactions([]);
    }
  };

  const handleSelectTransaction = (transactionId: string, checked: boolean) => {
    if (checked) {
      setSelectedTransactions(prev => [...prev, transactionId]);
    } else {
      setSelectedTransactions(prev => prev.filter(id => id !== transactionId));
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <RecordsHeader 
          filters={filters}
          onFilterChange={handleFilterChange}
          onAddTransaction={() => setShowAddTransaction(true)}
        />
        
        <div className={isMobile ? "space-y-4" : "flex gap-6"}>
          {!isMobile && (
            <div className="w-80 flex-shrink-0">
              <RecordsFilters 
                filters={filters}
                onFilterChange={handleFilterChange}
              />
            </div>
          )}
          
          <div className="flex-1">
            <RecordsMainSection
              transactions={transactions}
              filters={filters}
              selectedTransactions={selectedTransactions}
              onSelectAll={handleSelectAll}
              onSelectTransaction={handleSelectTransaction}
            />
          </div>
        </div>
      </div>

      <FloatingActionButton 
        onClick={() => setShowAddTransaction(true)}
      />

      <AddTransaction
        open={showAddTransaction}
        onOpenChange={setShowAddTransaction}
      />
    </Layout>
  );
};

export default Records;