/**
 * AutoBattle Engine
 *
 * Loads real historical price data from the CSV files in /public and
 * simulates portfolio performance year-by-year.
 *
 * CSV sources (all in /public):
 *   Market_Data - Equity Indices.csv   → SMI, EuroStoxx50, DJIA, Nikkei, DAX
 *   Market_Data - SMI_Single Stocks.csv → 20 Swiss blue-chips
 *   Market_Data - DJIA_Single Stocks.csv→ 30 US blue-chips
 *   Market_Data - Bonds.csv            → Swiss Bond AAA-BBB, Bloomberg Global Agg
 *   Market_Data - Gold.csv             → Gold in CHF
 *   Market_Data - FX.csv               → USDCHF, EURCHF (for currency context)
 *
 * Annual return is computed as:  (last_price_of_year / last_price_of_prev_year) - 1
 * Benchmarks: SMI (price return) is used as the local benchmark.
 * S&P 500 proxy: DJIA price-return (in USD).
 * MSCI World proxy: EuroStoxx50 price-return (in EUR).
 */

import type { AutoBattleAsset, AssetPerformance, AutoBattleResult, YearlyPortfolioSnapshot } from '@/types'
import {
  calculateSharpeRatio,
  calculateMaxDrawdown,
  calculateCAGR,
} from '@/composables/useSharpeRatio'

// ─── Types ────────────────────────────────────────────────────────────────────

/** Annual returns keyed by year string, e.g. { "2007": 0.12, "2008": -0.38 } */
type AnnualReturns = Record<string, number>

interface ParsedMarketData {
  /** Annual returns for every investable asset, keyed by asset key */
  assets: Record<string, AnnualReturns>
  /** Annual returns for benchmark assets */
  benchmarks: {
    SP500: AnnualReturns    // DJIA proxy
    MSCI_WORLD: AnnualReturns // EuroStoxx50 proxy
  }
  /** Rough Swiss inflation approximation (constant 1.2% — no inflation CSV available) */
  inflation: AnnualReturns
  /** Swiss 10-year bond yield used as risk-free rate proxy */
  riskFreeRate: AnnualReturns
  availableYears: number[]
}

// ─── Module-level cache ───────────────────────────────────────────────────────

let cachedData: ParsedMarketData | null = null

// ─── CSV parsing helpers ──────────────────────────────────────────────────────

/** Parse a date string like "17/2/2006" → Date */
function parseDate(s: string): Date | null {
  const parts = s.trim().split('/')
  if (parts.length !== 3) return null
  const d = parseInt(parts[0]!, 10)
  const m = parseInt(parts[1]!, 10) - 1
  const y = parseInt(parts[2]!, 10)
  if (isNaN(d) || isNaN(m) || isNaN(y)) return null
  return new Date(y, m, d)
}

