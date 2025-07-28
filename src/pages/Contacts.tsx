import { Layout } from "@/components/Layout";
import { ContactsHeader } from "@/components/contacts/ContactsHeader";
import { ContactsList } from "@/components/contacts/ContactsList";

export default function Contacts() {
  return (
    <Layout>
      <div className="space-y-6">
        <ContactsHeader />
        <ContactsList />
      </div>
    </Layout>
  );
}