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
      const { data, error } = await supabase
        .from('debt_payments')
        .select('*')
        .eq('debt_id', debtId)
        .order('payment_date', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching debt payments:', error)
      toast.error('Error al cargar los pagos de la deuda')
      return []
    }
  }

  const ensureDebtCategories = async () => {
    if (!user) return { debtCategoryId: null, loanCategoryId: null }

    // Check if categories exist
    let debtCategory = categories.find(c => c.name === 'Deuda' && c.nature === 'expense')
    let loanCategory = categories.find(c => c.name === 'Préstamo' && c.nature === 'income')

    // Create debt category if it doesn't exist
    if (!debtCategory) {
      await createCategory({
        name: 'Deuda',
        nature: 'expense',
        color: 'hsl(0, 84%, 60%)', // Red color for debts
        icon: 'CreditCard'
      })
      // Fetch updated categories to get the new one
      const { data: updatedCategories } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .eq('name', 'Deuda')

      debtCategory = updatedCategories?.[0]
    }

    // Create loan category if it doesn't exist
    if (!loanCategory) {
      await createCategory({
        name: 'Préstamo',
        nature: 'income',
        color: 'hsl(142, 76%, 36%)', // Green color for loans
        icon: 'HandCoins'
      })
      // Fetch updated categories to get the new one
      const { data: updatedCategories } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .eq('name', 'Préstamo')

      loanCategory = updatedCategories?.[0]
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

      // Update debt balance
      const debt = debts.find(d => d.id === debtId)
      if (debt) {
        const newBalance = debt.current_balance - paymentData.amount
        await updateDebt(debtId, { 
          current_balance: newBalance,
          status: Math.abs(newBalance) < 0.01 ? 'closed' : 'active'
        })
      }

      toast.success('Pago registrado exitosamente')
      return payment
    } catch (error) {
      console.error('Error adding debt payment:', error)
      toast.error('Error al registrar el pago')
      return null
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
    addDebtPayment
  }
}