/** Clean a price cell — strip spaces, commas, quotes. Returns null if #N/A or empty */
function parsePrice(raw: string): number | null {
  const s = raw.trim().replace(/[",\s]/g, '')
  if (!s || s === '#N/A' || s === 'N/A') return null
  const n = parseFloat(s)
  return isNaN(n) ? null : n
}

/**
 * Parse a CSV text where:
 *   - row 0 is a header (column names)
 *   - row 1 is optionally a ticker row (ignored)
 *   - remaining rows: date (col 0), then one value per column
 *
 * Returns a map: colName → { date → price }
 */
function parsePriceCSV(
  text: string,
  colNames: string[],
  hasTickerRow = false,
): Record<string, Record<string, number>> {
  const lines = text.split('\n').filter((l) => l.trim())
  const result: Record<string, Record<string, number>> = {}
  for (const name of colNames) result[name] = {}

  const dataStart = hasTickerRow ? 2 : 1

  for (let li = dataStart; li < lines.length; li++) {
    const line = lines[li]!
    // Split by comma, but respect quoted fields
    const cols = splitCSVLine(line)
    const dateStr = cols[0]?.trim() ?? ''
    const date = parseDate(dateStr)
    if (!date) continue
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

    for (let ci = 0; ci < colNames.length; ci++) {
      const name = colNames[ci]!
      const price = parsePrice(cols[ci + 1] ?? '')
      if (price !== null) {
        result[name]![dateKey] = price
      }
    }
  }

  return result
}

/** Minimal CSV line splitter (handles quoted fields with commas) */
function splitCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!
    if (ch === '"') {
      inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current)
  return result
}

/**
 * Given a daily price series (dateKey → price), compute annual returns.
 * Uses the last available price of each year as the year-end value.
 */
function computeAnnualReturns(daily: Record<string, number>): AnnualReturns {
  // Group by year, find last date
  const byYear: Record<number, { date: string; price: number }[]> = {}
  for (const [dateKey, price] of Object.entries(daily)) {
    const year = parseInt(dateKey.substring(0, 4), 10)
    if (!byYear[year]) byYear[year] = []
    byYear[year]!.push({ date: dateKey, price })
  }

  // Sort each year's entries and pick the last one
  const yearEndPrices: Record<number, number> = {}
  for (const [yearStr, entries] of Object.entries(byYear)) {
    entries.sort((a, b) => a.date.localeCompare(b.date))
    const last = entries[entries.length - 1]!
    yearEndPrices[parseInt(yearStr, 10)] = last.price
  }

  const sortedYears = Object.keys(yearEndPrices)
    .map(Number)
    .sort((a, b) => a - b)

  const returns: AnnualReturns = {}
  for (let i = 1; i < sortedYears.length; i++) {
    const y = sortedYears[i]!
    const prevY = sortedYears[i - 1]!
    const p = yearEndPrices[y]!
    const prev = yearEndPrices[prevY]!
    if (prev > 0) {
      returns[String(y)] = (p - prev) / prev
    }
  }
  return returns
}

// ─── Data loading ─────────────────────────────────────────────────────────────

async function fetchText(path: string): Promise<string> {
  const res = await fetch(path)
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`)
  return res.text()
}

async function loadMarketData(): Promise<ParsedMarketData> {
  if (cachedData) return cachedData

  const [equityText, bondsText, goldText, smiStocksText, djiaStocksText] = await Promise.all([
    fetchText('/Market_Data - Equity Indices.csv'),
    fetchText('/Market_Data - Bonds.csv'),
    fetchText('/Market_Data - Gold.csv'),
    fetchText('/Market_Data - SMI_Single Stocks.csv'),
    fetchText('/Market_Data - DJIA_Single Stocks.csv'),
  ])

  // ── Equity Indices ────────────────────────────────────────────────────────
  // Header: ,SMI (Price Return),EuroStoxx 50,Dow Jones Industrial Average,...,DAX
  const equityNames = ['SMI_INDEX', 'EUROSTOXX50', 'DJIA_INDEX', 'NIKKEI', 'DAX']
  const equityDaily = parsePriceCSV(equityText, equityNames, false)

  // ── Bonds ────────────────────────────────────────────────────────────────
  // Header: ,Swiss Bond AAA-BBB (TRI), Bloomberg Global Agg (TRI, CHF hedged), CH Gov 10Y Yield
  const bondNames = ['SWISS_BOND_TRI', 'BLOOMBERG_GLOBAL_AGG', 'CH_GOV_10Y_YIELD']
  const bondsDaily = parsePriceCSV(bondsText, bondNames, false)

  // ── Gold ─────────────────────────────────────────────────────────────────
  // Header: Gold (NY),in USD,in CHF
  const goldNames = ['GOLD_USD', 'GOLD_CHF']
  const goldDaily = parsePriceCSV(goldText, goldNames, false)

  // ── SMI Single Stocks ────────────────────────────────────────────────────
  // Row 0: Company names, Row 1: Tickers → hasTickerRow = true
  const smiStockTickers = [
    'LOGN', 'AMRZ', 'ALC', 'UBSG', 'SREN', 'CFR', 'SLHN', 'PGHN',
    'LONN', 'KNIN', 'SIKA', 'NESN', 'HOLN', 'ROG', 'ABBN', 'NOVN',
    'ZURN', 'GIVN', 'GEBN', 'SCMN',
  ]
  const smiStocksDaily = parsePriceCSV(smiStocksText, smiStockTickers, true)

  // ── DJIA Single Stocks ────────────────────────────────────────────────────
  const djiaStockTickers = [
    'GS', 'CAT', 'MSFT', 'HD', 'SHW', 'AMGN', 'AXP', 'MCD', 'V',
    'JPM', 'TRV', 'UNH', 'IBM', 'AAPL', 'JNJ', 'BA', 'HON', 'AMZN',
    'CRM', 'CVX', 'NVDA', 'MMM', 'PG', 'WMT', 'MRK', 'DIS', 'KO',
    'CSCO', 'NKE', 'VZ',
  ]
  const djiaStocksDaily = parsePriceCSV(djiaStocksText, djiaStockTickers, true)

  // ── Compute annual returns ────────────────────────────────────────────────
  const assets: Record<string, AnnualReturns> = {}

  // Index-based assets
  for (const name of equityNames) {
    assets[name] = computeAnnualReturns(equityDaily[name]!)
  }
  // Bond TRI assets
  assets['SWISS_BOND_TRI'] = computeAnnualReturns(bondsDaily['SWISS_BOND_TRI']!)
  assets['BLOOMBERG_GLOBAL_AGG'] = computeAnnualReturns(bondsDaily['BLOOMBERG_GLOBAL_AGG']!)

  // Gold
  assets['GOLD_CHF'] = computeAnnualReturns(goldDaily['GOLD_CHF']!)

  // SMI stocks
  for (const ticker of smiStockTickers) {
    assets[ticker] = computeAnnualReturns(smiStocksDaily[ticker]!)
  }
  // DJIA stocks
  for (const ticker of djiaStockTickers) {
    assets[ticker] = computeAnnualReturns(djiaStocksDaily[ticker]!)
  }

  // ── Risk-free rate: Swiss 10Y yield converted from % to decimal ────────────
  const riskFreeRate: AnnualReturns = {}
  const yieldDaily = bondsDaily['CH_GOV_10Y_YIELD']!
  const yieldByYear = groupByYear(yieldDaily)
  for (const [year, vals] of Object.entries(yieldByYear)) {
    const avg = vals.reduce((s, v) => s + v, 0) / vals.length
    riskFreeRate[year] = avg / 100 // percent → decimal
  }

  // ── Approximate Swiss inflation (SNB historical avg ≈ 0.8% p.a. 2006-2025) ─
  const inflation: AnnualReturns = {}
  // Rough annual values from SNB data
  const snbInflation: Record<string, number> = {
    '2007': 0.007, '2008': 0.023, '2009': -0.005, '2010': 0.007,
    '2011': 0.002, '2012': -0.007, '2013': -0.002, '2014': 0.000,
    '2015': -0.011, '2016': -0.004, '2017': 0.005, '2018': 0.009,
    '2019': 0.004, '2020': -0.007, '2021': 0.006, '2022': 0.029,
    '2023': 0.021, '2024': 0.012, '2025': 0.009,
  }
  Object.assign(inflation, snbInflation)

  // ── Available years: find common years across all assets ──────────────────
  const allYearSets = Object.values(assets).map((r) =>
    new Set(Object.keys(r).map(Number)),
  )
  // Find years present in at least one major index
  const smiYears = new Set(Object.keys(assets['SMI_INDEX'] ?? {}).map(Number))
  const availableYears = Array.from(smiYears).sort((a, b) => a - b)

  cachedData = {
    assets,
    benchmarks: {
      SP500: assets['DJIA_INDEX']!,
      MSCI_WORLD: assets['EUROSTOXX50']!,
    },
    inflation,
    riskFreeRate,
    availableYears,
  }

  return cachedData
}

function groupByYear(daily: Record<string, number>): Record<string, number[]> {
  const result: Record<string, number[]> = {}
  for (const [dateKey, val] of Object.entries(daily)) {
    const y = dateKey.substring(0, 4)
    if (!result[y]) result[y] = []
    result[y]!.push(val)
  }
  return result
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Available year range — determined at runtime from CSV data.
 * This is a conservative constant; the actual range is 2007-2025.
 */
export const AVAILABLE_YEARS = { min: 2007, max: 2025 }

/**
 * Run the full autobattle simulation.
 *
 * @param assets          Player's portfolio (allocations must sum to 100)
 * @param startingCapital Initial investment amount in CHF
 * @param startYear       First year of the simulation
 * @param endYear         Last year of the simulation (inclusive)
 * @param onSnapshot      Async callback called after each year — AWAITED so
 *                        callers can insert delays for animation
 */
export async function runSimulation(
  assets: AutoBattleAsset[],
  startingCapital: number,
  startYear: number,
  endYear: number,
  onSnapshot?: (snapshot: YearlyPortfolioSnapshot, yearIndex: number) => Promise<void>,
): Promise<AutoBattleResult> {
  const data = await loadMarketData()

  const years: number[] = []
  for (let y = startYear; y <= endYear; y++) years.push(y)

  // Portfolio value timeline
  let portfolioValue = startingCapital
  let sp500Value = startingCapital
  let msciValue = startingCapital
  let inflationValue = startingCapital

  // Rolling tracking arrays for Sharpe calculation
  const portfolioAnnualReturns: number[] = []
  const riskFreeRateHistory: number[] = []

  // All portfolio values for max-drawdown tracking
  const allPortfolioValues: number[] = [startingCapital]

  const snapshots: YearlyPortfolioSnapshot[] = []

  // Per-asset compounding value tracker (tracks the portion of capital each asset holds)
  // Starting value for each asset = startingCapital * (allocation / 100)
  const assetValues: Record<string, number> = {}
  for (const asset of assets) {
    if (asset.allocation > 0) {
      assetValues[asset.key] = startingCapital * (asset.allocation / 100)
    }
  }

  for (let i = 0; i < years.length; i++) {
    const year = years[i]!
    const yearStr = String(year)

    // ── Compute portfolio return for this year ──────────────────────────────
    let portfolioYearReturn = 0
    for (const asset of assets) {
      if (asset.allocation <= 0) continue
      const assetReturns = data.assets[asset.key]
      if (!assetReturns) continue
      const assetReturn = assetReturns[yearStr] ?? 0
      portfolioYearReturn += (asset.allocation / 100) * assetReturn
      // Compound each asset's slice independently
      assetValues[asset.key] = (assetValues[asset.key] ?? 0) * (1 + assetReturn)
    }

    // ── Update values ────────────────────────────────────────────────────────
    portfolioValue *= 1 + portfolioYearReturn
    sp500Value *= 1 + (data.benchmarks.SP500[yearStr] ?? 0)
    msciValue *= 1 + (data.benchmarks.MSCI_WORLD[yearStr] ?? 0)
    inflationValue *= 1 + (data.inflation[yearStr] ?? 0.012)

    allPortfolioValues.push(portfolioValue)
    portfolioAnnualReturns.push(portfolioYearReturn)
    riskFreeRateHistory.push(data.riskFreeRate[yearStr] ?? 0.005)

    // ── Rolling Sharpe ───────────────────────────────────────────────────────
    const rollingSharp = calculateSharpeRatio(portfolioAnnualReturns, riskFreeRateHistory)

    const snapshot: YearlyPortfolioSnapshot = {
      year,
      portfolioValue: Math.round(portfolioValue * 100) / 100,
      portfolioReturn: portfolioYearReturn,
      sp500Value: Math.round(sp500Value * 100) / 100,
      msciWorldValue: Math.round(msciValue * 100) / 100,
      inflationValue: Math.round(inflationValue * 100) / 100,
      sharpeRatio: rollingSharp !== null ? Math.round(rollingSharp * 1000) / 1000 : null,
      cumulativeReturn: (portfolioValue - startingCapital) / startingCapital,
    }

    snapshots.push(snapshot)

    // ── Await the snapshot callback (allows 2-second animation delay) ────────
    if (onSnapshot) {
      await onSnapshot(snapshot, i)
    }
  }

  // ── Final statistics ──────────────────────────────────────────────────────
  const totalYears = years.length
  const finalPortfolioValue = portfolioValue
  const finalSP500Value = sp500Value
  const finalMSCIValue = msciValue

  const annualizedReturn = calculateCAGR(startingCapital, finalPortfolioValue, totalYears)
  const volatility = stdDev(portfolioAnnualReturns)
  const overallSharp = calculateSharpeRatio(portfolioAnnualReturns, riskFreeRateHistory)
  const maxDrawdown = calculateMaxDrawdown(allPortfolioValues)

  // ── Per-asset performance breakdown ──────────────────────────────────────
  const assetPerformances: AssetPerformance[] = assets
    .filter((a) => a.allocation > 0)
    .map((a) => {
      const initialSlice = startingCapital * (a.allocation / 100)
      const finalSlice = assetValues[a.key] ?? initialSlice
      const totalReturnDecimal = (finalSlice - initialSlice) / initialSlice
      const absoluteGainCHF = Math.round((finalSlice - initialSlice) * 100) / 100
      return {
        key: a.key,
        name: a.name,
        ticker: a.ticker,
        color: a.color,
        allocation: a.allocation,
        totalReturnDecimal,
        absoluteGainCHF,
      } satisfies AssetPerformance
    })
    .sort((a, b) => b.totalReturnDecimal - a.totalReturnDecimal)

  return {
    startYear,
    endYear,
    startingCapital,
    snapshots,
    finalPortfolioValue: Math.round(finalPortfolioValue * 100) / 100,
    finalSP500Value: Math.round(finalSP500Value * 100) / 100,
    finalMSCIValue: Math.round(finalMSCIValue * 100) / 100,
    annualizedReturn,
    volatility,
    sharpeRatio: overallSharp,
    maxDrawdown,
    beatSP500: finalPortfolioValue > finalSP500Value,
    beatMSCI: finalPortfolioValue > finalMSCIValue,
    beatInflation: finalPortfolioValue > inflationValue,
    assetPerformances,
  }
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function stdDev(values: number[]): number {
  if (values.length < 2) return 0
  const avg = values.reduce((s, v) => s + v, 0) / values.length
  const squaredDiffs = values.map((v) => (v - avg) ** 2)
  const variance = squaredDiffs.reduce((s, v) => s + v, 0) / (values.length - 1)
  return Math.sqrt(variance)
}
