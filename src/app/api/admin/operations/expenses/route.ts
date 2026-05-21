import { NextRequest, NextResponse } from 'next/server'
import { clamp } from '@/lib/sanitize'
import { positiveNumber, proofFields, requireAdminSupabase, todayIsoDate } from '@/lib/operationsAdmin'

export async function POST(req: NextRequest) {
  const { supabase, user, response } = await requireAdminSupabase()
  if (!supabase || !user) return response

  try {
    const body = await req.json()
    const { data: created, error } = await supabase.from('season_expenses').insert({
      season_id: body.season_id,
      expense_date: body.expense_date || todayIsoDate(),
      category: body.category || 'other',
      description: clamp(body.description, 500) || null,
      amount: positiveNumber(body.amount, 'Expense amount'),
      ...proofFields(body),
      created_by: user.id,
    }).select().single()

    if (error) throw error

    await supabase.from('operation_audit_events').insert({
      actor_id: user.id,
      action: 'create',
      resource_type: 'season_expense',
      resource_id: created.id,
      after_data: created,
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create expense' }, { status: 400 })
  }
}
