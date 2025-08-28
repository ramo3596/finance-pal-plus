import { useState, useEffect } from "react"
import { useAuth } from "./useAuth"
import { toast } from "sonner"
import { useTransactions } from "./useTransactions"
import { useSettings } from "./useSettings"
import { cacheService } from "@/lib/cache"
import { v4 as uuidv4 } from "uuid"

export interface Debt {
  id: string
  user_id: string
  contact_id: string
  account_id: string
  type: 'debt' | 'loan'
  description: string
  initial_amount: number
  current_balance: number
  debt_date: string
  due_date?: string
  status: 'active' | 'closed'
  created_at: string
  updated_at: string
  tags?: string[]
  contacts?: {
    id: string
    name: string
    image_url?: string
  }
  accounts?: {
    id: string
    name: string
  }
}

export interface DebtPayment {
  id: string
  debt_id: string
  transaction_id?: string
  account_id?: string
  amount: number
  payment_date: string
  description?: string
  created_at: string
  tags?: string[]
  transactions?: {
    category_id: string
    subcategory_id?: string
    account_id: string
    categories: {
      name: string
      icon: string
      color: string
    }
    subcategories?: {
      name: string
      icon: string
    }
    accounts: {
      name: string
    }
  }
}

export function useDebts() {
  const [debts, setDebts] = useState<Debt[]>([])
  const [debtPayments, setDebtPayments] = useState<DebtPayment[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const { createTransaction, refetch: refetchTransactions } = useTransactions()
  const { categories, createCategory, createSubcategory, refetch: refetchSettings } = useSettings()

  const calculateDebtBalance = async (debtId: string): Promise<number> => {
    try {
      // Get debt information from cache with error handling
      const cachedDebts = await cacheService.get('debts').catch(err => {
        console.warn('Error loading debts from cache:', err);
        return [];
      });
      const debt = cachedDebts.find((d: any) => d.id === debtId)
      
      if (!debt) throw new Error('Debt not found')

      // Get debt payments from cache with error handling
      const cachedDebtPayments = await cacheService.get('debt_payments').catch(err => {
        console.warn('Error loading debt payments from cache:', err);
        return [];
      });
      const payments = cachedDebtPayments
        .filter((p: any) => p.debt_id === debtId)
        .sort((a: any, b: any) => new Date(a.payment_date).getTime() - new Date(b.payment_date).getTime())
      
      // Calculate balance by summing all records
      const totalBalance = payments.reduce((sum: number, payment: any) => sum + payment.amount, 0)
      // Multiply result by -1 according to the logic
      return totalBalance * -1
    } catch (error) {
      console.error('Error calculating debt balance:', error)
      return 0
    }
  }

  const fetchDebts = async () => {
    if (!user) return

    try {
      const cachedDebts = await cacheService.get('debts').catch(err => {
        console.warn('Error loading debts from cache:', err);
        return [];
      });
      const cachedContacts = await cacheService.get('contacts').catch(err => {
        console.warn('Error loading contacts from cache:', err);
        return [];
      });
      const cachedAccounts = await cacheService.get('accounts').catch(err => {
        console.warn('Error loading accounts from cache:', err);
        return [];
      });
      
      // Enrich debts with contact and account information
      const enrichedDebts = cachedDebts
        .filter((debt: any) => debt.user_id === user.id)
        .map((debt: any) => {
          const contact = cachedContacts.find((c: any) => c.id === debt.contact_id)
          const account = cachedAccounts.find((a: any) => a.id === debt.account_id)
          
          return {
            ...debt,
            contacts: contact ? {
              id: contact.id,
              name: contact.name,
              image_url: contact.image_url
            } : undefined,
            accounts: account ? {
              id: account.id,
              name: account.name
            } : undefined
          }
        })
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      
      // Calculate balance for each debt
      const debtsWithCalculatedBalance = await Promise.all(
        enrichedDebts.map(async (debt: any) => {
          const calculatedBalance = await calculateDebtBalance(debt.id)
          return {
            ...debt,
            current_balance: calculatedBalance
          }
        })
      )
      
      setDebts(debtsWithCalculatedBalance)
    } catch (error) {
      console.error('Error loading debts from cache:', error)
      toast.error('Error al cargar las deudas')
    }
  }

  const fetchDebtPayments = async (debtId: string) => {
    try {
      // Get debt details from cache with error handling
      const cachedDebts = await cacheService.get('debts').catch(err => {
        console.warn('Error loading debts from cache:', err);
        return [];
      });
      const cachedAccounts = await cacheService.get('accounts').catch(err => {
        console.warn('Error loading accounts from cache:', err);
        return [];
      });
      const debt = cachedDebts.find((d: any) => d.id === debtId)
      
      if (!debt) throw new Error('Debt not found')
      
      const account = cachedAccounts.find((a: any) => a.id === debt.account_id)

      // Get categories and subcategories for debt and loan using the new category structure
      const { incomeCategory, incomeSubcategory, expenseCategory, expenseSubcategory } = await ensureDebtCategories()
      
      const cachedCategories = await cacheService.get('categories').catch(err => {
        console.warn('Error loading categories from cache:', err);
        return [];
      });
      const incomeCateg = cachedCategories.find((c: any) => c.id === incomeCategory)
      const expenseCateg = cachedCategories.find((c: any) => c.id === expenseCategory)
      
      // Find subcategories
      const prestamosSubcategory = incomeCateg?.subcategories?.find((s: any) => s.id === incomeSubcategory)
      const comisionSubcategory = expenseCateg?.subcategories?.find((s: any) => s.id === expenseSubcategory)

      // Get payments from cache with error handling
      const cachedDebtPayments = await cacheService.get('debt_payments').catch(err => {
        console.warn('Error loading debt payments from cache:', err);
        return [];
      });
      const payments = cachedDebtPayments
        .filter((p: any) => p.debt_id === debtId)
        .sort((a: any, b: any) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())

      // Add category and subcategory info to each payment
      const enrichedPayments = payments.map((payment: any) => {
        // Determine category and subcategory based on amount sign (same logic as addDebtPayment)
        const isPositiveAmount = payment.amount > 0
        let selectedCategory, selectedSubcategory
        
        if (isPositiveAmount) {
          // Positive amounts use "Ingresos" -> "Préstamos, alquileres"
          selectedCategory = incomeCateg
          selectedSubcategory = prestamosSubcategory
        } else {
          // Negative amounts use "Gastos financieros" -> "Comisión"
          selectedCategory = expenseCateg
          selectedSubcategory = comisionSubcategory
        }

        return {
          ...payment,
          transactions: {
            category_id: selectedCategory?.id,
            subcategory_id: selectedSubcategory?.id,
            account_id: debt?.account_id,
            categories: selectedCategory,
            subcategories: selectedSubcategory,
            accounts: account ? { name: account.name } : undefined
          }
        }
      })

      return enrichedPayments
    } catch (error) {
      console.error('Error loading debt payments from cache:', error)
      return []
    }
  }

  const ensureDebtCategories = async () => {
    if (!user) return { debtCategoryId: null, loanCategoryId: null, debtSubcategoryId: null, loanSubcategoryId: null }

    // Get categories from cache
    const cachedCategories = await cacheService.get('categories') || []
    const currentCategories = cachedCategories.filter((c: any) => c.user_id === user.id)

    // Find or create 'Gastos financieros' category (for negative amounts/expenses)
    let expenseCategory = currentCategories.find(c => c.name === 'Gastos financieros')
    if (!expenseCategory) {
      try {
        const newExpenseCategory = await createCategory({
          name: 'Gastos financieros',
          color: '#ef4444', // Red color for expenses
          icon: '💰',
          nature: 'Deber' // Using correct nature value
        })
        if (newExpenseCategory) {
          expenseCategory = newExpenseCategory as any
          console.log('Created expense category:', expenseCategory)
          // Refresh settings to update local state
          await refetchSettings()
        }
      } catch (error) {
        console.error('Error creating expense category:', error)
      }
    }

    // Find or create 'Ingresos' category (for positive amounts/income)
    let incomeCategory = currentCategories.find(c => c.name === 'Ingresos')
    if (!incomeCategory) {
      try {
        const newIncomeCategory = await createCategory({
          name: 'Ingresos',
          color: '#22c55e', // Green color for income
          icon: '💵',
          nature: 'Necesitar' // Using correct nature value
        })
        if (newIncomeCategory) {
          incomeCategory = newIncomeCategory as any
          console.log('Created income category:', incomeCategory)
          // Refresh settings to update local state
          await refetchSettings()
        }
      } catch (error) {
        console.error('Error creating income category:', error)
      }
    }

    // Get updated categories from cache after potential creation
    const updatedCategories = await cacheService.get('categories') || []
    const finalCategories = updatedCategories.filter((c: any) => c.user_id === user.id)
    const finalExpenseCategory = finalCategories.find((c: any) => c.name === 'Gastos financieros')
    const finalIncomeCategory = finalCategories.find((c: any) => c.name === 'Ingresos')

    // Find or create 'Comisión' subcategory under 'Gastos financieros' (for negative amounts)
    let comisionSubcategory = finalExpenseCategory?.subcategories?.find(s => s.name === 'Comisión')
    if (!comisionSubcategory && finalExpenseCategory) {
      try {
        const newComisionSubcategory = await createSubcategory({
          name: 'Comisión',
          category_id: finalExpenseCategory.id,
          icon: '💳'
        })
        if (newComisionSubcategory) {
          comisionSubcategory = newComisionSubcategory as any
          console.log('Created comision subcategory:', comisionSubcategory)
          // Refresh settings to update local state
          await refetchSettings()
        }
      } catch (error) {
        console.error('Error creating comision subcategory:', error)
      }
    }

    // Find or create 'Préstamos, alquileres' subcategory under 'Ingresos' (for positive amounts)
    let prestamosSubcategory = finalIncomeCategory?.subcategories?.find(s => s.name === 'Préstamos, alquileres')
    if (!prestamosSubcategory && finalIncomeCategory) {
      try {
        const newPrestamosSubcategory = await createSubcategory({
          name: 'Préstamos, alquileres',
          category_id: finalIncomeCategory.id,
          icon: '🏠'
        })
        if (newPrestamosSubcategory) {
          prestamosSubcategory = newPrestamosSubcategory as any
          console.log('Created prestamos subcategory:', prestamosSubcategory)
          // Refresh settings to update local state
          await refetchSettings()
        }
      } catch (error) {
        console.error('Error creating prestamos subcategory:', error)
      }
    }

    return {
      // For positive amounts (income): use "Ingresos" -> "Préstamos, alquileres"
      incomeCategory: finalIncomeCategory?.id || null,
      incomeSubcategory: prestamosSubcategory?.id || null,
      // For negative amounts (expense): use "Gastos financieros" -> "Comisión"
      expenseCategory: finalExpenseCategory?.id || null,
      expenseSubcategory: comisionSubcategory?.id || null,
      // Keep old naming for backward compatibility
      debtCategoryId: finalIncomeCategory?.id || null,
      loanCategoryId: finalExpenseCategory?.id || null,
      debtSubcategoryId: prestamosSubcategory?.id || null,
      loanSubcategoryId: comisionSubcategory?.id || null
    }
  }

  const createDebt = async (debtData: Omit<Debt, 'id' | 'user_id' | 'created_at' | 'updated_at'>, selectedTags: string[] = [], options?: { skipTransaction?: boolean }) => {
    if (!user) return null

    try {
      // Ensure debt/loan categories exist
      const { debtCategoryId, loanCategoryId, debtSubcategoryId, loanSubcategoryId } = await ensureDebtCategories()

      // Get contact information from cache
      const cachedContacts = await cacheService.get('contacts') || []
      const contact = cachedContacts.find((c: any) => c.id === debtData.contact_id)
      const contactName = contact?.name || 'contacto'

      // Create new debt with UUID
      const newDebt = {
        id: uuidv4(),
        ...debtData,
        user_id: user.id,
        current_balance: debtData.initial_amount,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Update debts cache
      const cachedDebts = await cacheService.get('debts') || []
      await cacheService.updateCacheItem('debts', [...cachedDebts, newDebt])

      // Create initial transaction for manual debts/loans (not for inventory-based ones)
      if (!options?.skipTransaction) {
        const transactionType = debtData.type === 'debt' ? 'income' : 'expense'
        const categoryId = debtData.type === 'debt' ? debtCategoryId : loanCategoryId
        const description = debtData.type === 'debt' 
          ? `Deuda - ${contactName}` 
          : `Préstamo - ${contactName}`

        await createTransaction({
          type: transactionType,
          amount: debtData.initial_amount,
          account_id: debtData.account_id,
          category_id: categoryId,
          subcategory_id: debtData.type === 'debt' ? debtSubcategoryId : loanSubcategoryId,
          description,
          beneficiary: contactName,
          note: debtData.description,
          transaction_date: debtData.debt_date,
          tags: selectedTags
        })
      }

      // Create initial payment record in debt_payments for history tracking
      const initialPaymentAmount = debtData.type === 'debt' ? debtData.initial_amount : -debtData.initial_amount
      
      const newDebtPayment = {
        id: uuidv4(),
        debt_id: newDebt.id,
        amount: initialPaymentAmount,
        payment_date: debtData.debt_date,
        description: `Registro inicial - ${debtData.type === 'loan' ? 'Préstamo' : 'Deuda'}`,
        created_at: new Date().toISOString()
      }

      // Update debt_payments cache
      const cachedDebtPayments = await cacheService.get('debt_payments') || []
      await cacheService.updateCacheItem('debt_payments', [...cachedDebtPayments, newDebtPayment])
      
      // Register pending changes
      await cacheService.addPendingChange({
        operation: 'create',
        table: 'debts',
        record_id: newDebt.id,
        data: newDebt
      })

      await cacheService.addPendingChange({
        operation: 'create',
        table: 'debt_payments',
        record_id: newDebtPayment.id,
        data: newDebtPayment
      })
      
      await fetchDebts()
      refetchTransactions() // Refresh transactions to show in Records page
      toast.success('Deuda creada exitosamente')
      return newDebt
    } catch (error) {
      console.error('Error creating debt:', error)
      toast.error('Error al crear la deuda')
      return null
    }
  }

  const updateDebt = async (id: string, updates: Partial<Debt>) => {
    try {
      // Get current debt data from cache
      const cachedDebts = await cacheService.get('debts') || []
      const cachedContacts = await cacheService.get('contacts') || []
      const currentDebt = cachedDebts.find((d: any) => d.id === id)

      if (!currentDebt) throw new Error('Debt not found')

      // Get contact information
      const currentContact = cachedContacts.find((c: any) => c.id === currentDebt.contact_id)
      let contactName = currentContact?.name || ''
      
      if (updates.contact_id && updates.contact_id !== currentDebt.contact_id) {
        const newContact = cachedContacts.find((c: any) => c.id === updates.contact_id)
        contactName = newContact?.name || ''
      }

      // Update the debt in cache
      const updatedDebt = {
        ...currentDebt,
        ...updates,
        updated_at: new Date().toISOString()
      }

      const updatedDebts = cachedDebts.map((d: any) => 
        d.id === id ? updatedDebt : d
      )
      await cacheService.updateCacheItem('debts', updatedDebts)

      // Register pending change
      await cacheService.addPendingChange({
        operation: 'update',
        table: 'debts',
        record_id: id,
        data: updatedDebt
      })
      
      await fetchDebts()
      refetchTransactions() // Refresh transactions to show changes in Records page
      toast.success('Deuda actualizada exitosamente')
    } catch (error) {
      console.error('Error updating debt:', error)
      toast.error('Error al actualizar la deuda')
    }
  }

  const deleteDebt = async (id: string) => {
    try {
      // Get debt and debt payments from cache
      const cachedDebts = await cacheService.get('debts') || []
      const cachedDebtPayments = await cacheService.get('debt_payments') || []
      
      const debt = cachedDebts.find((d: any) => d.id === id)
      if (!debt) throw new Error('Debt not found')

      // Remove debt from cache
      const updatedDebts = cachedDebts.filter((d: any) => d.id !== id)
      await cacheService.updateCacheItem('debts', updatedDebts)

      // Remove associated debt payments from cache
      const updatedDebtPayments = cachedDebtPayments.filter((p: any) => p.debt_id !== id)
      await cacheService.updateCacheItem('debt_payments', updatedDebtPayments)

      // Register pending changes
      await cacheService.addPendingChange({
        operation: 'delete',
        table: 'debts',
        record_id: id,
        data: debt
      })

      // Register pending changes for debt payments
      const debtPaymentsToDelete = cachedDebtPayments.filter((p: any) => p.debt_id === id)
      for (const payment of debtPaymentsToDelete) {
        await cacheService.addPendingChange({
          operation: 'delete',
          table: 'debt_payments',
          record_id: payment.id,
          data: payment
        })
      }
      
      await fetchDebts()
      refetchTransactions() // Refresh transactions to show changes in Records page
      toast.success('Deuda eliminada exitosamente')
    } catch (error) {
      console.error('Error deleting debt:', error)
      toast.error('Error al eliminar la deuda')
    }
  }

  const addDebtPayment = async (debtId: string, paymentData: Omit<DebtPayment, 'id' | 'debt_id' | 'created_at'>, selectedTags: string[] = []) => {
    try {
      // Get debt information first
      const debt = debts.find(d => d.id === debtId)
      if (!debt) throw new Error('Debt not found')

      // Ensure debt/loan categories exist
      const { incomeCategory, incomeSubcategory, expenseCategory, expenseSubcategory } = await ensureDebtCategories()

      // Get contact information from cache
      const cachedContacts = await cacheService.get('contacts') || []
      const contactData = cachedContacts.find((c: any) => c.id === debt.contact_id)

      // Create payment record
      const paymentId = uuidv4()
      const payment = {
        id: paymentId,
        ...paymentData,
        debt_id: debtId,
        created_at: new Date().toISOString()
      }

      // Add payment to cache
      const cachedDebtPayments = await cacheService.get('debt_payments') || []
      const updatedDebtPayments = [...cachedDebtPayments, payment]
      await cacheService.updateCacheItem('debt_payments', updatedDebtPayments)

      // Register pending change
      await cacheService.addPendingChange({
        operation: 'create',
        table: 'debt_payments',
        record_id: paymentId,
        data: payment
      })

      // NEW LOGIC: Simple categorization based on amount sign
      // Positive amount → "Ingresos" with "Préstamos, alquileres" subcategory
      // Negative amount → "Gastos financieros" with "Comisión" subcategory
      const isPositiveAmount = paymentData.amount > 0
      let transactionType: 'income' | 'expense'
      let categoryId: string | null
      let subcategoryId: string | null
      let description: string

      if (isPositiveAmount) {
        // Positive amounts always use income category with loans subcategory
        transactionType = 'income'
        categoryId = incomeCategory
        subcategoryId = incomeSubcategory
        description = `Ingreso por deuda/préstamo - ${contactData?.name || 'contacto'}`
      } else {
        // Negative amounts always use expense category with commission subcategory
        transactionType = 'expense'
        categoryId = expenseCategory
        subcategoryId = expenseSubcategory
        description = `Gasto por deuda/préstamo - ${contactData?.name || 'contacto'}`
      }

      // Create the transaction if category exists
      let transactionId = null
      if (categoryId) {
        const transactionData = {
          type: transactionType,
          amount: paymentData.amount,
          account_id: paymentData.account_id || debt?.account_id || "",
          category_id: categoryId,
          subcategory_id: subcategoryId,
          description,
          beneficiary: contactData?.name,
          note: paymentData.description,
          transaction_date: paymentData.payment_date,
          tags: selectedTags
        }

        try {
          const createdTransaction = await createTransaction(transactionData)
          console.log('Created transaction for debt payment:', createdTransaction)
          if (createdTransaction && typeof createdTransaction === 'object') {
            if (Array.isArray(createdTransaction) && createdTransaction.length > 0) {
              transactionId = (createdTransaction[0] as any)?.id
            } else if ('id' in createdTransaction) {
              transactionId = (createdTransaction as any).id
            }
          }
          console.log('Extracted transaction ID:', transactionId)
        } catch (err) {
          console.error('Error creating transaction for debt payment:', err)
        }
      }

      // Update the payment record with the transaction ID in cache
      if (transactionId) {
        const cachedDebtPayments = await cacheService.get('debt_payments') || []
        const updatedPayments = cachedDebtPayments.map((p: any) => 
          p.id === payment.id ? { ...p, transaction_id: transactionId } : p
        )
        await cacheService.updateCacheItem('debt_payments', updatedPayments)
        
        // Register pending change for the update
        await cacheService.addPendingChange({
          operation: 'update',
          table: 'debt_payments',
          record_id: payment.id,
          data: { ...payment, transaction_id: transactionId }
        })
      }

      // Recalcular el saldo basado en la suma de todos los registros
      const newBalance = await calculateDebtBalance(debtId)
      
      // Check if balance reaches exactly zero to close debt/loan
      if (Math.abs(newBalance) < 0.01) {
        // Exact payment - close the debt/loan only when balance is exactly zero
        await updateDebt(debtId, { 
          current_balance: 0,
          status: 'closed'
        })
        toast.success('Pago registrado. Deuda/Préstamo cerrado.')
      } else {
        // Check if the sign changed (debt became loan or vice versa)
        const originalType = debt?.type
        const shouldChangeType = (originalType === 'debt' && newBalance > 0) || (originalType === 'loan' && newBalance < 0)
        
        if (shouldChangeType) {
          // Change debt type but keep it active with the same records
          const newType = originalType === 'debt' ? 'loan' : 'debt'
          await updateDebt(debtId, { 
            current_balance: newBalance,
            type: newType,
            status: 'active'
          })
          toast.success(`Pago registrado. ${originalType === 'debt' ? 'Deuda convertida a Préstamo' : 'Préstamo convertido a Deuda'}.`)
        } else {
          // Normal payment - update balance and keep active
          await updateDebt(debtId, { 
            current_balance: newBalance,
            status: 'active'
          })
          toast.success('Pago registrado exitosamente')
        }
      }

      refetchTransactions() // Refresh transactions to show in Records page
      return payment
    } catch (error) {
      console.error('Error adding debt payment:', error)
      toast.error('Error al registrar el pago')
      return null
    }
  }

  const deleteDebtPayment = async (paymentId: string, debtId: string) => {
    try {
      // Get payment details from cache
      const cachedDebtPayments = await cacheService.get('debt_payments') || []
      const payment = cachedDebtPayments.find((p: any) => p.id === paymentId)

      if (!payment) throw new Error('Payment not found')

      // Remove payment from cache
      const updatedDebtPayments = cachedDebtPayments.filter((p: any) => p.id !== paymentId)
      await cacheService.updateCacheItem('debt_payments', updatedDebtPayments)

      // Register pending change
      await cacheService.addPendingChange({
        operation: 'delete',
        table: 'debt_payments',
        record_id: paymentId,
        data: payment
      })

      // Recalcular el saldo basado en la suma de todos los registros restantes
      const newBalance = await calculateDebtBalance(debtId)
      await updateDebt(debtId, { 
        current_balance: newBalance,
        status: Math.abs(newBalance) < 0.01 ? 'closed' : 'active'
      })

      await fetchDebts()
      refetchTransactions() // Refresh transactions to show in Records page
      toast.success('Registro eliminado exitosamente')
    } catch (error) {
      console.error('Error deleting debt payment:', error)
      toast.error('Error al eliminar el registro')
    }
  }

  const updateDebtPayment = async (paymentId: string, debtId: string, updatedData: Partial<DebtPayment>) => {
    try {
      // Get current payment details from cache
      const cachedDebtPayments = await cacheService.get('debt_payments') || []
      const currentPayment = cachedDebtPayments.find((p: any) => p.id === paymentId)

      if (!currentPayment) throw new Error('Payment not found')

      // Get debt details
      const debt = debts.find(d => d.id === debtId)
      if (!debt) throw new Error('Debt not found')

      // Update payment in cache
      const updatedPayment = {
        ...currentPayment,
        ...updatedData,
        updated_at: new Date().toISOString()
      }

      const updatedDebtPayments = cachedDebtPayments.map((p: any) => 
        p.id === paymentId ? updatedPayment : p
      )
      await cacheService.updateCacheItem('debt_payments', updatedDebtPayments)

      // Register pending change
      await cacheService.addPendingChange({
        operation: 'update',
        table: 'debt_payments',
        record_id: paymentId,
        data: updatedPayment
      })

      // If amount changed, update debt balance
      if (updatedData.amount !== undefined) {
        const isInitialRecord = currentPayment.description?.includes('Registro inicial')
        
        if (isInitialRecord) {
          // For initial records, update the debt's initial_amount in cache
          const newInitialAmount = Math.abs(updatedData.amount)
          await updateDebt(debtId, { initial_amount: newInitialAmount })
        }
        
        // Recalcular el saldo basado en la suma de todos los registros
        const newBalance = await calculateDebtBalance(debtId)
        
        // Check if balance reaches exactly zero to close debt/loan
        if (Math.abs(newBalance) < 0.01) {
          await updateDebt(debtId, { 
            current_balance: 0,
            status: 'closed'
          })
        } else {
          // Check if the sign changed (debt became loan or vice versa)
          const originalType = debt?.type
          const shouldChangeType = (originalType === 'debt' && newBalance > 0) || (originalType === 'loan' && newBalance < 0)
          
          if (shouldChangeType) {
            // Change debt type but keep it active with the same records
            const newType = originalType === 'debt' ? 'loan' : 'debt'
            await updateDebt(debtId, { 
              current_balance: newBalance,
              type: newType,
              status: 'active'
            })
          } else {
            // Normal update - update balance and keep active
            await updateDebt(debtId, { 
              current_balance: newBalance,
              status: 'active'
            })
          }
        }
      }

      await fetchDebts()
      refetchTransactions() // Refresh transactions to show in Records page
      toast.success('Registro actualizado exitosamente')
      
      // Force re-fetch of debt payments to reflect updated categories
      setTimeout(() => {
        fetchDebts()
      }, 100)
    } catch (error) {
      console.error('Error updating debt payment:', error)
      toast.error('Error al actualizar el registro')
    }
  }

  useEffect(() => {
    if (user) {
      fetchDebts().finally(() => setLoading(false))
    }
  }, [user])

  const reactivateDebt = async (id: string) => {
    try {
      // Update debt status in cache
      const currentDebt = cacheService.getRecord('debts', id)
      if (!currentDebt) {
        throw new Error('Debt not found')
      }

      const updatedDebt = { ...currentDebt, status: 'active' }
      cacheService.updateRecord('debts', id, updatedDebt)
      cacheService.addPendingChange({
        table: 'debts',
        operation: 'update',
        record_id: id,
        data: { status: 'active' }
      })
      
      await fetchDebts()
      toast.success('Deuda reactivada exitosamente')
    } catch (error) {
      console.error('Error reactivating debt:', error)
      toast.error('Error al reactivar la deuda')
    }
  }

  return {
    debts,
    debtPayments,
    loading,
    fetchDebts,
    fetchDebtPayments,
    createDebt,
    updateDebt,
    deleteDebt,
    addDebtPayment,
    deleteDebtPayment,
    updateDebtPayment,
    reactivateDebt,
    calculateDebtBalance
  }
}