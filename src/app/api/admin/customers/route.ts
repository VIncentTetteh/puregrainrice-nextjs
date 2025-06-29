import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'

interface Order {
  status: string
  total_amount: number
  created_at: string
}

interface Customer {
  id: string
  email: string
  full_name: string
  phone: string
  whatsapp_number: string
  preferred_delivery_city: string
  total_orders: number
  total_spent: number
  last_order_date: string
  created_at: string
  orders?: Order[]
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
    const { data } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })

    const customers: Customer[] = data ?? []

    const processedCustomers = customers.map((customer) => {
      const orders: Order[] = customer.orders || []
      const completedOrders = orders.filter((order) => order.status === 'delivered')
      const pendingOrders = orders.filter((order) =>
        ['pending', 'confirmed', 'shipped'].includes(order.status)
      )
      return {
        ...customer,
        orderCount: orders.length,
        completedOrderCount: completedOrders.length,
        pendingOrderCount: pendingOrders.length,
        averageOrderValue:
          orders.length > 0
            ? orders.reduce((sum, order) => sum + order.total_amount, 0) / orders.length
            : 0,
        lastOrderDate:
          orders.length > 0
            ? Math.max(...orders.map((order) => new Date(order.created_at).getTime()))
            : null,
      }
    })

    return NextResponse.json({ customers: processedCustomers })
  } catch (err) {
    console.error('Error in customers API:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { customerId, updates } = await request.json()
    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 })
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
    const { data: customer, error: updateError } = await supabase
      .from('customers')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', customerId)
      .select()
      .single()
    if (updateError) {
      console.error('Error updating customer:', updateError)
      return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 })
    }
    return NextResponse.json({
      success: true,
      customer,
      message: 'Customer updated successfully'
    })
  } catch (err) {
    console.error('Error in customer update:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}