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
  if (error || !user) return { supabase: null, user: null, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  try {
    requireAdmin(user.email)
  } catch {
    return { supabase: null, user: null, response: NextResponse.json({ error: 'Access denied' }, { status: 403 }) }
  }
  return { supabase, user, response: null }
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
  document: 'operation_documents',
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
  if (resource === 'document') {
    return {
      resource_type: clamp(body.resource_type, 100),
      resource_id: nullableUuid(body.resource_id),
      farmer_id: nullableUuid(body.farmer_id),
      season_id: nullableUuid(body.season_id),
      document_type: body.document_type || 'other',
      title: clamp(body.title, 200),
      file_url: clamp(body.file_url, 1000),
      storage_path: clamp(body.storage_path, 1000) || null,
    }
  }
  throw new Error('This resource cannot be edited safely after stock movements are created')
}

async function logAudit(
  supabase: Awaited<ReturnType<typeof createClient>>,
  actorId: string,
  action: string,
  resourceType: string,
  resourceId: string | null,
  beforeData: unknown,
  afterData: unknown,
  reason?: string | null,
) {
  await supabase.from('operation_audit_events').insert({
    actor_id: actorId,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    before_data: beforeData ?? null,
    after_data: afterData ?? null,
    reason: reason || null,
  })
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
    documentsRes,
    auditRes,
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
    supabase
      .from('rice_dispatches')
      .select('*, orders(total_amount), invoices(total)')
      .order('dispatch_date', { ascending: false }),
    supabase.from('operation_documents').select('*').order('created_at', { ascending: false }),
    supabase.from('operation_audit_events').select('*').order('created_at', { ascending: false }).limit(250),
  ])

  const errors = [farmersRes, seasonsRes, accountsRes, warehousesRes, loansRes, repaymentsRes, movementsRes, millingRes, expensesRes, dispatchesRes, documentsRes, auditRes]
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
  const dispatches = (dispatchesRes.data || []).map(dispatch => ({
    ...dispatch,
    order_total: Array.isArray(dispatch.orders) ? dispatch.orders[0]?.total_amount : dispatch.orders?.total_amount,
    invoice_total: Array.isArray(dispatch.invoices) ? dispatch.invoices[0]?.total : dispatch.invoices?.total,
  }))
  const documents = documentsRes.data || []
  const auditEvents = auditRes.data || []

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
    documents,
    auditEvents,
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
  const { supabase, user, response } = await getAdminSupabase()
  if (!supabase) return response
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const resource = body.resource

    if (resource === 'farmer') {
      const full_name = clamp(body.full_name, 200)
      if (!full_name) throw new Error('Farmer name is required')
      const { data: created, error } = await supabase.from('farmers').insert({
        full_name,
        phone: clamp(body.phone, 50) || null,
        location: clamp(body.location, 200) || null,
        notes: clamp(body.notes, 1000) || null,
        created_by: user.id,
        updated_by: user.id,
      }).select().single()
      if (error) throw error
      await logAudit(supabase, user.id, 'create', 'farmer', created.id, null, created, null)
    } else if (resource === 'season') {
      const name = clamp(body.name, 200)
      if (!name) throw new Error('Season name is required')
      const { data: created, error } = await supabase.from('farming_seasons').insert({
        name,
        start_date: body.start_date || null,
        end_date: body.end_date || null,
        status: body.status || 'active',
        notes: clamp(body.notes, 1000) || null,
        created_by: user.id,
        updated_by: user.id,
      }).select().single()
      if (error) throw error
      await logAudit(supabase, user.id, 'create', 'farming_season', created.id, null, created, null)
    } else if (resource === 'warehouse') {
      const name = clamp(body.name, 200)
      if (!name) throw new Error('Warehouse name is required')
      const { data: created, error } = await supabase.from('warehouses').insert({
        name,
        location: clamp(body.location, 200) || null,
        notes: clamp(body.notes, 1000) || null,
        created_by: user.id,
        updated_by: user.id,
      }).select().single()
      if (error) throw error
      await logAudit(supabase, user.id, 'create', 'warehouse', created.id, null, created, null)
    } else if (resource === 'account') {
      const { data: created, error } = await supabase.from('farmer_season_accounts').insert({
        farmer_id: body.farmer_id,
        season_id: body.season_id,
        notes: clamp(body.notes, 1000) || null,
        created_by: user.id,
        updated_by: user.id,
      }).select().single()
      if (error) throw error
      await logAudit(supabase, user.id, 'create', 'farmer_season_account', created.id, null, created, null)
    } else if (resource === 'loan') {
      const { data: created, error } = await supabase.from('farmer_loans').insert({
        account_id: body.account_id,
        loan_date: body.loan_date || new Date().toISOString().slice(0, 10),
        amount: positiveNumber(body.amount, 'Loan amount'),
        notes: clamp(body.notes, 1000) || null,
        reference_number: clamp(body.reference_number, 120) || null,
        document_url: clamp(body.document_url, 1000) || null,
        created_by: user.id,
      }).select().single()
      if (error) throw error
      await logAudit(supabase, user.id, 'create', 'farmer_loan', created.id, null, created, null)
    } else if (resource === 'repayment') {
      const bags = positiveNumber(body.bags, 'Bags')
      const pricePerBag = positiveNumber(body.price_per_bag, 'Price per bag')
      const { error } = await supabase.rpc('create_farmer_repayment_with_stock', {
        p_account_id: body.account_id,
        p_warehouse_id: body.warehouse_id,
        p_repayment_date: body.repayment_date || new Date().toISOString().slice(0, 10),
        p_bags: bags,
        p_price_per_bag: pricePerBag,
        p_notes: clamp(body.notes, 1000) || null,
        p_reference_number: clamp(body.reference_number, 120) || null,
        p_document_url: clamp(body.document_url, 1000) || null,
      })
      if (error) throw error
    } else if (resource === 'milling') {
      const paddyBags = positiveNumber(body.paddy_bags, 'Paddy bags')
      const milledBags = Number(body.milled_bags)
      if (!Number.isFinite(milledBags) || milledBags < 0) throw new Error('Milled bags must be 0 or greater')
      const { error } = await supabase.rpc('create_milling_batch_with_stock', {
        p_season_id: body.season_id,
        p_source_warehouse_id: body.source_warehouse_id,
        p_destination_warehouse_id: body.destination_warehouse_id,
        p_milling_date: body.milling_date || new Date().toISOString().slice(0, 10),
        p_paddy_bags: paddyBags,
        p_milled_bags: milledBags,
        p_notes: clamp(body.notes, 1000) || null,
        p_reference_number: clamp(body.reference_number, 120) || null,
        p_document_url: clamp(body.document_url, 1000) || null,
      })
      if (error) throw error
    } else if (resource === 'expense') {
      const { data: created, error } = await supabase.from('season_expenses').insert({
        season_id: body.season_id,
        expense_date: body.expense_date || new Date().toISOString().slice(0, 10),
        category: body.category || 'other',
        description: clamp(body.description, 500) || null,
        amount: positiveNumber(body.amount, 'Expense amount'),
        reference_number: clamp(body.reference_number, 120) || null,
        document_url: clamp(body.document_url, 1000) || null,
        created_by: user.id,
      }).select().single()
      if (error) throw error
      await logAudit(supabase, user.id, 'create', 'season_expense', created.id, null, created, null)
    } else if (resource === 'dispatch') {
      const bags = positiveNumber(body.bags, 'Bags')
      const { error } = await supabase.rpc('create_rice_dispatch_with_stock', {
        p_season_id: body.season_id,
        p_warehouse_id: body.warehouse_id,
        p_dispatch_date: body.dispatch_date || new Date().toISOString().slice(0, 10),
        p_bags: bags,
        p_sale_amount: body.sale_amount ? Number(body.sale_amount) : null,
        p_order_id: nullableUuid(body.order_id),
        p_invoice_id: nullableUuid(body.invoice_id),
        p_recipient: clamp(body.recipient, 200) || null,
        p_notes: clamp(body.notes, 1000) || null,
        p_reference_number: clamp(body.reference_number, 120) || null,
        p_document_url: clamp(body.document_url, 1000) || null,
      })
      if (error) throw error
    } else if (resource === 'document') {
      const title = clamp(body.title, 200)
      const file_url = clamp(body.file_url, 1000)
      if (!title || !file_url) throw new Error('Document title and URL are required')
      const { data: created, error } = await supabase.from('operation_documents').insert({
        resource_type: clamp(body.resource_type, 100),
        resource_id: nullableUuid(body.resource_id),
        farmer_id: nullableUuid(body.farmer_id),
        season_id: nullableUuid(body.season_id),
        document_type: body.document_type || 'other',
        title,
        file_url,
        storage_path: clamp(body.storage_path, 1000) || null,
        uploaded_by: user.id,
        updated_by: user.id,
      })
        .select()
        .single()
      if (error) throw error
      await logAudit(supabase, user.id, 'create', 'operation_document', created.id, null, created, null)
    } else {
      throw new Error('Unsupported operations resource')
    }

    return NextResponse.json(await fetchOperationsData(supabase), { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to save operations data' }, { status: 400 })
  }
}

