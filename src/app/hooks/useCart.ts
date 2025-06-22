'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

interface CartItem {
  id: string
  product_id: string
  quantity: number
  products: {
    id: string
    name: string
    price: number
    image_url: string
  }
}

export function useCart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      fetchCartItems()
    } else {
      setCartItems([])
      setLoading(false)
    }
  }, [user])

  const fetchCartItems = async () => {
    if (!user) return

    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        *,
        products (
          id,
          name,
          price,
          image_url
        )
      `)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error fetching cart items:', error)
    } else {
      setCartItems(data || [])
    }
    setLoading(false)
  }

  const addToCart = async (productId: string, quantity: number = 1) => {
    if (!user) return

    const { data, error } = await supabase
      .from('cart_items')
      .upsert(
        { 
          user_id: user.id, 
          product_id: productId, 
          quantity 
        },
        { 
          onConflict: 'user_id,product_id' 
        }
      )

    if (error) {
      console.error('Error adding to cart:', error)
    } else {
      fetchCartItems()
    }
  }

  const updateQuantity = async (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(cartItemId)
      return
    }

    const { error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', cartItemId)

    if (error) {
      console.error('Error updating quantity:', error)
    } else {
      fetchCartItems()
    }
  }

  const removeFromCart = async (cartItemId: string) => {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', cartItemId)

    if (error) {
      console.error('Error removing from cart:', error)
    } else {
      fetchCartItems()
    }
  }

  const clearCart = async () => {
    if (!user) return

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id)

    if (error) {
      console.error('Error clearing cart:', error)
    } else {
      setCartItems([])
    }
  }

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      return total + (item.products.price * item.quantity)
    }, 0)
  }

  return {
    cartItems,
    loading,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getTotalPrice,
    refetch: fetchCartItems
  }
}