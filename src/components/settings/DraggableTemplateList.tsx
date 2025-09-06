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
import { Badge } from "@/components/ui/badge";
import { EditTemplateDialog } from "./EditTemplateDialog";
import { Trash2, GripVertical } from "lucide-react";
import { Template, Account, Category, Tag } from "@/hooks/useSettings";

interface SortableTemplateItemProps {
  template: Template;
  accounts: Account[];
  categories: Category[];
  tags: Tag[];
  onUpdate: (id: string, updates: Partial<Template>) => void;
  onDelete: (id: string) => void;
}

function SortableTemplateItem({
  template,
  accounts,
  categories,
  tags,
  onUpdate,
  onDelete,
}: SortableTemplateItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: template.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Ingresos": return "text-green-600";
      case "Gastos": return "text-red-600";
      case "Transferencias": return "text-blue-600";
      default: return "text-muted-foreground";
    }
  };

  const getCategoryName = (categoryId?: string, subcategoryId?: string) => {
    if (!categoryId) return "Sin categoría";
    
    const category = categories.find(c => c.id === categoryId);
    if (!category) return "Categoría desconocida";
    
    if (subcategoryId) {
      const subcategory = category.subcategories?.find(s => s.id === subcategoryId);
      if (subcategory) {
        return `${category.name} > ${subcategory.name}`;
      }
    }
    
    return category.name;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-4 border rounded-lg bg-background"
    >
      <div className="flex items-center gap-3 flex-1">
        <div
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded touch-none select-none transition-colors"
          style={{ touchAction: 'none' }}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium">{template.name}</h3>
            <Badge variant="outline" className={getTypeColor(template.type)}>
              {template.type}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Monto: ${template.amount}</p>
            <p>Categoría: {getCategoryName(template.category_id, template.subcategory_id)}</p>
            {template.payment_method && (
              <p>Método: {template.payment_method}</p>
            )}
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <EditTemplateDialog 
          template={template} 
          accounts={accounts}
          categories={categories}
          tags={tags}
          onUpdate={onUpdate} 
        />
        <Button variant="destructive" size="sm" onClick={() => onDelete(template.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

interface DraggableTemplateListProps {
  templates: Template[];
  accounts: Account[];
  categories: Category[];
  tags: Tag[];
  onUpdate: (id: string, updates: Partial<Template>) => void;
  onDelete: (id: string) => void;
  onReorder: (templates: Template[]) => void;
}

export function DraggableTemplateList({
  templates,
  accounts,
  categories,
  tags,
  onUpdate,
  onDelete,
  onReorder,
}: DraggableTemplateListProps) {
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
      const oldIndex = templates.findIndex((item) => item.id === active.id);
      const newIndex = templates.findIndex((item) => item.id === over.id);
      const newOrder = arrayMove(templates, oldIndex, newIndex);
      onReorder(newOrder);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={templates} strategy={verticalListSortingStrategy}>
        <div className="space-y-4">
          {templates.map((template) => (
            <SortableTemplateItem
              key={template.id}
              template={template}
              accounts={accounts}
              categories={categories}
              tags={tags}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}