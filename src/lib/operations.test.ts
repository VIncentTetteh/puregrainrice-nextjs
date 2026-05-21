import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  calculateFarmerSeasonAccount,
  calculateSeasonReport,
  calculateWarehouseBalances,
  hasAvailableStock,
} from './operations'

describe('operations calculations', () => {
  it('marks a farmer season account outstanding until rice repayments cover loans', () => {
    const account = calculateFarmerSeasonAccount({
      loans: [
        { amount: 1000 },
        { amount: 500 },
      ],
      repayments: [
        { bags: 10, price_per_bag: 100 },
        { bags: 2, price_per_bag: 100 },
      ],
    })

    assert.equal(account.loanTotal, 1500)
    assert.equal(account.repaymentTotal, 1200)
    assert.equal(account.balance, 300)
    assert.equal(account.status, 'outstanding')
  })

  it('marks a farmer season account settled when repayment value reaches loan total', () => {
    const account = calculateFarmerSeasonAccount({
      loans: [{ amount: 1500 }],
      repayments: [{ bags: 15, price_per_bag: 100 }],
    })

    assert.equal(account.balance, 0)
    assert.equal(account.status, 'settled')
  })

  it('calculates warehouse stock by season, warehouse, and stock type', () => {
    const balances = calculateWarehouseBalances([
      { warehouse_id: 'w1', season_id: 's1', stock_type: 'paddy', movement_type: 'received', bags: 100 },
      { warehouse_id: 'w1', season_id: 's1', stock_type: 'paddy', movement_type: 'milled_out', bags: 40 },
      { warehouse_id: 'w1', season_id: 's1', stock_type: 'milled', movement_type: 'milled_in', bags: 25 },
      { warehouse_id: 'w1', season_id: 's1', stock_type: 'milled', movement_type: 'dispatched', bags: 10 },
      { warehouse_id: 'w2', season_id: 's1', stock_type: 'paddy', movement_type: 'adjustment', bags: -5 },
    ])

    assert.deepEqual(balances, [
      { warehouse_id: 'w1', season_id: 's1', paddyBags: 60, milledBags: 15, totalBags: 75 },
      { warehouse_id: 'w2', season_id: 's1', paddyBags: -5, milledBags: 0, totalBags: -5 },
    ])
  })

  it('calculates season report totals and profit', () => {
    const report = calculateSeasonReport({
      loans: [{ amount: 1000 }, { amount: 750 }],
      repayments: [{ bags: 12, price_per_bag: 100 }],
      expenses: [{ amount: 200 }, { amount: 50 }],
      millingBatches: [{ paddy_bags: 20, milled_bags: 13 }],
      dispatches: [{ bags: 8, sale_amount: 1600 }, { bags: 3, sale_amount: null }],
      stockMovements: [
        { warehouse_id: 'w1', season_id: 's1', stock_type: 'paddy', movement_type: 'received', bags: 30 },
        { warehouse_id: 'w1', season_id: 's1', stock_type: 'paddy', movement_type: 'milled_out', bags: 20 },
        { warehouse_id: 'w1', season_id: 's1', stock_type: 'milled', movement_type: 'milled_in', bags: 13 },
        { warehouse_id: 'w1', season_id: 's1', stock_type: 'milled', movement_type: 'dispatched', bags: 8 },
      ],
    })

    assert.equal(report.totalInvested, 1750)
    assert.equal(report.repaymentValue, 1200)
    assert.equal(report.paddyBagsReceived, 30)
    assert.equal(report.paddyBagsMilled, 20)
    assert.equal(report.milledBagsProduced, 13)
    assert.equal(report.milledBagsDispatched, 11)
    assert.equal(report.expensesTotal, 250)
    assert.equal(report.revenueTotal, 1600)
    assert.equal(report.profit, -400)
  })

  it('ignores voided loans and repayments in farmer settlement', () => {
    const account = calculateFarmerSeasonAccount({
      loans: [
        { amount: 1000 },
        { amount: 500, voided_at: '2026-05-21T10:00:00Z' },
      ],
      repayments: [
        { bags: 8, price_per_bag: 100 },
        { bags: 10, price_per_bag: 100, voided_at: '2026-05-21T10:00:00Z' },
      ],
    })

    assert.equal(account.loanTotal, 1000)
    assert.equal(account.repaymentTotal, 800)
    assert.equal(account.balance, 200)
    assert.equal(account.status, 'outstanding')
  })

  it('uses reversal stock movements to restore balances after voids', () => {
    const balances = calculateWarehouseBalances([
      { warehouse_id: 'w1', season_id: 's1', stock_type: 'milled', movement_type: 'milled_in', bags: 20 },
      { warehouse_id: 'w1', season_id: 's1', stock_type: 'milled', movement_type: 'dispatched', bags: 8 },
      { warehouse_id: 'w1', season_id: 's1', stock_type: 'milled', movement_type: 'adjustment', bags: 8, source_type: 'reversal' },
    ])

    assert.equal(balances[0].milledBags, 20)
  })

  it('checks warehouse stock availability for milling and dispatch', () => {
    const balances = calculateWarehouseBalances([
      { warehouse_id: 'w1', season_id: 's1', stock_type: 'paddy', movement_type: 'received', bags: 30 },
      { warehouse_id: 'w1', season_id: 's1', stock_type: 'milled', movement_type: 'milled_in', bags: 12 },
    ])

    assert.equal(hasAvailableStock(balances, 'w1', 's1', 'paddy', 25), true)
    assert.equal(hasAvailableStock(balances, 'w1', 's1', 'paddy', 31), false)
    assert.equal(hasAvailableStock(balances, 'w1', 's1', 'milled', 13), false)
  })

  it('separates linked revenue and manual dispatch revenue in season profit', () => {
    const report = calculateSeasonReport({
      loans: [{ amount: 1000 }],
      repayments: [],
      expenses: [{ amount: 150 }],
      millingBatches: [],
      dispatches: [
        { bags: 5, sale_amount: 900, order_total: 1000, invoice_total: null },
        { bags: 3, sale_amount: 450, order_total: null, invoice_total: null },
      ],
      stockMovements: [],
    })

    assert.equal(report.linkedRevenueTotal, 1000)
    assert.equal(report.manualRevenueTotal, 450)
    assert.equal(report.revenueTotal, 1450)
    assert.equal(report.profit, 300)
  })
})
