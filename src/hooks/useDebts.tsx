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
  amount: number
  payment_date: string
  description?: string
  created_at: string
  transactions?: {
    category_id: string
    account_id: string
    categories: {
      name: string
      icon: string
      color: string
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
  const { categories, createCategory, createSubcategory } = useSettings()

  const calculateDebtBalance = async (debtId: string): Promise<number> => {
    try {
      const { data: payments, error } = await supabase
        .from('debt_payments')
        .select('amount')
        .eq('debt_id', debtId)
        .order('payment_date', { ascending: true })

      if (error) throw error
      
      // Calcular el saldo sumando todos los registros
      const totalBalance = (payments || []).reduce((sum, payment) => sum + payment.amount, 0)
      return totalBalance
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

      // Get categories for debt and loan using the new category structure
      const { debtCategoryId, loanCategoryId } = await ensureDebtCategories()
      
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .in('id', [debtCategoryId, loanCategoryId].filter(Boolean))

      if (categoriesError) throw categoriesError

      const debtCategory = categories?.find(c => c.id === debtCategoryId)
      const loanCategory = categories?.find(c => c.id === loanCategoryId)

      // Get payments
      const { data, error } = await supabase
        .from('debt_payments')
        .select('*')
        .eq('debt_id', debtId)
        .order('payment_date', { ascending: false })

      if (error) throw error

      // Add category and account info to each payment
      const enrichedPayments = (data || []).map(payment => {
        // Determine category based on payment type and debt type
        let selectedCategory
        if (!debt?.type) {
          // Default to debt category if debt info is not available
          selectedCategory = debtCategory
        } else if (payment.description?.includes('Registro inicial')) {
          // Initial records should match the debt type
          selectedCategory = debt.type === 'loan' ? loanCategory : debtCategory
        } else {
          // Apply the same category logic as addDebtPayment
          if (debt.type === 'debt') {
            // For debts: positive = "Deuda", negative = "Préstamo"
            selectedCategory = payment.amount > 0 ? debtCategory : loanCategory
          } else {
            // For loans: positive = "Deuda", negative = "Préstamo"
            selectedCategory = payment.amount > 0 ? debtCategory : loanCategory
          }
        }

        return {
          ...payment,
          transactions: {
            category_id: selectedCategory?.id,
            account_id: debt?.account_id,
            categories: selectedCategory,
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

    // Find or create 'Gastos financieros' category for loans (Préstamos -> Comisión)
    let expenseCategory = categories.find(c => c.name === 'Gastos financieros')
    if (!expenseCategory) {
      try {
        const newExpenseCategory = await createCategory({
          name: 'Gastos financieros',
          color: '#ef4444', // Red color for expenses
          icon: '💰',
          nature: 'expense'
        })
        if (newExpenseCategory) {
          expenseCategory = newExpenseCategory
          console.log('Created expense category:', expenseCategory)
        }
      } catch (error) {
        console.error('Error creating expense category:', error)
      }
    }

    // Find or create 'Ingresos' category for debts (Deuda -> Préstamos, alquileres)
    let incomeCategory = categories.find(c => c.name === 'Ingresos')
    if (!incomeCategory) {
      try {
        const newIncomeCategory = await createCategory({
          name: 'Ingresos',
          color: '#22c55e', // Green color for income
          icon: '💵',
          nature: 'income'
        })
        if (newIncomeCategory) {
          incomeCategory = newIncomeCategory
          console.log('Created income category:', incomeCategory)
        }
      } catch (error) {
        console.error('Error creating income category:', error)
      }
    }

    // Find or create 'Comisión' subcategory under 'Gastos financieros'
    let comisionSubcategory = expenseCategory?.subcategories?.find(s => s.name === 'Comisión')
    if (!comisionSubcategory && expenseCategory) {
      try {
        const newComisionSubcategory = await createSubcategory({
          name: 'Comisión',
          category_id: expenseCategory.id,
          icon: '🏦'
        })
        if (newComisionSubcategory) {
          comisionSubcategory = newComisionSubcategory
          console.log('Created comision subcategory:', comisionSubcategory)
        }
      } catch (error) {
        console.error('Error creating comision subcategory:', error)
      }
    }

    // Find or create 'Préstamos, alquileres' subcategory under 'Ingresos'
    let prestamosSubcategory = incomeCategory?.subcategories?.find(s => s.name === 'Préstamos, alquileres')
    if (!prestamosSubcategory && incomeCategory) {
      try {
        const newPrestamosSubcategory = await createSubcategory({
          name: 'Préstamos, alquileres',
          category_id: incomeCategory.id,
          icon: '🏠'
        })
        if (newPrestamosSubcategory) {
          prestamosSubcategory = newPrestamosSubcategory
          console.log('Created prestamos subcategory:', prestamosSubcategory)
        }
      } catch (error) {
        console.error('Error creating prestamos subcategory:', error)
      }
    }

    return {
      debtCategoryId: incomeCategory?.id || null, // Deuda -> Ingresos
      loanCategoryId: expenseCategory?.id || null, // Préstamo -> Gastos financieros
      debtSubcategoryId: prestamosSubcategory?.id || null, // Deuda -> Préstamos, alquileres
      loanSubcategoryId: comisionSubcategory?.id || null // Préstamo -> Comisión
    }
  }

  const createDebt = async (debtData: Omit<Debt, 'id' | 'user_id' | 'created_at' | 'updated_at'>, options?: { skipTransaction?: boolean }) => {
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
          tags: []
        })
      }

      // Create initial payment record in debt_payments for history tracking
      // For debts, the initial amount should be positive, for loans negative
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

  const addDebtPayment = async (debtId: string, paymentData: Omit<DebtPayment, 'id' | 'debt_id' | 'created_at'>) => {
    try {
      // Get debt information first
      const debt = debts.find(d => d.id === debtId)
      if (!debt) throw new Error('Debt not found')

      // Ensure debt/loan categories exist
      const { debtCategoryId, loanCategoryId, debtSubcategoryId, loanSubcategoryId } = await ensureDebtCategories()

      // Get contact information for the transaction
      const { data: contactData } = await supabase
        .from('contacts')
        .select('name')
        .eq('id', debt.contact_id)
        .single()

      // Create payment record
      const { data: payment, error: paymentError } = await supabase
        .from('debt_payments')
        .insert({
          ...paymentData,
          debt_id: debtId
        })
        .select()
        .single()

      if (paymentError) throw paymentError

      // Create corresponding transaction in the main records
      // Determine transaction type and category based on debt type and payment direction
      let transactionType: 'income' | 'expense'
      let categoryId: string | null
      let description: string

      if (!debt?.type) {
        // Default to income/debt category if debt info is not available
        transactionType = 'income'
        categoryId = debtCategoryId
        description = `Pago - ${contactData?.name || 'contacto'}`
      } else if (debt.type === 'debt') {
        if (paymentData.amount > 0) {
          // Aumento de deuda → category "Deuda", positive amount
          transactionType = 'income'
          categoryId = debtCategoryId
          description = `Aumento de deuda con ${contactData?.name || 'contacto'}`
        } else {
          // Reembolsar deuda → category "Préstamo", negative amount  
          transactionType = 'expense'
          categoryId = loanCategoryId
          description = `Reembolsar deuda a ${contactData?.name || 'contacto'}`
        }
      } else {
        // debt.type === 'loan'
        if (paymentData.amount < 0) {
          // Negative amount for loan = increase loan → category "Préstamo"
          transactionType = 'expense'
          categoryId = loanCategoryId
          description = `Aumento de préstamo a ${contactData?.name || 'contacto'}`
        } else {
          // Positive amount for loan = collect loan → category "Deuda"
          transactionType = 'income'
          categoryId = debtCategoryId
          description = `Cobro de préstamo de ${contactData?.name || 'contacto'}`
        }
      }

      // Create the transaction if category exists
      let transactionId = null
      if (categoryId) {
        // Determine the correct amount based on debt type and payment direction
        let transactionAmount: number
        
        if (!debt || !debt.type) {
          // Default case - keep amount as entered
          transactionAmount = paymentData.amount
        } else if (debt.type === 'debt') {
          if (paymentData.amount > 0) {
            // Aumento de deuda → positive amount (keep as entered)
            transactionAmount = paymentData.amount
          } else {
            // Reembolsar deuda → negative amount (keep as entered)
            transactionAmount = paymentData.amount
          }
        } else {
          // debt.type === 'loan'
          if (paymentData.amount < 0) {
            // Aumento de préstamo → keep as entered (negative)
            transactionAmount = paymentData.amount
          } else {
            // Cobro de préstamo → keep as entered (positive)
            transactionAmount = paymentData.amount
          }
        }

        // Determine subcategory based on transaction type and category
        let subcategoryId: string | null = null
        if (categoryId === debtCategoryId) {
          subcategoryId = debtSubcategoryId
        } else if (categoryId === loanCategoryId) {
          subcategoryId = loanSubcategoryId
        }

        const transactionData = {
          type: transactionType,
          amount: transactionAmount,
          account_id: debt?.account_id || "",
          category_id: categoryId,
          subcategory_id: subcategoryId,
          description,
          beneficiary: contactData?.name,
          note: paymentData.description,
          transaction_date: paymentData.payment_date,
          tags: []
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
      
      // Check if balance reaches zero to close debt/loan
      if (Math.abs(newBalance) < 0.01) {
        // Exact payment - close the debt/loan only when balance is zero
        await updateDebt(debtId, { 
          current_balance: 0,
          status: 'closed'
        })
        toast.success('Pago registrado. Deuda/Préstamo cerrado.')
      } else if ((debt && debt.type === 'debt' && newBalance < 0) || (debt && debt.type === 'loan' && newBalance < 0)) {
        // Overpayment occurred - close current debt and create opposite type
        await updateDebt(debtId, { 
          current_balance: 0,
          status: 'closed'
        })
        
        // Create new debt/loan of opposite type for the excess amount
        const newDebtData = {
          contact_id: debt?.contact_id || "",
          account_id: debt?.account_id || "",
          type: (debt && debt.type === 'debt') ? 'loan' as const : 'debt' as const,
          description: `Saldo a favor - ${debt?.description || 'Compra'}`,
          initial_amount: Math.abs(newBalance),
          current_balance: Math.abs(newBalance),
          debt_date: paymentData.payment_date,
          status: 'active' as const
        }
        
        await createDebt(newDebtData)
        toast.success(`Pago registrado. ${debt && debt.type === 'debt' ? 'Préstamo' : 'Deuda'} creado por el exceso.`)
      } else {
        // Normal payment - update balance
        await updateDebt(debtId, { 
          current_balance: newBalance,
          status: newBalance === 0 ? 'closed' : 'active'
        })
        toast.success('Pago registrado exitosamente')
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
        await updateDebt(debtId, { 
          current_balance: newBalance,
          status: Math.abs(newBalance) < 0.01 ? 'closed' : 'active'
        })
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