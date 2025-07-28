import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, User, Building, X, Trash2 } from "lucide-react";
import { useContacts } from "@/hooks/useContacts";
import { useSettings } from "@/hooks/useSettings";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const contactSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  contact_type: z.enum(["persona", "empresa"]),
  image_url: z.string().optional(),
  address: z.string().optional(),
  identification_number: z.string().optional(),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  website: z.string().url("URL inválida").optional().or(z.literal("")),
  internal_notes: z.string().optional(),
});

type ContactFormData = z.infer<typeof contactSchema>;

interface Contact {
  id: string;
  name: string;
  contact_type: 'persona' | 'empresa';
  image_url?: string;
  address?: string;
  identification_number?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  website?: string;
  internal_notes?: string;
  tags: Array<{ id: string; name: string; color: string }>;
  totalExpenses: number;
  totalIncome: number;
}

interface EditContactDialogProps {
  contact: Contact;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditContactDialog({ contact, open, onOpenChange }: EditContactDialogProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [imagePreview, setImagePreview] = useState<string>("");
  
  const { updateContact, deleteContact, loading } = useContacts();
  const { tags } = useSettings();

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      contact_type: "persona",
      image_url: "",
      address: "",
      identification_number: "",
      phone: "",
      mobile: "",
      email: "",
      website: "",
      internal_notes: "",
    },
  });

  useEffect(() => {
    if (contact && open) {
      form.reset({
        name: contact.name,
        contact_type: contact.contact_type,
        image_url: contact.image_url || "",
        address: contact.address || "",
        identification_number: contact.identification_number || "",
        phone: contact.phone || "",
        mobile: contact.mobile || "",
        email: contact.email || "",
        website: contact.website || "",
        internal_notes: contact.internal_notes || "",
      });
      setSelectedTags(contact.tags.map(tag => tag.id));
      setImagePreview(contact.image_url || "");
    }
  }, [contact, open, form]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreview(result);
        form.setValue("image_url", result);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const onSubmit = async (data: ContactFormData) => {
    try {
      await updateContact(contact.id, {
        ...data,
        tagIds: selectedTags,
      });
      
      toast.success("Contacto actualizado exitosamente");
      onOpenChange(false);
    } catch (error) {
      toast.error("Error al actualizar el contacto");
      console.error(error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteContact(contact.id);
      toast.success("Contacto eliminado exitosamente");
      onOpenChange(false);
    } catch (error) {
      toast.error("Error al eliminar el contacto");
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            Editar Contacto
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar contacto?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. El contacto será eliminado permanentemente.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Tipo de Contacto */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Contacto</label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={contact.contact_type === "persona" ? "default" : "outline"}
                  onClick={() => form.setValue("contact_type", "persona")}
                  className="flex-1"
                >
                  <User className="h-4 w-4 mr-2" />
                  Persona
                </Button>
                <Button
                  type="button"
                  variant={contact.contact_type === "empresa" ? "default" : "outline"}
                  onClick={() => form.setValue("contact_type", "empresa")}
                  className="flex-1"
                >
                  <Building className="h-4 w-4 mr-2" />
                  Empresa
                </Button>
              </div>
            </div>

            {/* Imagen/Logo */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {contact.contact_type === "persona" ? "Imagen de perfil" : "Logotipo"}
              </label>
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={imagePreview} />
                  <AvatarFallback>
                    <Upload className="h-8 w-8" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="mb-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    Formatos soportados: JPG, PNG, GIF
                  </p>
                </div>
              </div>
            </div>

            {/* Resto de campos igual que AddContactDialog */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {contact.contact_type === "persona" ? "Nombre completo" : "Razón social"}
                  </FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dirección</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="identification_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {contact.contact_type === "persona" ? "Número de identificación" : "NIT"}
                  </FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="mobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Celular</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo electrónico</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sitio web</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Etiquetas</label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                    className="cursor-pointer"
                    style={selectedTags.includes(tag.id) ? { backgroundColor: tag.color, color: 'white' } : {}}
                    onClick={() => toggleTag(tag.id)}
                  >
                    {tag.name}
                    {selectedTags.includes(tag.id) && (
                      <X className="h-3 w-3 ml-1" />
                    )}
                  </Badge>
                ))}
              </div>
            </div>

            <FormField
              control={form.control}
              name="internal_notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas internas</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}