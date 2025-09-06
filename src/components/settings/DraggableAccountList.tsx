import React from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { EditAccountDialog } from "./EditAccountDialog";
import { Trash2, GripVertical } from "lucide-react";
import { Account } from "@/hooks/useSettings";

interface SortableAccountItemProps {
  account: Account;
  onUpdate: (id: string, updates: Partial<Account>) => void;
  onDelete: (id: string) => void;
}

function SortableAccountItem({ account, onUpdate, onDelete }: SortableAccountItemProps) {
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
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-4 border rounded-lg bg-background"
    >
      <div className="flex items-center gap-3">
        <div
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded touch-none select-none transition-colors"
          style={{ touchAction: 'none' }}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
          style={{ backgroundColor: account.color + '20' }}
        >
          {account.icon}
        </div>
        <div>
          <h3 className="font-medium">{account.name}</h3>
          <p className="text-sm text-muted-foreground">
            Saldo: ${account.balance?.toFixed(2) || '0.00'}
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <EditAccountDialog account={account} onUpdate={onUpdate} />
        <Button variant="destructive" size="sm" onClick={() => onDelete(account.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

interface DraggableAccountListProps {
  accounts: Account[];
  onUpdate: (id: string, updates: Partial<Account>) => void;
  onDelete: (id: string) => void;
  onReorder: (accounts: Account[]) => void;
}

export function DraggableAccountList({
  accounts,
  onUpdate,
  onDelete,
  onReorder,
}: DraggableAccountListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = accounts.findIndex((item) => item.id === active.id);
      const newIndex = accounts.findIndex((item) => item.id === over.id);
      const newOrder = arrayMove(accounts, oldIndex, newIndex);
      onReorder(newOrder);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={accounts} strategy={verticalListSortingStrategy}>
        <div className="space-y-4">
          {accounts.map((account) => (
            <SortableAccountItem
              key={account.id}
              account={account}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}