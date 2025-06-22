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
    
    // Get all customers with their order statistics
    const { data: customers, error } = await supabase
      .from('customers')
      .select(`
        *,
        orders (
          id,
          status,
          total_amount,
          created_at
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching customers:', error)
      return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 })
    }

    // Process customer data to include statistics
    const processedCustomers = customers.map(customer => {
      const orders = customer.orders || []
      const completedOrders = orders.filter((order: any) => order.status === 'delivered')
      const pendingOrders = orders.filter((order: any) => ['pending', 'confirmed', 'shipped'].includes(order.status))
      
      return {
        ...customer,
        orderCount: orders.length,
        completedOrderCount: completedOrders.length,
        pendingOrderCount: pendingOrders.length,
        averageOrderValue: orders.length > 0 
          ? orders.reduce((sum: number, order: any) => sum + order.total_amount, 0) / orders.length 
          : 0,
        lastOrderDate: orders.length > 0 
          ? Math.max(...orders.map((order: any) => new Date(order.created_at).getTime()))
          : null
      }
    })

    return NextResponse.json({ customers: processedCustomers })
  } catch (error) {
    console.error('Error in customers API:', error)
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

    // Update customer record
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
  } catch (error) {
    console.error('Error in customer update:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
