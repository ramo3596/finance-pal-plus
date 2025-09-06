import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSettings } from "@/hooks/useSettings";
import { AddTemplateDialog } from "@/components/settings/AddTemplateDialog";
import { DraggableTemplateList } from "@/components/settings/DraggableTemplateList";
import { FloatingActionButton } from "@/components/shared/FloatingActionButton";

export default function TemplatesSettings() {
  const [showAddTemplateDialog, setShowAddTemplateDialog] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const {
    templates,
    accounts,
    categories,
    tags,
    loading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    reorderTemplates,
  } = useSettings();

  const handleDeleteTemplate = async (id: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar esta plantilla?")) {
      await deleteTemplate(id);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 pb-24">
        {isMobile ? (
          <>
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
                <FileText className="h-5 w-5" />
                <h2 className="text-lg font-semibold">Administrar Plantillas</h2>
              </div>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : templates.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No hay plantillas configuradas. Agrega tu primera plantilla.
              </p>
            ) : (
              <DraggableTemplateList
                templates={templates}
                accounts={accounts}
                categories={categories}
                tags={tags}
                onUpdate={updateTemplate}
                onDelete={handleDeleteTemplate}
                onReorder={reorderTemplates}
              />
            )}
          </>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Administrar Plantillas
                </span>
                <div className="hidden md:block">
                  <AddTemplateDialog 
                    onAdd={createTemplate}
                    accounts={accounts}
                    categories={categories}
                    tags={tags}
                  />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : templates.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No hay plantillas configuradas. Agrega tu primera plantilla.
                </p>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  <DraggableTemplateList
                    templates={templates}
                    accounts={accounts}
                    categories={categories}
                    tags={tags}
                    onUpdate={updateTemplate}
                    onDelete={handleDeleteTemplate}
                    onReorder={reorderTemplates}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <FloatingActionButton
          onClick={() => setShowAddTemplateDialog(true)}
        />

        <AddTemplateDialog 
          open={showAddTemplateDialog}
          onOpenChange={setShowAddTemplateDialog}
          onAdd={createTemplate}
          accounts={accounts}
          categories={categories}
          tags={tags}
        />
      </div>
    </Layout>
  );
}