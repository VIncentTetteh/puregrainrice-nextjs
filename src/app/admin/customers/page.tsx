'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { isAdminUser } from '@/lib/admin'
import toast from 'react-hot-toast'

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
  orderCount: number
  completedOrderCount: number
  pendingOrderCount: number
  averageOrderValue: number
}

export default function CustomersPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'orders' | 'spent' | 'recent'>('recent')

  useEffect(() => {
    if (!authLoading && (!user || !isAdminUser(user.email))) {
      router.push('/admin/login')
      return
    }
    if (user && isAdminUser(user.email)) {
      fetchCustomers()
    }
  }, [user, authLoading, router])

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/admin/customers')
      const data = await response.json()
      if (response.ok) {
        setCustomers(data.customers || [])
      } else {
        toast.error('Failed to fetch customers')
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
      toast.error('Error fetching customers')
    } finally {
      setLoading(false)
    }
  }

  const openWhatsApp = (customer: Customer) => {
    const phoneNumber = customer.whatsapp_number || customer.phone
    if (!phoneNumber) {
      toast.error('No WhatsApp number available for this customer')
      return
    }
    const cleanNumber = phoneNumber.replace(/\s/g, '')
    const formattedNumber = cleanNumber.startsWith('+') ? cleanNumber.slice(1) : cleanNumber
    const message = encodeURIComponent(
      `Hello ${customer.full_name || customer.email.split('@')[0]}! 👋\n\nThis is PureGrain Rice reaching out to you. How can we assist you today?`
    )
    window.open(`https://wa.me/${formattedNumber}?text=${message}`, '_blank')
  }

  const filteredCustomers = customers
    .filter(customer =>
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.includes(searchTerm)
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name': return (a.full_name || a.email).localeCompare(b.full_name || b.email)
        case 'orders': return b.total_orders - a.total_orders
        case 'spent': return b.total_spent - a.total_spent
        case 'recent':
        default:
          return new Date(b.last_order_date || b.created_at).getTime() -
                 new Date(a.last_order_date || a.created_at).getTime()
      }
    })

  const formatCurrency = (amount: number) => `GH₵${amount.toFixed(2)}`

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--cream)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-2 border-[var(--gold)] border-t-transparent animate-spin mx-auto" />
          <p className="mt-4 text-sm text-[var(--charcoal-muted)]">Loading customers…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--cream)] flex">

      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-[var(--charcoal)] text-white flex-shrink-0">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--gold)] to-[var(--gold-dark)] flex items-center justify-center text-lg">
              🌾
            </div>
            <div>
              <p className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)' }}>PureGrain Rice</p>
              <p className="text-[10px] text-white/50 uppercase tracking-widest">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          <button
            onClick={() => router.push('/admin')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/60 hover:bg-white/10 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Orders
          </button>
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm bg-[var(--gold)]/20 text-[var(--gold)]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Customers
          </div>
          <button
            onClick={() => router.push('/')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/60 hover:bg-white/10 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            View Store
          </button>
        </nav>

        {/* Admin info */}
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

        {/* Top bar */}
        <header className="bg-white border-b border-[var(--cream-dark)] px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/admin')}
              className="lg:hidden w-8 h-8 rounded-lg border border-[var(--cream-dark)] flex items-center justify-center text-[var(--charcoal-muted)] hover:bg-[var(--cream)] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-lg font-bold text-[var(--charcoal)]" style={{ fontFamily: 'var(--font-display)' }}>
                Customer Management
              </h1>
              <p className="text-xs text-[var(--charcoal-muted)]">{customers.length} registered customers</p>
            </div>
          </div>
          <button
            onClick={fetchCustomers}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[var(--cream-dark)] text-sm text-[var(--charcoal-muted)] hover:bg-[var(--cream)] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Customers', value: customers.length, icon: '👥', color: 'from-[var(--gold)] to-[var(--gold-dark)]' },
              { label: 'Active Customers', value: customers.filter(c => c.total_orders > 0).length, icon: '✅', color: 'from-[var(--forest)] to-emerald-700' },
              { label: 'Total Revenue', value: formatCurrency(customers.reduce((s, c) => s + c.total_spent, 0)), icon: '💰', color: 'from-blue-500 to-blue-700' },
              { label: 'Total Orders', value: customers.reduce((s, c) => s + c.total_orders, 0), icon: '📦', color: 'from-purple-500 to-purple-700' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-2xl border border-[var(--cream-dark)] p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-lg flex-shrink-0`}>
                  {stat.icon}
                </div>
                <div>
                  <p className="text-lg font-bold text-[var(--charcoal)]">{stat.value}</p>
                  <p className="text-xs text-[var(--charcoal-muted)]">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Search & Sort */}
          <div className="bg-white rounded-2xl border border-[var(--cream-dark)] p-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--charcoal-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by name, email or phone…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-[var(--cream-dark)] bg-[var(--cream)] text-[var(--charcoal)] placeholder:text-[var(--charcoal-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/30 focus:border-[var(--gold)]"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'orders' | 'spent' | 'recent')}
              className="px-4 py-2.5 text-sm rounded-xl border border-[var(--cream-dark)] bg-[var(--cream)] text-[var(--charcoal)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/30 focus:border-[var(--gold)]"
            >
              <option value="recent">Recent Activity</option>
              <option value="name">Name A–Z</option>
              <option value="orders">Most Orders</option>
              <option value="spent">Highest Spent</option>
            </select>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-[var(--cream-dark)] overflow-hidden">
            {filteredCustomers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-full bg-[var(--cream)] flex items-center justify-center text-3xl mb-4">👥</div>
                <h3 className="font-bold text-[var(--charcoal)] mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                  No customers found
                </h3>
                <p className="text-sm text-[var(--charcoal-muted)]">Try adjusting your search.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-[var(--cream-dark)] bg-[var(--off-white)]">
                      {['Customer', 'Contact', 'Orders', 'Total Spent', 'Last Order', 'Actions'].map((h) => (
                        <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-[var(--charcoal-muted)] uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--cream-dark)]">
                    {filteredCustomers.map((customer) => (
                      <tr key={customer.id} className="hover:bg-[var(--cream)] transition-colors group">

                        {/* Customer */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--gold)] to-[var(--gold-dark)] flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                              {(customer.full_name || customer.email)?.[0]?.toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-[var(--charcoal)]">
                                {customer.full_name || customer.email.split('@')[0]}
                              </p>
                              <p className="text-xs text-[var(--charcoal-muted)]">{customer.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <p className="text-sm text-[var(--charcoal)]">{customer.phone || '—'}</p>
                          {customer.whatsapp_number && (
                            <p className="text-xs text-[var(--forest)] font-medium">WA: {customer.whatsapp_number}</p>
                          )}
                          {customer.preferred_delivery_city && (
                            <p className="text-xs text-[var(--charcoal-muted)]">📍 {customer.preferred_delivery_city}</p>
                          )}
                        </td>

                        {/* Orders */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--gold-muted)] text-[var(--gold-dark)]">
                            {customer.total_orders} orders
                          </span>
                          <div className="flex gap-2 mt-1">
                            <span className="text-[10px] text-[var(--forest)] font-medium">{customer.completedOrderCount} done</span>
                            {customer.pendingOrderCount > 0 && (
                              <span className="text-[10px] text-amber-600 font-medium">{customer.pendingOrderCount} pending</span>
                            )}
                          </div>
                        </td>

                        {/* Spent */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <p className="text-sm font-bold text-[var(--charcoal)]">{formatCurrency(customer.total_spent)}</p>
                          <p className="text-xs text-[var(--charcoal-muted)]">avg {formatCurrency(customer.averageOrderValue)}</p>
                        </td>

                        {/* Last order */}
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-[var(--charcoal-muted)]">
                          {customer.last_order_date ? formatDate(customer.last_order_date) : '—'}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {(customer.whatsapp_number || customer.phone) && (
                              <button
                                onClick={() => openWhatsApp(customer)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--forest)] text-white hover:opacity-90 transition-opacity"
                              >
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.097" />
                                </svg>
                                WhatsApp
                              </button>
                            )}
                            <button
                              onClick={() => router.push(`/admin/customers/${customer.id}`)}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[var(--cream-dark)] text-[var(--charcoal-muted)] hover:border-[var(--gold)] hover:text-[var(--gold-dark)] transition-colors"
                            >
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
