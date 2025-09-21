import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useInventory } from "@/hooks/useInventory";
import { useSettings } from "@/hooks/useSettings";
import { Edit, Trash2, Package, Loader2 } from "lucide-react";
import { Product } from "@/hooks/useInventory";
import { ImageModal } from "@/components/shared/ImageModal";
import { useState, useEffect, useRef, useCallback } from "react";

interface InventoryListProps {
  filters: {
    category: string;
    tags: string[];
    search: string;
  };
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (product: Product) => void;
}

export function InventoryList({ filters, onEditProduct, onDeleteProduct }: InventoryListProps) {
  const { products, loading } = useInventory();
  const { tags } = useSettings();
  const [selectedImage, setSelectedImage] = useState<{ url: string; alt: string } | null>(null);
  const [displayedCount, setDisplayedCount] = useState(12);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerRef = useRef<HTMLDivElement>(null);
  const ITEMS_PER_PAGE = 12;

  // Función para obtener el color de una etiqueta por su nombre
  const getTagColor = (tagName: string) => {
    const tag = tags.find(t => t.name === tagName);
    return tag?.color || '#6b7280'; // Color por defecto si no se encuentra
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = filters.search === "" || 
      product.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      product.description?.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesCategory = filters.category === "" || product.category_id === filters.category;
    
    return matchesSearch && matchesCategory;
  });

  const displayedProducts = filteredProducts.slice(0, displayedCount);
  const hasMoreProducts = displayedCount < filteredProducts.length;

  // Reset displayed count when filters change
  useEffect(() => {
    setDisplayedCount(12);
  }, [filters.search, filters.category, filters.tags]);

  // Load more products function
  const loadMoreProducts = useCallback(() => {
    if (hasMoreProducts && !isLoadingMore) {
      setIsLoadingMore(true);
      setTimeout(() => {
        setDisplayedCount(prev => Math.min(prev + ITEMS_PER_PAGE, filteredProducts.length));
        setIsLoadingMore(false);
      }, 500); // Small delay to show loading state
    }
  }, [hasMoreProducts, isLoadingMore, filteredProducts.length]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasMoreProducts && !isLoadingMore) {
          loadMoreProducts();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px'
      }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => {
      if (observerRef.current) {
        observer.unobserve(observerRef.current);
      }
    };
  }, [hasMoreProducts, isLoadingMore, loadMoreProducts]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="w-full h-32 bg-muted rounded-md" />
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (filteredProducts.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No hay productos</h3>
          <p className="text-muted-foreground">
            {filters.search || filters.category 
              ? "No se encontraron productos con los filtros aplicados"
              : "Agrega tu primer producto al inventario"
            }
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedProducts.map((product) => (
        <Card key={product.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            {/* Desktop Layout */}
            <div className="hidden md:block space-y-3">
              {/* Product Image */}
              <div className="w-full h-32 bg-muted rounded-md flex items-center justify-center overflow-hidden">
                {product.image_url ? (
                  <img 
                    src={product.image_url} 
                    alt={product.name}
                    className="w-full h-full object-contain rounded-md cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setSelectedImage({ url: product.image_url!, alt: product.name })}
                  />
                ) : (
                  <Package className="h-8 w-8 text-muted-foreground" />
                )}
              </div>

              {/* Product Info */}
              <div>
                <h3 className="font-medium text-sm line-clamp-2">{product.name}</h3>
                {product.category && (
                  <div className="flex items-center space-x-1 mt-1">
                    <span className="text-xs">{product.category.icon}</span>
                    <span className="text-xs text-muted-foreground">{product.category.name}</span>
                  </div>
                )}
              </div>

              {/* Quantity and Price */}
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cantidad:</span>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs px-2 py-1 rounded flex-shrink-0 ${
                      product.quantity > 0 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {product.quantity > 0 ? 'Disponibles' : 'No disponible'}
                    </span>
                    <span className="font-medium">{product.quantity}</span>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Precio:</span>
                  <span className="font-medium">${product.price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Costo:</span>
                  <span className="font-medium">${product.cost.toLocaleString()}</span>
                </div>
              </div>

              {/* Tags */}
              {product.tags && product.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {product.tags.slice(0, 2).map((tag, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="text-xs text-white"
                      style={{ backgroundColor: getTagColor(tag) }}
                    >
                      {tag}
                    </Badge>
                  ))}
                  {product.tags.length > 2 && (
                    <Badge variant="secondary" className="text-xs">
                      +{product.tags.length - 2}
                    </Badge>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-2 pt-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => onEditProduct(product)}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Editar
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-destructive hover:text-destructive"
                  onClick={() => onDeleteProduct(product)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Mobile Layout */}
            <div className="md:hidden flex items-center space-x-3">
              {/* Product Image - Left */}
              <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center overflow-hidden flex-shrink-0">
                {product.image_url ? (
                  <img 
                    src={product.image_url} 
                    alt={product.name}
                    className="w-full h-full object-contain rounded-md cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setSelectedImage({ url: product.image_url!, alt: product.name })}
                  />
                ) : (
                  <Package className="h-6 w-6 text-muted-foreground" />
                )}
              </div>

              {/* Product Details - Center */}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm line-clamp-2">{product.name}</h3>
                {product.category && (
                  <div className="flex items-center space-x-1 mt-1">
                    <span className="text-xs">{product.category.icon}</span>
                    <span className="text-xs text-muted-foreground">{product.category.name}</span>
                  </div>
                )}
                
                <div className="space-y-1 mt-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Cantidad:</span>
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs px-2 py-1 rounded flex-shrink-0 ${
                        product.quantity > 0 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {product.quantity > 0 ? 'Disponibles' : 'No disponible'}
                      </span>
                      <span className="font-medium">{product.quantity}</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Precio:</span>
                    <span className="font-medium">${product.price}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Costo:</span>
                    <span className="font-medium">${product.cost}</span>
                  </div>
                </div>

                {/* Tags */}
                {product.tags && product.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {product.tags.slice(0, 2).map((tag, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className="text-xs text-white"
                        style={{ backgroundColor: getTagColor(tag) }}
                      >
                        {tag}
                      </Badge>
                    ))}
                    {product.tags.length > 2 && (
                      <Badge variant="secondary" className="text-xs">
                        +{product.tags.length - 2}
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons - Right */}
              <div className="flex flex-col space-y-2 flex-shrink-0">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-10 h-10 p-0"
                  onClick={() => onEditProduct(product)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-10 h-10 p-0 text-destructive hover:text-destructive"
                  onClick={() => onDeleteProduct(product)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        ))}
      </div>

      {/* Loading indicator and observer target */}
      {hasMoreProducts && (
        <div ref={observerRef} className="flex justify-center py-8">
          {isLoadingMore ? (
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Cargando más productos...</span>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              Mostrando {displayedProducts.length} de {filteredProducts.length} productos
            </div>
          )}
        </div>
      )}

      {/* Show total when all products are loaded */}
      {!hasMoreProducts && filteredProducts.length > 12 && (
        <div className="flex justify-center py-4">
          <div className="text-sm text-muted-foreground">
            Mostrando todos los {filteredProducts.length} productos
          </div>
        </div>
      )}
      
      {/* Image Modal */}
      {selectedImage && (
        <ImageModal
          isOpen={!!selectedImage}
          onClose={() => setSelectedImage(null)}
          imageUrl={selectedImage.url}
          altText={selectedImage.alt}
        />
      )}
    </div>
  );
}