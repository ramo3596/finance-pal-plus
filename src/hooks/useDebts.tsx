import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "./useAuth"
import { toast } from "sonner"
import { useTransactions } from "./useTransactions"

export interface Debt {
  id: string // contact_id para agrupación
  user_id: string
  type: 'debt' | 'loan'
  contact_id: string
  account_id: string // cuenta principal asociada
  description: string // descripción combinada
  initial_amount: number
  current_balance: number
  status: 'active' | 'closed'
  debt_date: string
  due_date?: string
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
  account_id?: string
  payment_date: string
  description?: string
  created_at: string
  transactions?: {
    id: string
    categories?: {
      id: string
      name: string
      color: string
      icon: string
    }
    subcategories?: {
      id: string
      name: string
      icon: string
    }
    accounts?: {
      id: string
      name: string
    }
  }
}

// Subcategorías identificadoras para deudas/préstamos
const DEBT_SUBCATEGORIES = {
  LOANS_INCOME: 'e9fb73a7-86d4-44f0-bb40-dee112a5560d', // Préstamos, alquileres (para cobros de préstamo - tipo income)
  COMMISSION: '6450a480-9d0c-4ae1-a08a-26e5d4b158a2', // Comisión (para pagos de deuda - tipo expense)
  LOANS_EXPENSE: 'e3b4a085-a4da-4b24-b356-fd9a2b3113e5', // Préstamos (para nuevas deudas - tipo expense)
}

const DEBT_CATEGORIES = {
  INCOME: 'ad030b76-5813-434c-aa06-322dbbedc20e', // Ingresos
  FINANCIAL_EXPENSES: '41d920fb-59d3-48a2-b9be-52c1a7eec929', // Gastos financieros
}

