import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin'
import {
  buildInvoiceNumber,
  createInvoiceToken,
  normalizeInvoicePayload,
} from '@/lib/invoices'

async function getAdminSupabase() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { supabase: null, user: null, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  try {
    requireAdmin(user.email)
  } catch {
    return { supabase: null, user: null, response: NextResponse.json({ error: 'Access denied' }, { status: 403 }) }
  }
  return { supabase, user, response: null }
}

async function nextInvoiceNumber(supabase: Awaited<ReturnType<typeof createClient>>) {
  const year = new Date().getFullYear()
  const start = `${year}-01-01`
  const end = `${year + 1}-01-01`

  const { count, error } = await supabase
    .from('invoices')
    .select('id', { count: 'exact', head: true })
    .gte('issue_date', start)
    .lt('issue_date', end)

  if (error) throw error
  return buildInvoiceNumber(year, (count || 0) + 1)
}

export async function GET() {
  const { supabase, response } = await getAdminSupabase()
  if (!supabase) return response

  const { data, error } = await supabase
    .from('invoices')
    .select(`
      *,
      invoice_items (
        id,
        product_name,
        description,
        unit_price,
        quantity,
        line_total
      )
    `)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ invoices: data || [] })
}

export async function POST(req: NextRequest) {
  const { supabase, user, response } = await getAdminSupabase()
  if (!supabase || !user) return response

  try {
    const payload = normalizeInvoicePayload(await req.json())
    const invoiceNumber = await nextInvoiceNumber(supabase)

    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        invoice_number: invoiceNumber,
        issue_date: new Date().toISOString().slice(0, 10),
        customer_name: payload.customer_name,
        customer_email: payload.customer_email,
        customer_phone: payload.customer_phone,
        customer_company: payload.customer_company,
        subtotal: payload.subtotal,
        total: payload.total,
        public_token: createInvoiceToken(),
        created_by: user.id,
      })
      .select()
      .single()

    if (invoiceError) return NextResponse.json({ error: invoiceError.message }, { status: 500 })

    const { error: itemsError } = await supabase
      .from('invoice_items')
      .insert(payload.items.map(item => ({
        invoice_id: invoice.id,
        product_name: item.product_name,
        description: item.description || null,
        unit_price: item.unit_price,
        quantity: item.quantity,
      })))

    if (itemsError) {
      await supabase.from('invoices').delete().eq('id', invoice.id)
      return NextResponse.json({ error: itemsError.message }, { status: 500 })
    }

    const { data: fullInvoice, error: fetchError } = await supabase
      .from('invoices')
      .select('*, invoice_items (id, product_name, description, unit_price, quantity, line_total)')
      .eq('id', invoice.id)
      .single()

    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })
    return NextResponse.json({ invoice: fullInvoice }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid invoice payload' },
      { status: 400 },
    )
  }
}

export async function PATCH(req: NextRequest) {
  const { supabase, response } = await getAdminSupabase()
  if (!supabase) return response

  try {
    const body = await req.json()
    const id = typeof body.id === 'string' ? body.id : ''
    if (!id) return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 })

    const payload = normalizeInvoicePayload(body)

    const { error: invoiceError } = await supabase
      .from('invoices')
      .update({
        customer_name: payload.customer_name,
        customer_email: payload.customer_email,
        customer_phone: payload.customer_phone,
        customer_company: payload.customer_company,
        subtotal: payload.subtotal,
        total: payload.total,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (invoiceError) return NextResponse.json({ error: invoiceError.message }, { status: 500 })

    const { error: deleteError } = await supabase.from('invoice_items').delete().eq('invoice_id', id)
    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })

    const { error: itemsError } = await supabase
      .from('invoice_items')
      .insert(payload.items.map(item => ({
        invoice_id: id,
        product_name: item.product_name,
        description: item.description || null,
        unit_price: item.unit_price,
        quantity: item.quantity,
      })))

    if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 })

    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select('*, invoice_items (id, product_name, description, unit_price, quantity, line_total)')
      .eq('id', id)
      .single()

    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })
    return NextResponse.json({ invoice })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid invoice payload' },
      { status: 400 },
    )
  }
}

export async function DELETE(req: NextRequest) {
  const { supabase, response } = await getAdminSupabase()
  if (!supabase) return response

  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 })

  const { error } = await supabase.from('invoices').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
