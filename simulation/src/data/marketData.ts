import type { Asset } from './assets'

/**
 * Generates synthetic price series using Geometric Brownian Motion (GBM).
 *
 * The model: S(t+dt) = S(t) * exp((mu - sigma^2/2)*dt + sigma*sqrt(dt)*Z)
 * where Z ~ N(0,1)
 *
 * This produces realistic-looking price paths with the correct
 * statistical properties (log-normal distribution of prices).
 */

/** Box-Muller transform for generating standard normal random numbers */
function randn(): number {
  let u = 0
  let v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
}

/** Seeded random number generator for reproducible results */
class SeededRandom {
  private seed: number

  constructor(seed: number) {
    this.seed = seed
  }

  next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) & 0xffffffff
    return (this.seed >>> 0) / 0xffffffff
  }

  randn(): number {
    let u = 0
    let v = 0
    while (u === 0) u = this.next()
    while (v === 0) v = this.next()
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
  }
}

export interface PricePoint {
  month: number
  year: number
  date: string
  price: number
}

export interface MarketEventImpact {
  month: number
  driftShock: number
  volMultiplier: number
}

/**
 * Generate a price series for a single asset using GBM.
 *
 * @param asset - The asset definition with mu (annual drift) and sigma (annual vol)
 * @param months - Number of monthly data points to generate
 * @param startPrice - Starting price (default 100)
 * @param seed - Random seed for reproducibility
 * @param eventImpacts - Array of event impacts that modify drift/vol at specific months
 */
export function generatePriceSeries(
  asset: Asset,
  months: number = 240,
  startPrice: number = 100,
  seed: number = 42,
  eventImpacts: MarketEventImpact[] = [],
): PricePoint[] {
  const rng = new SeededRandom(seed + hashString(asset.id))
  const dt = 1 / 12 // monthly time step
  const prices: PricePoint[] = []

  let price = startPrice

  for (let i = 0; i <= months; i++) {
    const year = Math.floor(i / 12) + 1
    const month = (i % 12) + 1
    const date = `Y${year} M${month}`

    prices.push({ month: i, year, date, price: Math.round(price * 100) / 100 })

    if (i < months) {
      // Check for event impacts at this month
      let mu = asset.mu
      let sigma = asset.sigma
      const impact = eventImpacts.find((e) => e.month === i)
      if (impact) {
        mu += impact.driftShock
        sigma *= impact.volMultiplier
      }

      // GBM step
      const drift = (mu - (sigma * sigma) / 2) * dt
      const diffusion = sigma * Math.sqrt(dt) * rng.randn()
      price = price * Math.exp(drift + diffusion)

      // Floor at 1% of start price (prevent going to zero)
      price = Math.max(price, startPrice * 0.01)
    }
  }

  return prices
}

/**
 * Generate correlated price series for multiple assets.
 * Uses a simplified correlation approach where equity assets share
 * a common market factor.
 */
export function generateMarketData(
  assetList: Asset[],
  months: number = 240,
  seed: number = 42,
  eventImpacts: MarketEventImpact[] = [],
): Map<string, PricePoint[]> {
  const data = new Map<string, PricePoint[]>()

  for (const asset of assetList) {
    const series = generatePriceSeries(asset, months, 100, seed, eventImpacts)
    data.set(asset.id, series)
  }

  return data
}

/** Simple string hash for seed variation per asset */
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return Math.abs(hash)
}

/**
 * Calculate portfolio value at a given month based on allocations and price data.
 */
export function calculatePortfolioValue(
  allocations: Record<string, number>,
  marketData: Map<string, PricePoint[]>,
  month: number,
  initialCapital: number,
  monthlySavings: number = 0,
): number {
  let totalValue = 0

  for (const [assetId, weight] of Object.entries(allocations)) {
    if (weight <= 0) continue

    const prices = marketData.get(assetId)
    if (!prices || month >= prices.length) continue

    const startPrice = prices[0].price
    const currentPrice = prices[month].price
    const priceReturn = currentPrice / startPrice

    // Initial capital portion
    const initialPortion = initialCapital * (weight / 100) * priceReturn

    // Monthly savings portion (dollar-cost averaging)
    let savingsPortion = 0
    if (monthlySavings > 0) {
      for (let m = 1; m <= month; m++) {
        const buyPrice = prices[m].price
        const monthReturn = currentPrice / buyPrice
        savingsPortion += monthlySavings * (weight / 100) * monthReturn
      }
    }

    totalValue += initialPortion + savingsPortion
  }

  return totalValue
}

/**
 * Calculate total invested amount at a given month.
 */
export function calculateTotalInvested(
  initialCapital: number,
  monthlySavings: number,
  month: number,
): number {
  return initialCapital + monthlySavings * month
}
