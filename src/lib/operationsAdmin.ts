import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { clamp } from '@/lib/sanitize'
import { createClient } from '@/lib/supabase/server'

export async function requireAdminSupabase() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return {
      supabase: null,
      user: null,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  try {
    requireAdmin(user.email)
  } catch {
    return {
      supabase: null,
      user: null,
      response: NextResponse.json({ error: 'Access denied' }, { status: 403 }),
    }
  }

  return { supabase, user, response: null }
}

export function positiveNumber(value: unknown, label: string) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) throw new Error(`${label} must be greater than 0`)
  return parsed
}

export function nonNegativeNumber(value: unknown, label: string) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error(`${label} must be 0 or greater`)
  return parsed
}

export function nullableUuid(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

export function todayIsoDate() {
  return new Date().toISOString().slice(0, 10)
}

export function proofFields(body: Record<string, unknown>) {
  return {
    reference_number: clamp(body.reference_number, 120) || null,
    document_url: clamp(body.document_url, 1000) || null,
  }
}
