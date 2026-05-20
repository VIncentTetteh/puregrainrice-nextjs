import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  buildInvoiceNumber,
  formatCurrency,
  normalizeInvoicePayload,
} from './invoices'

describe('invoice helpers', () => {
  it('normalizes invoice payloads and calculates totals on the server', () => {
    const normalized = normalizeInvoicePayload({
      customer_name: '  Ama Mensah  ',
      customer_email: ' ama@example.com ',
      customer_phone: ' 0542880528 ',
      customer_company: '  Ama Foods ',
      items: [
        {
          product_name: ' PureGrain 25KG ',
          description: ' Premium rice ',
          unit_price: '575.50',
          quantity: '2',
        },
        {
          product_name: 'PureGrain 5KG',
          description: '',
          unit_price: 120,
          quantity: 3,
        },
      ],
    })

    assert.equal(normalized.customer_name, 'Ama Mensah')
    assert.equal(normalized.customer_email, 'ama@example.com')
    assert.equal(normalized.customer_phone, '0542880528')
    assert.equal(normalized.customer_company, 'Ama Foods')
    assert.equal(normalized.subtotal, 1511)
    assert.equal(normalized.total, 1511)
    assert.deepEqual(
      normalized.items.map(item => item.line_total),
      [1151, 360],
    )
  })

  it('rejects invoices without required customer fields or valid line items', () => {
    assert.throws(
      () => normalizeInvoicePayload({ customer_name: '', customer_phone: '', items: [] }),
      /Customer name is required/,
    )
    assert.throws(
      () => normalizeInvoicePayload({ customer_name: 'Ama', customer_phone: '', items: [] }),
      /Customer phone is required/,
    )
    assert.throws(
      () => normalizeInvoicePayload({
        customer_name: 'Ama',
        customer_phone: '0542880528',
        items: [{ product_name: '', unit_price: 10, quantity: 1 }],
      }),
      /Product name is required/,
    )
    assert.throws(
      () => normalizeInvoicePayload({
        customer_name: 'Ama',
        customer_phone: '0542880528',
        items: [{ product_name: 'Rice', unit_price: 0, quantity: 1 }],
      }),
      /Unit price must be greater than 0/,
    )
  })

  it('formats invoice numbers and Ghanaian currency consistently', () => {
    assert.equal(buildInvoiceNumber(2026, 7), 'INV-2026-000007')
    assert.equal(formatCurrency(1511), 'GH₵1,511.00')
  })
})
