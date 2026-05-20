import React from 'react'
import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
  pdf,
} from '@react-pdf/renderer'
import path from 'path'
import {
  formatInvoiceDate,
  formatPdfCurrency,
  getCompanyInvoiceProfile,
  InvoiceForDocument,
} from './invoices'

const styles = StyleSheet.create({
  page: {
    padding: 42,
    fontFamily: 'Helvetica',
    color: '#20242a',
    fontSize: 10,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  brand: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    maxWidth: 300,
  },
  logo: {
    width: 54,
    height: 54,
    objectFit: 'contain',
  },
  companyName: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  muted: {
    color: '#687282',
    lineHeight: 1.45,
  },
  invoiceTitle: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    color: '#9A7A2A',
    textAlign: 'right',
    marginBottom: 6,
  },
  invoiceNumber: {
    fontSize: 11,
    textAlign: 'right',
    color: '#4a515c',
  },
  row: {
    flexDirection: 'row',
    gap: 18,
    marginBottom: 28,
  },
  panel: {
    flex: 1,
    border: '1px solid #e8dcc5',
    borderRadius: 8,
    padding: 14,
  },
  panelLabel: {
    fontSize: 8,
    letterSpacing: 1.2,
    color: '#9A7A2A',
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  strong: {
    fontFamily: 'Helvetica-Bold',
  },
  table: {
    border: '1px solid #e8dcc5',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1f2933',
    color: '#ffffff',
    paddingVertical: 9,
    paddingHorizontal: 10,
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderTop: '1px solid #efe7d8',
  },
  description: {
    color: '#687282',
    marginTop: 3,
    lineHeight: 1.35,
  },
  itemCol: { width: '46%' },
  qtyCol: { width: '12%', textAlign: 'right' },
  priceCol: { width: '20%', textAlign: 'right' },
  totalCol: { width: '22%', textAlign: 'right' },
  totals: {
    marginTop: 22,
    marginLeft: 'auto',
    width: 220,
  },
  totalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottom: '1px solid #efe7d8',
  },
  grandTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#1f2933',
    color: '#ffffff',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    fontFamily: 'Helvetica-Bold',
    fontSize: 13,
  },
  footer: {
    position: 'absolute',
    bottom: 28,
    left: 42,
    right: 42,
    borderTop: '1px solid #efe7d8',
    paddingTop: 12,
    color: '#687282',
    fontSize: 9,
    textAlign: 'center',
  },
})

function logoFilePath() {
  return path.join(process.cwd(), 'public', 'IMG_4866.png')
}

export function InvoiceDocument({ invoice }: { invoice: InvoiceForDocument }) {
  const company = getCompanyInvoiceProfile()

  return (
    <Document title={`Invoice ${invoice.invoice_number}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.brand}>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf Image is not a DOM image element. */}
            <Image src={logoFilePath()} style={styles.logo} />
            <View>
              <Text style={styles.companyName}>{company.name}</Text>
              <Text style={styles.muted}>{company.address}</Text>
              <Text style={styles.muted}>{company.phone}</Text>
              <Text style={styles.muted}>{company.email}</Text>
            </View>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>{invoice.invoice_number}</Text>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.panel}>
            <Text style={styles.panelLabel}>Bill To</Text>
            <Text style={styles.strong}>{invoice.customer_name}</Text>
            {invoice.customer_company ? <Text>{invoice.customer_company}</Text> : null}
            <Text>{invoice.customer_phone}</Text>
            {invoice.customer_email ? <Text>{invoice.customer_email}</Text> : null}
          </View>
          <View style={styles.panel}>
            <Text style={styles.panelLabel}>Invoice Details</Text>
            <Text>
              <Text style={styles.strong}>Invoice number: </Text>
              {invoice.invoice_number}
            </Text>
            <Text>
              <Text style={styles.strong}>Issue date: </Text>
              {formatInvoiceDate(invoice.issue_date)}
            </Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.itemCol}>Product</Text>
            <Text style={styles.qtyCol}>Qty</Text>
            <Text style={styles.priceCol}>Unit price</Text>
            <Text style={styles.totalCol}>Line total</Text>
          </View>
          {invoice.invoice_items.map((item, index) => (
            <View key={`${item.product_name}-${index}`} style={styles.tableRow}>
              <View style={styles.itemCol}>
                <Text style={styles.strong}>{item.product_name}</Text>
                {item.description ? <Text style={styles.description}>{item.description}</Text> : null}
              </View>
              <Text style={styles.qtyCol}>{item.quantity}</Text>
              <Text style={styles.priceCol}>{formatPdfCurrency(Number(item.unit_price))}</Text>
              <Text style={styles.totalCol}>{formatPdfCurrency(Number(item.line_total))}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalLine}>
            <Text>Subtotal</Text>
            <Text>{formatPdfCurrency(Number(invoice.subtotal))}</Text>
          </View>
          <View style={styles.grandTotal}>
            <Text>Total</Text>
            <Text>{formatPdfCurrency(Number(invoice.total))}</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Thank you for choosing {company.name}. This invoice was generated electronically.
        </Text>
      </Page>
    </Document>
  )
}

async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}

export async function renderInvoicePdf(invoice: InvoiceForDocument): Promise<Buffer> {
  const stream = await pdf(<InvoiceDocument invoice={invoice} />).toBuffer()
  return streamToBuffer(stream)
}
