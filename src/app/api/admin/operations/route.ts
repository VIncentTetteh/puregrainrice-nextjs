import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin'
import { clamp } from '@/lib/sanitize'
import {
  calculateFarmerSeasonAccount,
  calculateSeasonReport,
  calculateWarehouseBalances,
} from '@/lib/operations'

async function getAdminSupabase() {
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

function positiveNumber(value: unknown, label: string) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) throw new Error(`${label} must be greater than 0`)
  return parsed
}

function nullableUuid(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

const editableTables: Record<string, string> = {
  farmer: 'farmers',
  season: 'farming_seasons',
  warehouse: 'warehouses',
  account: 'farmer_season_accounts',
  loan: 'farmer_loans',
  repayment: 'farmer_repayments',
  milling: 'milling_batches',
  expense: 'season_expenses',
  dispatch: 'rice_dispatches',
}

function updatesFor(resource: string, body: Record<string, unknown>) {
  if (resource === 'farmer') {
    return {
      full_name: clamp(body.full_name, 200),
      phone: clamp(body.phone, 50) || null,
      location: clamp(body.location, 200) || null,
      notes: clamp(body.notes, 1000) || null,
    }
  }
  if (resource === 'season') {
    return {
      name: clamp(body.name, 200),
      start_date: body.start_date || null,
      end_date: body.end_date || null,
      status: body.status || 'active',
      notes: clamp(body.notes, 1000) || null,
    }
  }
  if (resource === 'warehouse') {
    return {
      name: clamp(body.name, 200),
      location: clamp(body.location, 200) || null,
      notes: clamp(body.notes, 1000) || null,
    }
  }
  if (resource === 'loan') {
    return {
      loan_date: body.loan_date || new Date().toISOString().slice(0, 10),
      amount: positiveNumber(body.amount, 'Loan amount'),
      notes: clamp(body.notes, 1000) || null,
    }
  }
  if (resource === 'expense') {
    return {
      expense_date: body.expense_date || new Date().toISOString().slice(0, 10),
      category: body.category || 'other',
      description: clamp(body.description, 500) || null,
      amount: positiveNumber(body.amount, 'Expense amount'),
    }
  }
  throw new Error('This resource cannot be edited safely after stock movements are created')
}

async function fetchOperationsData(supabase: Awaited<ReturnType<typeof createClient>>) {
  const [
    farmersRes,
    seasonsRes,
    accountsRes,
    warehousesRes,
    loansRes,
    repaymentsRes,
    movementsRes,
    millingRes,
    expensesRes,
    dispatchesRes,
  ] = await Promise.all([
    supabase.from('farmers').select('*').order('created_at', { ascending: false }),
    supabase.from('farming_seasons').select('*').order('created_at', { ascending: false }),
    supabase.from('farmer_season_accounts').select('*').order('created_at', { ascending: false }),
    supabase.from('warehouses').select('*').order('created_at', { ascending: false }),
    supabase.from('farmer_loans').select('*').order('loan_date', { ascending: false }),
    supabase.from('farmer_repayments').select('*').order('repayment_date', { ascending: false }),
    supabase.from('warehouse_stock_movements').select('*').order('movement_date', { ascending: false }),
    supabase.from('milling_batches').select('*').order('milling_date', { ascending: false }),
    supabase.from('season_expenses').select('*').order('expense_date', { ascending: false }),
    supabase.from('rice_dispatches').select('*').order('dispatch_date', { ascending: false }),
  ])

  const errors = [farmersRes, seasonsRes, accountsRes, warehousesRes, loansRes, repaymentsRes, movementsRes, millingRes, expensesRes, dispatchesRes]
    .map(result => result.error)
    .filter(Boolean)
  if (errors.length) throw errors[0]

  const farmers = farmersRes.data || []
  const seasons = seasonsRes.data || []
  const accounts = accountsRes.data || []
  const warehouses = warehousesRes.data || []
  const loans = loansRes.data || []
  const repayments = repaymentsRes.data || []
  const stockMovements = movementsRes.data || []
  const millingBatches = millingRes.data || []
  const expenses = expensesRes.data || []
  const dispatches = dispatchesRes.data || []

  const enrichedAccounts = accounts.map(account => {
    const accountLoans = loans.filter(loan => loan.account_id === account.id)
    const accountRepayments = repayments.filter(repayment => repayment.account_id === account.id)
    return {
      ...account,
      farmer: farmers.find(farmer => farmer.id === account.farmer_id) || null,
      season: seasons.find(season => season.id === account.season_id) || null,
      loans: accountLoans,
      repayments: accountRepayments,
      summary: calculateFarmerSeasonAccount({ loans: accountLoans, repayments: accountRepayments }),
    }
  })

  const seasonReports = seasons.map(season => {
    const seasonAccounts = accounts.filter(account => account.season_id === season.id)
    const accountIds = new Set(seasonAccounts.map(account => account.id))
    const seasonLoans = loans.filter(loan => accountIds.has(loan.account_id))
    const seasonRepayments = repayments.filter(repayment => accountIds.has(repayment.account_id))
    const seasonMovements = stockMovements.filter(movement => movement.season_id === season.id)
    const seasonMilling = millingBatches.filter(batch => batch.season_id === season.id)
    const seasonExpenses = expenses.filter(expense => expense.season_id === season.id)
    const seasonDispatches = dispatches.filter(dispatch => dispatch.season_id === season.id)
    return {
      season,
      summary: calculateSeasonReport({
        loans: seasonLoans,
        repayments: seasonRepayments,
        expenses: seasonExpenses,
        millingBatches: seasonMilling,
        dispatches: seasonDispatches,
        stockMovements: seasonMovements,
      }),
    }
  })

  return {
    farmers,
    seasons,
    accounts: enrichedAccounts,
    warehouses,
    loans,
    repayments,
    stockMovements,
    millingBatches,
    expenses,
    dispatches,
    warehouseBalances: calculateWarehouseBalances(stockMovements),
    seasonReports,
  }
}

export async function GET() {
  const { supabase, response } = await getAdminSupabase()
  if (!supabase) return response

  try {
    return NextResponse.json(await fetchOperationsData(supabase))
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to load operations data' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { supabase, response } = await getAdminSupabase()
  if (!supabase) return response

  try {
    const body = await req.json()
    const resource = body.resource

    if (resource === 'farmer') {
      const full_name = clamp(body.full_name, 200)
      if (!full_name) throw new Error('Farmer name is required')
      const { error } = await supabase.from('farmers').insert({
        full_name,
        phone: clamp(body.phone, 50) || null,
        location: clamp(body.location, 200) || null,
        notes: clamp(body.notes, 1000) || null,
      })
      if (error) throw error
    } else if (resource === 'season') {
      const name = clamp(body.name, 200)
      if (!name) throw new Error('Season name is required')
      const { error } = await supabase.from('farming_seasons').insert({
        name,
        start_date: body.start_date || null,
        end_date: body.end_date || null,
        status: body.status || 'active',
        notes: clamp(body.notes, 1000) || null,
      })
      if (error) throw error
    } else if (resource === 'warehouse') {
      const name = clamp(body.name, 200)
      if (!name) throw new Error('Warehouse name is required')
      const { error } = await supabase.from('warehouses').insert({
        name,
        location: clamp(body.location, 200) || null,
        notes: clamp(body.notes, 1000) || null,
      })
      if (error) throw error
    } else if (resource === 'account') {
      const { error } = await supabase.from('farmer_season_accounts').insert({
        farmer_id: body.farmer_id,
        season_id: body.season_id,
        notes: clamp(body.notes, 1000) || null,
      })
      if (error) throw error
    } else if (resource === 'loan') {
      const { error } = await supabase.from('farmer_loans').insert({
        account_id: body.account_id,
        loan_date: body.loan_date || new Date().toISOString().slice(0, 10),
        amount: positiveNumber(body.amount, 'Loan amount'),
        notes: clamp(body.notes, 1000) || null,
      })
      if (error) throw error
    } else if (resource === 'repayment') {
      const bags = positiveNumber(body.bags, 'Bags')
      const pricePerBag = positiveNumber(body.price_per_bag, 'Price per bag')
      const { data: account, error: accountError } = await supabase
        .from('farmer_season_accounts')
        .select('id, farmer_id, season_id')
        .eq('id', body.account_id)
        .single()
      if (accountError) throw accountError

      const { data: repayment, error } = await supabase.from('farmer_repayments').insert({
        account_id: body.account_id,
        warehouse_id: body.warehouse_id,
        repayment_date: body.repayment_date || new Date().toISOString().slice(0, 10),
        bags,
        price_per_bag: pricePerBag,
        notes: clamp(body.notes, 1000) || null,
      }).select().single()
      if (error) throw error

      const { error: movementError } = await supabase.from('warehouse_stock_movements').insert({
        warehouse_id: body.warehouse_id,
        season_id: account.season_id,
        farmer_id: account.farmer_id,
        source_type: 'farmer_repayment',
        source_id: repayment.id,
        stock_type: 'paddy',
        movement_type: 'received',
        bags,
        movement_date: repayment.repayment_date,
        notes: `Rice repayment recorded for ${bags} bags`,
      })
      if (movementError) throw movementError
    } else if (resource === 'milling') {
      const paddyBags = positiveNumber(body.paddy_bags, 'Paddy bags')
      const milledBags = Number(body.milled_bags)
      if (!Number.isFinite(milledBags) || milledBags < 0) throw new Error('Milled bags must be 0 or greater')
      const { data: batch, error } = await supabase.from('milling_batches').insert({
        season_id: body.season_id,
        source_warehouse_id: body.source_warehouse_id,
        destination_warehouse_id: body.destination_warehouse_id,
        milling_date: body.milling_date || new Date().toISOString().slice(0, 10),
        paddy_bags: paddyBags,
        milled_bags: milledBags,
        notes: clamp(body.notes, 1000) || null,
      }).select().single()
      if (error) throw error

      const { error: movementError } = await supabase.from('warehouse_stock_movements').insert([
        {
          warehouse_id: body.source_warehouse_id,
          season_id: body.season_id,
          source_type: 'milling_batch',
          source_id: batch.id,
          stock_type: 'paddy',
          movement_type: 'milled_out',
          bags: paddyBags,
          movement_date: batch.milling_date,
          notes: 'Paddy sent for milling',
        },
        {
          warehouse_id: body.destination_warehouse_id,
          season_id: body.season_id,
          source_type: 'milling_batch',
          source_id: batch.id,
          stock_type: 'milled',
          movement_type: 'milled_in',
          bags: milledBags,
          movement_date: batch.milling_date,
          notes: 'Milled rice received',
        },
      ])
      if (movementError) throw movementError
    } else if (resource === 'expense') {
      const { error } = await supabase.from('season_expenses').insert({
        season_id: body.season_id,
        expense_date: body.expense_date || new Date().toISOString().slice(0, 10),
        category: body.category || 'other',
        description: clamp(body.description, 500) || null,
        amount: positiveNumber(body.amount, 'Expense amount'),
      })
      if (error) throw error
    } else if (resource === 'dispatch') {
      const bags = positiveNumber(body.bags, 'Bags')
      const { data: dispatch, error } = await supabase.from('rice_dispatches').insert({
        season_id: body.season_id,
        warehouse_id: body.warehouse_id,
        dispatch_date: body.dispatch_date || new Date().toISOString().slice(0, 10),
        bags,
        sale_amount: body.sale_amount ? Number(body.sale_amount) : null,
        order_id: nullableUuid(body.order_id),
        invoice_id: nullableUuid(body.invoice_id),
        recipient: clamp(body.recipient, 200) || null,
        notes: clamp(body.notes, 1000) || null,
      }).select().single()
      if (error) throw error

      const { error: movementError } = await supabase.from('warehouse_stock_movements').insert({
        warehouse_id: body.warehouse_id,
        season_id: body.season_id,
        source_type: 'dispatch',
        source_id: dispatch.id,
        stock_type: 'milled',
        movement_type: 'dispatched',
        bags,
        movement_date: dispatch.dispatch_date,
        notes: dispatch.recipient ? `Dispatched to ${dispatch.recipient}` : 'Rice dispatched',
      })
      if (movementError) throw movementError
    } else {
      throw new Error('Unsupported operations resource')
    }

    return NextResponse.json(await fetchOperationsData(supabase), { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to save operations data' }, { status: 400 })
  }
}

export async function PATCH(req: NextRequest) {
  const { supabase, response } = await getAdminSupabase()
  if (!supabase) return response

  try {
    const body = await req.json()
    const resource = String(body.resource || '')
    const id = String(body.id || '')
    const table = editableTables[resource]
    if (!table || !id) throw new Error('Valid resource and ID are required')

    const { error } = await supabase
      .from(table)
      .update(updatesFor(resource, body))
      .eq('id', id)
    if (error) throw error

    return NextResponse.json(await fetchOperationsData(supabase))
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to update operations data' }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest) {
  const { supabase, response } = await getAdminSupabase()
  if (!supabase) return response

  try {
    const { searchParams } = new URL(req.url)
    const resource = searchParams.get('resource') || ''
    const id = searchParams.get('id') || ''
    const table = editableTables[resource]
    if (!table || !id) throw new Error('Valid resource and ID are required')

    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) throw error

    return NextResponse.json(await fetchOperationsData(supabase))
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to delete operations data' }, { status: 400 })
  }
}
