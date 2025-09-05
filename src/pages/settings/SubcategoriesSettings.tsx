import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2 } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { AddSubcategoryDialog } from "@/components/settings/AddSubcategoryDialog";
import { EditSubcategoryDialog } from "@/components/settings/EditSubcategoryDialog";
import { FloatingActionButton } from "@/components/shared/FloatingActionButton";

interface LocationState {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
}

export default function SubcategoriesSettings() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;
  
  const {
    categories,
    loading,
    createSubcategory,
    updateSubcategory,
    deleteSubcategory,
  } = useSettings();

  const [showAddDialog, setShowAddDialog] = useState(false);

  // Si no hay estado, redirigir de vuelta
  if (!state?.categoryId) {
    navigate('/settings/categories', { replace: true });
    return null;
  }

  const category = categories.find(cat => cat.id === state.categoryId);
  const subcategories = category?.subcategories || [];

  const handleDeleteSubcategory = async (id: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar esta subcategoría?")) {
      await deleteSubcategory(id);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-4 pb-24">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/settings/categories')}
            className="p-1 h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
            style={{ backgroundColor: state.categoryColor }}
          >
            {state.categoryIcon}
          </div>
          <div>
            <h1 className="text-xl font-semibold">
              Subcategorías de "{state.categoryName}"
            </h1>
            <p className="text-sm text-muted-foreground">
              {subcategories.length} subcategoría{subcategories.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Lista de Subcategorías</span>
              <AddSubcategoryDialog
                categoryId={state.categoryId}
                categoryName={state.categoryName}
                onAdd={async (subcategory) => {
                  await createSubcategory(subcategory);
                }}
              />
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : subcategories.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                <p className="mb-4">Esta categoría no tiene subcategorías.</p>
                <AddSubcategoryDialog
                  categoryId={state.categoryId}
                  categoryName={state.categoryName}
                  onAdd={async (subcategory) => {
                    await createSubcategory(subcategory);
                  }}
                />
              </div>
            ) : (
              <div className="space-y-3">
                {subcategories.map((subcategory) => (
                  <div
                    key={subcategory.id}
                    className="p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg font-bold"
                          style={{ backgroundColor: state.categoryColor }}
                        >
                          {subcategory.icon || '📦'}
                        </div>
                        <div>
                          <span className="font-medium text-lg">{subcategory.name}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <EditSubcategoryDialog
                          subcategory={subcategory}
                          onUpdate={updateSubcategory}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSubcategory(subcategory.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Floating Action Button */}
        <FloatingActionButton
          onClick={() => setShowAddDialog(true)}
        />

        {/* La dialog se maneja internamente en AddSubcategoryDialog */}
      </div>
    </Layout>
  );
}