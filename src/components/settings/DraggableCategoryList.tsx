import React from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
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
import { Badge } from "@/components/ui/badge";
import { EditCategoryDialog } from "./EditCategoryDialog";
import { EditSubcategoryDialog } from "./EditSubcategoryDialog";
import { AddSubcategoryDialog } from "./AddSubcategoryDialog";
import { Trash2, GripVertical } from "lucide-react";
import { Category, Subcategory } from "@/hooks/useSettings";

interface SortableCategoryItemProps {
  category: Category;
  onUpdate: (id: string, updates: Partial<Category>) => void;
  onDelete: (id: string) => void;
  onCreateSubcategory: (subcategory: Omit<Subcategory, 'id' | 'created_at'>) => Promise<void>;
  onUpdateSubcategory: (id: string, updates: Partial<Subcategory>) => Promise<void>;
  onDeleteSubcategory: (id: string) => Promise<void>;
}

function SortableCategoryItem({
  category,
  onUpdate,
  onDelete,
  onCreateSubcategory,
  onUpdateSubcategory,
  onDeleteSubcategory,
}: SortableCategoryItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border rounded-lg p-4 space-y-3 bg-background"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
            style={{ backgroundColor: category.color + '20' }}
          >
            {category.icon}
          </div>
          <div>
            <h3 className="font-medium">{category.name}</h3>
            <Badge variant="secondary">{category.nature}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <AddSubcategoryDialog
            categoryId={category.id}
            categoryName={category.name}
            onAdd={onCreateSubcategory}
          />
          <EditCategoryDialog category={category} onUpdate={onUpdate} />
          <Button variant="destructive" size="sm" onClick={() => onDelete(category.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Subcategorías */}
      {category.subcategories && category.subcategories.length > 0 && (
        <div className="ml-13 space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Subcategorías:</p>
          <div className="space-y-2">
            {category.subcategories.map((subcategory) => (
              <div
                key={subcategory.id}
                className="flex items-center justify-between p-3 bg-muted rounded"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                    style={{ backgroundColor: category.color + '20' }}
                  >
                    {category.icon}
                  </div>
                  <span className="font-medium">{subcategory.name}</span>
                </div>
                <div className="flex gap-1">
                  <EditSubcategoryDialog
                    subcategory={subcategory}
                    onUpdate={onUpdateSubcategory}
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onDeleteSubcategory(subcategory.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface DraggableCategoryListProps {
  categories: Category[];
  onUpdate: (id: string, updates: Partial<Category>) => void;
  onDelete: (id: string) => void;
  onReorder: (categories: Category[]) => void;
  onCreateSubcategory: (subcategory: Omit<Subcategory, 'id' | 'created_at'>) => Promise<void>;
  onUpdateSubcategory: (id: string, updates: Partial<Subcategory>) => Promise<void>;
  onDeleteSubcategory: (id: string) => Promise<void>;
}

export function DraggableCategoryList({
  categories,
  onUpdate,
  onDelete,
  onReorder,
  onCreateSubcategory,
  onUpdateSubcategory,
  onDeleteSubcategory,
}: DraggableCategoryListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = categories.findIndex((item) => item.id === active.id);
      const newIndex = categories.findIndex((item) => item.id === over.id);
      const newOrder = arrayMove(categories, oldIndex, newIndex);
      onReorder(newOrder);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={categories} strategy={verticalListSortingStrategy}>
        <div className="space-y-4">
          {categories.map((category) => (
            <SortableCategoryItem
              key={category.id}
              category={category}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onCreateSubcategory={onCreateSubcategory}
              onUpdateSubcategory={onUpdateSubcategory}
              onDeleteSubcategory={onDeleteSubcategory}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}