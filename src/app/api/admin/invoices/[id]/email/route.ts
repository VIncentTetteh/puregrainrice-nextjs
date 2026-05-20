import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin'
import { createInvoiceEmailHtml, createInvoiceEmailText, InvoiceForDocument } from '@/lib/invoices'
import { renderInvoicePdf } from '@/lib/invoicePdf'

const resend = new Resend(process.env.RESEND_API_KEY!)

async function requireAdminSupabase() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { supabase: null, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  try {
    requireAdmin(user.email)
  } catch {
    return { supabase: null, response: NextResponse.json({ error: 'Access denied' }, { status: 403 }) }
  }
  return { supabase, response: null }
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const { supabase, response } = await requireAdminSupabase()
  if (!supabase) return response

  const { data: invoice, error } = await supabase
    .from('invoices')
    .select('*, invoice_items (id, product_name, description, unit_price, quantity, line_total)')
    .eq('id', id)
    .single()

  if (error || !invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
  if (!invoice.customer_email) return NextResponse.json({ error: 'Customer email is required' }, { status: 400 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin
  const invoiceUrl = `${appUrl}/api/invoices/${invoice.public_token}/pdf`
  const pdfBuffer = await renderInvoicePdf(invoice as InvoiceForDocument)
  const html = createInvoiceEmailHtml(invoice as InvoiceForDocument, invoiceUrl)
  const text = createInvoiceEmailText(invoice as InvoiceForDocument, invoiceUrl)

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: invoice.customer_email,
      subject: `Invoice ${invoice.invoice_number} from PurePlatter Foods LTD`,
      html,
      text,
      attachments: [
        {
          filename: `${invoice.invoice_number}.pdf`,
          content: pdfBuffer.toString('base64'),
        },
      ],
    })

    const { data: updated, error: updateError } = await supabase
      .from('invoices')
      .update({ emailed_at: new Date().toISOString() })
      .eq('id', invoice.id)
      .select('*, invoice_items (id, product_name, description, unit_price, quantity, line_total)')
      .single()

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })
    return NextResponse.json({ invoice: updated })
  } catch (emailError) {
    return NextResponse.json(
      { error: emailError instanceof Error ? emailError.message : 'Failed to send invoice email' },
      { status: 500 },
    )
  }
}
