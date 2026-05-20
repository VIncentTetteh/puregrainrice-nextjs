import { NextRequest, NextResponse } from 'next/server'
import { InvoiceForDocument } from '@/lib/invoices'
import { renderInvoicePdf } from '@/lib/invoicePdf'
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

    const buffer = await renderInvoicePdf(invoice as InvoiceForDocument)
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${invoice.invoice_number}.pdf"`,
        'Cache-Control': 'private, max-age=0, must-revalidate',
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to render invoice PDF' },
      { status: 500 },
    )
  }
}
