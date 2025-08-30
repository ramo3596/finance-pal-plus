import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Dashboard } from "@/components/Dashboard";
import { useAuth } from "@/hooks/useAuth";
import { Loader } from "lucide-react";
import { FloatingActionButton } from "@/components/shared/FloatingActionButton";
import { AddTransaction } from "@/components/AddTransaction";
import { AIChat } from "@/components/shared/AIChat";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [showAddTransaction, setShowAddTransaction] = useState(false);

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

      <FloatingActionButton 
        onClick={() => setShowAddTransaction(true)}
      />

      <AIChat isDashboard={true} />

      <AddTransaction
        open={showAddTransaction}
        onOpenChange={setShowAddTransaction}
      />
    </Layout>
  );
};

export default Index;
