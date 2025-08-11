import { ReactNode } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GripVertical } from 'lucide-react';
import { useIsMobile } from "@/hooks/use-mobile";

interface DashboardCardProps {
  id: string;
  title: string;
  children: ReactNode;
  className?: string;
}

export function DashboardCard({ id, title, children, className = "" }: DashboardCardProps) {
  const isMobile = useIsMobile();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card 
      ref={setNodeRef} 
      style={style} 
      className={`${className} ${isDragging ? 'opacity-50' : ''} ${isMobile ? 'w-screen -mx-2' : ''}`}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab hover:cursor-grabbing p-1 hover:bg-secondary rounded"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}