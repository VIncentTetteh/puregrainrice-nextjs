export type FarmerAccountStatus = 'settled' | 'outstanding'
export type StockType = 'paddy' | 'milled'
export type StockMovementType = 'received' | 'milled_out' | 'milled_in' | 'dispatched' | 'adjustment'

export interface MoneyEntry {
  amount: number | string | null
  voided_at?: string | null
}

export interface RepaymentEntry {
  bags: number | string | null
  price_per_bag: number | string | null
  voided_at?: string | null
}

export interface StockMovementEntry {
  warehouse_id: string
  season_id: string
  stock_type: StockType
  movement_type: StockMovementType
  bags: number | string | null
  source_type?: string | null
  voided_at?: string | null
}

export interface MillingBatchEntry {
  paddy_bags: number | string | null
  milled_bags: number | string | null
  voided_at?: string | null
}

export interface DispatchEntry {
  bags: number | string | null
  sale_amount: number | string | null
  order_total?: number | string | null
  invoice_total?: number | string | null
  voided_at?: string | null
}

export interface FarmerSeasonAccountInput {
  loans: MoneyEntry[]
  repayments: RepaymentEntry[]
}

export interface FarmerSeasonAccountSummary {
  loanTotal: number
  repaymentTotal: number
  balance: number
  status: FarmerAccountStatus
}

export interface WarehouseBalance {
  warehouse_id: string
  season_id: string
  paddyBags: number
  milledBags: number
  totalBags: number
}

export interface SeasonReportInput {
  loans: MoneyEntry[]
  repayments: RepaymentEntry[]
  expenses: MoneyEntry[]
  millingBatches: MillingBatchEntry[]
  dispatches: DispatchEntry[]
  stockMovements: StockMovementEntry[]
}

export interface SeasonReportSummary {
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

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function toNumber(value: number | string | null | undefined): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function isActiveRecord(record: { voided_at?: string | null }): boolean {
  return !record.voided_at
}

export function calculateFarmerSeasonAccount(input: FarmerSeasonAccountInput): FarmerSeasonAccountSummary {
  const activeLoans = input.loans.filter(isActiveRecord)
  const activeRepayments = input.repayments.filter(isActiveRecord)
  const loanTotal = roundMoney(activeLoans.reduce((sum, loan) => sum + toNumber(loan.amount), 0))
  const repaymentTotal = roundMoney(
    activeRepayments.reduce((sum, repayment) => {
      return sum + (toNumber(repayment.bags) * toNumber(repayment.price_per_bag))
    }, 0),
  )
  const balance = roundMoney(loanTotal - repaymentTotal)

  return {
    loanTotal,
    repaymentTotal,
    balance,
    status: balance <= 0 ? 'settled' : 'outstanding',
  }
}

function signedMovementBags(movement: StockMovementEntry): number {
  const bags = toNumber(movement.bags)
  switch (movement.movement_type) {
    case 'milled_out':
    case 'dispatched':
      return -Math.abs(bags)
    case 'adjustment':
      return bags
    case 'received':
    case 'milled_in':
    default:
      return Math.abs(bags)
  }
}

export function calculateWarehouseBalances(movements: StockMovementEntry[]): WarehouseBalance[] {
  const balances = new Map<string, WarehouseBalance>()

  for (const movement of movements.filter(isActiveRecord)) {
    const key = `${movement.warehouse_id}:${movement.season_id}`
    const current = balances.get(key) || {
      warehouse_id: movement.warehouse_id,
      season_id: movement.season_id,
      paddyBags: 0,
      milledBags: 0,
      totalBags: 0,
    }
    const signedBags = signedMovementBags(movement)
    if (movement.stock_type === 'paddy') current.paddyBags += signedBags
    if (movement.stock_type === 'milled') current.milledBags += signedBags
    current.totalBags = current.paddyBags + current.milledBags
    balances.set(key, current)
  }

  return Array.from(balances.values()).sort((a, b) => {
    const warehouseCompare = a.warehouse_id.localeCompare(b.warehouse_id)
    return warehouseCompare || a.season_id.localeCompare(b.season_id)
  })
}

export function hasAvailableStock(
  balances: WarehouseBalance[],
  warehouseId: string,
  seasonId: string,
  stockType: StockType,
  requestedBags: number | string | null,
): boolean {
  const requested = toNumber(requestedBags)
  const balance = balances.find(item => item.warehouse_id === warehouseId && item.season_id === seasonId)
  const available = stockType === 'paddy' ? balance?.paddyBags || 0 : balance?.milledBags || 0
  return requested > 0 && available >= requested
}

export function calculateSeasonReport(input: SeasonReportInput): SeasonReportSummary {
  const activeLoans = input.loans.filter(isActiveRecord)
  const activeRepayments = input.repayments.filter(isActiveRecord)
  const activeExpenses = input.expenses.filter(isActiveRecord)
  const activeMillingBatches = input.millingBatches.filter(isActiveRecord)
  const activeDispatches = input.dispatches.filter(isActiveRecord)
  const activeStockMovements = input.stockMovements.filter(isActiveRecord)

  const totalInvested = roundMoney(activeLoans.reduce((sum, loan) => sum + toNumber(loan.amount), 0))
  const repaymentValue = roundMoney(
    activeRepayments.reduce((sum, repayment) => sum + (toNumber(repayment.bags) * toNumber(repayment.price_per_bag)), 0),
  )
  const repaymentBags = activeRepayments.reduce((sum, repayment) => sum + toNumber(repayment.bags), 0)
  const paddyBagsReceived = activeStockMovements
    .filter(movement => movement.stock_type === 'paddy' && movement.movement_type === 'received')
    .reduce((sum, movement) => sum + Math.abs(toNumber(movement.bags)), 0)
  const paddyBagsMilled = activeMillingBatches.reduce((sum, batch) => sum + toNumber(batch.paddy_bags), 0)
  const milledBagsProduced = activeMillingBatches.reduce((sum, batch) => sum + toNumber(batch.milled_bags), 0)
  const milledBagsDispatched = activeDispatches.reduce((sum, dispatch) => sum + toNumber(dispatch.bags), 0)
  const expensesTotal = roundMoney(activeExpenses.reduce((sum, expense) => sum + toNumber(expense.amount), 0))
  const linkedRevenueTotal = roundMoney(activeDispatches.reduce((sum, dispatch) => {
    return sum + (toNumber(dispatch.order_total) || toNumber(dispatch.invoice_total))
  }, 0))
  const manualRevenueTotal = roundMoney(activeDispatches.reduce((sum, dispatch) => {
    if (toNumber(dispatch.order_total) || toNumber(dispatch.invoice_total)) return sum
    return sum + toNumber(dispatch.sale_amount)
  }, 0))
  const revenueTotal = roundMoney(linkedRevenueTotal + manualRevenueTotal)
  const profit = roundMoney(revenueTotal - totalInvested - expensesTotal)

  return {
    totalInvested,
    repaymentValue,
    repaymentBags,
    paddyBagsReceived,
    paddyBagsMilled,
    milledBagsProduced,
    milledBagsDispatched,
    expensesTotal,
    linkedRevenueTotal,
    manualRevenueTotal,
    revenueTotal,
    profit,
    warehouseBalances: calculateWarehouseBalances(activeStockMovements),
  }
}
