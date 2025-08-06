import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Phone, TrendingUp, TrendingDown } from "lucide-react";
import { useState } from "react";
import { EditContactDialog } from "./EditContactDialog";

interface Contact {
  id: string;
  name: string;
  contact_type: 'persona' | 'empresa';
  image_url?: string;
  email?: string;
  mobile?: string;
  tags: Array<{ id: string; name: string; color: string }>;
  totalExpenses: number;
  totalIncome: number;
}

interface ContactCardProps {
  contact: Contact;
}

export function ContactCard({ contact }: ContactCardProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <>
      <Card 
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => setShowEditDialog(true)}
      >
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={contact.image_url} />
              <AvatarFallback>{getInitials(contact.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium truncate">{contact.name}</h3>
              <p className="text-sm text-muted-foreground capitalize">
                {contact.contact_type}
              </p>
            </div>
          </div>

          {contact.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {contact.tags.slice(0, 2).map((tag) => (
                <Badge 
                  key={tag.id}
                  variant="secondary"
                  style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                  className="text-xs"
                >
                  {tag.name}
                </Badge>
              ))}
              {contact.tags.length > 2 && (
                <Badge variant="secondary" className="text-xs">
                  +{contact.tags.length - 2}
                </Badge>
              )}
            </div>
          )}

          <div className="space-y-1 text-sm">
            {contact.mobile && (
              <div className="flex items-center text-muted-foreground">
                <Phone className="h-3 w-3 mr-2" />
                <span className="truncate">{contact.mobile}</span>
              </div>
            )}
            {contact.email && (
              <div className="flex items-center text-muted-foreground">
                <Mail className="h-3 w-3 mr-2" />
                <span className="truncate">{contact.email}</span>
              </div>
            )}
          </div>

          <div className="flex justify-between text-xs">
            <div className="flex items-center text-destructive">
              <TrendingDown className="h-3 w-3 mr-1" />
              <span>{formatCurrency(contact.totalExpenses)}</span>
            </div>
            <div className="flex items-center" style={{ color: 'hsl(var(--success))' }}>
              <TrendingUp className="h-3 w-3 mr-1" />
              <span>{formatCurrency(contact.totalIncome)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <EditContactDialog
        contact={contact}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
      />
    </>
  );
}