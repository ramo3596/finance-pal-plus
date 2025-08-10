import { useState } from "react";
import { Layout } from "@/components/Layout";
import { ContactsHeader } from "@/components/contacts/ContactsHeader";
import { ContactsList } from "@/components/contacts/ContactsList";
import { FloatingActionButton } from "@/components/shared/FloatingActionButton";
import { AddContactDialog } from "@/components/contacts/AddContactDialog";

export default function Contacts() {
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);

  return (
    <Layout>
      <div className="space-y-6">
        <ContactsHeader onAddContact={() => setIsAddContactOpen(true)} />
        <ContactsList />
      </div>

      <FloatingActionButton 
        onClick={() => setIsAddContactOpen(true)}
      />

      <AddContactDialog 
        open={isAddContactOpen}
        onOpenChange={setIsAddContactOpen}
      />
    </Layout>
  );
}