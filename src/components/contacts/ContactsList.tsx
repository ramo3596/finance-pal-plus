import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { ContactCard } from "./ContactCard";
import { useContacts } from "@/hooks/useContacts";

export function ContactsList() {
  const [searchTerm, setSearchTerm] = useState("");
  const { contacts, loading } = useContacts();

  const filteredContacts = contacts.filter(contact => {
    const search = searchTerm.toLowerCase();
    return (
      contact.name.toLowerCase().includes(search) ||
      contact.email?.toLowerCase().includes(search) ||
      contact.mobile?.toLowerCase().includes(search) ||
      contact.phone?.toLowerCase().includes(search) ||
      contact.identification_number?.toLowerCase().includes(search) ||
      contact.address?.toLowerCase().includes(search) ||
      contact.website?.toLowerCase().includes(search) ||
      contact.internal_notes?.toLowerCase().includes(search)
    );
  });

  if (loading) {
    return <div className="text-center py-8">Cargando contactos...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Buscar por nombre, celular, identificación, correo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredContacts.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {searchTerm ? "No se encontraron contactos" : "No hay contactos registrados"}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContacts.map((contact) => (
            <ContactCard key={contact.id} contact={contact} />
          ))}
        </div>
      )}
    </div>
  );
}