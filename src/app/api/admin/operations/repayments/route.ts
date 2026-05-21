import { NextRequest, NextResponse } from 'next/server'
import { clamp } from '@/lib/sanitize'
import { positiveNumber, proofFields, requireAdminSupabase, todayIsoDate } from '@/lib/operationsAdmin'

export async function POST(req: NextRequest) {
  const { supabase, response } = await requireAdminSupabase()
  if (!supabase) return response

  try {
    const body = await req.json()
    const proof = proofFields(body)
    const { data, error } = await supabase.rpc('create_farmer_repayment_with_stock', {
      p_account_id: body.account_id,
      p_warehouse_id: body.warehouse_id,
      p_repayment_date: body.repayment_date || todayIsoDate(),
      p_bags: positiveNumber(body.bags, 'Bags'),
      p_price_per_bag: positiveNumber(body.price_per_bag, 'Price per bag'),
      p_notes: clamp(body.notes, 1000) || null,
      p_reference_number: proof.reference_number,
      p_document_url: proof.document_url,
    })

    if (error) throw error
    return NextResponse.json({ id: data }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create repayment' }, { status: 400 })
  }
}
