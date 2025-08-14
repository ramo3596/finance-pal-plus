import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface RegisterPurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RegisterPurchaseDialog({ open, onOpenChange }: RegisterPurchaseDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar compras</DialogTitle>
        </DialogHeader>
        
        <div className="p-4 text-center text-muted-foreground">
          Funcionalidad en desarrollo
        </div>
      </DialogContent>
    </Dialog>
  );
}