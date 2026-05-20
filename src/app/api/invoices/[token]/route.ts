import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(_req: NextRequest, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params

  try {
    const supabase = createServiceClient()
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('*, invoice_items (id, product_name, description, unit_price, quantity, line_total)')
      .eq('public_token', token)
      .single()

    if (error || !invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    return NextResponse.json({ invoice })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to load invoice' },
      { status: 500 },
    )
  }
}
