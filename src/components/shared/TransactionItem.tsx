import { Transaction } from "@/hooks/useTransactions";
import { useSettings } from "@/hooks/useSettings";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MoreVertical, Edit, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";

interface TransactionItemProps {
  transaction: Transaction;
  showCheckbox?: boolean;
  isSelected?: boolean;
  onSelectTransaction?: (transactionId: string, checked: boolean) => void;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (transactionId: string) => void;
}

export function TransactionItem({
  transaction,
  showCheckbox = false,
  isSelected = false,
  onSelectTransaction,
  onEdit,
  onDelete
}: TransactionItemProps) {
  const { categories, accounts, tags } = useSettings();
  const isMobile = useIsMobile();

  const getCategoryData = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId);
  };

  const getSubcategoryData = (categoryId: string, subcategoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.subcategories?.find(sub => sub.id === subcategoryId);
  };

  const getAccountName = (accountId: string) => {
    return accounts.find(acc => acc.id === accountId)?.name || 'Cuenta';
  };

  const categoryData = getCategoryData(transaction.category_id);
  const subcategoryData = transaction.subcategory_id && transaction.category_id 
    ? getSubcategoryData(transaction.category_id, transaction.subcategory_id)
    : null;
  const accountName = getAccountName(transaction.account_id);

  // Use subcategory icon if available, otherwise use category icon
  const displayIcon = subcategoryData?.icon || categoryData?.icon;
  const displayName = subcategoryData?.name || categoryData?.name || transaction.description;

  return (
    <div className={cn(
      "flex items-center space-x-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors",
      isMobile ? "w-screen -mx-2" : ""
    )}>
      {showCheckbox && (
        <Checkbox 
          checked={isSelected}
          onCheckedChange={(checked) => onSelectTransaction?.(transaction.id, checked as boolean)}
        />
      )}
      
      {/* Category/Subcategory Icon */}
      <div className="flex items-center space-x-2">
        {(categoryData || subcategoryData) && (
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: categoryData?.color || '#6b7280' }}
          >
            {displayIcon}
          </div>
        )}
      </div>
      
      {/* Transaction Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-sm">{displayName}</p>
            <p className="text-xs text-muted-foreground">
              {transaction.type === 'transfer' ? (
                transaction.amount < 0 ? (
                  // Transferencia saliente: cuenta origen en negrita
                  <>
                    <span className="font-semibold">{getAccountName(transaction.account_id)}</span>
                    {' → '}
                    {getAccountName(transaction.to_account_id || '')}
                  </>
                ) : (
                  // Transferencia entrante: cuenta destino en negrita
                  <>
                    {getAccountName(transaction.account_id)}
                    {' → '}
                    <span className="font-semibold">{getAccountName(transaction.to_account_id || '')}</span>
                  </>
                )
              ) : (
                accountName
              )}
            </p>
            {(() => {
              // Handle both array and string formats for tags
              let tagsArray: string[] = [];
              
              if (Array.isArray(transaction.tags)) {
                tagsArray = transaction.tags;
              } else if (transaction.tags && typeof transaction.tags === 'string') {
                const tagString = transaction.tags as string;
                // If it's a string that looks like JSON array, try to parse it
                if (tagString.startsWith('[') && tagString.endsWith(']')) {
                  try {
                    const parsed = JSON.parse(tagString);
                    if (Array.isArray(parsed)) {
                      tagsArray = parsed;
                    } else {
                      tagsArray = [tagString.trim()];
                    }
                  } catch {
                    tagsArray = [tagString.trim()];
                  }
                } else {
                  // If it's a regular string, split by common separators or treat as single tag
                  tagsArray = tagString.includes(',') 
                    ? tagString.split(',').map(tag => tag.trim())
                    : [tagString.trim()];
                }
              }
              
              return tagsArray.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {tagsArray.map((tagName, index) => {
                    // First try to find by name, then by ID as fallback
                    const tag = tags.find(t => t.name === tagName) || tags.find(t => t.id === tagName);
                    return tag ? (
                      <span
                        key={tag.id || index}
                        className="inline-block px-2 py-0.5 text-xs font-medium text-white rounded"
                        style={{ backgroundColor: tag.color }}
                      >
                        {tag.name}
                      </span>
                    ) : (
                      // If tag is not found in the settings, still show it with a default color
                      <span
                        key={index}
                        className="inline-block px-2 py-0.5 text-xs font-medium text-white rounded bg-gray-500"
                      >
                        {tagName}
                      </span>
                    );
                  })}
                </div>
              );
            })()}
            {transaction.type === 'transfer' && transaction.beneficiary && (
              <p className="text-xs text-muted-foreground">{transaction.beneficiary}</p>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Amount and Date */}
            <div className="flex flex-col items-end min-w-[80px]">
              <span className={cn(
                "text-sm font-bold",
                (() => {
                  // Lógica específica para categorías de deudas y préstamos
                  if (categoryData?.name === 'Ingresos') {
                    return "text-green-600"; // Ingresos siempre positivos
                  }
                  if (categoryData?.name === 'Gastos financieros') {
                    return "text-red-600"; // Gastos financieros siempre negativos
                  }
                  return transaction.amount >= 0 ? "text-green-600" : "text-red-600";
                })()
              )}>
                {(() => {
                  // Lógica específica para categorías de deudas y préstamos
                  if (categoryData?.name === 'Ingresos') {
                    // Ingresos siempre mostrar como positivo
                    const displayAmount = Math.abs(transaction.amount);
                    return `+${new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD'
                    }).format(displayAmount)}`;
                  }
                  if (categoryData?.name === 'Gastos financieros') {
                    // Gastos financieros siempre mostrar como negativo
                    const displayAmount = Math.abs(transaction.amount);
                    return `-${new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD'
                    }).format(displayAmount)}`;
                  }
                  // Para otras categorías, usar lógica normal
                  return `${transaction.amount > 0 ? '+' : ''}${new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD'
                  }).format(transaction.amount)}`;
                })()}
              </span>
              <span className="text-xs text-muted-foreground">
                {new Date(transaction.transaction_date).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'short'
                })}
              </span>
            </div>
            
            {/* Actions Menu */}
            {(onEdit || onDelete) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-background border border-border">
                  {onEdit && (
                    <DropdownMenuItem 
                      onClick={() => onEdit(transaction)}
                      className="cursor-pointer"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem 
                      onClick={() => onDelete(transaction.id)}
                      className="cursor-pointer text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}