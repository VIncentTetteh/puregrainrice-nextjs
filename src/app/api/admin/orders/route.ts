'use server'

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication and admin privileges
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    try {
      requireAdmin(user.email)
    } catch (error) {
      return NextResponse.json({ error: 'Access denied: Admin privileges required' }, { status: 403 })
    }
    
    // Enhanced query that works with both old and new schema
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

    // If that fails, try a more basic query
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

    // Transform data to ensure consistent format for frontend
    if (orders) {
      orders = orders.map(order => ({
        ...order,
        // Ensure shipping_address exists for backward compatibility
        shipping_address: order.shipping_address || {
          email: order.user_email || '',
          full_name: order.user_full_name || '',
          phone: order.user_phone || ''
        },
        order_items: (order.order_items || []).map(item => ({
          ...item,
          // Use unit_price if available, fallback to price
          price: item.unit_price || item.price || 0,
          // Create products object for frontend compatibility
          products: {
            name: item.product_name || `Product ${item.product_id}`,
            image_url: item.product_image_url || ''
          }
        }))
      }))
    }

    return NextResponse.json({ orders: orders || [] })
  } catch (error) {
    console.error('Error in orders API:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
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
    
    // Check authentication and admin privileges
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    try {
      requireAdmin(user.email)
    } catch (error) {
      return NextResponse.json({ error: 'Access denied: Admin privileges required' }, { status: 403 })
    }
    
    const updateData: any = { 
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
  } catch (error) {
    console.error('Error in order update API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
