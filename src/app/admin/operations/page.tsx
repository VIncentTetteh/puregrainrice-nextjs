'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { isAdminUser } from '@/lib/admin'
import { useAuth } from '@/contexts/AuthContext'

type Status = 'planned' | 'active' | 'closed'
type ExpenseCategory = 'milling' | 'labour' | 'transportation' | 'other'

interface Farmer { id: string; full_name: string; phone: string | null; location: string | null; notes: string | null }
interface Season { id: string; name: string; start_date: string | null; end_date: string | null; status: Status }
interface Warehouse { id: string; name: string; location: string | null }
interface Loan { id: string; account_id: string; loan_date: string; amount: number; notes: string | null; reference_number?: string | null; document_url?: string | null; voided_at?: string | null }
interface Repayment { id: string; account_id: string; warehouse_id: string; repayment_date: string; bags: number; price_per_bag: number; total_amount: number; reference_number?: string | null; document_url?: string | null; voided_at?: string | null }
interface AccountSummary { loanTotal: number; repaymentTotal: number; balance: number; status: 'settled' | 'outstanding' }
interface Account {
  id: string
  farmer_id: string
  season_id: string
  farmer: Farmer | null
  season: Season | null
  loans: Loan[]
  repayments: Repayment[]
  summary: AccountSummary
}
interface WarehouseBalance {
  warehouse_id: string
  season_id: string
  paddyBags: number
  milledBags: number
  totalBags: number
}
interface SeasonReport {
  season: Season
  summary: {
    totalInvested: number
    repaymentValue: number
    repaymentBags: number
    paddyBagsReceived: number
    paddyBagsMilled: number
    milledBagsProduced: number
    milledBagsDispatched: number
    expensesTotal: number
    linkedRevenueTotal: number
    manualRevenueTotal: number
    revenueTotal: number
    profit: number
    warehouseBalances: WarehouseBalance[]
  }
}
interface OperationsData {
  farmers: Farmer[]
  seasons: Season[]
  warehouses: Warehouse[]
  accounts: Account[]
  loans: Loan[]
  repayments: Repayment[]
  millingBatches: Array<Record<string, unknown>>
  expenses: Array<Record<string, unknown>>
  dispatches: Array<Record<string, unknown>>
  stockMovements: Array<Record<string, unknown>>
  documents: Array<Record<string, unknown>>
  auditEvents: Array<Record<string, unknown>>
  warehouseBalances: WarehouseBalance[]
  seasonReports: SeasonReport[]
}