export async function PATCH(req: NextRequest) {
  const { supabase, user, response } = await getAdminSupabase()
  if (!supabase) return response
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const resource = String(body.resource || '')
    const id = String(body.id || '')
    const table = editableTables[resource]
    if (!table || !id) throw new Error('Valid resource and ID are required')

    const { data: before } = await supabase
      .from(table)
      .select('*')
      .eq('id', id)
      .single()

    const updates = {
      ...updatesFor(resource, body),
      updated_by: user.id,
    }

    const { data: after, error } = await supabase
      .from(table)
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error

    await logAudit(supabase, user.id, 'update', resource, id, before, after, clamp(body.reason, 500) || null)

    return NextResponse.json(await fetchOperationsData(supabase))
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to update operations data' }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest) {
  const { supabase, user, response } = await getAdminSupabase()
  if (!supabase) return response
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const resource = searchParams.get('resource') || ''
    const id = searchParams.get('id') || ''
    if (resource === 'document') {
      const { data: before } = await supabase.from('operation_documents').select('*').eq('id', id).single()
      const { error } = await supabase.from('operation_documents').delete().eq('id', id)
      if (error) throw error
      await logAudit(supabase, user.id, 'delete', 'operation_document', id, before, null, 'Document metadata deleted')
      return NextResponse.json(await fetchOperationsData(supabase))
    }

    return NextResponse.json(
      { error: 'Hard delete is disabled for operations records. Use void with a reason instead.' },
      { status: 405 },
    )
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to delete operations data' }, { status: 400 })
  }
}
