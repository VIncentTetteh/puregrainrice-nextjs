'use server'

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'

interface ShippingAddress {
  email: string
  full_name?: string
  phone?: string
}

interface OrderItem {
  id: string
  product_id: string
  product_name?: string
  product_description?: string
  product_image_url?: string
  product_weight_kg?: number
  quantity: number
  price?: number
  unit_price?: number
  total_price?: number
  products?: {
    name: string
    image_url: string
  }
}

interface Order {
  id: string
  status: string
  created_at: string
  shipping_address?: ShippingAddress
  user_email?: string
  user_full_name?: string
  user_phone?: string
  order_items: OrderItem[]
  [key: string]: unknown
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    try {
      requireAdmin(user.email)
    } catch {
      return NextResponse.json({ error: 'Access denied: Admin privileges required' }, { status: 403 })
    }
    let { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          product_id,
          product_name,
          product_description,
          product_image_url,
          product_weight_kg,
          quantity,
          price,
          unit_price,
          total_price
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.log('Detailed query failed, trying basic schema for admin orders...', error.message)
      const basicResult = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            product_id,
            quantity,
            price
          )
        `)
        .order('created_at', { ascending: false })
      orders = basicResult.data
      error = basicResult.error
    }

    if (error) {
      console.error('Error fetching orders:', error)
      return NextResponse.json({ error: 'Failed to fetch orders', details: error.message }, { status: 500 })
    }

    if (orders) {
      orders = orders.map((order: Order) => ({
        ...order,
        shipping_address: order.shipping_address || {
          email: order.user_email || '',
          full_name: order.user_full_name || '',
          phone: order.user_phone || ''
        },
        order_items: (order.order_items || []).map((item: OrderItem) => ({
          ...item,
          price: item.unit_price || item.price || 0,
          products: {
            name: item.product_name || `Product ${item.product_id}`,
            image_url: item.product_image_url || ''
          }
        }))
      }))
    }

    return NextResponse.json({ orders: orders || [] })
  } catch (err: unknown) {
    console.error('Error in orders API:', err)
    return NextResponse.json(
      { error: 'Internal server error', details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { orderId, status, notes } = await request.json()
    if (!orderId || !status) {
      return NextResponse.json({ error: 'Order ID and status are required' }, { status: 400 })
    }
    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    try {
      requireAdmin(user.email)
    } catch {
      return NextResponse.json({ error: 'Access denied: Admin privileges required' }, { status: 403 })
    }
    const updateData: { status: string; updated_at: string; admin_notes?: string } = {
      status,
      updated_at: new Date().toISOString()
    }
    if (notes) {
      updateData.admin_notes = notes
    }
    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single()
    if (error) {
      console.error('Error updating order:', error)
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
    }
    return NextResponse.json({ order: data })
  } catch (err: unknown) {
    console.error('Error in order update API:', err)
    return NextResponse.json(
      { error: 'Internal server error', details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}