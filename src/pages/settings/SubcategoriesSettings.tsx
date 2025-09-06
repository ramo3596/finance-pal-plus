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
import { DraggableSubcategoryList } from "@/components/settings/DraggableSubcategoryList";

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
    reorderSubcategories,
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

  const handleReorderSubcategories = async (newOrder: any[]) => {
    await reorderSubcategories(state.categoryId, newOrder);
  };

  return (
    <Layout>
      <div className="container mx-auto p-4 pb-24">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
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
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : subcategories.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                <p>Esta categoría no tiene subcategorías.</p>
                <p className="text-sm mt-2">Usa el botón flotante para añadir una nueva subcategoría.</p>
              </div>
            ) : (
              <DraggableSubcategoryList
                subcategories={subcategories}
                categoryColor={state.categoryColor}
                onUpdate={updateSubcategory}
                onDelete={handleDeleteSubcategory}
                onReorder={handleReorderSubcategories}
              />
            )}
          </CardContent>
        </Card>

        {/* Floating Action Button */}
        <FloatingActionButton
          onClick={() => setShowAddDialog(true)}
        />

        {/* Dialog para el botón flotante */}
        <AddSubcategoryDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          categoryId={state.categoryId}
          categoryName={state.categoryName}
          onAdd={async (subcategory) => {
            await createSubcategory(subcategory);
            setShowAddDialog(false);
          }}
        />
      </div>
    </Layout>
  );
}