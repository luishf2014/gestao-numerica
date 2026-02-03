/**
 * Cart Context - Contexto do Carrinho de Apostas
 *
 * Gerencia o estado do carrinho de compras para permitir múltiplas participações
 * antes de finalizar o pagamento.
 */
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { Contest } from '../types'

// Interface para item do carrinho
export interface CartItem {
  id: string // ID único do item no carrinho
  contestId: string
  contestName: string
  contestCode?: string
  selectedNumbers: number[]
  price: number
  addedAt: number // Timestamp
}

// Interface do contexto
interface CartContextType {
  items: CartItem[]
  addItem: (contest: Contest, numbers: number[]) => void
  removeItem: (itemId: string) => void
  clearCart: () => void
  getItemCount: () => number
  getTotalPrice: () => number
  hasItemForContest: (contestId: string) => boolean
}

// Criar contexto
const CartContext = createContext<CartContextType | undefined>(undefined)

// Chave do localStorage
const CART_STORAGE_KEY = 'dezaqui_cart'

// Provider do carrinho
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Carregar carrinho do localStorage ao iniciar
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY)
      if (savedCart) {
        const parsed = JSON.parse(savedCart) as CartItem[]
        // Filtrar itens muito antigos (mais de 24 horas)
        const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000)
        const validItems = parsed.filter(item => item.addedAt > oneDayAgo)
        setItems(validItems)
      }
    } catch (err) {
      console.error('[CartContext] Erro ao carregar carrinho:', err)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Salvar carrinho no localStorage sempre que mudar
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
      } catch (err) {
        console.error('[CartContext] Erro ao salvar carrinho:', err)
      }
    }
  }, [items, isLoaded])

  // Adicionar item ao carrinho
  const addItem = useCallback((contest: Contest, numbers: number[]) => {
    const newItem: CartItem = {
      id: `${contest.id}-${Date.now()}`, // ID único
      contestId: contest.id,
      contestName: contest.name,
      contestCode: contest.contest_code,
      selectedNumbers: [...numbers].sort((a, b) => a - b),
      price: contest.participation_value || 0,
      addedAt: Date.now(),
    }

    setItems(prev => [...prev, newItem])
    console.log('[CartContext] Item adicionado ao carrinho:', newItem)
  }, [])

  // Remover item do carrinho
  const removeItem = useCallback((itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId))
    console.log('[CartContext] Item removido do carrinho:', itemId)
  }, [])

  // Limpar carrinho
  const clearCart = useCallback(() => {
    setItems([])
    console.log('[CartContext] Carrinho limpo')
  }, [])

  // Obter quantidade de itens
  const getItemCount = useCallback(() => {
    return items.length
  }, [items])

  // Obter preço total
  const getTotalPrice = useCallback(() => {
    return items.reduce((total, item) => total + item.price, 0)
  }, [items])

  // Verificar se já tem item para um concurso específico
  const hasItemForContest = useCallback((contestId: string) => {
    return items.some(item => item.contestId === contestId)
  }, [items])

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        clearCart,
        getItemCount,
        getTotalPrice,
        hasItemForContest,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

// Hook para usar o contexto
export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart deve ser usado dentro de um CartProvider')
  }
  return context
}
