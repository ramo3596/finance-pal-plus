import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Filter } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { RecordsFilters as RecordsFiltersType } from "@/pages/Records";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";

interface RecordsFiltersProps {
  filters: RecordsFiltersType;
  onFilterChange: (filters: Partial<RecordsFiltersType>) => void;
}

export function RecordsFilters({ filters, onFilterChange }: RecordsFiltersProps) {
  const { accounts, categories, tags, filters: savedFilters } = useSettings();

  const transactionTypes = [
    { id: "expense", label: "Gastos" },
    { id: "income", label: "Ingresos" },
    { id: "transfer", label: "Transferencias" },
  ];

  const paymentMethods = [
    { id: "cash", label: "Dinero en efectivo" },
    { id: "debit", label: "Tarjeta de débito" },
    { id: "credit", label: "Tarjeta de crédito" },
    { id: "transfer", label: "Transferencia bancaria" },
    { id: "coupon", label: "Cupón" },
    { id: "mobile", label: "Pago por móvil" },
    { id: "web", label: "Pago por web" }
  ];


  const handleAccountToggle = (accountId: string, checked: boolean) => {
    const newSelected = checked 
      ? [...filters.selectedAccounts, accountId]
      : filters.selectedAccounts.filter(id => id !== accountId);
    onFilterChange({ selectedAccounts: newSelected });
  };

  const handleCategoryToggle = (categoryId: string, checked: boolean) => {
    const newSelected = checked 
      ? [...filters.selectedCategories, categoryId]
      : filters.selectedCategories.filter(id => id !== categoryId);
    onFilterChange({ selectedCategories: newSelected });
  };

  const handleTagToggle = (tagId: string, checked: boolean) => {
    const newSelected = checked 
      ? [...filters.selectedTags, tagId]
      : filters.selectedTags.filter(id => id !== tagId);
    onFilterChange({ selectedTags: newSelected });
  };

  const handleTypeToggle = (type: string, checked: boolean) => {
    const newSelected = checked 
      ? [...filters.selectedTypes, type]
      : filters.selectedTypes.filter(t => t !== type);
    onFilterChange({ selectedTypes: newSelected });
  };

  const handlePaymentMethodToggle = (methodId: string, checked: boolean) => {
    const newSelected = checked 
      ? [...filters.selectedPaymentMethods, methodId]
      : filters.selectedPaymentMethods.filter(m => m !== methodId);
    onFilterChange({ selectedPaymentMethods: newSelected });
  };

  return (
    <Card className="h-fit">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Search className="h-5 w-5" />
          Búsqueda y Filtros
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="search">Buscar</Label>
          <Input
            id="search"
            placeholder="Buscar transacciones..."
            value={filters.searchTerm}
            onChange={(e) => onFilterChange({ searchTerm: e.target.value })}
            className="w-full"
          />
        </div>

        <Separator />

        {/* Filter Section Header */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <span className="font-semibold text-sm uppercase tracking-wide">FILTRAR</span>
        </div>

        {/* Saved Filters */}
        {savedFilters.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Lista de filtros</Label>
            <ScrollArea className="h-20">
              <div className="space-y-1">
                {savedFilters.map((filter) => (
                  <div key={filter.id} className="flex items-center space-x-2">
                    <Checkbox id={`filter-${filter.id}`} />
                    <Label htmlFor={`filter-${filter.id}`} className="text-sm">
                      {filter.name}
                    </Label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        <Separator />

        {/* Accounts */}
        <div className="space-y-2">
          <Label className="font-medium">CUENTAS</Label>
          <ScrollArea className="h-32">
            <div className="space-y-2">
              {accounts.map((account) => (
                <div key={account.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`account-${account.id}`}
                    checked={filters.selectedAccounts.includes(account.id)}
                    onCheckedChange={(checked) => handleAccountToggle(account.id, checked as boolean)}
                  />
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: account.color }}
                    />
                    <Label 
                      htmlFor={`account-${account.id}`} 
                      className="text-sm cursor-pointer"
                    >
                      {account.name}
                    </Label>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <Separator />

        {/* Categories */}
        <div className="space-y-2">
          <Label className="font-medium">CATEGORÍAS</Label>
          <ScrollArea className="h-32">
            <div className="space-y-2">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`category-${category.id}`}
                    checked={filters.selectedCategories.includes(category.id)}
                    onCheckedChange={(checked) => handleCategoryToggle(category.id, checked as boolean)}
                  />
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <Label 
                      htmlFor={`category-${category.id}`} 
                      className="text-sm cursor-pointer"
                    >
                      {category.name}
                    </Label>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <Separator />

        {/* Tags */}
        <div className="space-y-2">
          <Label className="font-medium">ETIQUETAS</Label>
          <ScrollArea className="h-32">
            <div className="space-y-2">
              {tags.map((tag) => (
                <div key={tag.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`tag-${tag.id}`}
                    checked={filters.selectedTags.includes(tag.id)}
                    onCheckedChange={(checked) => handleTagToggle(tag.id, checked as boolean)}
                  />
                  <Badge 
                    variant="outline" 
                    style={{ backgroundColor: tag.color, color: 'white' }}
                    className="text-xs"
                  >
                    {tag.name}
                  </Badge>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <Separator />

        {/* Transaction Types */}
        <div className="space-y-2">
          <Label className="font-medium">TIPOS DE REGISTRO</Label>
          <div className="space-y-2">
            {transactionTypes.map((type) => (
              <div key={type.id} className="flex items-center space-x-2">
                <Checkbox 
                  id={`type-${type.id}`}
                  checked={filters.selectedTypes.includes(type.id)}
                  onCheckedChange={(checked) => handleTypeToggle(type.id, checked as boolean)}
                />
                <Label 
                  htmlFor={`type-${type.id}`} 
                  className="text-sm cursor-pointer"
                >
                  {type.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Amount Range */}
        <div className="space-y-3">
          <Label className="font-medium">RANGO DE LA CANTIDAD</Label>
          <div className="px-2">
            <Slider
              value={[filters.amountRange.min, filters.amountRange.max]}
              onValueChange={([min, max]) => onFilterChange({ amountRange: { min, max } })}
              max={10000}
              step={100}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>${filters.amountRange.min}</span>
              <span>${filters.amountRange.max}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Payment Methods */}
        <div className="space-y-2">
          <Label className="font-medium">TIPOS DE PAGO</Label>
          <ScrollArea className="h-32">
            <div className="space-y-2">
              {paymentMethods.map((method) => (
                <div key={method.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`payment-${method.id}`}
                    checked={filters.selectedPaymentMethods.includes(method.id)}
                    onCheckedChange={(checked) => handlePaymentMethodToggle(method.id, checked as boolean)}
                  />
                  <Label 
                    htmlFor={`payment-${method.id}`} 
                    className="text-sm cursor-pointer"
                  >
                    {method.label}
                  </Label>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}