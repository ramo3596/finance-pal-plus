import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IncomeScheduledForm } from './IncomeScheduledForm';
import { ExpenseScheduledForm } from './ExpenseScheduledForm';
import { TransferScheduledForm } from './TransferScheduledForm';

interface AddScheduledPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddScheduledPaymentDialog = ({ open, onOpenChange }: AddScheduledPaymentDialogProps) => {
  const [activeTab, setActiveTab] = useState('income');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Añada un pago programado</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="income">Ingresos</TabsTrigger>
            <TabsTrigger value="expense">Gasto</TabsTrigger>
            <TabsTrigger value="transfer">Transferencia</TabsTrigger>
          </TabsList>

          <TabsContent value="income" className="mt-6">
            <IncomeScheduledForm onClose={() => onOpenChange(false)} />
          </TabsContent>

          <TabsContent value="expense" className="mt-6">
            <ExpenseScheduledForm onClose={() => onOpenChange(false)} />
          </TabsContent>

          <TabsContent value="transfer" className="mt-6">
            <TransferScheduledForm onClose={() => onOpenChange(false)} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};