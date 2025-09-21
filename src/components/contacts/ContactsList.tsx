import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Search, Loader } from "lucide-react";
import { ContactCard } from "./ContactCard";
import { useContacts } from "@/hooks/useContacts";

export function ContactsList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [displayedCount, setDisplayedCount] = useState(12);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const { contacts, loading } = useContacts();
  const observerRef = useRef<HTMLDivElement>(null);

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

  const displayedContacts = filteredContacts.slice(0, displayedCount);
  const hasMoreContacts = displayedCount < filteredContacts.length;

  // Reset displayed count when search term changes
  useEffect(() => {
    setDisplayedCount(12);
  }, [searchTerm]);

  // Load more contacts function
  const loadMoreContacts = useCallback(() => {
    if (isLoadingMore || !hasMoreContacts) return;
    
    setIsLoadingMore(true);
    // Simulate loading delay for better UX
    setTimeout(() => {
      setDisplayedCount(prev => Math.min(prev + 12, filteredContacts.length));
      setIsLoadingMore(false);
    }, 300);
  }, [isLoadingMore, hasMoreContacts, filteredContacts.length]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasMoreContacts && !isLoadingMore) {
          loadMoreContacts();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px'
      }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => {
      if (observerRef.current) {
        observer.unobserve(observerRef.current);
      }
    };
  }, [hasMoreContacts, isLoadingMore, loadMoreContacts]);

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
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedContacts.map((contact) => (
              <ContactCard key={contact.id} contact={contact} />
            ))}
          </div>
          
          {/* Loading indicator */}
          {isLoadingMore && (
            <div className="flex justify-center py-4">
              <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          
          {/* Intersection observer target */}
          {hasMoreContacts && (
            <div ref={observerRef} className="h-4" />
          )}
          
          {/* Results summary */}
          <div className="text-center py-4 text-sm text-muted-foreground">
            Mostrando {displayedContacts.length} de {filteredContacts.length} contactos
            {hasMoreContacts && " (desplázate para cargar más)"}
          </div>
        </>
      )}
    </div>
  );
}