import { NextRequest, NextResponse } from 'next/server'
import { requireAdminSupabase } from '@/lib/operationsAdmin'

export async function GET(req: NextRequest) {
  const { supabase, response } = await requireAdminSupabase()
  if (!supabase) return response

  try {
    const { searchParams } = new URL(req.url)
    const resourceType = searchParams.get('resource_type')
    const action = searchParams.get('action')
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    let query = supabase
      .from('operation_audit_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500)

    if (resourceType) query = query.eq('resource_type', resourceType)
    if (action) query = query.eq('action', action)
    if (from) query = query.gte('created_at', from)
    if (to) query = query.lte('created_at', to)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ auditEvents: data || [] })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to load audit events' }, { status: 400 })
  }
}
