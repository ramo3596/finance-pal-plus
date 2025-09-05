import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FolderOpen, Trash2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSettings } from "@/hooks/useSettings";
import { AddCategoryDialog } from "@/components/settings/AddCategoryDialog";
import { AddSubcategoryDialog } from "@/components/settings/AddSubcategoryDialog";
import { EditCategoryDialog } from "@/components/settings/EditCategoryDialog";
import { EditSubcategoryDialog } from "@/components/settings/EditSubcategoryDialog";
import { FloatingActionButton } from "@/components/shared/FloatingActionButton";

export default function CategoriesSettings() {
  const [showAddCategoryDialog, setShowAddCategoryDialog] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const {
    categories,
    loading,
    createCategory,
    updateCategory,
    deleteCategory,
    createSubcategory,
    updateSubcategory,
    deleteSubcategory,
  } = useSettings();

  const handleDeleteCategory = async (id: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar esta categoría?")) {
      await deleteCategory(id);
    }
  };

  const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);
  const subcategories = selectedCategory?.subcategories || [];

  return (
    <Layout>
      <div className="container mx-auto p-6 pb-24">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {isMobile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="p-1 h-8 w-8"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <FolderOpen className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Administrar Categorías</h2>
          </div>
          <div className="hidden md:block">
            <AddCategoryDialog 
              open={showAddCategoryDialog}
              onOpenChange={setShowAddCategoryDialog}
              onAdd={createCategory} 
            />
          </div>
        </div>
        
        <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
          {/* Panel Izquierdo - Categorías Principales */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Categorías Principales</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : categories.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No hay categorías configuradas. Agrega tu primera categoría.
                </p>
              ) : (
                <div className="space-y-2">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedCategoryId === category.id
                          ? 'bg-primary/10 border-primary'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => {
                        if (isMobile) {
                          navigate('/settings/categories/subcategories', {
                            state: {
                              categoryId: category.id,
                              categoryName: category.name,
                              categoryColor: category.color,
                              categoryIcon: category.icon
                            }
                          });
                        } else {
                          setSelectedCategoryId(category.id);
                        }
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                            style={{ backgroundColor: category.color }}
                          >
                            {category.icon}
                          </div>
                          <span className="font-medium">{category.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {category.subcategories?.length || 0} subcategorías
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <EditCategoryDialog
                            category={category}
                            onUpdate={updateCategory}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCategory(category.id);
                            }}
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

          {/* Panel Derecho - Subcategorías - Solo visible en desktop */}
          {!isMobile && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>
                    {selectedCategory ? `Subcategorías de "${selectedCategory.name}"` : 'Subcategorías'}
                  </span>
                   {selectedCategory && (
                      <AddSubcategoryDialog
                        categoryId={selectedCategory.id}
                        categoryName={selectedCategory.name}
                        onAdd={async (subcategory) => {
                          await createSubcategory(subcategory);
                        }}
                      />
                    )}
                 </CardTitle>
               </CardHeader>
               <CardContent>
                 {!selectedCategory ? (
                   <div className="text-center text-muted-foreground py-12">
                     <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                     <p>Selecciona una categoría del panel izquierdo para ver sus subcategorías</p>
                   </div>
                 ) : subcategories.length === 0 ? (
                   <div className="text-center text-muted-foreground py-12">
                     <p className="mb-4">Esta categoría no tiene subcategorías.</p>
                     <AddSubcategoryDialog
                        categoryId={selectedCategory.id}
                        categoryName={selectedCategory.name}
                        onAdd={async (subcategory) => {
                          await createSubcategory(subcategory);
                        }}
                      />
                   </div>
                ) : (
                  <div className="space-y-2">
                    {subcategories.map((subcategory) => (
                      <div
                        key={subcategory.id}
                        className="p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                              style={{ backgroundColor: selectedCategory.color }}
                            >
                              {subcategory.icon || '📦'}
                            </div>
                            <span className="font-medium">{subcategory.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <EditSubcategoryDialog
                              subcategory={subcategory}
                              onUpdate={updateSubcategory}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                if (confirm("¿Estás seguro de que quieres eliminar esta subcategoría?")) {
                                  await deleteSubcategory(subcategory.id);
                                }
                              }}
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
          )}
        </div>

        <FloatingActionButton
          onClick={() => setShowAddCategoryDialog(true)}
        />

        <AddCategoryDialog onAdd={createCategory} />
      </div>
    </Layout>
  );
}