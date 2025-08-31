import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, ArrowLeft } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { AddAccountDialog } from "@/components/settings/AddAccountDialog";
import { EditAccountDialog } from "@/components/settings/EditAccountDialog";
import { DraggableAccountList } from "@/components/settings/DraggableAccountList";
import { FloatingActionButton } from "@/components/shared/FloatingActionButton";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";

export default function AccountsSettings() {
  const [showAddAccountDialog, setShowAddAccountDialog] = useState(false);
  const [editAccountId, setEditAccountId] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  
  const {
    accounts,
    loading,
    createAccount,
    updateAccount,
    deleteAccount,
    reorderAccounts,
  } = useSettings();

  const handleDeleteAccount = async (id: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar esta cuenta?")) {
      await deleteAccount(id);
    }
  };

  const handleReorderAccounts = (newOrder: any[]) => {
    reorderAccounts(newOrder);
  };

  const editAccount = editAccountId ? accounts.find(acc => acc.id === editAccountId) : null;

  return (
    <Layout>
      <div className="container mx-auto p-6 pb-24">
        {isMobile ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mr-2">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <CreditCard className="h-5 w-5" />
                <span>Gestión de Cuentas</span>
              </div>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : accounts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No hay cuentas configuradas. Agrega tu primera cuenta.
              </p>
            ) : (
              <DraggableAccountList
                accounts={accounts}
                onUpdate={updateAccount}
                onDelete={handleDeleteAccount}
                onReorder={handleReorderAccounts}
              />
            )}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Gestión de Cuentas
                </span>
                <div>
                  <AddAccountDialog onAdd={createAccount} />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : accounts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No hay cuentas configuradas. Agrega tu primera cuenta.
                </p>
              ) : (
                <DraggableAccountList
                  accounts={accounts}
                  onUpdate={updateAccount}
                  onDelete={handleDeleteAccount}
                  onReorder={handleReorderAccounts}
                />
              )}
            </CardContent>
          </Card>
        )}

        <FloatingActionButton
          onClick={() => setShowAddAccountDialog(true)}
        />

        <AddAccountDialog
          onAdd={createAccount}
          open={showAddAccountDialog}
          onOpenChange={setShowAddAccountDialog}
        />
        
        {editAccount && (
          <EditAccountDialog
            account={editAccount}
            onUpdate={updateAccount}
            open={true}
            onOpenChange={() => setEditAccountId(null)}
          />
        )}
      </div>
    </Layout>
  );
}