'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { isAdminUser } from '@/lib/admin'
import { useAuth } from '@/contexts/AuthContext'

type Mode = 'farmer' | 'season' | 'warehouse' | 'audit'

interface Farmer { id: string; full_name: string; phone?: string | null; location?: string | null; notes?: string | null }
interface Season { id: string; name: string; status?: string; start_date?: string | null; end_date?: string | null }
interface Warehouse { id: string; name: string; location?: string | null }
interface Account {
  id: string
  farmer_id: string
  season_id: string
  farmer?: Farmer | null
  season?: Season | null
  loans?: OperationRecord[]
  repayments?: OperationRecord[]
  summary?: { loanTotal: number; repaymentTotal: number; balance: number; status: 'settled' | 'outstanding' }
}
interface WarehouseBalance { warehouse_id: string; season_id: string; paddyBags: number; milledBags: number; totalBags: number }
interface OperationRecord {
  id: string
  account_id?: string
  farmer_id?: string
  season_id?: string
  warehouse_id?: string
  source_warehouse_id?: string
  destination_warehouse_id?: string
  amount?: number
  bags?: number
  price_per_bag?: number
  total_amount?: number
  paddy_bags?: number
  milled_bags?: number
  sale_amount?: number
  recipient?: string | null
  category?: string
  description?: string | null
  notes?: string | null
  reference_number?: string | null
  document_url?: string | null
  voided_at?: string | null
  void_reason?: string | null
  loan_date?: string
  repayment_date?: string
  milling_date?: string
  expense_date?: string
  dispatch_date?: string
  movement_date?: string
  stock_type?: string
  movement_type?: string
  source_type?: string
  created_at?: string
  action?: string
  resource_type?: string
  resource_id?: string
  reason?: string | null
}
interface OperationsData {
  farmers: Farmer[]
  seasons: Season[]
  warehouses: Warehouse[]
  accounts: Account[]
  loans: OperationRecord[]
  repayments: OperationRecord[]
  stockMovements: OperationRecord[]
  millingBatches: OperationRecord[]
  expenses: OperationRecord[]
  dispatches: OperationRecord[]
  documents: OperationRecord[]
  auditEvents: OperationRecord[]
  warehouseBalances: WarehouseBalance[]
  seasonReports: Array<{ season: Season; summary: Record<string, number | WarehouseBalance[]> }>
}

const blankData: OperationsData = {
  farmers: [],
  seasons: [],
  warehouses: [],
  accounts: [],
  loans: [],
  repayments: [],
  stockMovements: [],
  millingBatches: [],
  expenses: [],
  dispatches: [],
  documents: [],
  auditEvents: [],
  warehouseBalances: [],
  seasonReports: [],
}

