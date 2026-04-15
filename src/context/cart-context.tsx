import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { FoodItem } from '../types/dashboard'

export interface CartItem extends FoodItem {
  quantity: number
}

interface CartContextValue {
  items: CartItem[]
  addItem: (item: FoodItem) => void
  decreaseItem: (itemId: number) => void
  removeItem: (itemId: number) => void
  setQuantity: (itemId: number, quantity: number) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | undefined>(undefined)
const STORAGE_KEY = 'resto_cart_items_v1'

function readStoredItems(): CartItem[] {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const storedValue = window.localStorage.getItem(STORAGE_KEY)
    if (!storedValue) {
      return []
    }

    const parsed = JSON.parse(storedValue) as CartItem[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(readStoredItems)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      addItem: (item) => {
        setItems((currentItems) => {
          const existingItem = currentItems.find((cartItem) => cartItem.id === item.id)
          if (existingItem) {
            return currentItems.map((cartItem) =>
              cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem,
            )
          }

          return [...currentItems, { ...item, quantity: 1 }]
        })
      },
      decreaseItem: (itemId) => {
        setItems((currentItems) =>
          currentItems
            .map((cartItem) =>
              cartItem.id === itemId ? { ...cartItem, quantity: cartItem.quantity - 1 } : cartItem,
            )
            .filter((cartItem) => cartItem.quantity > 0),
        )
      },
      removeItem: (itemId) => {
        setItems((currentItems) => currentItems.filter((cartItem) => cartItem.id !== itemId))
      },
      setQuantity: (itemId, quantity) => {
        setItems((currentItems) => {
          if (quantity <= 0) {
            return currentItems.filter((cartItem) => cartItem.id !== itemId)
          }

          return currentItems.map((cartItem) =>
            cartItem.id === itemId ? { ...cartItem, quantity } : cartItem,
          )
        })
      },
      clearCart: () => {
        setItems([])
      },
    }),
    [items],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used inside CartProvider')
  }

  return context
}