import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try { requireAdmin(user.email) } catch {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  const { data: customer, error: custError } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single()

  if (custError || !customer) {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
  }

  const { data: orders } = await supabase
    .from('orders')
    .select('*, order_items(id, product_id, product_weight_kg, quantity, unit_price, total_price)')
    .eq('user_id', id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ customer, orders: orders || [] })
}
