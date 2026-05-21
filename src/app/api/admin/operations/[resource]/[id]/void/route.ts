import { NextRequest, NextResponse } from 'next/server'
import { clamp } from '@/lib/sanitize'
import { requireAdminSupabase } from '@/lib/operationsAdmin'

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ resource: string; id: string }> },
) {
  const { supabase, response } = await requireAdminSupabase()
  if (!supabase) return response

  try {
    const { resource, id } = await context.params
    const body = await req.json().catch(() => ({}))
    const reason = clamp(body.reason, 500)
    if (!reason) throw new Error('Void reason is required')

    const { error } = await supabase.rpc('void_operation_record', {
      p_resource_type: resource,
      p_resource_id: id,
      p_reason: reason,
    })

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to void record' }, { status: 400 })
  }
}
