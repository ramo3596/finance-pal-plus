import { useState } from "react";
import { Layout } from "@/components/Layout";
import { ContactsHeader } from "@/components/contacts/ContactsHeader";
import { ContactsList } from "@/components/contacts/ContactsList";
import { AddContactDialog } from "@/components/contacts/AddContactDialog";
import { FloatingActionButton } from "@/components/shared/FloatingActionButton";

export default function Contacts() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  return (
    <Layout>
      <div className="space-y-6">
        <ContactsHeader />
        <ContactsList />
      </div>

      <AddContactDialog open={showAddDialog} onOpenChange={setShowAddDialog} />
      <FloatingActionButton label="Nuevo Contacto" onClick={() => setShowAddDialog(true)} />
    </Layout>
  );
}