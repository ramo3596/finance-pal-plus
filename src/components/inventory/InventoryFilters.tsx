import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useSettings } from "@/hooks/useSettings";
import { Search } from "lucide-react";

interface InventoryFiltersProps {
  filters: {
    category: string;
    tags: string[];
    search: string;
  };
  onFilterChange: (filters: any) => void;
}

export function InventoryFilters({ filters, onFilterChange }: InventoryFiltersProps) {
  const { categories, tags } = useSettings();

  const handleCategoryChange = (category: string) => {
    const actualCategory = category === "all" ? "" : category;
    onFilterChange({ ...filters, category: actualCategory });
  };

  const handleSearchChange = (search: string) => {
    onFilterChange({ ...filters, search });
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Buscar</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar productos..."
                value={filters.search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Categoría</Label>
            <Select value={filters.category || "all"} onValueChange={handleCategoryChange}>
              <SelectTrigger>
                <SelectValue placeholder="Todas las categorías" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categories.filter(category => category.id && category.id.trim() !== '').map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">{category.icon}</span>
                      <span>{category.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Etiquetas</Label>
            <Select value="" onValueChange={() => {}}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por etiquetas" />
              </SelectTrigger>
              <SelectContent>
                {tags.filter(tag => tag.id && tag.id.trim() !== '').map((tag) => (
                  <SelectItem key={tag.id} value={tag.id}>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: tag.color }}
                      />
                      <span>{tag.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}