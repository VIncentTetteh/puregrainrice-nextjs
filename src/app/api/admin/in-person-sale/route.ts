import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin'
import { clamp } from '@/lib/sanitize'

interface SaleItem {
  product_id: string
  weight_kg: string
  quantity: number
  unit_price: number
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try { requireAdmin(user.email) } catch {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  const body = await req.json()
  const {
    customer_id,
    customer_name,
    customer_email,
    customer_phone,
    delivery_address,
    delivery_city,
    items,
    total_amount,
    notes,
  } = body

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'At least one item is required' }, { status: 400 })
  }
  if (!total_amount || isNaN(Number(total_amount)) || Number(total_amount) <= 0) {
    return NextResponse.json({ error: 'Valid total amount is required' }, { status: 400 })
  }

  const paymentRef = `INPERSON-${Date.now()}`
  const adminNotes = [
    notes ? clamp(notes, 500) : '',
    '[In-person sale recorded by admin]',
  ].filter(Boolean).join('\n')

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: customer_id || null,
      user_email: customer_email || 'walk-in@inperson.sale',
      user_full_name: customer_name || 'Walk-in Customer',
      user_phone: customer_phone || null,
      delivery_address: delivery_address || 'In-Person',
      delivery_city: delivery_city || 'In-Person',
      total_amount: Number(total_amount),
      status: 'delivered',
      payment_status: 'success',
      payment_reference: paymentRef,
      admin_notes: adminNotes,
    })
    .select()
    .single()

  if (orderError) {
    return NextResponse.json({ error: orderError.message }, { status: 500 })
  }

  const orderItems = items.map((item: SaleItem) => ({
    order_id: order.id,
    product_id: item.product_id,
    product_weight_kg: item.weight_kg || '',
    quantity: Number(item.quantity),
    unit_price: Number(item.unit_price),
    total_price: Number(item.unit_price) * Number(item.quantity),
  }))

  const { error: itemsError } = await supabase.from('order_items').insert(orderItems)

  if (itemsError) {
    await supabase.from('orders').delete().eq('id', order.id)
    return NextResponse.json({ error: itemsError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, order }, { status: 201 })
}
