import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AddContactDialog } from "./AddContactDialog";

export function ContactsHeader() {
  const [showAddDialog, setShowAddDialog] = useState(false);

  return (
    <>
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Contactos</h1>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Contacto
        </Button>
      </div>
      
      <AddContactDialog 
        open={showAddDialog} 
        onOpenChange={setShowAddDialog}
      />
    </>
  );
}