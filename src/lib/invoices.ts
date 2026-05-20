import { randomBytes } from 'crypto'
import { clamp, escapeHtml, isValidEmail } from './sanitize'

export interface InvoiceItemInput {
  id?: string
  product_name?: unknown
  description?: unknown
  unit_price?: unknown
  quantity?: unknown
}

export interface InvoicePayloadInput {
  customer_name?: unknown
  customer_email?: unknown
  customer_phone?: unknown
  customer_company?: unknown
  items?: InvoiceItemInput[]
}

export interface NormalizedInvoiceItem {
  id?: string
  product_name: string
  description: string
  unit_price: number
  quantity: number
  line_total: number
}

export interface NormalizedInvoicePayload {
  customer_name: string
  customer_email: string | null
  customer_phone: string
  customer_company: string | null
  items: NormalizedInvoiceItem[]
  subtotal: number
  total: number
}

export interface CompanyInvoiceProfile {
  name: string
  logoPath: string
  address: string
  phone: string
  email: string
  website: string
}

export interface InvoiceForDocument {
  id: string
  invoice_number: string
  issue_date: string
  customer_name: string
  customer_email: string | null
  customer_phone: string
  customer_company: string | null
  subtotal: number
  total: number
  public_token: string
  created_at?: string
  invoice_items: NormalizedInvoiceItem[]
}

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function asPositiveMoney(value: unknown, label: string): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${label} must be greater than 0`)
  }
  return roundMoney(parsed)
}

function asPositiveInteger(value: unknown, label: string): number {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${label} must be greater than 0`)
  }
  return parsed
}

export function normalizeInvoicePayload(input: InvoicePayloadInput): NormalizedInvoicePayload {
  const customer_name = clamp(input.customer_name, 200)
  const customer_phone = clamp(input.customer_phone, 50)
  const rawEmail = clamp(input.customer_email, 254)
  const customer_email = rawEmail ? rawEmail.toLowerCase() : null
  const customer_company = clamp(input.customer_company, 200) || null

  if (!customer_name) throw new Error('Customer name is required')
  if (!customer_phone) throw new Error('Customer phone is required')
  if (customer_email && !isValidEmail(customer_email)) throw new Error('Customer email is invalid')
  if (!Array.isArray(input.items) || input.items.length === 0) {
    throw new Error('At least one invoice item is required')
  }

  const items = input.items.map((item, index) => {
    const product_name = clamp(item.product_name, 240)
    if (!product_name) throw new Error(`Product name is required for item ${index + 1}`)

    const unit_price = asPositiveMoney(item.unit_price, 'Unit price')
    const quantity = asPositiveInteger(item.quantity, 'Quantity')
    const line_total = roundMoney(unit_price * quantity)

    return {
      id: typeof item.id === 'string' ? item.id : undefined,
      product_name,
      description: clamp(item.description, 1000),
      unit_price,
      quantity,
      line_total,
    }
  })

  const subtotal = roundMoney(items.reduce((sum, item) => sum + item.line_total, 0))

  return {
    customer_name,
    customer_email,
    customer_phone,
    customer_company,
    items,
    subtotal,
    total: subtotal,
  }
}

export function buildInvoiceNumber(year: number, sequence: number): string {
  return `INV-${year}-${String(sequence).padStart(6, '0')}`
}

export function createInvoiceToken(): string {
  return randomBytes(24).toString('hex')
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: 2,
  }).format(amount).replace('GH₵', 'GH₵')
}

export function formatPdfCurrency(amount: number): string {
  const value = new Intl.NumberFormat('en-GH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)

  return `GHS ${value}`
}

export function getCompanyInvoiceProfile(): CompanyInvoiceProfile {
  return {
    name: process.env.COMPANY_NAME || 'PurePlatter Foods LTD',
    logoPath: '/IMG_4866.png',
    address: process.env.COMPANY_ADDRESS || 'Taifa Suma Ampim 23, Ghana',
    phone: process.env.SUPPORT_PHONE || '+233 54 288 0528',
    email: process.env.SUPPORT_EMAIL || process.env.EMAIL_FROM || 'info@pureplatterfoods.com',
    website: process.env.NEXT_PUBLIC_APP_URL || 'https://www.pureplatterfoods.com',
  }
}

export function createInvoiceEmailHtml(invoice: InvoiceForDocument, invoiceUrl: string): string {
  const company = getCompanyInvoiceProfile()
  return `
    <!DOCTYPE html>
    <html>
      <body style="margin:0;background:#f7f3e8;font-family:Arial,sans-serif;color:#1f2933;">
        <div style="max-width:640px;margin:0 auto;background:#ffffff;padding:32px;">
          <h1 style="margin:0 0 8px;color:#1f2933;">Invoice ${escapeHtml(invoice.invoice_number)}</h1>
          <p style="margin:0 0 24px;color:#5d6673;">Hello ${escapeHtml(invoice.customer_name)}, your invoice from ${escapeHtml(company.name)} is attached.</p>
          <div style="border:1px solid #e8dcc5;border-radius:10px;padding:18px;margin-bottom:24px;">
            <p style="margin:0 0 8px;"><strong>Total:</strong> ${formatCurrency(invoice.total)}</p>
            <p style="margin:0;"><strong>Invoice date:</strong> ${escapeHtml(formatInvoiceDate(invoice.issue_date))}</p>
          </div>
          <p style="margin:0 0 24px;">You can also view or download it here:</p>
          <p style="margin:0 0 28px;">
            <a href="${escapeHtml(invoiceUrl)}" style="background:#9A7A2A;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;display:inline-block;">View invoice</a>
          </p>
          <p style="margin:0;color:#5d6673;font-size:14px;">${escapeHtml(company.name)}<br>${escapeHtml(company.phone)} · ${escapeHtml(company.email)}</p>
        </div>
      </body>
    </html>
  `
}

export function createInvoiceEmailText(invoice: InvoiceForDocument, invoiceUrl: string): string {
  const company = getCompanyInvoiceProfile()
  return [
    `Invoice ${invoice.invoice_number}`,
    '',
    `Hello ${invoice.customer_name}, your invoice from ${company.name} is attached.`,
    `Total: ${formatCurrency(invoice.total)}`,
    `Invoice date: ${formatInvoiceDate(invoice.issue_date)}`,
    '',
    `View invoice: ${invoiceUrl}`,
    '',
    `${company.name}`,
    `${company.phone} · ${company.email}`,
  ].join('\n')
}

export function formatInvoiceDate(date: string): string {
  return new Date(date).toLocaleDateString('en-GH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
