import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Edit, Trash2, GripVertical } from "lucide-react";
import { Account } from "@/hooks/useSettings";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface AccountManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: Account[];
  onReorderAccounts: (accounts: Account[]) => void;
  onEditAccount: (account: Account) => void;
  onDeleteAccount: (accountId: string) => void;
}

function SortableAccountItem({ account, onEdit, onDelete }: {
  account: Account;
  onEdit: (account: Account) => void;
  onDelete: (accountId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: account.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card 
      ref={setNodeRef} 
      style={style}
      className={`p-4 mb-2 ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab hover:cursor-grabbing p-1 hover:bg-secondary rounded"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <div 
            className="w-4 h-4 rounded-full flex-shrink-0"
            style={{ backgroundColor: account.color }}
          />
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{account.name}</p>
            <p className="text-sm text-muted-foreground">
              ${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(account)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(account.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

export function AccountManagerDialog({
  open,
  onOpenChange,
  accounts,
  onReorderAccounts,
  onEditAccount,
  onDeleteAccount
}: AccountManagerDialogProps) {
  const [localAccounts, setLocalAccounts] = useState(accounts);

  // Sincronizar el estado local cuando las cuentas cambien
  useEffect(() => {
    setLocalAccounts(accounts);
  }, [accounts]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = localAccounts.findIndex(account => account.id === active.id);
      const newIndex = localAccounts.findIndex(account => account.id === over.id);
      
      const newOrder = arrayMove(localAccounts, oldIndex, newIndex);
      setLocalAccounts(newOrder);
      onReorderAccounts(newOrder);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Gestionar Cuentas</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-96">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={localAccounts.map(account => account.id)}
              strategy={verticalListSortingStrategy}
            >
              {localAccounts.map((account) => (
                <SortableAccountItem
                  key={account.id}
                  account={account}
                  onEdit={onEditAccount}
                  onDelete={onDeleteAccount}
                />
              ))}
            </SortableContext>
          </DndContext>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}