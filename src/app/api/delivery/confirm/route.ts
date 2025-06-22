import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { orderId, confirmationCode } = await request.json()
    
    if (!orderId || !confirmationCode) {
      return NextResponse.json({ error: 'Order ID and confirmation code are required' }, { status: 400 })
    }

    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify the confirmation code
    const { data: confirmationData, error: confirmationError } = await supabase
      .from('delivery_confirmations')
      .select('*')
      .eq('order_id', orderId)
      .eq('confirmation_code', confirmationCode.toUpperCase())
      .eq('user_id', user.id)
      .is('confirmed_at', null)
      .single()

    if (confirmationError || !confirmationData) {
      return NextResponse.json({ error: 'Invalid confirmation code or order already confirmed' }, { status: 400 })
    }

    // Update confirmation record
    const { error: updateConfirmationError } = await supabase
      .from('delivery_confirmations')
      .update({
        confirmed_at: new Date().toISOString(),
        confirmation_method: 'code'
      })
      .eq('id', confirmationData.id)

    if (updateConfirmationError) {
      console.error('Error updating confirmation:', updateConfirmationError)
      return NextResponse.json({ error: 'Failed to confirm delivery' }, { status: 500 })
    }

    // Update order status to delivered
    const { error: orderUpdateError } = await supabase
      .from('orders')
      .update({
        status: 'delivered',
        confirmed_delivery_at: new Date().toISOString(),
        delivery_confirmation_method: 'customer_code'
      })
      .eq('id', orderId)
      .eq('user_id', user.id)

    if (orderUpdateError) {
      console.error('Error updating order status:', orderUpdateError)
      return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Delivery confirmed successfully' 
    })
  } catch (error) {
    console.error('Error in delivery confirmation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
