import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Filter, Trash2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSettings } from "@/hooks/useSettings";
import { AddFilterDialog } from "@/components/settings/AddFilterDialog";
import { EditFilterDialog } from "@/components/settings/EditFilterDialog";
import { FloatingActionButton } from "@/components/shared/FloatingActionButton";

export default function FiltersSettings() {
  const [showAddFilterDialog, setShowAddFilterDialog] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const {
    filters,
    accounts,
    categories,
    tags,
    loading,
    createFilter,
    updateFilter,
    deleteFilter,
  } = useSettings();

  const handleDeleteFilter = async (id: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar este filtro?")) {
      await deleteFilter(id);
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
                <Filter className="h-5 w-5" />
                <h2 className="text-lg font-semibold">Administrar Filtros</h2>
              </div>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {filters.map((filter) => (
                  <div key={filter.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-medium">{filter.name}</h3>
                        <Badge variant="secondary">{filter.type}</Badge>
                      </div>
                      <div className="flex gap-2">
                        <EditFilterDialog 
                          filter={filter} 
                          onUpdate={updateFilter}
                          accounts={accounts}
                          categories={categories}
                          tags={tags}
                        />
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteFilter(filter.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {filters.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No hay filtros configurados. Agrega tu primer filtro.
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
                  <Filter className="h-5 w-5" />
                  Administrar Filtros
                </span>
                <div className="hidden md:block">
                  <AddFilterDialog 
                    onAdd={createFilter}
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
                <div className="space-y-4">
                  {filters.map((filter) => (
                    <div key={filter.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-medium">{filter.name}</h3>
                          <Badge variant="secondary">{filter.type}</Badge>
                        </div>
                        <div className="flex gap-2">
                          <EditFilterDialog 
                            filter={filter} 
                            onUpdate={updateFilter}
                            accounts={accounts}
                            categories={categories}
                            tags={tags}
                          />
                          <Button variant="destructive" size="sm" onClick={() => handleDeleteFilter(filter.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filters.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No hay filtros configurados. Agrega tu primer filtro.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <FloatingActionButton
          onClick={() => setShowAddFilterDialog(true)}
        />

        <AddFilterDialog
          open={showAddFilterDialog}
          onOpenChange={setShowAddFilterDialog}
          onAdd={createFilter}
          accounts={accounts}
          categories={categories}
          tags={tags}
        />
      </div>
    </Layout>
  );
}