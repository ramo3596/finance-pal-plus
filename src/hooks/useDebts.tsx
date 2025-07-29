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
  const { createTransaction } = useTransactions()
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
        if (payment.description?.includes('Registro inicial')) {
          // Initial records should match the debt type
          selectedCategory = debt.type === 'loan' ? loanCategory : debtCategory
        } else {
          // Regular payments: positive amounts are payments reducing debt (use opposite category)
          selectedCategory = payment.amount > 0 ? 
            (debt.type === 'debt' ? debtCategory : loanCategory) : 
            (debt.type === 'debt' ? loanCategory : debtCategory)
        }

        return {
          ...payment,
          transactions: {
            category_id: selectedCategory?.id,
            account_id: debt.account_id,
            categories: selectedCategory,
            accounts: debt.accounts
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
    const debtCategory = categories.find(c => c.name === 'Deuda')
    const loanCategory = categories.find(c => c.name === 'Préstamo')

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

      // Create corresponding transaction in the history
      const transactionData = {
        type: debtData.type === 'loan' ? 'income' as const : 'expense' as const,
        amount: debtData.initial_amount,
        account_id: debtData.account_id,
        category_id: debtData.type === 'loan' ? loanCategoryId : debtCategoryId,
        description: `${debtData.type === 'loan' ? 'Préstamo a' : 'Deuda con'} ${contactData?.name || 'contacto'}`,
        beneficiary: contactData?.name,
        transaction_date: debtData.debt_date,
        tags: []
      }

      // Create the transaction
      if (transactionData.category_id) {
        await createTransaction(transactionData)
      }

      // Create initial payment record in debt_payments for history tracking
      await supabase
        .from('debt_payments')
        .insert({
          debt_id: data.id,
          amount: debtData.initial_amount,
          payment_date: debtData.debt_date,
          description: `Registro inicial - ${debtData.type === 'loan' ? 'Préstamo' : 'Deuda'}`
        })
      
      await fetchDebts()
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
      const { error } = await supabase
        .from('debts')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      await fetchDebts()
      toast.success('Deuda eliminada exitosamente')
    } catch (error) {
      console.error('Error deleting debt:', error)
      toast.error('Error al eliminar la deuda')
    }
  }

  const addDebtPayment = async (debtId: string, paymentData: Omit<DebtPayment, 'id' | 'debt_id' | 'created_at'>) => {
    try {
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

      // Update debt balance and handle automatic conversion
      const debt = debts.find(d => d.id === debtId)
      if (debt) {
        const newBalance = debt.current_balance - paymentData.amount
        
        // Check if overpayment/overcollection occurred
        if (Math.abs(newBalance) < 0.01) {
          // Exact payment - close the debt/loan
          await updateDebt(debtId, { 
            current_balance: 0,
            status: 'closed'
          })
        } else if ((debt.type === 'debt' && newBalance < 0) || (debt.type === 'loan' && newBalance < 0)) {
          // Overpayment occurred - close current debt and create opposite type
          await updateDebt(debtId, { 
            current_balance: 0,
            status: 'closed'
          })
          
          // Create new debt/loan of opposite type for the excess amount
          const newDebtData = {
            contact_id: debt.contact_id,
            account_id: debt.account_id,
            type: debt.type === 'debt' ? 'loan' as const : 'debt' as const,
            description: `Saldo a favor - ${debt.description}`,
            initial_amount: Math.abs(newBalance),
            current_balance: Math.abs(newBalance),
            debt_date: paymentData.payment_date,
            status: 'active' as const
          }
          
          await createDebt(newDebtData)
          toast.success(`Pago registrado. ${debt.type === 'debt' ? 'Préstamo' : 'Deuda'} creado por el exceso.`)
        } else {
          // Normal payment - update balance
          await updateDebt(debtId, { 
            current_balance: newBalance,
            status: 'active'
          })
          toast.success('Pago registrado exitosamente')
        }
      }

      return payment
    } catch (error) {
      console.error('Error adding debt payment:', error)
      toast.error('Error al registrar el pago')
      return null
    }
  }

  const deleteDebtPayment = async (paymentId: string, debtId: string) => {
    try {
      // Get payment details before deleting
      const { data: payment } = await supabase
        .from('debt_payments')
        .select('amount')
        .eq('id', paymentId)
        .single()

      if (!payment) throw new Error('Payment not found')

      // Delete payment
      const { error } = await supabase
        .from('debt_payments')
        .delete()
        .eq('id', paymentId)

      if (error) throw error

      // Update debt balance by reversing the payment
      const debt = debts.find(d => d.id === debtId)
      if (debt) {
        const newBalance = debt.current_balance + payment.amount
        await updateDebt(debtId, { 
          current_balance: newBalance,
          status: 'active'
        })
      }

      await fetchDebts()
      toast.success('Registro eliminado exitosamente')
    } catch (error) {
      console.error('Error deleting debt payment:', error)
      toast.error('Error al eliminar el registro')
    }
  }

  const updateDebtPayment = async (paymentId: string, debtId: string, updatedData: Partial<DebtPayment>) => {
    try {
      // Get current payment details
      const { data: currentPayment } = await supabase
        .from('debt_payments')
        .select('amount')
        .eq('id', paymentId)
        .single()

      if (!currentPayment) throw new Error('Payment not found')

      // Update payment
      const { error } = await supabase
        .from('debt_payments')
        .update(updatedData)
        .eq('id', paymentId)

      if (error) throw error

      // If amount changed, update debt balance
      if (updatedData.amount !== undefined) {
        const debt = debts.find(d => d.id === debtId)
        if (debt) {
          const balanceChange = currentPayment.amount - updatedData.amount
          const newBalance = debt.current_balance + balanceChange
          await updateDebt(debtId, { 
            current_balance: newBalance,
            status: Math.abs(newBalance) < 0.01 ? 'closed' : 'active'
          })
        }
      }

      await fetchDebts()
      toast.success('Registro actualizado exitosamente')
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
    updateDebtPayment
  }
}