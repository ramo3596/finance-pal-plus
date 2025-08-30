import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Dashboard } from "@/components/Dashboard";
import { useAuth } from "@/hooks/useAuth";
import { Loader } from "lucide-react";
import FloatingActionMenu from "@/components/shared/FloatingActionMenu";
import { AddTransaction } from "@/components/AddTransaction";
import { AIChat } from "@/components/shared/AIChat";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [defaultTransactionTab, setDefaultTransactionTab] = useState<"expense" | "income" | "transfer">("expense");

  const handleNewTransaction = () => {
    setDefaultTransactionTab("expense");
    setShowAddTransaction(true);
  };

  const handleTransfer = () => {
    setDefaultTransactionTab("transfer");
    setShowAddTransaction(true);
  };

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Layout>
      <Dashboard />

      <FloatingActionMenu 
        onNewTransaction={handleNewTransaction}
        onTransfer={handleTransfer}
      />

      <AddTransaction
        open={showAddTransaction}
        onOpenChange={setShowAddTransaction}
        defaultTab={defaultTransactionTab}
      />
      
      <AIChat />
    </Layout>
  );
};

export default Index;
