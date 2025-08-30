import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "./useAuth"
import { toast } from "sonner"
import { useTransactions } from "./useTransactions"
import { useSettings } from "./useSettings"

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
      // Obtener información de la deuda para conocer su tipo
      const { data: debt, error: debtError } = await supabase
        .from('debts')
        .select('type')
        .eq('id', debtId)
        .single()

      if (debtError) throw debtError

      const { data: payments, error } = await supabase
        .from('debt_payments')
        .select('amount')
        .eq('debt_id', debtId)
        .order('payment_date', { ascending: true })

      if (error) throw error
      
      // Calcular el saldo sumando todos los registros
      // Los valores ya están almacenados con los signos correctos:
      // - Deudas ("Me prestaron"): valores negativos
      // - Préstamos ("Prestó"): valores positivos
      const totalBalance = (payments || []).reduce((sum, payment) => sum + payment.amount, 0)
      // Multiplicar el resultado por -1 según la nueva lógica
      return totalBalance * -1
    } catch (error) {
      console.error('Error calculating debt balance:', error)
      return 0
    }
  }

  const fetchDebts = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('debts')
        .select(`
          *,
          contacts:contact_id (
            id,
            name,
            image_url
          ),
          accounts:account_id (
            id,
            name
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Calcular el saldo real para cada deuda basado en la suma de registros
      const debtsWithCalculatedBalance = await Promise.all(
        (data as Debt[] || []).map(async (debt) => {
          const calculatedBalance = await calculateDebtBalance(debt.id)
          return {
            ...debt,
            current_balance: calculatedBalance
          }
        })
      )
      
      setDebts(debtsWithCalculatedBalance)
    } catch (error) {
      console.error('Error fetching debts:', error)
      toast.error('Error al cargar las deudas')
    }
  }

  const fetchDebtPayments = async (debtId: string) => {
    try {
      // Get the debt details first to determine category
      const { data: debt, error: debtError } = await supabase
        .from('debts')
        .select(`
          *,
          accounts (
            name
          )
        `)
        .eq('id', debtId)
        .single()

      if (debtError) throw debtError

      // Get categories and subcategories for debt and loan using the new category structure
      const { incomeCategory, incomeSubcategory, expenseCategory, expenseSubcategory } = await ensureDebtCategories()
      
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select(`
          *,
          subcategories (*)
        `)
        .in('id', [incomeCategory, expenseCategory].filter(Boolean))

      if (categoriesError) throw categoriesError

      const incomeCateg = categories?.find(c => c.id === incomeCategory)
      const expenseCateg = categories?.find(c => c.id === expenseCategory)
      const prestamosSubcategory = incomeCateg?.subcategories?.find(s => s.id === incomeSubcategory)
      const comisionSubcategory = expenseCateg?.subcategories?.find(s => s.id === expenseSubcategory)

      // Get payments
      const { data, error } = await supabase
        .from('debt_payments')
        .select('*')
        .eq('debt_id', debtId)
        .order('payment_date', { ascending: false })

      if (error) throw error

      // Add category and subcategory info to each payment
      const enrichedPayments = (data || []).map(payment => {
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
            accounts: debt?.accounts
          }
        }
      })

      return enrichedPayments
    } catch (error) {
      console.error('Error fetching debt payments:', error)
      return []
    }
  }

  const ensureDebtCategories = async () => {
    if (!user) return { debtCategoryId: null, loanCategoryId: null, debtSubcategoryId: null, loanSubcategoryId: null }

    // Get fresh categories from database to avoid stale state
    const { data: freshCategories } = await supabase
      .from('categories')
      .select(`
        *,
        subcategories (*)
      `)
      .eq('user_id', user.id)

    const currentCategories = freshCategories || []

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

    // Get updated categories after potential creation
    const { data: updatedCategories } = await supabase
      .from('categories')
      .select(`
        *,
        subcategories (*)
      `)
      .eq('user_id', user.id)

    const finalCategories = updatedCategories || []
    const finalExpenseCategory = finalCategories.find(c => c.name === 'Gastos financieros')
    const finalIncomeCategory = finalCategories.find(c => c.name === 'Ingresos')

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

      // Get contact information for the transaction
      const { data: contactData } = await supabase
        .from('contacts')
        .select('name')
        .eq('id', debtData.contact_id)
        .single()

      const { data, error } = await supabase
        .from('debts')
        .insert({
          ...debtData,
          user_id: user.id,
          current_balance: debtData.initial_amount
        })
        .select()
        .single()

      if (error) throw error

      // Create initial transaction for manual debts/loans (not for inventory-based ones)
      if (!options?.skipTransaction) {
        const transactionType = debtData.type === 'debt' ? 'income' : 'expense'
        const categoryId = debtData.type === 'debt' ? debtCategoryId : loanCategoryId
        const description = debtData.type === 'debt' 
          ? `Deuda - ${contactData?.name || 'contacto'}` 
          : `Préstamo - ${contactData?.name || 'contacto'}`

        await createTransaction({
          type: transactionType,
          amount: debtData.initial_amount,
          account_id: debtData.account_id,
          category_id: categoryId,
          subcategory_id: debtData.type === 'debt' ? debtSubcategoryId : loanSubcategoryId,
          description,
          beneficiary: contactData?.name,
          note: debtData.description,
          transaction_date: debtData.debt_date,
          tags: selectedTags
        })
      }

      // Create initial payment record in debt_payments for history tracking
      // Para que las deudas muestren valores negativos y los préstamos positivos:
      // - Para deudas ("Me prestaron"): monto positivo (se invierte con el *-1 en calculateDebtBalance)
      // - Para préstamos ("Prestó"): monto negativo (se invierte con el *-1 en calculateDebtBalance)
      const initialPaymentAmount = debtData.type === 'debt' ? debtData.initial_amount : -debtData.initial_amount
      
      await supabase
        .from('debt_payments')
        .insert({
          debt_id: data.id,
          amount: initialPaymentAmount,
          payment_date: debtData.debt_date,
          description: `Registro inicial - ${debtData.type === 'loan' ? 'Préstamo' : 'Deuda'}`
        })
      
      await fetchDebts()
      refetchTransactions() // Refresh transactions to show in Records page
      toast.success('Deuda creada exitosamente')
      return data
    } catch (error) {
      console.error('Error creating debt:', error)
      toast.error('Error al crear la deuda')
      return null
    }
  }

  const updateDebt = async (id: string, updates: Partial<Debt>) => {
    try {
      // Get current debt data before updating
      const { data: currentDebt } = await supabase
        .from('debts')
        .select('*, contacts(name)')
        .eq('id', id)
        .single()

      if (!currentDebt) throw new Error('Debt not found')

      // Update the debt
      const { error } = await supabase
        .from('debts')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      // Handle synchronization with linked transactions
      // 1. Update initial transaction if debt details changed
      if (updates.initial_amount !== undefined || 
          updates.debt_date !== undefined || 
          updates.contact_id !== undefined) {
        
        // Get contact name for transaction description
        let contactName = currentDebt.contacts?.name || ''
        if (updates.contact_id && updates.contact_id !== currentDebt.contact_id) {
          const { data: newContact } = await supabase
            .from('contacts')
            .select('name')
            .eq('id', updates.contact_id)
            .single()
          contactName = newContact?.name || ''
        }

        // Find and update the initial transaction
        const initialDescription = `${currentDebt.type === 'loan' ? 'Préstamo' : 'Deuda'} - ${contactName}`
        
        const transactionUpdates: any = {}
        if (updates.initial_amount !== undefined) {
          transactionUpdates.amount = updates.initial_amount
        }
        if (updates.debt_date !== undefined) {
          transactionUpdates.transaction_date = updates.debt_date
        }
        if (contactName && (updates.contact_id !== undefined)) {
          transactionUpdates.description = initialDescription
          transactionUpdates.beneficiary = contactName
        }

        // Update the initial transaction if there are changes
        if (Object.keys(transactionUpdates).length > 0) {
          await supabase
            .from('transactions')
            .update(transactionUpdates)
            .eq('description', `${currentDebt.type === 'loan' ? 'Préstamo' : 'Deuda'} - ${currentDebt.contacts?.name || ''}`)
            .eq('transaction_date', currentDebt.debt_date)
        }
      }

      // 2. Update debt payments and their linked transactions if account changed
      if (updates.account_id !== undefined && updates.account_id !== currentDebt.account_id) {
        // Get all debt payments with transaction IDs
        const { data: debtPayments } = await supabase
          .from('debt_payments')
          .select('transaction_id')
          .eq('debt_id', id)
          .not('transaction_id', 'is', null)

        // Update all linked transactions to use the new account
        if (debtPayments && debtPayments.length > 0) {
          const transactionIds = debtPayments
            .filter(p => p.transaction_id)
            .map(p => p.transaction_id)
          
          if (transactionIds.length > 0) {
            await supabase
              .from('transactions')
              .update({ account_id: updates.account_id })
              .in('id', transactionIds)
          }
        }
      }
      
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
      // Get the debt information to find the initial transaction
      const { data: debt } = await supabase
        .from('debts')
        .select('contact_id, type, debt_date')
        .eq('id', id)
        .single()

      // Get contact name for transaction description matching
      let contactName = ''
      if (debt?.contact_id) {
        const { data: contact } = await supabase
          .from('contacts')
          .select('name')
          .eq('id', debt.contact_id)
          .single()
        contactName = contact?.name || ''
      }

      // Find and delete the initial transaction based on description pattern
      if (debt && contactName) {
        const initialDescription = `${debt.type === 'loan' ? 'Préstamo a' : 'Deuda con'} ${contactName}`
        
        await supabase
          .from('transactions')
          .delete()
          .eq('description', initialDescription)
          .eq('transaction_date', debt.debt_date)
      }

      // Get all debt payments to delete associated transactions
      const { data: payments } = await supabase
        .from('debt_payments')
        .select('transaction_id')
        .eq('debt_id', id)

      // Delete associated transactions from payments
      if (payments && payments.length > 0) {
        const transactionIds = payments
          .filter(p => p.transaction_id)
          .map(p => p.transaction_id)
        
        if (transactionIds.length > 0) {
          await supabase
            .from('transactions')
            .delete()
            .in('id', transactionIds)
        }
      }

      // Delete debt payments first
      await supabase
        .from('debt_payments')
        .delete()
        .eq('debt_id', id)

      // Delete the debt
      const { error } = await supabase
        .from('debts')
        .delete()
        .eq('id', id)

      if (error) throw error
      
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

      // Get contact information for the transaction
      const { data: contactData } = await supabase
        .from('contacts')
        .select('name')
        .eq('id', debt.contact_id)
        .single()

      // Create payment record with account_id
      const { data: payment, error: paymentError } = await supabase
        .from('debt_payments')
        .insert({
          ...paymentData,
          debt_id: debtId
        })
        .select()
        .single()

      if (paymentError) throw paymentError

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

      // Update the payment record with the transaction ID
      if (transactionId) {
        await supabase
          .from('debt_payments')
          .update({ transaction_id: transactionId })
          .eq('id', payment.id)
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
      // Get payment details before deleting, including transaction_id
      const { data: payment } = await supabase
        .from('debt_payments')
        .select('amount, transaction_id')
        .eq('id', paymentId)
        .single()

      if (!payment) throw new Error('Payment not found')

      // Delete associated transaction if it exists
      if (payment.transaction_id) {
        try {
          const { error: transactionError } = await supabase
            .from('transactions')
            .delete()
            .eq('id', payment.transaction_id)
          
          if (transactionError) {
            console.error('Error deleting associated transaction:', transactionError)
          }
        } catch (transactionErr) {
          console.error('Error deleting transaction:', transactionErr)
        }
      }

      // Delete payment
      const { error } = await supabase
        .from('debt_payments')
        .delete()
        .eq('id', paymentId)

      if (error) throw error

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
      // Get current payment details, including transaction_id
      const { data: currentPayment } = await supabase
        .from('debt_payments')
        .select('amount, transaction_id, payment_date, description')
        .eq('id', paymentId)
        .single()

      if (!currentPayment) throw new Error('Payment not found')

      // Get debt details
      const debt = debts.find(d => d.id === debtId)
      if (!debt) throw new Error('Debt not found')

      // Update payment
      const { error } = await supabase
        .from('debt_payments')
        .update(updatedData)
        .eq('id', paymentId)

      if (error) throw error

      // Update associated transaction if it exists and relevant fields changed
      if (currentPayment.transaction_id && 
          (updatedData.amount !== undefined || 
           updatedData.payment_date !== undefined || 
           updatedData.description !== undefined)) {
        
        const transactionUpdates: any = {}
        
        if (updatedData.amount !== undefined) {
          // Mantener el signo original del monto para preservar la naturaleza de la transacción
          transactionUpdates.amount = updatedData.amount
        }
        if (updatedData.payment_date !== undefined) {
          transactionUpdates.transaction_date = updatedData.payment_date
        }
        if (updatedData.description !== undefined) {
          transactionUpdates.note = updatedData.description
        }

        try {
          const { error: transactionError } = await supabase
            .from('transactions')
            .update(transactionUpdates)
            .eq('id', currentPayment.transaction_id)
          
          if (transactionError) {
            console.error('Error updating associated transaction:', transactionError)
          }
        } catch (transactionErr) {
          console.error('Error updating transaction:', transactionErr)
        }
      }

      // If amount changed, update debt balance
      if (updatedData.amount !== undefined) {
        const isInitialRecord = currentPayment.description?.includes('Registro inicial')
        
        if (isInitialRecord) {
          // For initial records, update the debt's initial_amount
          const newInitialAmount = Math.abs(updatedData.amount)
          await supabase
            .from('debts')
            .update({ initial_amount: newInitialAmount })
            .eq('id', debtId)
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
      const { error } = await supabase
        .from('debts')
        .update({ status: 'active' })
        .eq('id', id)

      if (error) throw error
      
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