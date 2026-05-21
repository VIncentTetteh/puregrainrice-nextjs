import { NextRequest, NextResponse } from 'next/server'
import { clamp } from '@/lib/sanitize'
import {
  nonNegativeNumber,
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
    const { data, error } = await supabase.rpc('create_milling_batch_with_stock', {
      p_season_id: body.season_id,
      p_source_warehouse_id: body.source_warehouse_id,
      p_destination_warehouse_id: body.destination_warehouse_id,
      p_milling_date: body.milling_date || todayIsoDate(),
      p_paddy_bags: positiveNumber(body.paddy_bags, 'Paddy bags'),
      p_milled_bags: nonNegativeNumber(body.milled_bags, 'Milled bags'),
      p_notes: clamp(body.notes, 1000) || null,
      p_reference_number: proof.reference_number,
      p_document_url: proof.document_url,
    })

    if (error) throw error
    return NextResponse.json({ id: data }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create milling batch' }, { status: 400 })
  }
}
