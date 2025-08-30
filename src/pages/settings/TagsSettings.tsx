import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tag } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { AddTagDialog } from "@/components/settings/AddTagDialog";
import { DraggableTagList } from "@/components/settings/DraggableTagList";
import { FloatingActionButton } from "@/components/shared/FloatingActionButton";

export default function TagsSettings() {
  const [showAddTagDialog, setShowAddTagDialog] = useState(false);
  
  const {
    tags,
    loading,
    createTag,
    updateTag,
    deleteTag,
    reorderTags,
  } = useSettings();

  const handleDeleteTag = async (id: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar esta etiqueta?")) {
      await deleteTag(id);
    }
  };

  const handleReorderTags = (newOrder: any[]) => {
    reorderTags(newOrder);
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 pb-24">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Definir Etiquetas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : tags.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No hay etiquetas configuradas. Agrega tu primera etiqueta.
              </p>
            ) : (
              <DraggableTagList
                tags={tags}
                onUpdate={updateTag}
                onDelete={handleDeleteTag}
                onReorder={handleReorderTags}
              />
            )}
          </CardContent>
        </Card>

        <FloatingActionButton
          onClick={() => setShowAddTagDialog(true)}
        />

        <AddTagDialog 
          open={showAddTagDialog}
          onOpenChange={setShowAddTagDialog}
          onAdd={createTag} 
        />
      </div>
    </Layout>
  );
}