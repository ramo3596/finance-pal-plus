import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Trash2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSettings } from "@/hooks/useSettings";
import { AddTemplateDialog } from "@/components/settings/AddTemplateDialog";
import { EditTemplateDialog } from "@/components/settings/EditTemplateDialog";
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
            ) : (
              <div className="space-y-4 w-full">
                {templates.map((template) => (
                  <div key={template.id} className="border rounded-lg p-4 w-full">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{template.name}</h3>
                        <p className="text-sm text-muted-foreground">${template.amount.toFixed(2)} - {template.type}</p>
                        {template.tags && template.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {template.tags.map((tag) => (
                              <span 
                                key={tag.id}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs"
                                style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                              >
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }}></div>
                                {tag.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <EditTemplateDialog 
                          template={template} 
                          onUpdate={updateTemplate}
                          accounts={accounts}
                          categories={categories}
                          tags={tags}
                        />
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteTemplate(template.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {templates.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No hay plantillas configuradas. Agrega tu primera plantilla.
                  </p>
                )}
              </div>
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
              ) : (
                <div className="max-h-96 overflow-y-auto space-y-4">
                  {templates.map((template) => (
                    <div key={template.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{template.name}</h3>
                          <p className="text-sm text-muted-foreground">${template.amount.toFixed(2)} - {template.type}</p>
                          {template.tags && template.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {template.tags.map((tag) => (
                                <span 
                                  key={tag.id}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs"
                                  style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                                >
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }}></div>
                                  {tag.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 ml-4">
                          <EditTemplateDialog 
                            template={template} 
                            onUpdate={updateTemplate}
                            accounts={accounts}
                            categories={categories}
                            tags={tags}
                          />
                          <Button variant="destructive" size="sm" onClick={() => handleDeleteTemplate(template.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {templates.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No hay plantillas configuradas. Agrega tu primera plantilla.
                    </p>
                  )}
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