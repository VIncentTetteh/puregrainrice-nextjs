import { NextRequest, NextResponse } from 'next/server'
import { clamp } from '@/lib/sanitize'
import { positiveNumber, proofFields, requireAdminSupabase, todayIsoDate } from '@/lib/operationsAdmin'

export async function POST(req: NextRequest) {
  const { supabase, user, response } = await requireAdminSupabase()
  if (!supabase || !user) return response

  try {
    const body = await req.json()
    const { data: created, error } = await supabase.from('farmer_loans').insert({
      account_id: body.account_id,
      loan_date: body.loan_date || todayIsoDate(),
      amount: positiveNumber(body.amount, 'Loan amount'),
      notes: clamp(body.notes, 1000) || null,
      ...proofFields(body),
      created_by: user.id,
    }).select().single()

    if (error) throw error

    await supabase.from('operation_audit_events').insert({
      actor_id: user.id,
      action: 'create',
      resource_type: 'farmer_loan',
      resource_id: created.id,
      after_data: created,
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create loan' }, { status: 400 })
  }
}
