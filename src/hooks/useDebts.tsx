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
  const { categories, createCategory } = useSettings()

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
      setDebts((data as Debt[]) || [])
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

      // Get categories for debt and loan
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .in('name', ['Deuda', 'Préstamo'])

      if (categoriesError) throw categoriesError

      const debtCategory = categories?.find(c => c.name === 'Deuda')
      const loanCategory = categories?.find(c => c.name === 'Préstamo')

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
        if (!debt || !debt.type) {
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
    if (!user) return { debtCategoryId: null, loanCategoryId: null }

    // Use existing categories from configuration, prioritizing them regardless of nature
    let debtCategory = categories.find(c => c.name === 'Deuda')
    let loanCategory = categories.find(c => c.name === 'Préstamo')

    // Create debt category if it doesn't exist
    if (!debtCategory) {
      try {
        const newDebtCategory = await createCategory({
          name: 'Deuda',
          color: '#ef4444', // Red color for debts
          icon: '💳',
          nature: 'expense'
        })
        if (newDebtCategory) {
          debtCategory = newDebtCategory
          console.log('Created debt category:', debtCategory)
        }
      } catch (error) {
        console.error('Error creating debt category:', error)
      }
    }

    // Create loan category if it doesn't exist
    if (!loanCategory) {
      try {
        const newLoanCategory = await createCategory({
          name: 'Préstamo',
          color: '#22c55e', // Green color for loans
          icon: '🏦',
          nature: 'income'
        })
        if (newLoanCategory) {
          loanCategory = newLoanCategory
          console.log('Created loan category:', loanCategory)
        }
      } catch (error) {
        console.error('Error creating loan category:', error)
      }
    }

    return {
      debtCategoryId: debtCategory?.id || null,
      loanCategoryId: loanCategory?.id || null
    }
  }

  const createDebt = async (debtData: Omit<Debt, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return null

    try {
      // Ensure debt/loan categories exist
      const { debtCategoryId, loanCategoryId } = await ensureDebtCategories()

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

      // Only create transaction for loans (money given out), not for debts (money owed)
      // Debts should only create transactions when they are actually paid
      if (debtData.type === 'loan') {
        const transactionData = {
          type: 'income' as const,
          amount: debtData.initial_amount,
          account_id: debtData.account_id,
          category_id: loanCategoryId,
          description: `Préstamo a ${contactData?.name || 'contacto'}`,
          beneficiary: contactData?.name,
          transaction_date: debtData.debt_date,
          tags: []
        }

        // Create the transaction for loans only
        if (transactionData.category_id) {
          try {
            const createdTransaction = await createTransaction(transactionData)
            console.log('Transaction created successfully for loan:', createdTransaction)
          } catch (err) {
            console.error('Error creating transaction for loan:', err)
          }
        }
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
      const { error } = await supabase
        .from('debts')
        .update(updates)
        .eq('id', id)

      if (error) throw error
      
      await fetchDebts()
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
      const { debtCategoryId, loanCategoryId } = await ensureDebtCategories()

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

      if (!debt || !debt.type) {
        // Default to expense/debt category if debt info is not available
        transactionType = 'expense'
        categoryId = debtCategoryId
        description = `Pago - ${contactData?.name || 'contacto'}`
      } else if (debt.type === 'debt') {
        if (paymentData.amount > 0) {
          // Aumento de deuda → category "Deuda", positive amount
          transactionType = 'expense'
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
          transactionType = 'income'
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

        const transactionData = {
          type: transactionType,
          amount: transactionAmount,
          account_id: debt?.account_id || "",
          category_id: categoryId,
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

      // Update debt balance and handle automatic conversion
      let newBalance: number
      
      if (!debt || !debt.type || debt.type === 'debt') {
        // Para deudas: amount positivo suma al saldo, amount negativo resta al saldo
        newBalance = debt ? debt.current_balance + paymentData.amount : paymentData.amount
      } else {
        // Para préstamos: la lógica debe ser invertida
        // - amount negativo (aumento de préstamo) debe AUMENTAR el saldo (me deben más)
        // - amount positivo (cobro de préstamo) debe DISMINUIR el saldo (me deben menos)
        newBalance = debt.current_balance - paymentData.amount
      }
      
      // Check if balance reaches zero to close debt/loan
      if (Math.abs(newBalance) < 0.01) {
        // Exact payment - close the debt/loan only when balance is zero
        await updateDebt(debtId, { 
          current_balance: 0,
          status: 'closed'
        })
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

      // Update debt balance by reversing the payment
      const debt = debts.find(d => d.id === debtId)
      if (debt) {
        // Revertir el pago: si agregamos payment.amount, ahora restamos payment.amount
        const newBalance = debt.current_balance - payment.amount
        await updateDebt(debtId, { 
          current_balance: newBalance,
          status: 'active'
        })
      }

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
          transactionUpdates.amount = Math.abs(updatedData.amount)
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

      // If amount changed, update debt balance and initial amount if it's an initial record
      if (updatedData.amount !== undefined) {
        const isInitialRecord = currentPayment.description?.includes('Registro inicial')
        
        if (isInitialRecord) {
          // For initial records, update the debt's initial_amount and recalculate balance
          const newInitialAmount = Math.abs(updatedData.amount)
           const { error: debtUpdateError } = await supabase
             .from('debts')
             .update({ 
               initial_amount: newInitialAmount,
               current_balance: (debt && debt.type === 'debt') ? newInitialAmount : newInitialAmount
             })
             .eq('id', debtId)
          
          if (debtUpdateError) throw debtUpdateError
        } else {
          // For regular payments, update balance normally
          // Revertir el cambio anterior y aplicar el nuevo
          const balanceChange = updatedData.amount - currentPayment.amount
          const newBalance = debt.current_balance + balanceChange
          await updateDebt(debtId, { 
            current_balance: newBalance,
            status: Math.abs(newBalance) < 0.01 ? 'closed' : 'active'
          })
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
    reactivateDebt
  }
}