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
import { EditTagDialog } from "./EditTagDialog";
import { Trash2, GripVertical } from "lucide-react";
import { Tag } from "@/hooks/useSettings";

interface SortableTagItemProps {
  tag: Tag;
  onUpdate: (id: string, updates: Partial<Tag>) => void;
  onDelete: (id: string) => void;
}

function SortableTagItem({ tag, onUpdate, onDelete }: SortableTagItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tag.id });

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
          className="w-8 h-8 rounded-full"
          style={{ backgroundColor: tag.color }}
        />
        <span className="font-medium">{tag.name}</span>
      </div>
      <div className="flex gap-2">
        <EditTagDialog tag={tag} onUpdate={onUpdate} />
        <Button variant="destructive" size="sm" onClick={() => onDelete(tag.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

interface DraggableTagListProps {
  tags: Tag[];
  onUpdate: (id: string, updates: Partial<Tag>) => void;
  onDelete: (id: string) => void;
  onReorder: (tags: Tag[]) => void;
}

export function DraggableTagList({
  tags,
  onUpdate,
  onDelete,
  onReorder,
}: DraggableTagListProps) {
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
      const oldIndex = tags.findIndex((item) => item.id === active.id);
      const newIndex = tags.findIndex((item) => item.id === over.id);
      const newOrder = arrayMove(tags, oldIndex, newIndex);
      onReorder(newOrder);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={tags} strategy={verticalListSortingStrategy}>
        <div className="space-y-4">
          {tags.map((tag) => (
            <SortableTagItem
              key={tag.id}
              tag={tag}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}