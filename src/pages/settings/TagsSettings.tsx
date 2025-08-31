import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tag, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSettings } from "@/hooks/useSettings";
import { AddTagDialog } from "@/components/settings/AddTagDialog";
import { DraggableTagList } from "@/components/settings/DraggableTagList";
import { FloatingActionButton } from "@/components/shared/FloatingActionButton";

export default function TagsSettings() {
  const [showAddTagDialog, setShowAddTagDialog] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
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
        {isMobile ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(-1)}
                  className="p-1 h-8 w-8"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Tag className="h-5 w-5" />
                <span>Definir Etiquetas</span>
              </div>
            </div>
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
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Definir Etiquetas
                </span>
                <div>
                  <AddTagDialog onAdd={createTag} />
                </div>
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
        )}

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