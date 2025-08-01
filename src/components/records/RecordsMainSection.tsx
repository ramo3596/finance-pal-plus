import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Edit, Trash2 } from "lucide-react";
import { Transaction } from "@/hooks/useTransactions";
import { RecordsFilters } from "@/pages/Records";
import { useSettings } from "@/hooks/useSettings";
import { format, isToday, isYesterday, startOfDay, endOfDay, isAfter, isBefore } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";
import { EditTransaction } from "@/components/EditTransaction";
import { useTransactions } from "@/hooks/useTransactions";

interface RecordsMainSectionProps {
  transactions: Transaction[];
  filters: RecordsFilters;
  selectedTransactions: string[];
  onSelectAll: (checked: boolean) => void;
  onSelectTransaction: (transactionId: string, checked: boolean) => void;
}

export function RecordsMainSection({ 
  transactions, 
  filters, 
  selectedTransactions, 
  onSelectAll, 
  onSelectTransaction 
}: RecordsMainSectionProps) {
  const { accounts, categories, tags } = useSettings();
  const { deleteTransaction } = useTransactions();
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Filter and sort transactions
  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = transactions.filter((transaction) => {
      // Search term filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        if (!transaction.description.toLowerCase().includes(searchLower) &&
            !transaction.beneficiary?.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Account filter
      if (filters.selectedAccounts.length > 0) {
        if (!filters.selectedAccounts.includes(transaction.account_id)) {
          return false;
        }
      }

      // Category filter
      if (filters.selectedCategories.length > 0) {
        if (!transaction.category_id || !filters.selectedCategories.includes(transaction.category_id)) {
          return false;
        }
      }

      // Tag filter
      if (filters.selectedTags.length > 0) {
        const hasMatchingTag = transaction.tags.some(tagName => {
          const tag = tags.find(t => t.name === tagName);
          return tag && filters.selectedTags.includes(tag.id);
        });
        if (!hasMatchingTag) {
          return false;
        }
      }

      // Type filter
      if (filters.selectedTypes.length > 0) {
        if (!filters.selectedTypes.includes(transaction.type)) {
          return false;
        }
      }

      // Payment method filter
      if (filters.selectedPaymentMethods.length > 0) {
        if (!transaction.payment_method || !filters.selectedPaymentMethods.includes(transaction.payment_method)) {
          return false;
        }
      }

      // Date range filter
      if (filters.dateRange.from || filters.dateRange.to) {
        const transactionDate = new Date(transaction.transaction_date);
        if (filters.dateRange.from && isBefore(transactionDate, startOfDay(filters.dateRange.from))) {
          return false;
        }
        if (filters.dateRange.to && isAfter(transactionDate, endOfDay(filters.dateRange.to))) {
          return false;
        }
      }

      // Amount range filter
      const absAmount = Math.abs(transaction.amount);
      if (filters.amountRange.max > 0) {
        if (absAmount < filters.amountRange.min || absAmount > filters.amountRange.max) {
          return false;
        }
      }

      return true;
    });

    // Sort transactions
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case "date-desc":
          return new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime();
        case "date-asc":
          return new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime();
        case "amount-desc":
          return Math.abs(b.amount) - Math.abs(a.amount);
        case "amount-asc":
          return Math.abs(a.amount) - Math.abs(b.amount);
        case "description":
          return a.description.localeCompare(b.description);
        default:
          return 0;
      }
    });

    return filtered;
  }, [transactions, filters, tags]);

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const groups: { [key: string]: { transactions: Transaction[], label: string, sum: number } } = {};
    
    filteredAndSortedTransactions.forEach((transaction) => {
      const date = new Date(transaction.transaction_date);
      const dateKey = format(date, 'yyyy-MM-dd');
      
      if (!groups[dateKey]) {
        let label = format(date, 'dd MMMM yyyy', { locale: es });
        if (isToday(date)) {
          label = 'Hoy';
        } else if (isYesterday(date)) {
          label = 'Ayer';
        }
        
        groups[dateKey] = {
          transactions: [],
          label,
          sum: 0
        };
      }
      
      groups[dateKey].transactions.push(transaction);
      groups[dateKey].sum += transaction.amount;
    });

    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [filteredAndSortedTransactions]);

  const totalSum = filteredAndSortedTransactions.reduce((sum, t) => sum + t.amount, 0);
  const allSelected = filteredAndSortedTransactions.length > 0 && 
    filteredAndSortedTransactions.every(t => selectedTransactions.includes(t.id));

  const getAccountName = (accountId: string) => {
    return accounts.find(a => a.id === accountId)?.name || 'Cuenta desconocida';
  };

  const getCategoryData = (categoryId?: string) => {
    if (!categoryId) return null;
    return categories.find(c => c.id === categoryId);
  };

  const handleDelete = async (transactionId: string) => {
    try {
      await deleteTransaction(transactionId);
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(selectedTransactions.map(id => deleteTransaction(id)));
    } catch (error) {
      console.error('Error deleting transactions:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Checkbox 
                checked={allSelected}
                onCheckedChange={onSelectAll}
                className="h-5 w-5"
              />
              <span className="text-sm font-medium">Seleccionar todo</span>
              
              {/* Bulk Actions */}
              {selectedTransactions.length > 0 && (
                <div className="flex items-center space-x-2 ml-4">
                  <span className="text-sm text-muted-foreground">
                    {selectedTransactions.length} seleccionados
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkDelete}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Eliminar
                  </Button>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                {filteredAndSortedTransactions.length} registros
              </span>
              <span className={cn(
                "text-lg font-bold",
                totalSum >= 0 ? "text-green-600" : "text-red-600"
              )}>
                ${Math.abs(totalSum).toFixed(2)}
              </span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Transactions by Date */}
      <div className="space-y-4">
        {groupedTransactions.map(([dateKey, group]) => (
          <Card key={dateKey}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{group.label}</h3>
                <span className={cn(
                  "text-sm font-medium",
                  group.sum >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  ${Math.abs(group.sum).toFixed(2)}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {group.transactions.map((transaction) => {
                  const categoryData = getCategoryData(transaction.category_id);
                  const accountName = getAccountName(transaction.account_id);
                  
                  return (
                    <div key={transaction.id} className="flex items-center space-x-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <Checkbox 
                        checked={selectedTransactions.includes(transaction.id)}
                        onCheckedChange={(checked) => onSelectTransaction(transaction.id, checked as boolean)}
                      />
                      
                      {/* Category Icon */}
                      <div className="flex items-center space-x-2">
                        {categoryData && (
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                            style={{ backgroundColor: categoryData.color }}
                          >
                            {categoryData.icon}
                          </div>
                        )}
                      </div>
                      
                       {/* Transaction Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{transaction.description}</p>
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
                            {transaction.type !== 'transfer' && transaction.tags.length > 0 && (
                              <p className="text-xs text-muted-foreground">
                                {transaction.tags.map(tagName => {
                                  const tag = tags.find(t => t.name === tagName);
                                  return tag?.name;
                                }).filter(Boolean).join(', ')}
                              </p>
                            )}
                            {transaction.type === 'transfer' && transaction.beneficiary && (
                              <p className="text-xs text-muted-foreground">{transaction.beneficiary}</p>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {/* Tags */}
                            <div className="flex space-x-1">
                              {transaction.tags.slice(0, 2).map((tagName) => {
                                const tag = tags.find(t => t.name === tagName);
                                return tag ? (
                                  <Badge 
                                    key={tag.id}
                                    variant="outline" 
                                    style={{ backgroundColor: tag.color, color: 'white' }}
                                    className="text-xs"
                                  >
                                    {tag.name}
                                  </Badge>
                                ) : null;
                              })}
                              {transaction.tags.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{transaction.tags.length - 2}
                                </Badge>
                              )}
                            </div>
                            
                            {/* Amount */}
                            <span className={cn(
                              "text-sm font-bold min-w-[80px] text-right",
                              transaction.amount >= 0 ? "text-green-600" : "text-red-600"
                            )}>
                              {transaction.amount > 0 ? '+' : ''}{new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'USD'
                              }).format(transaction.amount)}
                            </span>
                            
                            {/* Actions Menu */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-background border border-border">
                                <DropdownMenuItem 
                                  onClick={() => setEditingTransaction(transaction)}
                                  className="cursor-pointer"
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDelete(transaction.id)}
                                  className="cursor-pointer text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
        
        {filteredAndSortedTransactions.length === 0 && (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                <p>No se encontraron transacciones que coincidan con los filtros.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Transaction Modal */}
      {editingTransaction && (
        <EditTransaction
          transaction={editingTransaction}
          open={!!editingTransaction}
          onOpenChange={(open) => !open && setEditingTransaction(null)}
        />
      )}
    </div>
  );
}