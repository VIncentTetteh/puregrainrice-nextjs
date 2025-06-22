import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json()
    
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Generate a unique 6-character code
    const generateCode = () => {
      return Math.random().toString(36).substring(2, 8).toUpperCase()
    }

    let confirmationCode = generateCode()
    let attempts = 0
    const maxAttempts = 10

    // Ensure the code is unique
    while (attempts < maxAttempts) {
      const { data: existingCode } = await supabase
        .from('delivery_confirmations')
        .select('id')
        .eq('confirmation_code', confirmationCode)
        .single()

      if (!existingCode) {
        break
      }
      
      confirmationCode = generateCode()
      attempts++
    }

    // Insert the confirmation code
    const { data, error } = await supabase
      .from('delivery_confirmations')
      .insert({
        order_id: orderId,
        user_id: user.id,
        confirmation_code: confirmationCode
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating delivery confirmation:', error)
      return NextResponse.json({ error: 'Failed to generate confirmation code' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      confirmationCode,
      id: data.id 
    })
  } catch (error) {
    console.error('Error in delivery code generation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
