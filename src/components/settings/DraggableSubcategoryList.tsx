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
import { EditSubcategoryDialog } from "./EditSubcategoryDialog";
import { Trash2, GripVertical } from "lucide-react";
import { Subcategory } from "@/hooks/useSettings";

interface SortableSubcategoryItemProps {
  subcategory: Subcategory;
  categoryColor: string;
  onUpdate: (id: string, updates: Partial<Subcategory>) => Promise<void>;
  onDelete: (id: string) => void;
}

function SortableSubcategoryItem({ subcategory, categoryColor, onUpdate, onDelete }: SortableSubcategoryItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: subcategory.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-4 border rounded-lg bg-background hover:bg-muted/50 transition-colors"
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
          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg font-bold"
          style={{ backgroundColor: categoryColor }}
        >
          {subcategory.icon || '📦'}
        </div>
        <div>
          <span className="font-medium text-lg">{subcategory.name}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <EditSubcategoryDialog
          subcategory={subcategory}
          onUpdate={onUpdate}
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(subcategory.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

interface DraggableSubcategoryListProps {
  subcategories: Subcategory[];
  categoryColor: string;
  onUpdate: (id: string, updates: Partial<Subcategory>) => Promise<void>;
  onDelete: (id: string) => void;
  onReorder: (subcategories: Subcategory[]) => void;
}

export function DraggableSubcategoryList({
  subcategories,
  categoryColor,
  onUpdate,
  onDelete,
  onReorder,
}: DraggableSubcategoryListProps) {
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
      const oldIndex = subcategories.findIndex((item) => item.id === active.id);
      const newIndex = subcategories.findIndex((item) => item.id === over.id);
      const newOrder = arrayMove(subcategories, oldIndex, newIndex);
      onReorder(newOrder);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={subcategories} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {subcategories.map((subcategory) => (
            <SortableSubcategoryItem
              key={subcategory.id}
              subcategory={subcategory}
              categoryColor={categoryColor}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}