'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

interface Order {
  id: string
  total_amount: number
  status: string
  created_at: string
  order_items: {
    id: string
    quantity: number
    price: number
    products: {
      name: string
      image_url: string
    }
  }[]
}

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      fetchOrders()
    } else {
      setOrders([])
      setLoading(false)
    }
  }, [user])

  const fetchOrders = async () => {
    if (!user) return

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          quantity,
          price,
          products (
            name,
            image_url
          )
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching orders:', error)
    } else {
      setOrders(data || [])
    }
    setLoading(false)
  }

  const createOrder = async (cartItems: any[], shippingAddress: any) => {
    if (!user) {
      console.error('No user found for order creation')
      return null
    }

    console.log('Creating order for user:', user.id)
    console.log('Cart items:', cartItems)
    console.log('Shipping address:', shippingAddress)

    const totalAmount = cartItems.reduce((total, item) => {
      return total + (item.products.price * item.quantity)
    }, 0)

    console.log('Total amount:', totalAmount)

    // Create order
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        total_amount: totalAmount,
        status: 'pending',
        shipping_address: shippingAddress
      })
      .select()
      .single()

    if (orderError) {
      console.error('Error creating order:', orderError)
      return null
    }

    console.log('Order created successfully:', orderData)

    // Create order items
    const orderItems = cartItems.map(item => ({
      order_id: orderData.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.products.price
    }))

    console.log('Creating order items:', orderItems)

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      console.error('Error creating order items:', itemsError)
      return null
    }

    console.log('Order items created successfully')

    // Clear cart after successful order
    const { error: clearCartError } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id)

    if (clearCartError) {
      console.error('Error clearing cart:', clearCartError)
    } else {
      console.log('Cart cleared successfully')
    }

    fetchOrders()
    console.log('Returning order:', orderData)
    return orderData
  }

  return {
    orders,
    loading,
    createOrder,
    refetch: fetchOrders
  }
}

const clearDatabaseCart = async (supabase: any, user: any) => {
  // Clear cart from database
  await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id);
}
