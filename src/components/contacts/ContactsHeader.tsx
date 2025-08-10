import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface ContactsHeaderProps {
  onAddContact?: () => void;
}

export function ContactsHeader({ onAddContact }: ContactsHeaderProps) {
  const isMobile = useIsMobile();

  return (
    <div className="flex justify-between items-center">
      <h1 className="text-3xl font-bold">Contactos</h1>
      {!isMobile && (
        <Button onClick={onAddContact}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Contacto
        </Button>
      )}
    </div>
  );
}