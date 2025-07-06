'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { ShippingAddress } from '@/types/ShippingAddress'

interface OrderItem {
  id: string
  product_id: string
  product_weight_kg: string
  quantity: number
  unit_price: number
  total_price: number
}

// interface ShippingAddress {
//   user_email?: string
//   user_full_name?: string
//   user_phone?: string
//   delivery_address?: string
//   delivery_city?: string
//   delivery_notes?: string
//   payment_reference?: string
//   [key: string]: unknown
// }

interface Order {
  id: string
  user_id: string
  total_amount: number
  status: string
  user_email: string
  user_full_name: string
  user_phone: string
  delivery_address: string
  delivery_city: string
  delivery_notes?: string
  payment_reference?: string
  payment_status: string
  shipping_address?: ShippingAddress
  created_at: string
  order_items: OrderItem[]
}

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const supabase = createClient()

  // Replace 'any' with explicit types
  const fetchOrders = useCallback(async () => {
    if (!user) return

    let { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          product_id,
          product_weight_kg,
          quantity,
          unit_price,
          total_price
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // if (error) {
    //   console.log('New schema failed for fetching, trying old schema...')
    //   const oldSchemaResult = await supabase
    //     .from('orders')
    //     .select(`
    //       *,
    //       order_items (
    //         id,
    //         product_id,
    //         quantity,
    //         price
    //       )
    //     `)
    //     .eq('user_id', user.id)
    //     .order('created_at', { ascending: false })
        
    //   data = oldSchemaResult.data
    //   error = oldSchemaResult.error
    // }

    if (error) {
      console.error('Error fetching orders (both schemas failed):', error)
    } else {
      // Use Order and OrderItem types instead of any
      const ordersWithProductInfo = (data || []).map((order: Order) => ({
        ...order,
        order_items: (order.order_items || []).map((item: OrderItem) => ({
          ...item,
          products: {
            name: item.product_id
          }
        }))
      }))
      setOrders(ordersWithProductInfo)
    }
    setLoading(false)
  }, [supabase, user])

  useEffect(() => {
    if (user) {
      fetchOrders()
    } else {
      setOrders([])
      setLoading(false)
    }
  }, [user, fetchOrders])

  // Specify types for cartItems and shippingAddress
  const createOrder = async (
    cartItems: Array<{
      product_id: string
      quantity: number
      price: number
      weight_kg: string
      
    }>,
    shippingAddress: ShippingAddress
  ) => {
    if (!user) {
      console.error('No user found for order creation')
      return null
    }

    console.log('Creating order for user:', user.id)
    console.log('Cart items:', cartItems)
    console.log('Shipping address:', shippingAddress)

    // Validate cart items
    if (!cartItems || cartItems.length === 0) {
      console.error('No cart items provided for order creation')
      return null
    }

    // Calculate total amount correctly - check if price is in products or at item level
    const totalAmount = cartItems.reduce((total, item) => {
      const price = item.price
      return total + (price * item.quantity)
    }, 0)

    console.log('Total amount:', totalAmount)

    if (totalAmount <= 0) {
      console.error('Invalid total amount:', totalAmount)
      return null
    }

    // Create order data - try new schema first, fallback to old schema
    const orderData = {
      user_id: user.id,
      total_amount: totalAmount,
      status: 'pending',
      // Try new schema fields
      payment_status: 'pending',
      user_email: shippingAddress.user_email || shippingAddress.email || user.email || '',
      user_full_name: shippingAddress.user_full_name || shippingAddress.fullName || '',
      user_phone: shippingAddress.user_phone || shippingAddress.phone || '',
      delivery_address: shippingAddress.delivery_address || shippingAddress.address || '',
      delivery_city: shippingAddress.delivery_city || shippingAddress.city || '',
      delivery_notes: shippingAddress.delivery_notes || shippingAddress.notes || null,
      payment_reference: shippingAddress.payment_reference || null,
      // Legacy field that should work with old schema
      shipping_address: shippingAddress
    }

    console.log('Inserting order data:', orderData)

    // Check if we have minimum required data
    if (!orderData.user_id || !orderData.total_amount) {
      console.error('Missing critical fields: user_id or total_amount')
      console.error('Order data:', orderData)
      return null
    }

    // Try with new schema first, then fallback to minimal old schema
    let { data: createdOrder, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single()

    console.log('First attempt - data:', createdOrder)
    console.log('First attempt - error:', orderError)

    // If it fails, try with minimal old schema
    if (orderError) {
      console.log('Trying fallback with minimal schema...')
      const minimalOrderData = {
        user_id: user.id,
        total_amount: totalAmount,
        status: 'pending',
        shipping_address: shippingAddress
      }
      
      const fallbackResult = await supabase
        .from('orders')
        .insert(minimalOrderData)
        .select()
        .single()
        
      createdOrder = fallbackResult.data
      orderError = fallbackResult.error
      
      console.log('Fallback attempt - data:', createdOrder)
      console.log('Fallback attempt - error:', orderError)
    }

    if (orderError) {
      console.error('Error creating order (both attempts failed):', orderError)
      console.error('Order error details:', JSON.stringify(orderError, null, 2))
      console.error('Error code:', orderError.code)
      console.error('Error message:', orderError.message)
      console.error('Error details:', orderError.details)
      console.error('Error hint:', orderError.hint)
      return null
    }

    if (!createdOrder || !createdOrder.id) {
      console.error('Order creation failed - no order returned from database')
      console.error('Created order data:', createdOrder)
      return null
    }

    console.log('Order created successfully:', createdOrder)

    // Create order items - exclude generated columns
    const newSchemaOrderItems = await Promise.all(cartItems.map(async (item) => {
      let productId = item.product_id;

      if (!productId) {
        console.error('Missing product_id for item:', item);
        throw new Error('Missing product_id for cart item');
      }

      const unitPrice = item.price;
      const totalPrice = unitPrice * item.quantity;

      return {
        order_id: createdOrder.id,
        product_id: productId,
        product_weight_kg: item.weight_kg,
        quantity: item.quantity,
        unit_price: unitPrice,
      };
    }));

    console.log('Creating order items (new schema):', newSchemaOrderItems);

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(newSchemaOrderItems);

    if (itemsError) {
      console.error('Error creating order items:', itemsError);
      console.error('Items error details:', JSON.stringify(itemsError, null, 2));
      console.error('Items error code:', itemsError.code);
      console.error('Items error message:', itemsError.message);
      console.error('Items error hint:', itemsError.hint);
      // Don't return null here - the order was created, just items failed
      console.warn('Order created but order items failed. Order ID:', createdOrder.id);
    } else {
      console.log('Order items created successfully')
    }

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
    console.log('Returning order:', createdOrder)
    return createdOrder
  }

  return {
    orders,
    loading,
    createOrder,
    refetch: fetchOrders
  }
}