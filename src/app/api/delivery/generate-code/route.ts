import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

// Cryptographically secure 8-character hex code (e.g. "A3F2B19C")
function generateCode(): string {
  return randomBytes(4).toString('hex').toUpperCase()
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const orderId = typeof body?.orderId === 'string' ? body.orderId.trim() : null

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify the order belongs to this user before generating a code
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Find a unique code (collision extremely unlikely with 4 random bytes, but check anyway)
    let code = generateCode()
    for (let i = 0; i < 5; i++) {
      const { data: existing } = await supabase
        .from('delivery_confirmations')
        .select('id')
        .eq('code', code)
        .maybeSingle()
      if (!existing) break
      code = generateCode()
    }

    const { data, error } = await supabase
      .from('delivery_confirmations')
      .insert({ order_id: orderId, code })
      .select()
      .single()

    if (error) {
      console.error('Error creating delivery confirmation:', error)
      return NextResponse.json({ error: 'Failed to generate confirmation code' }, { status: 500 })
    }

    return NextResponse.json({ success: true, code, id: data.id })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
