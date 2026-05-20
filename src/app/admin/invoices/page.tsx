'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { isAdminUser } from '@/lib/admin'
import { useAuth } from '@/contexts/AuthContext'

interface InvoiceItem {
  id?: string
  product_name: string
  description: string | null
  unit_price: number
  quantity: number
  line_total: number
}

interface Invoice {
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
  emailed_at: string | null
  created_at: string
  invoice_items: InvoiceItem[]
}

interface InvoiceFormItem {
  product_name: string
  description: string
  unit_price: string
  quantity: string
}

interface InvoiceForm {
  customer_name: string
  customer_email: string
  customer_phone: string
  customer_company: string
  items: InvoiceFormItem[]
}

const emptyItem: InvoiceFormItem = {
  product_name: '',
  description: '',
  unit_price: '',
  quantity: '1',
}

const emptyForm: InvoiceForm = {
  customer_name: '',
  customer_email: '',
  customer_phone: '',
  customer_company: '',
  items: [{ ...emptyItem }],
}

const navItems = [
  { label: 'Orders', icon: '📦', href: '/admin' },
  { label: 'Invoices', icon: '🧾', href: '/admin/invoices' },
  { label: 'Operations', icon: '🏭', href: '/admin/operations' },
  { label: 'Customers', icon: '👥', href: '/admin/customers' },
  { label: 'Products', icon: '🌾', href: '/admin/products' },
  { label: 'Promotions', icon: '🎟️', href: '/admin/promotions' },
  { label: 'View Store', icon: '🏪', href: '/' },
]

