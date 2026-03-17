'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useParams } from 'next/navigation'
import { isAdminUser } from '@/lib/admin'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface OrderItem {
  id: string
  product_id: string
  product_weight_kg: string
  quantity: number
  unit_price: number
  total_price: number
}

interface Order {
  id: string
  status: string
  total_amount: number
  created_at: string
  payment_reference: string
  payment_status: string
  admin_notes: string
  delivery_city: string
  order_items: OrderItem[]
}

interface Customer {
  id: string
  email: string
  full_name: string
  phone: string
  whatsapp_number: string
  preferred_delivery_city: string
  total_orders: number
  total_spent: number
  last_order_date: string
  created_at: string
}

interface Product {
  id: string
  name: string
  price: number
  sale_price: number | null
  weight_kg: number
  is_active?: boolean
}

interface SaleItem {
  product_id: string
  weight_kg: string
  quantity: number
  unit_price: number
}

const STATUS_CONFIG: Record<string, { label: string; badge: string }> = {
  pending:    { label: 'Pending',    badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  confirmed:  { label: 'Confirmed',  badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  processing: { label: 'Processing', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  shipped:    { label: 'Shipped',    badge: 'bg-purple-50 text-purple-700 border-purple-200' },
  delivered:  { label: 'Delivered',  badge: 'bg-green-50 text-green-700 border-green-200' },
  cancelled:  { label: 'Cancelled',  badge: 'bg-red-50 text-red-700 border-red-200' },
}

export default function CustomerDetailPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const customerId = params.id as string

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showSaleModal, setShowSaleModal] = useState(false)
  const [saleItems, setSaleItems] = useState<SaleItem[]>([{ product_id: '', weight_kg: '', quantity: 1, unit_price: 0 }])
  const [saleNotes, setSaleNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [custRes, prodRes] = await Promise.all([
        fetch(`/api/admin/customers/${customerId}`),
        fetch('/api/admin/products'),
      ])
      if (custRes.ok) {
        const d = await custRes.json()
        setCustomer(d.customer)
        setOrders(d.orders || [])
      } else {
        toast.error('Customer not found')
        router.push('/admin/customers')
      }
      if (prodRes.ok) {
        const d = await prodRes.json()
        setProducts((d.products || []).filter((p: Product) => p.is_active !== false))
      }
    } catch {
      toast.error('Failed to load customer data')
    } finally {
      setLoading(false)
    }
  }, [customerId, router])

  useEffect(() => {
    if (!authLoading && (!user || !isAdminUser(user.email))) {
      router.push('/admin/login')
      return
    }
    if (user && isAdminUser(user.email)) fetchData()
  }, [user, authLoading, router, fetchData])

  const totalSpent = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((s, o) => s + o.total_amount, 0)

  const inPersonCount = orders.filter(o => o.payment_reference?.startsWith('INPERSON-')).length

  const handleProductSelect = (index: number, productId: string) => {
    const product = products.find(p => p.id === productId)
    setSaleItems(prev => prev.map((item, i) =>
      i === index ? {
        ...item,
        product_id: productId,
        weight_kg: product ? `${product.weight_kg}KG` : '',
        unit_price: product ? (product.sale_price ?? product.price) : 0,
      } : item
    ))
  }

  const addItem = () => setSaleItems(prev => [...prev, { product_id: '', weight_kg: '', quantity: 1, unit_price: 0 }])
  const removeItem = (index: number) => setSaleItems(prev => prev.filter((_, i) => i !== index))

  const saleTotal = saleItems.reduce((s, i) => s + i.unit_price * i.quantity, 0)

  const handleSubmitSale = async () => {
    if (saleItems.some(i => !i.product_id)) {
      toast.error('Please select a product for each item')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/in-person-sale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customer?.id,
          customer_name: customer?.full_name,
          customer_email: customer?.email,
          customer_phone: customer?.phone || customer?.whatsapp_number,
          delivery_city: customer?.preferred_delivery_city,
          items: saleItems,
          total_amount: saleTotal,
          notes: saleNotes,
        }),
      })
      if (res.ok) {
        toast.success('In-person sale recorded!')
        setShowSaleModal(false)
        setSaleItems([{ product_id: '', weight_kg: '', quantity: 1, unit_price: 0 }])
        setSaleNotes('')
        fetchData()
      } else {
        const d = await res.json()
        toast.error(d.error || 'Failed to record sale')
      }
    } catch {
      toast.error('Error recording sale')
    } finally {
      setSubmitting(false)
    }
  }

  const fmt = (d: string) => new Date(d).toLocaleDateString('en-GH', { year: 'numeric', month: 'short', day: 'numeric' })
  const fmtCurrency = (n: number) => `GH₵${n.toFixed(2)}`

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-[var(--cream)] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!customer) return null

  return (
    <div className="min-h-screen bg-[var(--cream)] flex">

      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-[var(--charcoal)] text-white flex-shrink-0">
        <div className="px-6 py-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--gold)] to-[var(--gold-dark)] flex items-center justify-center text-lg">🌾</div>
            <div>
              <p className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)' }}>PureGrain Rice</p>
              <p className="text-[10px] text-white/50 uppercase tracking-widest">Admin Panel</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1">
          {[
            { label: 'Orders', icon: '📦', href: '/admin' },
            { label: 'Customers', icon: '👥', href: '/admin/customers', active: true },
            { label: 'Products', icon: '🌾', href: '/admin/products' },
            { label: 'Promotions', icon: '🎟️', href: '/admin/promotions' },
            { label: 'View Store', icon: '🏪', href: '/' },
          ].map(item => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                item.active ? 'bg-[var(--gold)]/20 text-[var(--gold)]' : 'text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span>{item.icon}</span>{item.label}
            </Link>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--gold)] to-[var(--gold-dark)] flex items-center justify-center text-xs font-bold text-[var(--charcoal)]">
              {user?.email?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{user?.email}</p>
              <p className="text-[10px] text-white/40">Administrator</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <header className="bg-white border-b border-[var(--cream-dark)] px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <Link href="/admin/customers" className="w-8 h-8 rounded-lg border border-[var(--cream-dark)] flex items-center justify-center text-[var(--charcoal-muted)] hover:bg-[var(--cream)] transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-lg font-bold text-[var(--charcoal)]" style={{ fontFamily: 'var(--font-display)' }}>
                {customer.full_name || customer.email}
              </h1>
              <p className="text-xs text-[var(--charcoal-muted)]">Customer since {fmt(customer.created_at)}</p>
            </div>
          </div>
          <button
            onClick={() => setShowSaleModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--gold)] text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-gold"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Record In-Person Sale
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Profile + Stats */}
          <div className="grid lg:grid-cols-3 gap-4">

            {/* Profile card */}
            <div className="bg-white rounded-2xl border border-[var(--cream-dark)] p-6 col-span-1">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[var(--gold)] to-[var(--gold-dark)] flex items-center justify-center text-2xl font-bold text-white">
                  {(customer.full_name || customer.email)?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-[var(--charcoal)] text-base">{customer.full_name || '—'}</p>
                  <p className="text-xs text-[var(--charcoal-muted)]">{customer.email}</p>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Phone', value: customer.phone || '—', icon: '📞' },
                  { label: 'WhatsApp', value: customer.whatsapp_number || '—', icon: '💬' },
                  { label: 'City', value: customer.preferred_delivery_city || '—', icon: '📍' },
                ].map(row => (
                  <div key={row.label} className="flex items-center gap-3 text-sm">
                    <span className="text-base">{row.icon}</span>
                    <span className="text-[var(--charcoal-muted)] w-20 flex-shrink-0">{row.label}</span>
                    <span className="text-[var(--charcoal)] font-medium">{row.value}</span>
                  </div>
                ))}
                {(customer.whatsapp_number || customer.phone) && (
                  <a
                    href={`https://wa.me/${(customer.whatsapp_number || customer.phone).replace(/\s/g, '').replace(/^\+/, '')}?text=${encodeURIComponent(`Hello ${customer.full_name || ''}! 👋 This is PureGrain Rice reaching out.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-[var(--forest)] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.097" />
                    </svg>
                    Message on WhatsApp
                  </a>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4 content-start">
              {[
                { label: 'Total Orders', value: orders.length, icon: '📦', color: 'from-[var(--gold)] to-[var(--gold-dark)]' },
                { label: 'Total Spent', value: fmtCurrency(totalSpent), icon: '💰', color: 'from-green-500 to-emerald-700' },
                { label: 'Delivered', value: orders.filter(o => o.status === 'delivered').length, icon: '✅', color: 'from-blue-500 to-blue-700' },
                { label: 'In-Person', value: inPersonCount, icon: '🤝', color: 'from-purple-500 to-purple-700' },
              ].map(stat => (
                <div key={stat.label} className="bg-white rounded-2xl border border-[var(--cream-dark)] p-4 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-lg flex-shrink-0`}>
                    {stat.icon}
                  </div>
                  <div>
                    <p className="text-base font-bold text-[var(--charcoal)]">{stat.value}</p>
                    <p className="text-xs text-[var(--charcoal-muted)]">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order History */}
          <div className="bg-white rounded-2xl border border-[var(--cream-dark)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--cream-dark)] flex items-center justify-between">
              <h2 className="font-bold text-[var(--charcoal)]" style={{ fontFamily: 'var(--font-display)' }}>Order History</h2>
              <span className="text-xs text-[var(--charcoal-muted)]">{orders.length} orders</span>
            </div>
            {orders.length === 0 ? (
              <div className="py-16 text-center">
                <div className="text-4xl mb-3">📭</div>
                <p className="text-sm text-[var(--charcoal-muted)]">No orders yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-[var(--cream-dark)] bg-[var(--off-white)]">
                      {['Order ID', 'Date', 'Items', 'Total', 'Type', 'Status'].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-[var(--charcoal-muted)] uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--cream-dark)]">
                    {orders.map(order => {
                      const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
                      const isInPerson = order.payment_reference?.startsWith('INPERSON-')
                      return (
                        <tr key={order.id} className="hover:bg-[var(--cream)] transition-colors">
                          <td className="px-5 py-3 text-sm font-mono text-[var(--charcoal)]">
                            #{order.id.slice(-8).toUpperCase()}
                          </td>
                          <td className="px-5 py-3 text-sm text-[var(--charcoal-muted)]">
                            {fmt(order.created_at)}
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex flex-wrap gap-1">
                              {(order.order_items || []).map(item => (
                                <span key={item.id} className="text-xs bg-[var(--cream)] rounded px-2 py-0.5 text-[var(--charcoal-muted)]">
                                  🌾 {item.product_weight_kg || item.product_id?.split('-').pop()?.toUpperCase()} ×{item.quantity}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-5 py-3 text-sm font-bold text-[var(--charcoal)]">
                            {fmtCurrency(order.total_amount)}
                          </td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                              isInPerson ? 'bg-purple-50 text-purple-700' : 'bg-[var(--cream-dark)] text-[var(--charcoal-muted)]'
                            }`}>
                              {isInPerson ? '🤝 In-Person' : '🌐 Online'}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.badge}`}>
                              {cfg.label}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* In-Person Sale Modal */}
      {showSaleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-5 border-b border-[var(--cream-dark)] flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
              <div>
                <h2 className="font-bold text-[var(--charcoal)]" style={{ fontFamily: 'var(--font-display)' }}>Record In-Person Sale</h2>
                <p className="text-xs text-[var(--charcoal-muted)] mt-0.5">For {customer.full_name || customer.email}</p>
              </div>
              <button onClick={() => setShowSaleModal(false)} className="w-8 h-8 rounded-full hover:bg-[var(--cream)] flex items-center justify-center text-[var(--charcoal-muted)] transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-semibold text-[var(--charcoal)]">Items Sold</label>
                  <button onClick={addItem} className="text-xs text-[var(--gold-dark)] font-semibold hover:text-[var(--gold)] transition-colors">
                    + Add Item
                  </button>
                </div>
                <div className="space-y-3">
                  {saleItems.map((item, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <select
                        value={item.product_id}
                        onChange={e => handleProductSelect(index, e.target.value)}
                        className="flex-1 px-3 py-2 text-sm rounded-xl border border-[var(--cream-dark)] bg-[var(--cream)] text-[var(--charcoal)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/30 focus:border-[var(--gold)]"
                      >
                        <option value="">Select product…</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} {p.weight_kg}KG — GH₵{p.sale_price ?? p.price}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={e => setSaleItems(prev => prev.map((it, i) => i === index ? { ...it, quantity: Number(e.target.value) } : it))}
                        className="w-16 px-3 py-2 text-sm rounded-xl border border-[var(--cream-dark)] bg-[var(--cream)] text-[var(--charcoal)] text-center focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/30 focus:border-[var(--gold)]"
                        placeholder="Qty"
                      />
                      <span className="text-sm font-semibold text-[var(--charcoal)] w-20 text-right flex-shrink-0">
                        GH₵{(item.unit_price * item.quantity).toFixed(2)}
                      </span>
                      {saleItems.length > 1 && (
                        <button onClick={() => removeItem(index)} className="w-7 h-7 rounded-full hover:bg-red-50 flex items-center justify-center text-red-400 flex-shrink-0 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="bg-[var(--cream)] rounded-xl px-4 py-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-[var(--charcoal)]">Total Amount</span>
                <span className="text-xl font-bold text-[var(--gold-dark)]" style={{ fontFamily: 'var(--font-display)' }}>
                  GH₵{saleTotal.toFixed(2)}
                </span>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-[var(--charcoal)] mb-2">Notes (optional)</label>
                <textarea
                  value={saleNotes}
                  onChange={e => setSaleNotes(e.target.value)}
                  placeholder="e.g. Cash paid, walk-in at Taifa branch…"
                  rows={2}
                  className="w-full px-4 py-3 text-sm rounded-xl border border-[var(--cream-dark)] bg-[var(--cream)] text-[var(--charcoal)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/30 focus:border-[var(--gold)] resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setShowSaleModal(false)}
                  className="flex-1 py-3 rounded-xl border border-[var(--cream-dark)] text-sm font-semibold text-[var(--charcoal-muted)] hover:bg-[var(--cream)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitSale}
                  disabled={submitting || saleTotal === 0}
                  className="flex-1 py-3 rounded-xl bg-[var(--gold)] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity shadow-gold"
                >
                  {submitting ? 'Recording…' : `Record Sale · GH₵${saleTotal.toFixed(2)}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