const money = (value: unknown) => `GHS ${Number(value || 0).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const bags = (value: unknown) => `${Number(value || 0).toLocaleString('en-GH', { maximumFractionDigits: 2 })} bags`
const dateText = (value?: string | null) => value ? new Date(value).toLocaleDateString('en-GH') : '-'

function statusBadge(record: OperationRecord) {
  if (record.voided_at) return <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">Voided</span>
  if (!record.document_url && ['loan', 'repayment', 'milling', 'expense', 'dispatch'].some(kind => record.resource_type?.includes(kind) || Boolean(record.reference_number))) {
    return <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">Missing proof</span>
  }
  return <span className="rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">Active</span>
}

export default function OperationsRecordPage({ mode, id }: { mode: Mode; id?: string }) {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [data, setData] = useState<OperationsData>(blankData)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!authLoading && (!user || !isAdminUser(user.email))) {
      router.push('/admin/login')
      return
    }
    if (user && isAdminUser(user.email)) fetchData()
  }, [user, authLoading, router])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/operations')
      const next = await res.json()
      if (!res.ok) {
        toast.error(next.error || 'Failed to load operations')
        return
      }
      setData(next)
    } finally {
      setLoading(false)
    }
  }

  const farmerName = (farmerId?: string) => data.farmers.find(farmer => farmer.id === farmerId)?.full_name || 'Unknown farmer'
  const seasonName = (seasonId?: string) => data.seasons.find(season => season.id === seasonId)?.name || 'Unknown season'
  const warehouseName = (warehouseId?: string) => data.warehouses.find(warehouse => warehouse.id === warehouseId)?.name || 'Unknown warehouse'

  const voidRecord = async (resource: string, recordId: string) => {
    const reason = window.prompt('Enter void reason for audit trail')
    if (!reason) return
    const resourceSlug: Record<string, string> = {
      farmer_loan: 'loan',
      farmer_repayment: 'repayment',
      milling_batch: 'milling',
      season_expense: 'expense',
      rice_dispatch: 'dispatch',
    }
    const res = await fetch(`/api/admin/operations/${resourceSlug[resource] || resource}/${recordId}/void`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    })
    const result = await res.json()
    if (!res.ok) {
      toast.error(result.error || 'Void failed')
      return
    }
    toast.success('Record voided')
    fetchData()
  }

  const selected = useMemo(() => {
    if (mode === 'farmer') return data.farmers.find(item => item.id === id)
    if (mode === 'season') return data.seasons.find(item => item.id === id)
    if (mode === 'warehouse') return data.warehouses.find(item => item.id === id)
    return null
  }, [data, id, mode])

  const rows = useMemo<OperationRecord[]>(() => {
    if (mode === 'audit') {
      const needle = query.toLowerCase()
      return data.auditEvents.filter(event => JSON.stringify(event).toLowerCase().includes(needle))
    }
    if (mode === 'farmer') {
      const accounts = data.accounts.filter(account => account.farmer_id === id)
      const accountIds = new Set(accounts.map(account => account.id))
      return [
        ...accounts.map(account => ({
          id: account.id,
          farmer_id: account.farmer_id,
          season_id: account.season_id,
          resource_type: 'farmer_account',
          created_at: account.season?.name,
        })),
        ...data.loans.filter(record => accountIds.has(record.account_id || '')).map(record => ({ ...record, resource_type: 'farmer_loan' })),
        ...data.repayments.filter(record => accountIds.has(record.account_id || '')).map(record => ({ ...record, resource_type: 'farmer_repayment' })),
        ...data.documents.filter(record => record.farmer_id === id).map(record => ({ ...record, resource_type: 'document' })),
      ]
    }
    if (mode === 'season') {
      const accounts = data.accounts.filter(account => account.season_id === id)
      const accountIds = new Set(accounts.map(account => account.id))
      return [
        ...data.loans.filter(record => accountIds.has(record.account_id || '')).map(record => ({ ...record, resource_type: 'farmer_loan' })),
        ...data.repayments.filter(record => accountIds.has(record.account_id || '')).map(record => ({ ...record, resource_type: 'farmer_repayment' })),
        ...data.millingBatches.filter(record => record.season_id === id).map(record => ({ ...record, resource_type: 'milling_batch' })),
        ...data.expenses.filter(record => record.season_id === id).map(record => ({ ...record, resource_type: 'season_expense' })),
        ...data.dispatches.filter(record => record.season_id === id).map(record => ({ ...record, resource_type: 'rice_dispatch' })),
        ...data.documents.filter(record => record.season_id === id).map(record => ({ ...record, resource_type: 'document' })),
      ]
    }
    return data.stockMovements.filter(record => record.warehouse_id === id).map(record => ({ ...record, resource_type: 'stock_movement' }))
  }, [data, id, mode, query])

  const exportCsv = () => {
    const headers = ['type', 'date', 'farmer', 'season', 'warehouse', 'reference', 'amount', 'bags', 'status']
    const csvRows = rows.map(row => [
      row.resource_type || '',
      row.loan_date || row.repayment_date || row.milling_date || row.expense_date || row.dispatch_date || row.movement_date || row.created_at || '',
      farmerName(row.farmer_id || data.accounts.find(account => account.id === row.account_id)?.farmer_id),
      seasonName(row.season_id || data.accounts.find(account => account.id === row.account_id)?.season_id),
      warehouseName(row.warehouse_id || row.source_warehouse_id),
      row.reference_number || row.resource_id || '',
      row.amount || row.total_amount || row.sale_amount || '',
      row.bags || row.paddy_bags || row.milled_bags || '',
      row.voided_at ? 'voided' : 'active',
    ])
    const csv = [headers, ...csvRows].map(row => row.map(cell => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `operations-${mode}-${id || 'audit'}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (loading || authLoading) {
    return <div className="min-h-screen bg-[var(--off-white)] flex items-center justify-center text-sm text-[var(--charcoal-muted)]">Loading records...</div>
  }

  const title = mode === 'audit'
    ? 'Operations Audit Log'
    : mode === 'farmer'
      ? (selected as Farmer | undefined)?.full_name || 'Farmer Record'
      : mode === 'season'
        ? (selected as Season | undefined)?.name || 'Season Record'
        : (selected as Warehouse | undefined)?.name || 'Warehouse Record'

  const report = mode === 'season' ? data.seasonReports.find(item => item.season.id === id)?.summary : null
  const warehouseBalances = mode === 'warehouse'
    ? data.warehouseBalances.filter(balance => balance.warehouse_id === id)
    : mode === 'season'
      ? data.warehouseBalances.filter(balance => balance.season_id === id)
      : []

  return (
    <main className="min-h-screen bg-[var(--off-white)] p-6 space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/admin/operations" className="text-xs font-semibold uppercase tracking-wider text-[var(--gold-dark)]">Back to operations</Link>
          <h1 className="mt-2 text-2xl font-bold text-[var(--charcoal)]" style={{ fontFamily: 'var(--font-display)' }}>{title}</h1>
          <p className="text-sm text-[var(--charcoal-muted)]">Audit-ready history with references, proof links, void status, and exports.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCsv} className="btn-ghost !py-2 !px-3 text-sm border border-[var(--cream-dark)]">Export CSV</button>
          <button onClick={() => window.print()} className="btn-ghost !py-2 !px-3 text-sm border border-[var(--cream-dark)]">Print / PDF</button>
        </div>
      </header>

      {mode === 'audit' && (
        <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search audit log" className="w-full rounded-xl border border-[var(--cream-dark)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--gold)]" />
      )}

      {report && (
        <section className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
          {[
            ['Invested', money(report.totalInvested)],
            ['Repayment Value', money(report.repaymentValue)],
            ['Paddy Received', bags(report.paddyBagsReceived)],
            ['Milled', bags(report.milledBagsProduced)],
            ['Expenses', money(report.expensesTotal)],
            ['Revenue', money(report.revenueTotal)],
            ['Profit', money(report.profit)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-[var(--cream-dark)] bg-white p-4">
              <p className="text-lg font-bold text-[var(--charcoal)]">{value}</p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--charcoal-muted)]">{label}</p>
            </div>
          ))}
        </section>
      )}

      {warehouseBalances.length > 0 && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {warehouseBalances.map(balance => (
            <Link key={`${balance.warehouse_id}-${balance.season_id}`} href={`/admin/operations/warehouses/${balance.warehouse_id}`} className="rounded-2xl border border-[var(--cream-dark)] bg-white p-4 hover:border-[var(--gold)]">
              <p className="font-semibold text-[var(--charcoal)]">{warehouseName(balance.warehouse_id)}</p>
              <p className="text-xs text-[var(--charcoal-muted)]">{seasonName(balance.season_id)}</p>
              <p className="mt-3 text-sm">Paddy: <strong>{bags(balance.paddyBags)}</strong></p>
              <p className="text-sm">Milled: <strong>{bags(balance.milledBags)}</strong></p>
            </Link>
          ))}
        </section>
      )}

      <section className="rounded-2xl border border-[var(--cream-dark)] bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead>
              <tr className="border-b border-[var(--cream-dark)] bg-[var(--off-white)]">
                {['Type', 'Date', 'Farmer / Season', 'Warehouse', 'Reference', 'Amount / Bags', 'Proof', 'Status', 'Action'].map(header => (
                  <th key={header} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--charcoal-muted)]">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--cream-dark)]">
              {rows.map(row => {
                const account = data.accounts.find(item => item.id === row.account_id)
                const voidable = ['farmer_loan', 'farmer_repayment', 'milling_batch', 'season_expense', 'rice_dispatch'].includes(row.resource_type || '') && !row.voided_at
                return (
                  <tr key={`${row.resource_type}-${row.id}`}>
                    <td className="px-5 py-3 text-sm font-semibold text-[var(--charcoal)]">{row.resource_type}</td>
                    <td className="px-5 py-3 text-sm text-[var(--charcoal-muted)]">{dateText(row.loan_date || row.repayment_date || row.milling_date || row.expense_date || row.dispatch_date || row.movement_date || row.created_at)}</td>
                    <td className="px-5 py-3 text-sm text-[var(--charcoal)]">{farmerName(row.farmer_id || account?.farmer_id)} / {seasonName(row.season_id || account?.season_id)}</td>
                    <td className="px-5 py-3 text-sm text-[var(--charcoal-muted)]">{warehouseName(row.warehouse_id || row.source_warehouse_id || row.destination_warehouse_id)}</td>
                    <td className="px-5 py-3 text-sm text-[var(--charcoal-muted)]">{row.reference_number || row.resource_id || '-'}</td>
                    <td className="px-5 py-3 text-sm text-[var(--charcoal)]">{row.amount ? money(row.amount) : row.total_amount ? money(row.total_amount) : row.sale_amount ? money(row.sale_amount) : bags(row.bags || row.paddy_bags || row.milled_bags)}</td>
                    <td className="px-5 py-3 text-sm">
                      {row.document_url ? <a className="font-semibold text-[var(--gold-dark)]" href={row.document_url} target="_blank">Open proof</a> : <span className="text-amber-700">Missing</span>}
                    </td>
                    <td className="px-5 py-3">{statusBadge(row)}</td>
                    <td className="px-5 py-3">
                      {voidable ? (
                        <button onClick={() => voidRecord(row.resource_type || '', row.id)} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50">Void</button>
                      ) : (
                        <span className="text-xs text-[var(--charcoal-muted)]">Locked</span>
                      )}
                    </td>
                  </tr>
                )
              })}
              {rows.length === 0 && (
                <tr><td colSpan={9} className="px-5 py-12 text-center text-sm text-[var(--charcoal-muted)]">No records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}