export function useDebts() {
  const [debts, setDebts] = useState<Debt[]>([])
  const [loading, setLoading] = useState(true)
  const [contactsMap, setContactsMap] = useState<Record<string, any>>({})
  const [accountsMap, setAccountsMap] = useState<Record<string, any>>({})
  const { user } = useAuth()
  const { transactions, createTransaction, updateTransaction, deleteTransaction, refetch: refetchTransactions } = useTransactions()

  // Cargar información de contactos y cuentas
  useEffect(() => {
    const loadReferencesData = async () => {
      if (!user) return

      try {
        // Cargar contactos
        const { data: contactsData } = await supabase
          .from('contacts')
          .select('id, name, image_url')
          .eq('user_id', user.id)

        const contactsById = (contactsData || []).reduce((acc, contact) => {
          acc[contact.id] = contact
          return acc
        }, {} as Record<string, any>)

        // Cargar cuentas
        const { data: accountsData } = await supabase
          .from('accounts')
          .select('id, name')
          .eq('user_id', user.id)

        const accountsById = (accountsData || []).reduce((acc, account) => {
          acc[account.id] = account
          return acc
        }, {} as Record<string, any>)

        setContactsMap(contactsById)
        setAccountsMap(accountsById)
      } catch (error) {
        console.error('Error loading reference data:', error)
      }
    }

    loadReferencesData()
  }, [user])

  // Procesar transacciones para generar la vista de deudas
  const processDebtsFromTransactions = () => {
    if (!transactions?.length) {
      setDebts([])
      setLoading(false)
      return
    }

    // Filtrar transacciones de deudas/préstamos por subcategorías
    const debtTransactions = transactions.filter(transaction => 
      [DEBT_SUBCATEGORIES.LOANS_INCOME, DEBT_SUBCATEGORIES.COMMISSION, DEBT_SUBCATEGORIES.LOANS_EXPENSE].includes(transaction.subcategory_id || '')
    )

    // Agrupar por contact_id
    const debtsByContact = debtTransactions.reduce((acc, transaction) => {
      const contactId = transaction.contact_id
      if (!contactId) return acc

      if (!acc[contactId]) {
        acc[contactId] = []
      }
      acc[contactId].push(transaction)
      return acc
    }, {} as Record<string, typeof transactions>)

    // Crear objetos Debt basados en los grupos
    const debtsArray: Debt[] = Object.entries(debtsByContact).map(([contactId, contactTransactions]) => {
      // Ordenar por fecha para obtener la primera transacción
      const sortedTransactions = contactTransactions.sort((a, b) => 
        new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
      )
      
      const firstTransaction = sortedTransactions[0]
      const lastTransaction = sortedTransactions[sortedTransactions.length - 1]

      // Calcular saldo actual sumando todas las transacciones
      let currentBalance = 0
      let isDebt = false // Por defecto es préstamo

      // Determinar tipo basado en el patrón de transacciones
      const incomeTransactions = contactTransactions.filter(t => t.type === 'income')
      const expenseTransactions = contactTransactions.filter(t => t.type === 'expense')

      if (incomeTransactions.length > 0 && expenseTransactions.length === 0) {
        // Solo ingresos = Alguien me prestó dinero (Me deben a mí)
        isDebt = true
        currentBalance = incomeTransactions.reduce((sum, t) => sum + t.amount, 0)
      } else if (expenseTransactions.length > 0 && incomeTransactions.length === 0) {
        // Solo gastos = Yo presté dinero (Debo)
        isDebt = false
        currentBalance = expenseTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
      } else {
        // Mezcla: calcular balance neto
        const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0)
        const totalExpense = expenseTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
        
        if (totalIncome > totalExpense) {
          // Me prestaron más de lo que presté
          isDebt = true
          currentBalance = totalIncome - totalExpense
        } else {
          // Presté más de lo que me prestaron
          isDebt = false
          currentBalance = totalExpense - totalIncome
        }
      }

      // Determinar estado basado en el saldo
      const status = currentBalance === 0 ? 'closed' : 'active'

      // Obtener información del contacto y cuenta
      const contactInfo = contactsMap[contactId] || { id: contactId, name: firstTransaction.beneficiary || 'Contacto sin nombre' }
      const accountInfo = accountsMap[firstTransaction.account_id] || { id: firstTransaction.account_id, name: 'Cuenta' }

      return {
        id: contactId,
        user_id: user?.id || '',
        type: isDebt ? 'debt' : 'loan',
        contact_id: contactId,
        account_id: firstTransaction.account_id,
        description: firstTransaction.description,
        initial_amount: Math.abs(firstTransaction.amount),
        current_balance: currentBalance,
        status,
        debt_date: firstTransaction.transaction_date,
        created_at: firstTransaction.created_at,
        updated_at: lastTransaction.updated_at,
        contacts: contactInfo,
        accounts: accountInfo
      }
    })

    setDebts(debtsArray)
    setLoading(false)
  }

  // Procesar deudas cuando cambien las transacciones o los mapas de referencia
  useEffect(() => {
    if (user && Object.keys(contactsMap).length > 0 && Object.keys(accountsMap).length > 0) {
      processDebtsFromTransactions()
    }
  }, [transactions, user, contactsMap, accountsMap])

  // Crear nueva deuda/préstamo (primero crear registro en tabla debts, luego transacción vinculada)
  const createDebt = async (debtData: Omit<Debt, 'id' | 'user_id' | 'created_at' | 'updated_at'>, selectedTags: string[] = []) => {
    if (!user) return null

    try {
      // Obtener información del contacto
      const { data: contactData } = await supabase
        .from('contacts')
        .select('name')
        .eq('id', debtData.contact_id)
        .single()

      const contactName = contactData?.name || 'Contacto'
      
      // 1. Crear registro en tabla debts
      const { data: debtRecord, error: debtError } = await supabase
        .from('debts')
        .insert({
          user_id: user.id,
          contact_id: debtData.contact_id,
          account_id: debtData.account_id,
          type: debtData.type,
          description: debtData.description,
          initial_amount: debtData.initial_amount,
          current_balance: debtData.initial_amount,
          debt_date: debtData.debt_date,
          due_date: debtData.due_date,
          status: 'active'
        })
        .select()
        .single()

      if (debtError) {
        console.error('Error creating debt record:', debtError)
        toast.error('Error al crear el registro de deuda')
        return null
      }

      // 2. Determinar categoría y subcategoría basada en el tipo
      let categoryId: string
      let subcategoryId: string
      let transactionType: 'income' | 'expense'

      if (debtData.type === 'debt') {
        // Deuda: Alguien me prestó (ingreso para mí)
        categoryId = DEBT_CATEGORIES.INCOME
        subcategoryId = DEBT_SUBCATEGORIES.LOANS_INCOME // Préstamos, alquileres
        transactionType = 'income'
      } else {
        // Préstamo: Yo presté (gasto para mí)
        categoryId = DEBT_CATEGORIES.FINANCIAL_EXPENSES
        subcategoryId = DEBT_SUBCATEGORIES.LOANS_EXPENSE // Préstamos
        transactionType = 'expense'
      }
      
      // 3. Crear transacción vinculada a la deuda
      const transactionData = {
        type: transactionType,
        amount: debtData.initial_amount,
        account_id: debtData.account_id,
        category_id: categoryId,
        subcategory_id: subcategoryId,
        description: debtData.type === 'debt' 
          ? `Préstamo recibido de ${contactName}` 
          : `Préstamo otorgado a ${contactName}`,
        beneficiary: contactName,
        note: debtData.description,
        transaction_date: debtData.debt_date,
        contact_id: debtData.contact_id,
        debt_id: debtRecord.id, // Vincular transacción a la deuda
        tags: selectedTags
      }

      const result = await createTransaction(transactionData)
      
      if (result) {
        toast.success(`${debtData.type === 'debt' ? 'Deuda' : 'Préstamo'} creado exitosamente`)
        return { ...debtRecord, transaction: result }
      } else {
        // Si falla la transacción, eliminar el registro de deuda
        await supabase.from('debts').delete().eq('id', debtRecord.id)
        return null
      }
      
    } catch (error) {
      console.error('Error creating debt:', error)
      toast.error(`Error al crear ${debtData.type === 'debt' ? 'la deuda' : 'el préstamo'}`)
      return null
    }
  }

  // Agregar pago de deuda/cobro de préstamo
  const addDebtPayment = async (
    debtId: string, // es el contact_id
    paymentData: {
      amount: number
      account_id: string
      payment_date: string
      description?: string
    },
    selectedTags: string[] = []
  ) => {
    if (!user) return null

    try {
      // Encontrar la deuda para determinar el tipo
      const debt = debts.find(d => d.id === debtId)
      if (!debt) {
        toast.error('Deuda no encontrada')
        return null
      }

      // Buscar el registro de deuda en Supabase para obtener el debt_id real
      const { data: debtRecord, error: debtError } = await supabase
        .from('debts')
        .select('id')
        .eq('contact_id', debt.contact_id)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      if (debtError || !debtRecord) {
        console.error('Error finding debt record:', debtError)
        toast.error('No se encontró el registro de deuda')
        return null
      }

      // Determinar el tipo de transacción basado en el tipo de deuda y acción
      let categoryId: string
      let subcategoryId: string
      let transactionType: 'income' | 'expense'
      let description: string

      if (debt.type === 'debt') {
        // Es una deuda (me prestaron), agregar pago = gasto (reduce la deuda)
        categoryId = DEBT_CATEGORIES.FINANCIAL_EXPENSES
        subcategoryId = DEBT_SUBCATEGORIES.COMMISSION // Comisión
        transactionType = 'expense'
        description = `Pago de deuda a ${debt.contacts?.name}`
      } else {
        // Es un préstamo (presté), agregar cobro = ingreso (reduce lo que me deben)
        categoryId = DEBT_CATEGORIES.INCOME
        subcategoryId = DEBT_SUBCATEGORIES.LOANS_INCOME // Préstamos, alquileres
        transactionType = 'income'
        description = `Cobro de préstamo de ${debt.contacts?.name}`
      }

      const transactionData = {
        type: transactionType,
        amount: Math.abs(paymentData.amount),
        account_id: paymentData.account_id,
        category_id: categoryId,
        subcategory_id: subcategoryId,
        description: paymentData.description || description,
        beneficiary: debt.contacts?.name,
        transaction_date: paymentData.payment_date,
        contact_id: debt.contact_id,
        debt_id: debtRecord.id, // Vincular pago a la deuda específica
        tags: selectedTags
      }

      const result = await createTransaction(transactionData)
      
      if (result) {
        toast.success('Pago registrado exitosamente')
      }
      
      return result
    } catch (error) {
      console.error('Error adding debt payment:', error)
      toast.error('Error al registrar el pago')
      return null
    }
  }

  // Obtener historial de pagos de una deuda específica
  const fetchDebtPayments = async (debtId: string) => {
    try {
      // Buscar el registro de deuda para obtener el debt_id real
      const { data: debtRecord, error: debtError } = await supabase
        .from('debts')
        .select('id')
        .eq('contact_id', debtId)
        .eq('user_id', user?.id)
        .single()

      if (debtError || !debtRecord) {
        console.error('Error finding debt record:', debtError)
        return []
      }

      // Filtrar transacciones por debt_id específico
      const contactTransactions = transactions.filter(t => 
        t.debt_id === debtRecord.id &&
        [DEBT_SUBCATEGORIES.LOANS_INCOME, DEBT_SUBCATEGORIES.COMMISSION, DEBT_SUBCATEGORIES.LOANS_EXPENSE].includes(t.subcategory_id || '')
      )

      // Convertir a formato DebtPayment
      const payments: DebtPayment[] = contactTransactions.map(transaction => ({
        id: transaction.id,
        debt_id: debtRecord.id,
        transaction_id: transaction.id,
        amount: transaction.type === 'income' ? transaction.amount : -transaction.amount,
        account_id: transaction.account_id,
        payment_date: transaction.transaction_date,
        description: transaction.note || transaction.description,
        created_at: transaction.created_at,
        transactions: {
          id: transaction.id,
          categories: {
            id: transaction.category_id || '',
            name: transaction.type === 'income' ? 'Ingresos' : 'Gastos financieros',
            color: transaction.type === 'income' ? '#22c55e' : '#ef4444',
            icon: transaction.type === 'income' ? '💵' : '💰'
          },
          subcategories: {
            id: transaction.subcategory_id || '',
            name: transaction.subcategory_id === DEBT_SUBCATEGORIES.LOANS_INCOME ? 'Préstamos, alquileres' : 
                  transaction.subcategory_id === DEBT_SUBCATEGORIES.COMMISSION ? 'Comisión' : 'Préstamos',
            icon: transaction.subcategory_id === DEBT_SUBCATEGORIES.LOANS_INCOME ? '🏠' : 
                  transaction.subcategory_id === DEBT_SUBCATEGORIES.COMMISSION ? '💳' : '💰'
          },
          accounts: accountsMap[transaction.account_id] || {
            id: transaction.account_id,
            name: 'Cuenta'
          }
        }
      }))

      return payments.sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())
    } catch (error) {
      console.error('Error fetching debt payments:', error)
      return []
    }
  }

  // Eliminar deuda y todas sus transacciones
  const deleteDebt = async (contactId: string) => {
    if (!user) return false

    try {
      // Buscar el registro de deuda
      const { data: debtRecord, error: debtError } = await supabase
        .from('debts')
        .select('id')
        .eq('contact_id', contactId)
        .eq('user_id', user.id)
        .single()

      if (debtError || !debtRecord) {
        console.error('Error finding debt record:', debtError)
        toast.error('No se encontró el registro de deuda')
        return false
      }

      // Obtener todas las transacciones vinculadas a esta deuda
      const debtTransactions = transactions.filter(t => 
        t.debt_id === debtRecord.id
      )

      if (debtTransactions.length === 0) {
        toast.error('No se encontraron transacciones de deuda para eliminar')
        return false
      }

      // Eliminar todas las transacciones
      const transactionIds = debtTransactions.map(t => t.id)
      const { error: transactionError } = await supabase
        .from('transactions')
        .delete()
        .in('id', transactionIds)

      if (transactionError) {
        console.error('Error deleting debt transactions:', transactionError)
        toast.error('Error al eliminar las transacciones de deuda')
        return false
      }

      // Eliminar el registro de deuda
      const { error: debtDeleteError } = await supabase
        .from('debts')
        .delete()
        .eq('id', debtRecord.id)

      if (debtDeleteError) {
        console.error('Error deleting debt record:', debtDeleteError)
        toast.error('Error al eliminar el registro de deuda')
        return false
      }

      toast.success('Deuda eliminada exitosamente')
      return true
    } catch (error) {
      console.error('Error deleting debt:', error)
      toast.error('Error al eliminar la deuda')
      return false
    }
  }

  // Eliminar pago específico
  const deleteDebtPayment = async (paymentId: string, debtId: string) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', paymentId)

      if (error) {
        console.error('Error deleting debt payment:', error)
        toast.error('Error al eliminar el pago')
        return false
      }

      toast.success('Pago eliminado exitosamente')
      return true
    } catch (error) {
      console.error('Error deleting debt payment:', error)
      toast.error('Error al eliminar el pago')
      return false
    }
  }

  // Reactivar deuda cerrada
  const reactivateDebt = async (contactId: string) => {
    if (!user) return false

    try {
      // Buscar el registro de deuda cerrada
      const { data: debtRecord, error: debtError } = await supabase
        .from('debts')
        .select('*')
        .eq('contact_id', contactId)
        .eq('user_id', user.id)
        .eq('status', 'closed')
        .single()

      if (debtError || !debtRecord) {
        console.error('Error finding closed debt record:', debtError)
        toast.error('No se encontró una deuda cerrada para este contacto')
        return false
      }

      // Verificar si hay balance pendiente
      const remainingBalance = Math.abs(debtRecord.current_balance)
      
      if (remainingBalance === 0) {
        toast.error('No hay balance pendiente para reactivar')
        return false
      }

      // Obtener información del contacto
      const { data: contactData } = await supabase
        .from('contacts')
        .select('name')
        .eq('id', contactId)
        .single()

      const contactName = contactData?.name || 'Contacto'

      // Determinar tipo de transacción para reactivar
      let categoryId: string
      let subcategoryId: string
      let transactionType: 'income' | 'expense'
      let description: string

      if (debtRecord.type === 'debt') {
        // Reactivar deuda: Crear ingreso
        categoryId = DEBT_CATEGORIES.INCOME
        subcategoryId = DEBT_SUBCATEGORIES.LOANS_INCOME
        transactionType = 'income'
        description = `Reactivación de deuda con ${contactName}`
      } else {
        // Reactivar préstamo: Crear gasto
        categoryId = DEBT_CATEGORIES.FINANCIAL_EXPENSES
        subcategoryId = DEBT_SUBCATEGORIES.LOANS_EXPENSE
        transactionType = 'expense'
        description = `Reactivación de préstamo a ${contactName}`
      }

      // Crear transacción de reactivación
      const transactionData = {
        type: transactionType,
        amount: remainingBalance,
        account_id: debtRecord.account_id,
        category_id: categoryId,
        subcategory_id: subcategoryId,
        description,
        beneficiary: contactName,
        note: 'Deuda reactivada',
        transaction_date: new Date().toISOString().split('T')[0],
        contact_id: contactId,
        debt_id: debtRecord.id, // Vincular a la deuda específica
        tags: []
      }

      const result = await createTransaction(transactionData)
      
      if (result) {
        // Actualizar el estado de la deuda a 'active'
        const { error: updateError } = await supabase
          .from('debts')
          .update({ status: 'active' })
          .eq('id', debtRecord.id)

        if (updateError) {
          console.error('Error updating debt status:', updateError)
          toast.error('Error al actualizar el estado de la deuda')
          return false
        }

        toast.success('Deuda reactivada exitosamente')
        return true
      }
      
      return false
    } catch (error) {
      console.error('Error reactivating debt:', error)
      toast.error('Error al reactivar la deuda')
      return false
    }
  }

  // Refetch (usar refetch de transacciones)
  const refetch = () => {
    refetchTransactions()
  }

  return {
    debts,
    loading,
    createDebt,
    addDebtPayment,
    fetchDebtPayments,
    deleteDebt,
    deleteDebtPayment,
    reactivateDebt,
    refetch
  }
}