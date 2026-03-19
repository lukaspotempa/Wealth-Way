/**
 * AutoBattle Engine
 *
 * Loads the historical market data JSON and simulates portfolio performance
 * year-by-year using real historical returns.
 *
 * The engine:
 *  1. Accepts a weighted portfolio of assets (allocations sum to 100)
 *  2. Applies real historical annual returns for each asset year by year
 *  3. Calculates a rolling Sharpe Ratio using all years seen so far
 *  4. Returns a full timeline of snapshots + summary statistics
 */

import type { AutoBattleAsset, AutoBattleResult, YearlyPortfolioSnapshot } from '@/types'
import {
  calculateSharpeRatio,
  calculateMaxDrawdown,
  calculateCAGR,
} from '@/composables/useSharpeRatio'

// ─── Types matching the JSON file structure ───────────────────────────────────

interface AssetHistoricalData {
  name: string
  description: string
  category: string
  color: string
  isIndex: boolean
  annualReturns: Record<string, number>
}

interface MarketHistoryData {
  _meta: {
    description: string
    years: string
  }
  riskFreeRate: { data: Record<string, number> }
  inflation: { data: Record<string, number> }
  assets: Record<string, AssetHistoricalData>
  benchmarks: { SP500: string; MSCI_WORLD: string }
}

// ─── Module-level cache ───────────────────────────────────────────────────────

let cachedData: MarketHistoryData | null = null

async function loadMarketData(): Promise<MarketHistoryData> {
  if (cachedData) return cachedData

  const response = await fetch('/data/market-history.json')
  if (!response.ok) {
    throw new Error(`Failed to load market data: ${response.status} ${response.statusText}`)
  }

  cachedData = (await response.json()) as MarketHistoryData
  return cachedData
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Available year range from the dataset */
export const AVAILABLE_YEARS = { min: 2000, max: 2023 }

/**
 * Maps the AutoBattleAsset key to the corresponding key in market-history.json.
 */
const ASSET_KEY_MAP: Record<string, string> = {
  SMI: 'SMI',
  BONDS_CHF: 'BONDS_CHF',
  GLOBAL_ETF: 'GLOBAL_ETF',
  REAL_ESTATE: 'REAL_ESTATE',
  EMERGING_MARKETS: 'EMERGING_MARKETS',
  CASH: 'CASH',
}

/**
 * Run the full autobattle simulation.
 *
 * @param assets          Player's portfolio (allocations must sum to 100)
 * @param startingCapital Initial investment amount in CHF
 * @param startYear       First year of the simulation
 * @param endYear         Last year of the simulation (inclusive)
 * @param onSnapshot      Optional callback called after each year is processed
 *                        (used for animated reveal during playback)
 */
export async function runSimulation(
  assets: AutoBattleAsset[],
  startingCapital: number,
  startYear: number,
  endYear: number,
  onSnapshot?: (snapshot: YearlyPortfolioSnapshot, yearIndex: number) => void,
): Promise<AutoBattleResult> {
  const data = await loadMarketData()

  const years: number[] = []
  for (let y = startYear; y <= endYear; y++) years.push(y)

  // Portfolio value timeline
  let portfolioValue = startingCapital
  let sp500Value = startingCapital
  let msciValue = startingCapital
  let inflationValue = startingCapital // nominal cash (inflation-eroded benchmark)

  // Rolling tracking arrays for Sharpe calculation
  const portfolioAnnualReturns: number[] = []
  const riskFreeRateHistory: number[] = []

  // Peak value for max drawdown
  const allPortfolioValues: number[] = [startingCapital]

  const snapshots: YearlyPortfolioSnapshot[] = []

  for (let i = 0; i < years.length; i++) {
    const year = years[i]!
    const yearStr = String(year)

    // ── Compute portfolio return for this year ──────────────────────────────
    let portfolioYearReturn = 0
    for (const asset of assets) {
      if (asset.allocation <= 0) continue
      const dataKey = ASSET_KEY_MAP[asset.key]
      if (!dataKey) continue
      const assetData = data.assets[dataKey]
      if (!assetData) continue
      const assetReturn = assetData.annualReturns[yearStr] ?? 0
      portfolioYearReturn += (asset.allocation / 100) * assetReturn
    }

    // ── Update values ────────────────────────────────────────────────────────
    portfolioValue *= 1 + portfolioYearReturn
    sp500Value *= 1 + (data.assets['SP500']?.annualReturns[yearStr] ?? 0)
    msciValue *= 1 + (data.assets['MSCI_WORLD']?.annualReturns[yearStr] ?? 0)
    inflationValue *= 1 + (data.inflation.data[yearStr] ?? 0.02)

    allPortfolioValues.push(portfolioValue)
    portfolioAnnualReturns.push(portfolioYearReturn)
    riskFreeRateHistory.push(data.riskFreeRate.data[yearStr] ?? 0)

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
    onSnapshot?.(snapshot, i)
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
  }
}

// Local helper (duplicated from composable to keep the service self-contained)
function stdDev(values: number[]): number {
  if (values.length < 2) return 0
  const avg = values.reduce((s, v) => s + v, 0) / values.length
  const squaredDiffs = values.map((v) => (v - avg) ** 2)
  const variance = squaredDiffs.reduce((s, v) => s + v, 0) / (values.length - 1)
  return Math.sqrt(variance)
}
