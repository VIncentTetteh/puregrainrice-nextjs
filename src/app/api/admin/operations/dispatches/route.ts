import { NextRequest, NextResponse } from 'next/server'
import { clamp } from '@/lib/sanitize'
import {
  nullableUuid,
  positiveNumber,
  proofFields,
  requireAdminSupabase,
  todayIsoDate,
} from '@/lib/operationsAdmin'

export async function POST(req: NextRequest) {
  const { supabase, response } = await requireAdminSupabase()
  if (!supabase) return response

  try {
    const body = await req.json()
    const proof = proofFields(body)
    const { data, error } = await supabase.rpc('create_rice_dispatch_with_stock', {
      p_season_id: body.season_id,
      p_warehouse_id: body.warehouse_id,
      p_dispatch_date: body.dispatch_date || todayIsoDate(),
      p_bags: positiveNumber(body.bags, 'Bags'),
      p_sale_amount: body.sale_amount ? Number(body.sale_amount) : null,
      p_order_id: nullableUuid(body.order_id),
      p_invoice_id: nullableUuid(body.invoice_id),
      p_recipient: clamp(body.recipient, 200) || null,
      p_notes: clamp(body.notes, 1000) || null,
      p_reference_number: proof.reference_number,
      p_document_url: proof.document_url,
    })

    if (error) throw error
    return NextResponse.json({ id: data }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create dispatch' }, { status: 400 })
  }
}