export default function AdminInvoicesPage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null)
  const [form, setForm] = useState<InvoiceForm>(emptyForm)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [emailingId, setEmailingId] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && (!user || !isAdminUser(user.email))) {
      router.push('/admin/login')
      return
    }
    if (user && isAdminUser(user.email)) fetchInvoices()
  }, [user, authLoading, router])

  const fetchInvoices = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/invoices')
      const data = await res.json()
      if (res.ok) setInvoices(data.invoices || [])
      else toast.error(data.error || 'Failed to load invoices')
    } catch {
      toast.error('Error loading invoices')
    } finally {
      setLoading(false)
    }
  }

  const formTotal = useMemo(
    () => form.items.reduce((sum, item) => {
      const price = Number(item.unit_price) || 0
      const qty = Number(item.quantity) || 0
      return sum + price * qty
    }, 0),
    [form.items],
  )

  const stats = useMemo(() => ({
    count: invoices.length,
    total: invoices.reduce((sum, invoice) => sum + Number(invoice.total || 0), 0),
    emailed: invoices.filter(invoice => invoice.emailed_at).length,
  }), [invoices])

  const filteredInvoices = invoices.filter(invoice => {
    const q = search.toLowerCase()
    if (!q) return true
    return (
      invoice.invoice_number.toLowerCase().includes(q) ||
      invoice.customer_name.toLowerCase().includes(q) ||
      invoice.customer_phone.toLowerCase().includes(q) ||
      invoice.customer_email?.toLowerCase().includes(q) ||
      invoice.customer_company?.toLowerCase().includes(q)
    )
  })

  const openCreate = () => {
    setEditInvoice(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  const openEdit = (invoice: Invoice) => {
    setEditInvoice(invoice)
    setForm({
      customer_name: invoice.customer_name,
      customer_email: invoice.customer_email || '',
      customer_phone: invoice.customer_phone,
      customer_company: invoice.customer_company || '',
      items: invoice.invoice_items.map(item => ({
        product_name: item.product_name,
        description: item.description || '',
        unit_price: String(item.unit_price),
        quantity: String(item.quantity),
      })),
    })
    setShowForm(true)
  }

  const updateItem = (index: number, updates: Partial<InvoiceFormItem>) => {
    setForm(prev => ({
      ...prev,
      items: prev.items.map((item, i) => i === index ? { ...item, ...updates } : item),
    }))
  }

  const addItem = () => {
    setForm(prev => ({ ...prev, items: [...prev.items, { ...emptyItem }] }))
  }

  const removeItem = (index: number) => {
    setForm(prev => ({
      ...prev,
      items: prev.items.length === 1 ? prev.items : prev.items.filter((_, i) => i !== index),
    }))
  }

  const handleSave = async () => {
    if (!form.customer_name.trim()) { toast.error('Customer name is required'); return }
    if (!form.customer_phone.trim()) { toast.error('Customer phone is required'); return }
    if (form.items.some(item => !item.product_name.trim())) { toast.error('Product name is required for every item'); return }
    if (form.items.some(item => Number(item.unit_price) <= 0 || Number(item.quantity) <= 0)) {
      toast.error('Each item needs a valid price and quantity')
      return
    }

    setSaving(true)
    try {
      const method = editInvoice ? 'PATCH' : 'POST'
      const res = await fetch('/api/admin/invoices', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(editInvoice ? { id: editInvoice.id } : {}),
          ...form,
          items: form.items.map(item => ({
            product_name: item.product_name,
            description: item.description,
            unit_price: Number(item.unit_price),
            quantity: Number(item.quantity),
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to save invoice')
        return
      }
      toast.success(editInvoice ? 'Invoice updated' : 'Invoice generated')
      setShowForm(false)
      setEditInvoice(null)
      setForm(emptyForm)
      fetchInvoices()
    } catch {
      toast.error('Error saving invoice')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (invoiceId: string) => {
    try {
      const res = await fetch(`/api/admin/invoices?id=${invoiceId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to delete invoice')
        return
      }
      toast.success('Invoice deleted')
      setInvoices(prev => prev.filter(invoice => invoice.id !== invoiceId))
      setDeleteConfirm(null)
    } catch {
      toast.error('Error deleting invoice')
    }
  }

  const handleEmail = async (invoice: Invoice) => {
    setEmailingId(invoice.id)
    try {
      const res = await fetch(`/api/admin/invoices/${invoice.id}/email`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to email invoice')
        return
      }
      toast.success('Invoice emailed')
      setInvoices(prev => prev.map(item => item.id === invoice.id ? data.invoice : item))
    } catch {
      toast.error('Error emailing invoice')
    } finally {
      setEmailingId(null)
    }
  }

  const invoicePdfUrl = (invoice: Invoice) => `/api/invoices/${invoice.public_token}/pdf`

  const whatsappUrl = (invoice: Invoice) => {
    const clean = invoice.customer_phone.replace(/[^0-9+]/g, '').replace(/^\+/, '')
    const absoluteUrl = `${window.location.origin}${invoicePdfUrl(invoice)}`
    const message = encodeURIComponent(
      `Hello ${invoice.customer_name}, here is your PurePlatter Foods invoice ${invoice.invoice_number}: ${absoluteUrl}`,
    )
    return `https://wa.me/${clean}?text=${message}`
  }

  const fmtCurrency = (amount: number) =>
    `GH₵${Number(amount || 0).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const fmtDate = (date: string) =>
    new Date(date).toLocaleDateString('en-GH', { year: 'numeric', month: 'short', day: 'numeric' })

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-[var(--off-white)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-[3px] border-[var(--gold-muted)] border-t-[var(--gold)] rounded-full mx-auto" style={{ animation: 'spin 0.8s linear infinite' }} />
          <p className="mt-4 text-sm text-[var(--charcoal-muted)]">Loading invoices...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--off-white)] flex">
      <aside className="w-64 min-h-screen bg-[var(--charcoal)] flex-col hidden lg:flex">
        <div className="px-6 py-5 border-b border-white/08">
          <div className="flex items-center gap-3">
            <div className="bg-[var(--gold-muted)] rounded-xl p-1.5">
              <Image src="/IMG_4866.png" alt="Logo" width={32} height={32} className="w-8 h-8 object-contain" />
            </div>
            <div>
              <p className="text-white text-sm font-bold leading-tight" style={{ fontFamily: 'var(--font-display)' }}>PurePlatter</p>
              <p className="text-[var(--gold)] text-xs">Admin Panel</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map(item => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                item.href === '/admin/invoices'
                  ? 'bg-[var(--gold)] text-white shadow-gold'
                  : 'text-white/50 hover:text-white hover:bg-white/08'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="px-4 pb-6 border-t border-white/08 pt-4">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/05 mb-3">
            <div className="w-8 h-8 rounded-full bg-[var(--gold)] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {user?.email?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">{user?.email}</p>
              <p className="text-white/40 text-xs">Administrator</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/08 transition-all"
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-[var(--cream-dark)] px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[var(--charcoal)]" style={{ fontFamily: 'var(--font-display)' }}>Invoices</h1>
            <p className="text-xs text-[var(--charcoal-muted)] mt-0.5">Generate, edit, email, and share customer invoices</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin" className="lg:hidden btn-ghost !text-xs !py-2 !px-3">Orders</Link>
            <button onClick={fetchInvoices} className="btn-ghost !text-sm !py-2 !px-3 border border-[var(--cream-dark)]">
              Refresh
            </button>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--gold)] text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-gold"
            >
              <span>+</span>
              Generate Invoice
            </button>
          </div>
        </header>

        <div className="flex-1 p-6 space-y-6 overflow-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Total Invoices', value: stats.count, icon: '🧾' },
              { label: 'Invoice Value', value: fmtCurrency(stats.total), icon: '💰' },
              { label: 'Emailed', value: stats.emailed, icon: '✉️' },
            ].map(stat => (
              <div key={stat.label} className="card p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-2xl">{stat.icon}</span>
                  <span className="text-2xl font-bold text-[var(--charcoal)]" style={{ fontFamily: 'var(--font-display)' }}>{stat.value}</span>
                </div>
                <p className="text-xs text-[var(--charcoal-muted)] uppercase tracking-wider font-medium">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="card p-4">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--charcoal-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search invoice, customer, phone, email..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[var(--cream-dark)] text-sm text-[var(--charcoal)] bg-[var(--off-white)] focus:ring-2 focus:ring-[var(--gold-muted)] focus:border-[var(--gold)] outline-none transition-all"
              />
            </div>
          </div>

          {filteredInvoices.length === 0 ? (
            <div className="card p-16 text-center">
              <span className="text-5xl block mb-4">🧾</span>
              <h3 className="text-lg font-bold text-[var(--charcoal)] mb-2" style={{ fontFamily: 'var(--font-display)' }}>No invoices found</h3>
              <p className="text-sm text-[var(--charcoal-muted)] mb-6">Generate the first customer invoice from here.</p>
              <button onClick={openCreate} className="btn-primary">Generate Invoice</button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[var(--cream-dark)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[960px]">
                  <thead>
                    <tr className="border-b border-[var(--cream-dark)] bg-[var(--off-white)]">
                      {['Invoice', 'Customer', 'Items', 'Total', 'Status', 'Actions'].map(header => (
                        <th key={header} className="px-5 py-3.5 text-left text-xs font-semibold text-[var(--charcoal-muted)] uppercase tracking-wider">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--cream-dark)]">
                    {filteredInvoices.map(invoice => (
                      <tr key={invoice.id} className="hover:bg-[var(--cream)] transition-colors">
                        <td className="px-5 py-4">
                          <p className="text-sm font-bold text-[var(--charcoal)]">{invoice.invoice_number}</p>
                          <p className="text-xs text-[var(--charcoal-muted)]">{fmtDate(invoice.issue_date)}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-[var(--charcoal)]">{invoice.customer_name}</p>
                          {invoice.customer_company && <p className="text-xs text-[var(--charcoal-muted)]">{invoice.customer_company}</p>}
                          <p className="text-xs text-[var(--charcoal-muted)]">{invoice.customer_phone}{invoice.customer_email ? ` · ${invoice.customer_email}` : ''}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm text-[var(--charcoal)]">{invoice.invoice_items.length} item{invoice.invoice_items.length !== 1 ? 's' : ''}</p>
                          <p className="text-xs text-[var(--charcoal-muted)] truncate max-w-[220px]">{invoice.invoice_items.map(item => item.product_name).join(', ')}</p>
                        </td>
                        <td className="px-5 py-4 text-sm font-bold text-[var(--charcoal)]">{fmtCurrency(invoice.total)}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                            invoice.emailed_at
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {invoice.emailed_at ? 'Emailed' : 'Generated'}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <a href={invoicePdfUrl(invoice)} target="_blank" rel="noreferrer" className="btn-ghost !text-xs !py-1.5 !px-3 border border-[var(--cream-dark)]">PDF</a>
                            <a href={whatsappUrl(invoice)} target="_blank" rel="noreferrer" className="btn-ghost !text-xs !py-1.5 !px-3 border border-green-200 !text-green-700">WhatsApp</a>
                            {invoice.customer_email && (
                              <button
                                onClick={() => handleEmail(invoice)}
                                disabled={emailingId === invoice.id}
                                className="btn-ghost !text-xs !py-1.5 !px-3 border border-blue-200 !text-blue-700 disabled:opacity-50"
                              >
                                {emailingId === invoice.id ? 'Sending...' : 'Email'}
                              </button>
                            )}
                            <button onClick={() => openEdit(invoice)} className="btn-ghost !text-xs !py-1.5 !px-3 border border-[var(--cream-dark)]">Edit</button>
                            {deleteConfirm === invoice.id ? (
                              <button onClick={() => handleDelete(invoice.id)} className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold">Confirm</button>
                            ) : (
                              <button onClick={() => setDeleteConfirm(invoice.id)} className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50">Delete</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto">
            <div className="px-6 py-5 border-b border-[var(--cream-dark)] flex items-center justify-between sticky top-0 bg-white rounded-t-2xl z-10">
              <div>
                <h2 className="font-bold text-[var(--charcoal)]" style={{ fontFamily: 'var(--font-display)' }}>
                  {editInvoice ? `Edit ${editInvoice.invoice_number}` : 'Generate Invoice'}
                </h2>
                <p className="text-xs text-[var(--charcoal-muted)] mt-0.5">Totals are recalculated on the server when saved.</p>
              </div>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-full hover:bg-[var(--cream)] flex items-center justify-center text-[var(--charcoal-muted)] transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block">
                  <span className="block text-sm font-semibold text-[var(--charcoal)] mb-2">Customer name</span>
                  <input value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} className="w-full px-4 py-2.5 text-sm rounded-xl border border-[var(--cream-dark)] bg-[var(--cream)] text-[var(--charcoal)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/30 focus:border-[var(--gold)]" />
                </label>
                <label className="block">
                  <span className="block text-sm font-semibold text-[var(--charcoal)] mb-2">Phone number</span>
                  <input value={form.customer_phone} onChange={e => setForm(f => ({ ...f, customer_phone: e.target.value }))} className="w-full px-4 py-2.5 text-sm rounded-xl border border-[var(--cream-dark)] bg-[var(--cream)] text-[var(--charcoal)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/30 focus:border-[var(--gold)]" />
                </label>
                <label className="block">
                  <span className="block text-sm font-semibold text-[var(--charcoal)] mb-2">Email optional</span>
                  <input type="email" value={form.customer_email} onChange={e => setForm(f => ({ ...f, customer_email: e.target.value }))} className="w-full px-4 py-2.5 text-sm rounded-xl border border-[var(--cream-dark)] bg-[var(--cream)] text-[var(--charcoal)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/30 focus:border-[var(--gold)]" />
                </label>
                <label className="block">
                  <span className="block text-sm font-semibold text-[var(--charcoal)] mb-2">Company optional</span>
                  <input value={form.customer_company} onChange={e => setForm(f => ({ ...f, customer_company: e.target.value }))} className="w-full px-4 py-2.5 text-sm rounded-xl border border-[var(--cream-dark)] bg-[var(--cream)] text-[var(--charcoal)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/30 focus:border-[var(--gold)]" />
                </label>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-[var(--charcoal)]">Products</h3>
                  <button onClick={addItem} className="text-xs text-[var(--gold-dark)] font-semibold hover:text-[var(--gold)] transition-colors">+ Add product</button>
                </div>
                <div className="space-y-3">
                  {form.items.map((item, index) => {
                    const lineTotal = (Number(item.unit_price) || 0) * (Number(item.quantity) || 0)
                    return (
                      <div key={index} className="grid grid-cols-1 lg:grid-cols-[1.3fr_1.6fr_120px_90px_120px_32px] gap-2 items-start p-3 rounded-2xl border border-[var(--cream-dark)] bg-[var(--off-white)]">
                        <input placeholder="Product name" value={item.product_name} onChange={e => updateItem(index, { product_name: e.target.value })} className="px-3 py-2 text-sm rounded-xl border border-[var(--cream-dark)] bg-white text-[var(--charcoal)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/30 focus:border-[var(--gold)]" />
                        <input placeholder="Description optional" value={item.description} onChange={e => updateItem(index, { description: e.target.value })} className="px-3 py-2 text-sm rounded-xl border border-[var(--cream-dark)] bg-white text-[var(--charcoal)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/30 focus:border-[var(--gold)]" />
                        <input type="number" min="0" step="0.01" placeholder="Unit price" value={item.unit_price} onChange={e => updateItem(index, { unit_price: e.target.value })} className="px-3 py-2 text-sm rounded-xl border border-[var(--cream-dark)] bg-white text-[var(--charcoal)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/30 focus:border-[var(--gold)]" />
                        <input type="number" min="1" step="1" placeholder="Qty" value={item.quantity} onChange={e => updateItem(index, { quantity: e.target.value })} className="px-3 py-2 text-sm rounded-xl border border-[var(--cream-dark)] bg-white text-[var(--charcoal)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/30 focus:border-[var(--gold)]" />
                        <div className="px-3 py-2 text-sm font-bold text-right text-[var(--charcoal)]">{fmtCurrency(lineTotal)}</div>
                        <button onClick={() => removeItem(index)} className="w-8 h-8 rounded-full hover:bg-red-50 flex items-center justify-center text-red-500" aria-label="Remove item">
                          ×
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="bg-[var(--charcoal)] rounded-2xl px-5 py-4 flex items-center justify-between text-white">
                <span className="text-sm font-semibold">Invoice Total</span>
                <span className="text-2xl font-bold text-[var(--gold)]" style={{ fontFamily: 'var(--font-display)' }}>{fmtCurrency(formTotal)}</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <button onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl border border-[var(--cream-dark)] text-sm font-semibold text-[var(--charcoal-muted)] hover:bg-[var(--cream)] transition-colors">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving} className="flex-1 py-3 rounded-xl bg-[var(--gold)] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity shadow-gold">
                  {saving ? 'Saving...' : editInvoice ? 'Update Invoice' : 'Save Invoice'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