const today = () => new Date().toISOString().slice(0, 10)
const blankData: OperationsData = {
  farmers: [],
  seasons: [],
  warehouses: [],
  accounts: [],
  loans: [],
  repayments: [],
  millingBatches: [],
  expenses: [],
  dispatches: [],
  stockMovements: [],
  documents: [],
  auditEvents: [],
  warehouseBalances: [],
  seasonReports: [],
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

export default function AdminOperationsPage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const [data, setData] = useState<OperationsData>(blankData)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [selectedSeasonId, setSelectedSeasonId] = useState('')

  const [farmerForm, setFarmerForm] = useState({ full_name: '', phone: '', location: '', notes: '' })
  const [seasonForm, setSeasonForm] = useState({ name: '', start_date: '', end_date: '', status: 'active' as Status, notes: '' })
  const [warehouseForm, setWarehouseForm] = useState({ name: '', location: '', notes: '' })
  const [accountForm, setAccountForm] = useState({ farmer_id: '', season_id: '' })
  const [loanForm, setLoanForm] = useState({ account_id: '', loan_date: today(), amount: '', notes: '', reference_number: '', document_url: '' })
  const [repaymentForm, setRepaymentForm] = useState({ account_id: '', warehouse_id: '', repayment_date: today(), bags: '', price_per_bag: '', notes: '', reference_number: '', document_url: '' })
  const [millingForm, setMillingForm] = useState({ season_id: '', source_warehouse_id: '', destination_warehouse_id: '', milling_date: today(), paddy_bags: '', milled_bags: '', notes: '', reference_number: '', document_url: '' })
  const [expenseForm, setExpenseForm] = useState({ season_id: '', expense_date: today(), category: 'milling' as ExpenseCategory, description: '', amount: '', reference_number: '', document_url: '' })
  const [dispatchForm, setDispatchForm] = useState({ season_id: '', warehouse_id: '', dispatch_date: today(), bags: '', sale_amount: '', recipient: '', notes: '', reference_number: '', document_url: '' })

  useEffect(() => {
    if (!authLoading && (!user || !isAdminUser(user.email))) {
      router.push('/admin/login')
      return
    }
    if (user && isAdminUser(user.email)) fetchOperations()
  }, [user, authLoading, router])

  const activeSeasonId = selectedSeasonId || data.seasons[0]?.id || ''
  const activeSeasonReport = data.seasonReports.find(report => report.season.id === activeSeasonId)
  const activeAccounts = data.accounts.filter(account => !activeSeasonId || account.season_id === activeSeasonId)
  const activeWarehouseBalances = data.warehouseBalances.filter(balance => !activeSeasonId || balance.season_id === activeSeasonId)

  useEffect(() => {
    if (!selectedSeasonId && data.seasons[0]?.id) {
      setSelectedSeasonId(data.seasons[0].id)
    }
  }, [data.seasons, selectedSeasonId])

  const farmerName = (id: string) => data.farmers.find(farmer => farmer.id === id)?.full_name || 'Unknown farmer'
  const seasonName = (id: string) => data.seasons.find(season => season.id === id)?.name || 'Unknown season'
  const warehouseName = (id: string) => data.warehouses.find(warehouse => warehouse.id === id)?.name || 'Unknown warehouse'

  const fmtMoney = (amount: number) =>
    `GHS ${Number(amount || 0).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const fmtBags = (bags: number) =>
    `${Number(bags || 0).toLocaleString('en-GH', { maximumFractionDigits: 2 })} bags`

  const totals = useMemo(() => {
    const summary = activeSeasonReport?.summary
    return {
      invested: summary?.totalInvested || 0,
      received: summary?.paddyBagsReceived || 0,
      milled: summary?.milledBagsProduced || 0,
      expenses: summary?.expensesTotal || 0,
      linkedRevenue: summary?.linkedRevenueTotal || 0,
      manualRevenue: summary?.manualRevenueTotal || 0,
      revenue: summary?.revenueTotal || 0,
      profit: summary?.profit || 0,
    }
  }, [activeSeasonReport])

  const stockAvailable = (warehouseId: string, seasonId: string, stockType: 'paddy' | 'milled') => {
    const balance = data.warehouseBalances.find(item => item.warehouse_id === warehouseId && item.season_id === seasonId)
    return stockType === 'paddy' ? balance?.paddyBags || 0 : balance?.milledBags || 0
  }

  const millingSeasonId = millingForm.season_id || activeSeasonId
  const dispatchSeasonId = dispatchForm.season_id || activeSeasonId
  const paddyAvailable = stockAvailable(millingForm.source_warehouse_id, millingSeasonId, 'paddy')
  const milledAvailable = stockAvailable(dispatchForm.warehouse_id, dispatchSeasonId, 'milled')
  const overMilling = Number(millingForm.paddy_bags || 0) > paddyAvailable
  const overDispatch = Number(dispatchForm.bags || 0) > milledAvailable

  const fetchOperations = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/operations')
      const nextData = await res.json()
      if (!res.ok) {
        toast.error(nextData.error || 'Failed to load operations')
        return
      }
      setData(nextData)
    } catch {
      toast.error('Error loading operations')
    } finally {
      setLoading(false)
    }
  }

  const createResource = async (resource: string, payload: Record<string, unknown>, reset: () => void) => {
    setSaving(resource)
    try {
      const res = await fetch('/api/admin/operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resource, ...payload }),
      })
      const nextData = await res.json()
      if (!res.ok) {
        toast.error(nextData.error || 'Save failed')
        return
      }
      setData(nextData)
      reset()
      toast.success('Saved')
    } catch {
      toast.error('Save failed')
    } finally {
      setSaving(null)
    }
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-[var(--off-white)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-[3px] border-[var(--gold-muted)] border-t-[var(--gold)] rounded-full mx-auto" style={{ animation: 'spin 0.8s linear infinite' }} />
          <p className="mt-4 text-sm text-[var(--charcoal-muted)]">Loading operations...</p>
        </div>
      </div>
    )
  }

  const inputClass = 'w-full px-3 py-2 text-sm rounded-xl border border-[var(--cream-dark)] bg-[var(--cream)] text-[var(--charcoal)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/30 focus:border-[var(--gold)]'
  const labelClass = 'block text-xs font-semibold text-[var(--charcoal-muted)] mb-1.5 uppercase tracking-wider'
  const buttonClass = 'w-full py-2.5 rounded-xl bg-[var(--gold)] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity shadow-gold'

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
                item.href === '/admin/operations'
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
          <button onClick={signOut} className="w-full px-4 py-2.5 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/08 transition-all text-left">
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-[var(--cream-dark)] px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[var(--charcoal)]" style={{ fontFamily: 'var(--font-display)' }}>Operations</h1>
            <p className="text-xs text-[var(--charcoal-muted)] mt-0.5">Track farmer sponsorship, warehouses, milling, dispatches, expenses, and season profit</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin/operations/audit" className="btn-ghost !text-sm !py-2 !px-3 border border-[var(--cream-dark)]">Audit Log</Link>
            <Link href="/admin" className="lg:hidden btn-ghost !text-xs !py-2 !px-3">Orders</Link>
            <button onClick={fetchOperations} className="btn-ghost !text-sm !py-2 !px-3 border border-[var(--cream-dark)]">Refresh</button>
          </div>
        </header>

        <main className="flex-1 p-6 space-y-6 overflow-auto">
          <div className="card p-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--charcoal)]">Season</p>
              <p className="text-xs text-[var(--charcoal-muted)]">All cards and balances below follow the selected season.</p>
            </div>
            <select value={activeSeasonId} onChange={e => setSelectedSeasonId(e.target.value)} className={`${inputClass} sm:w-72`}>
              <option value="">All seasons</option>
              {data.seasons.map(season => (
                <option key={season.id} value={season.id}>{season.name} ({season.status})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
            {[
              { label: 'Invested', value: fmtMoney(totals.invested), color: 'text-[var(--charcoal)]' },
              { label: 'Paddy Received', value: fmtBags(totals.received), color: 'text-[var(--gold-dark)]' },
              { label: 'Milled Rice', value: fmtBags(totals.milled), color: 'text-green-700' },
              { label: 'Expenses', value: fmtMoney(totals.expenses), color: 'text-red-600' },
              { label: 'Linked Sales', value: fmtMoney(totals.linkedRevenue), color: 'text-blue-700' },
              { label: 'Manual Sales', value: fmtMoney(totals.manualRevenue), color: 'text-sky-700' },
              { label: 'Revenue', value: fmtMoney(totals.revenue), color: 'text-blue-700' },
              { label: 'Profit', value: fmtMoney(totals.profit), color: totals.profit >= 0 ? 'text-green-700' : 'text-red-600' },
            ].map(card => (
              <div key={card.label} className="card p-4">
                <p className={`text-lg font-bold ${card.color}`} style={{ fontFamily: 'var(--font-display)' }}>{card.value}</p>
                <p className="text-[10px] text-[var(--charcoal-muted)] uppercase tracking-wider font-semibold mt-1">{card.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <section className="card p-5 space-y-4">
              <h2 className="font-bold text-[var(--charcoal)]" style={{ fontFamily: 'var(--font-display)' }}>Setup</h2>
              <div className="space-y-3">
                <div>
                  <label className={labelClass}>Farmer</label>
                  <input className={inputClass} placeholder="Farmer name" value={farmerForm.full_name} onChange={e => setFarmerForm(f => ({ ...f, full_name: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input className={inputClass} placeholder="Phone" value={farmerForm.phone} onChange={e => setFarmerForm(f => ({ ...f, phone: e.target.value }))} />
                  <input className={inputClass} placeholder="Location" value={farmerForm.location} onChange={e => setFarmerForm(f => ({ ...f, location: e.target.value }))} />
                </div>
                <button disabled={saving === 'farmer'} className={buttonClass} onClick={() => createResource('farmer', farmerForm, () => setFarmerForm({ full_name: '', phone: '', location: '', notes: '' }))}>Add Farmer</button>
              </div>

              <div className="border-t border-[var(--cream-dark)] pt-4 space-y-3">
                <div>
                  <label className={labelClass}>Season</label>
                  <input className={inputClass} placeholder="2026 Major Season" value={seasonForm.name} onChange={e => setSeasonForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <input type="date" className={inputClass} value={seasonForm.start_date} onChange={e => setSeasonForm(f => ({ ...f, start_date: e.target.value }))} />
                  <input type="date" className={inputClass} value={seasonForm.end_date} onChange={e => setSeasonForm(f => ({ ...f, end_date: e.target.value }))} />
                  <select className={inputClass} value={seasonForm.status} onChange={e => setSeasonForm(f => ({ ...f, status: e.target.value as Status }))}>
                    <option value="planned">Planned</option>
                    <option value="active">Active</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <button disabled={saving === 'season'} className={buttonClass} onClick={() => createResource('season', seasonForm, () => setSeasonForm({ name: '', start_date: '', end_date: '', status: 'active', notes: '' }))}>Add Season</button>
              </div>

              <div className="border-t border-[var(--cream-dark)] pt-4 space-y-3">
                <div>
                  <label className={labelClass}>Warehouse</label>
                  <input className={inputClass} placeholder="Warehouse name" value={warehouseForm.name} onChange={e => setWarehouseForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <input className={inputClass} placeholder="Location" value={warehouseForm.location} onChange={e => setWarehouseForm(f => ({ ...f, location: e.target.value }))} />
                <button disabled={saving === 'warehouse'} className={buttonClass} onClick={() => createResource('warehouse', warehouseForm, () => setWarehouseForm({ name: '', location: '', notes: '' }))}>Add Warehouse</button>
              </div>
            </section>

            <section className="card p-5 space-y-4">
              <h2 className="font-bold text-[var(--charcoal)]" style={{ fontFamily: 'var(--font-display)' }}>Farmer Sponsorship</h2>
              <div className="grid grid-cols-2 gap-2">
                <select className={inputClass} value={accountForm.farmer_id} onChange={e => setAccountForm(f => ({ ...f, farmer_id: e.target.value }))}>
                  <option value="">Farmer</option>
                  {data.farmers.map(farmer => <option key={farmer.id} value={farmer.id}>{farmer.full_name}</option>)}
                </select>
                <select className={inputClass} value={accountForm.season_id || activeSeasonId} onChange={e => setAccountForm(f => ({ ...f, season_id: e.target.value }))}>
                  <option value="">Season</option>
                  {data.seasons.map(season => <option key={season.id} value={season.id}>{season.name}</option>)}
                </select>
              </div>
              <button disabled={saving === 'account'} className={buttonClass} onClick={() => createResource('account', { ...accountForm, season_id: accountForm.season_id || activeSeasonId }, () => setAccountForm({ farmer_id: '', season_id: '' }))}>Open Farmer Season Account</button>

              <div className="border-t border-[var(--cream-dark)] pt-4 space-y-3">
                <label className={labelClass}>Loan / Cash Advance</label>
                <select className={inputClass} value={loanForm.account_id} onChange={e => setLoanForm(f => ({ ...f, account_id: e.target.value }))}>
                  <option value="">Farmer season account</option>
                  {activeAccounts.map(account => <option key={account.id} value={account.id}>{account.farmer?.full_name || farmerName(account.farmer_id)} - {account.season?.name || seasonName(account.season_id)}</option>)}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <input type="date" className={inputClass} value={loanForm.loan_date} onChange={e => setLoanForm(f => ({ ...f, loan_date: e.target.value }))} />
                  <input type="number" min="0" step="0.01" className={inputClass} placeholder="Amount" value={loanForm.amount} onChange={e => setLoanForm(f => ({ ...f, amount: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input className={inputClass} placeholder="Reference number" value={loanForm.reference_number} onChange={e => setLoanForm(f => ({ ...f, reference_number: e.target.value }))} />
                  <input className={inputClass} placeholder="Proof document URL" value={loanForm.document_url} onChange={e => setLoanForm(f => ({ ...f, document_url: e.target.value }))} />
                </div>
                <button disabled={saving === 'loan'} className={buttonClass} onClick={() => createResource('loan', loanForm, () => setLoanForm({ account_id: '', loan_date: today(), amount: '', notes: '', reference_number: '', document_url: '' }))}>Record Loan</button>
              </div>

              <div className="border-t border-[var(--cream-dark)] pt-4 space-y-3">
                <label className={labelClass}>Rice Repayment</label>
                <select className={inputClass} value={repaymentForm.account_id} onChange={e => setRepaymentForm(f => ({ ...f, account_id: e.target.value }))}>
                  <option value="">Farmer season account</option>
                  {activeAccounts.map(account => <option key={account.id} value={account.id}>{account.farmer?.full_name || farmerName(account.farmer_id)} - balance {fmtMoney(account.summary.balance)}</option>)}
                </select>
                <select className={inputClass} value={repaymentForm.warehouse_id} onChange={e => setRepaymentForm(f => ({ ...f, warehouse_id: e.target.value }))}>
                  <option value="">Warehouse received into</option>
                  {data.warehouses.map(warehouse => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}
                </select>
                <div className="grid grid-cols-3 gap-2">
                  <input type="date" className={inputClass} value={repaymentForm.repayment_date} onChange={e => setRepaymentForm(f => ({ ...f, repayment_date: e.target.value }))} />
                  <input type="number" min="0" step="0.01" className={inputClass} placeholder="Bags" value={repaymentForm.bags} onChange={e => setRepaymentForm(f => ({ ...f, bags: e.target.value }))} />
                  <input type="number" min="0" step="0.01" className={inputClass} placeholder="Price/bag" value={repaymentForm.price_per_bag} onChange={e => setRepaymentForm(f => ({ ...f, price_per_bag: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input className={inputClass} placeholder="Reference number" value={repaymentForm.reference_number} onChange={e => setRepaymentForm(f => ({ ...f, reference_number: e.target.value }))} />
                  <input className={inputClass} placeholder="Proof document URL" value={repaymentForm.document_url} onChange={e => setRepaymentForm(f => ({ ...f, document_url: e.target.value }))} />
                </div>
                <button disabled={saving === 'repayment'} className={buttonClass} onClick={() => createResource('repayment', repaymentForm, () => setRepaymentForm({ account_id: '', warehouse_id: '', repayment_date: today(), bags: '', price_per_bag: '', notes: '', reference_number: '', document_url: '' }))}>Record Rice Repayment</button>
              </div>
            </section>

            <section className="card p-5 space-y-4">
              <h2 className="font-bold text-[var(--charcoal)]" style={{ fontFamily: 'var(--font-display)' }}>Milling, Expense, Dispatch</h2>
              <div className="space-y-3">
                <label className={labelClass}>Milling Batch</label>
                <div className="grid grid-cols-2 gap-2">
                  <select className={inputClass} value={millingForm.season_id || activeSeasonId} onChange={e => setMillingForm(f => ({ ...f, season_id: e.target.value }))}>
                    <option value="">Season</option>
                    {data.seasons.map(season => <option key={season.id} value={season.id}>{season.name}</option>)}
                  </select>
                  <input type="date" className={inputClass} value={millingForm.milling_date} onChange={e => setMillingForm(f => ({ ...f, milling_date: e.target.value }))} />
                  <select className={inputClass} value={millingForm.source_warehouse_id} onChange={e => setMillingForm(f => ({ ...f, source_warehouse_id: e.target.value }))}>
                    <option value="">Source warehouse</option>
                    {data.warehouses.map(warehouse => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}
                  </select>
                  <select className={inputClass} value={millingForm.destination_warehouse_id} onChange={e => setMillingForm(f => ({ ...f, destination_warehouse_id: e.target.value }))}>
                    <option value="">Destination warehouse</option>
                    {data.warehouses.map(warehouse => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}
                  </select>
                  <input type="number" min="0" step="0.01" className={inputClass} placeholder="Paddy bags" value={millingForm.paddy_bags} onChange={e => setMillingForm(f => ({ ...f, paddy_bags: e.target.value }))} />
                  <input type="number" min="0" step="0.01" className={inputClass} placeholder="Milled bags" value={millingForm.milled_bags} onChange={e => setMillingForm(f => ({ ...f, milled_bags: e.target.value }))} />
                </div>
                {millingForm.source_warehouse_id && (
                  <p className={`text-xs font-semibold ${overMilling ? 'text-red-600' : 'text-[var(--charcoal-muted)]'}`}>
                    Available paddy: {fmtBags(paddyAvailable)}
                  </p>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <input className={inputClass} placeholder="Reference number" value={millingForm.reference_number} onChange={e => setMillingForm(f => ({ ...f, reference_number: e.target.value }))} />
                  <input className={inputClass} placeholder="Proof document URL" value={millingForm.document_url} onChange={e => setMillingForm(f => ({ ...f, document_url: e.target.value }))} />
                </div>
                <button disabled={saving === 'milling' || overMilling} className={buttonClass} onClick={() => createResource('milling', { ...millingForm, season_id: millingForm.season_id || activeSeasonId }, () => setMillingForm({ season_id: '', source_warehouse_id: '', destination_warehouse_id: '', milling_date: today(), paddy_bags: '', milled_bags: '', notes: '', reference_number: '', document_url: '' }))}>Record Milling</button>
              </div>

              <div className="border-t border-[var(--cream-dark)] pt-4 space-y-3">
                <label className={labelClass}>Expense</label>
                <div className="grid grid-cols-2 gap-2">
                  <select className={inputClass} value={expenseForm.season_id || activeSeasonId} onChange={e => setExpenseForm(f => ({ ...f, season_id: e.target.value }))}>
                    <option value="">Season</option>
                    {data.seasons.map(season => <option key={season.id} value={season.id}>{season.name}</option>)}
                  </select>
                  <select className={inputClass} value={expenseForm.category} onChange={e => setExpenseForm(f => ({ ...f, category: e.target.value as ExpenseCategory }))}>
                    <option value="milling">Milling</option>
                    <option value="labour">Labour</option>
                    <option value="transportation">Transportation</option>
                    <option value="other">Other</option>
                  </select>
                  <input className={inputClass} placeholder="Description" value={expenseForm.description} onChange={e => setExpenseForm(f => ({ ...f, description: e.target.value }))} />
                  <input type="number" min="0" step="0.01" className={inputClass} placeholder="Amount" value={expenseForm.amount} onChange={e => setExpenseForm(f => ({ ...f, amount: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input className={inputClass} placeholder="Reference number" value={expenseForm.reference_number} onChange={e => setExpenseForm(f => ({ ...f, reference_number: e.target.value }))} />
                  <input className={inputClass} placeholder="Proof document URL" value={expenseForm.document_url} onChange={e => setExpenseForm(f => ({ ...f, document_url: e.target.value }))} />
                </div>
                <button disabled={saving === 'expense'} className={buttonClass} onClick={() => createResource('expense', { ...expenseForm, season_id: expenseForm.season_id || activeSeasonId }, () => setExpenseForm({ season_id: '', expense_date: today(), category: 'milling', description: '', amount: '', reference_number: '', document_url: '' }))}>Record Expense</button>
              </div>

              <div className="border-t border-[var(--cream-dark)] pt-4 space-y-3">
                <label className={labelClass}>Dispatch / Sale</label>
                <div className="grid grid-cols-2 gap-2">
                  <select className={inputClass} value={dispatchForm.season_id || activeSeasonId} onChange={e => setDispatchForm(f => ({ ...f, season_id: e.target.value }))}>
                    <option value="">Season</option>
                    {data.seasons.map(season => <option key={season.id} value={season.id}>{season.name}</option>)}
                  </select>
                  <select className={inputClass} value={dispatchForm.warehouse_id} onChange={e => setDispatchForm(f => ({ ...f, warehouse_id: e.target.value }))}>
                    <option value="">Warehouse</option>
                    {data.warehouses.map(warehouse => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}
                  </select>
                  <input type="number" min="0" step="0.01" className={inputClass} placeholder="Bags" value={dispatchForm.bags} onChange={e => setDispatchForm(f => ({ ...f, bags: e.target.value }))} />
                  <input type="number" min="0" step="0.01" className={inputClass} placeholder="Sale amount optional" value={dispatchForm.sale_amount} onChange={e => setDispatchForm(f => ({ ...f, sale_amount: e.target.value }))} />
                  <input className={`${inputClass} col-span-2`} placeholder="Recipient / customer optional" value={dispatchForm.recipient} onChange={e => setDispatchForm(f => ({ ...f, recipient: e.target.value }))} />
                </div>
                {dispatchForm.warehouse_id && (
                  <p className={`text-xs font-semibold ${overDispatch ? 'text-red-600' : 'text-[var(--charcoal-muted)]'}`}>
                    Available milled rice: {fmtBags(milledAvailable)}
                  </p>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <input className={inputClass} placeholder="Reference number" value={dispatchForm.reference_number} onChange={e => setDispatchForm(f => ({ ...f, reference_number: e.target.value }))} />
                  <input className={inputClass} placeholder="Proof document URL" value={dispatchForm.document_url} onChange={e => setDispatchForm(f => ({ ...f, document_url: e.target.value }))} />
                </div>
                <button disabled={saving === 'dispatch' || overDispatch} className={buttonClass} onClick={() => createResource('dispatch', { ...dispatchForm, season_id: dispatchForm.season_id || activeSeasonId }, () => setDispatchForm({ season_id: '', warehouse_id: '', dispatch_date: today(), bags: '', sale_amount: '', recipient: '', notes: '', reference_number: '', document_url: '' }))}>Record Dispatch</button>
              </div>
            </section>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <section className="bg-white rounded-2xl border border-[var(--cream-dark)] overflow-hidden">
              <div className="px-5 py-4 border-b border-[var(--cream-dark)]">
                <h2 className="font-bold text-[var(--charcoal)]" style={{ fontFamily: 'var(--font-display)' }}>Farmer Settlement</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px]">
                  <thead>
                    <tr className="bg-[var(--off-white)] border-b border-[var(--cream-dark)]">
                      {['Farmer', 'Season', 'Loan', 'Rice Value', 'Balance', 'Status', 'Proof'].map(header => <th key={header} className="px-5 py-3 text-left text-xs font-semibold text-[var(--charcoal-muted)] uppercase tracking-wider">{header}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--cream-dark)]">
                    {activeAccounts.map(account => (
                      <tr key={account.id}>
                        <td className="px-5 py-3 text-sm font-semibold text-[var(--charcoal)]">
                          <Link className="hover:text-[var(--gold-dark)]" href={`/admin/operations/farmers/${account.farmer_id}`}>{account.farmer?.full_name || farmerName(account.farmer_id)}</Link>
                        </td>
                        <td className="px-5 py-3 text-sm text-[var(--charcoal-muted)]">
                          <Link className="hover:text-[var(--gold-dark)]" href={`/admin/operations/seasons/${account.season_id}`}>{account.season?.name || seasonName(account.season_id)}</Link>
                        </td>
                        <td className="px-5 py-3 text-sm text-[var(--charcoal)]">{fmtMoney(account.summary.loanTotal)}</td>
                        <td className="px-5 py-3 text-sm text-[var(--charcoal)]">{fmtMoney(account.summary.repaymentTotal)}</td>
                        <td className={`px-5 py-3 text-sm font-bold ${account.summary.balance <= 0 ? 'text-green-700' : 'text-red-600'}`}>{fmtMoney(account.summary.balance)}</td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex px-2.5 py-1 rounded-full border text-xs font-semibold ${account.summary.status === 'settled' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                            {account.summary.status === 'settled' ? 'Settled' : 'Outstanding'}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          {account.loans.some(loan => !loan.document_url) || account.repayments.some(repayment => !repayment.document_url) ? (
                            <span className="inline-flex px-2.5 py-1 rounded-full border text-xs font-semibold bg-amber-50 text-amber-700 border-amber-200">Missing proof</span>
                          ) : (
                            <span className="inline-flex px-2.5 py-1 rounded-full border text-xs font-semibold bg-green-50 text-green-700 border-green-200">Proof attached</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {activeAccounts.length === 0 && (
                      <tr><td colSpan={7} className="px-5 py-10 text-center text-sm text-[var(--charcoal-muted)]">No farmer season accounts yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="bg-white rounded-2xl border border-[var(--cream-dark)] overflow-hidden">
              <div className="px-5 py-4 border-b border-[var(--cream-dark)]">
                <h2 className="font-bold text-[var(--charcoal)]" style={{ fontFamily: 'var(--font-display)' }}>Warehouse Balances</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px]">
                  <thead>
                    <tr className="bg-[var(--off-white)] border-b border-[var(--cream-dark)]">
                      {['Warehouse', 'Season', 'Paddy', 'Milled', 'Total'].map(header => <th key={header} className="px-5 py-3 text-left text-xs font-semibold text-[var(--charcoal-muted)] uppercase tracking-wider">{header}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--cream-dark)]">
                    {activeWarehouseBalances.map(balance => (
                      <tr key={`${balance.warehouse_id}-${balance.season_id}`}>
                        <td className="px-5 py-3 text-sm font-semibold text-[var(--charcoal)]">
                          <Link className="hover:text-[var(--gold-dark)]" href={`/admin/operations/warehouses/${balance.warehouse_id}`}>{warehouseName(balance.warehouse_id)}</Link>
                        </td>
                        <td className="px-5 py-3 text-sm text-[var(--charcoal-muted)]">
                          <Link className="hover:text-[var(--gold-dark)]" href={`/admin/operations/seasons/${balance.season_id}`}>{seasonName(balance.season_id)}</Link>
                        </td>
                        <td className="px-5 py-3 text-sm text-[var(--charcoal)]">{fmtBags(balance.paddyBags)}</td>
                        <td className="px-5 py-3 text-sm text-[var(--charcoal)]">{fmtBags(balance.milledBags)}</td>
                        <td className="px-5 py-3 text-sm font-bold text-[var(--charcoal)]">{fmtBags(balance.totalBags)}</td>
                      </tr>
                    ))}
                    {activeWarehouseBalances.length === 0 && (
                      <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-[var(--charcoal-muted)]">No warehouse stock movements yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}
