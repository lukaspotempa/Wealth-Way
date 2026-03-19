/**
 * useSharpeRatio
 *
 * Composable that provides Sharpe Ratio calculation utilities and reactive
 * helpers for color-mapping the ratio to a visual quality band.
 *
 * Sharpe Ratio = (Portfolio Return − Risk-Free Rate) / Portfolio Std Dev
 *
 * Standard interpretation bands:
 *   < 0     → Very Poor   (deep red)
 *   0–0.5   → Poor        (red)
 *   0.5–1.0 → Acceptable  (orange)
 *   1.0–1.5 → Good        (yellow-green)
 *   1.5–2.0 → Very Good   (green)
 *   > 2.0   → Excellent   (deep green)
 */

import { computed, type Ref } from 'vue'
import type { SharpeRatingBand } from '@/types'

// ─── Rating bands (from worst to best) ───────────────────────────────────────

export const SHARPE_BANDS: SharpeRatingBand[] = [
  {
    min: -Infinity,
    max: 0,
    label: 'Very Poor',
    description: 'Your portfolio loses value relative to the risk you are taking. Even cash would be better.',
    color: '#dc2626',
    bgColor: '#fef2f2',
  },
  {
    min: 0,
    max: 0.5,
    label: 'Poor',
    description: 'The returns barely justify the risk. Consider reducing volatile assets or adding diversification.',
    color: '#ea580c',
    bgColor: '#fff7ed',
  },
  {
    min: 0.5,
    max: 1.0,
    label: 'Acceptable',
    description: 'You are earning a modest premium for the risk taken — a starting point, but room to improve.',
    color: '#d97706',
    bgColor: '#fffbeb',
  },
  {
    min: 1.0,
    max: 1.5,
    label: 'Good',
    description: 'Solid risk-adjusted return. Most professional fund managers target this range.',
    color: '#65a30d',
    bgColor: '#f7fee7',
  },
  {
    min: 1.5,
    max: 2.0,
    label: 'Very Good',
    description: 'Excellent risk-reward balance. Well-diversified portfolios with strong performance reach here.',
    color: '#16a34a',
    bgColor: '#f0fdf4',
  },
  {
    min: 2.0,
    max: Infinity,
    label: 'Excellent',
    description: 'Outstanding — top-tier risk-adjusted return. Rare in practice over long periods.',
    color: '#15803d',
    bgColor: '#dcfce7',
  },
]

// Dark-mode variants for bg colors
export const SHARPE_BANDS_DARK: SharpeRatingBand[] = [
  { ...SHARPE_BANDS[0]!, bgColor: 'rgba(220,38,38,0.15)' },
  { ...SHARPE_BANDS[1]!, bgColor: 'rgba(234,88,12,0.15)' },
  { ...SHARPE_BANDS[2]!, bgColor: 'rgba(217,119,6,0.15)' },
  { ...SHARPE_BANDS[3]!, bgColor: 'rgba(101,163,13,0.15)' },
  { ...SHARPE_BANDS[4]!, bgColor: 'rgba(22,163,74,0.15)' },
  { ...SHARPE_BANDS[5]!, bgColor: 'rgba(21,128,61,0.15)' },
]

// ─── Pure maths ──────────────────────────────────────────────────────────────

/**
 * Computes the arithmetic mean of an array of numbers.
 */
export function mean(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((s, v) => s + v, 0) / values.length
}

/**
 * Computes the population standard deviation of an array of numbers.
 * Uses sample std dev (N-1) for n >= 2, population (N) for n < 2.
 */
export function stdDev(values: number[]): number {
  if (values.length < 2) return 0
  const avg = mean(values)
  const squaredDiffs = values.map((v) => (v - avg) ** 2)
  const variance = squaredDiffs.reduce((s, v) => s + v, 0) / (values.length - 1)
  return Math.sqrt(variance)
}

/**
 * Calculates the Sharpe Ratio given a series of annual returns and
 * the corresponding risk-free rates for each year.
 *
 * Returns null when there is insufficient data (< 2 data points).
 */
export function calculateSharpeRatio(
  annualReturns: number[],
  riskFreeRates: number[],
): number | null {
  if (annualReturns.length < 2) return null

  // Excess returns per year
  const excess = annualReturns.map((r, i) => r - (riskFreeRates[i] ?? 0))
  const avgExcess = mean(excess)
  const vol = stdDev(excess)

  if (vol === 0) return null
  return avgExcess / vol
}

/**
 * Maximum drawdown: the largest peak-to-trough decline in a value series.
 * Returns a negative decimal, e.g. -0.35 = −35% drawdown.
 */
export function calculateMaxDrawdown(portfolioValues: number[]): number {
  if (portfolioValues.length < 2) return 0

  let peak = portfolioValues[0]!
  let maxDD = 0

  for (const value of portfolioValues) {
    if (value > peak) peak = value
    const dd = (value - peak) / peak
    if (dd < maxDD) maxDD = dd
  }

  return maxDD
}

/**
 * Compound Annual Growth Rate.
 */
export function calculateCAGR(startValue: number, endValue: number, years: number): number {
  if (years <= 0 || startValue <= 0) return 0
  return (endValue / startValue) ** (1 / years) - 1
}

// ─── Reactive composable ─────────────────────────────────────────────────────

/**
 * useSharpeRatio composable.
 *
 * @param sharpeRef  A reactive ref holding the current Sharpe Ratio value (null = insufficient data)
 * @param darkMode   Optional reactive boolean for dark mode color selection
 */
export function useSharpeRatio(sharpeRef: Ref<number | null>, darkMode?: Ref<boolean>) {
  const band = computed<SharpeRatingBand | null>(() => {
    const value = sharpeRef.value
    if (value === null) return null
    const bands = darkMode?.value ? SHARPE_BANDS_DARK : SHARPE_BANDS
    return bands.find((b) => value >= b.min && value < b.max) ?? bands[bands.length - 1]!
  })

  const color = computed<string>(() => band.value?.color ?? '#6b7280')

  const bgColor = computed<string>(() => band.value?.bgColor ?? 'transparent')

  const label = computed<string>(() => band.value?.label ?? '—')

  const description = computed<string>(() => band.value?.description ?? 'Not enough data to calculate Sharpe Ratio.')

  /** A 0–1 progress value for a visual gauge (clamped to reasonable bounds). */
  const gaugeProgress = computed<number>(() => {
    const value = sharpeRef.value
    if (value === null) return 0
    // Map from -1 → 0 to 3 → 1 linearly
    const clamped = Math.max(-1, Math.min(3, value))
    return (clamped + 1) / 4
  })

  /** CSS color string interpolated across the red→yellow→green spectrum. */
  const gaugeColor = computed<string>(() => {
    const p = gaugeProgress.value
    if (p < 0.25) return '#dc2626'
    if (p < 0.375) return '#ea580c'
    if (p < 0.5) return '#d97706'
    if (p < 0.625) return '#84cc16'
    if (p < 0.75) return '#16a34a'
    return '#15803d'
  })

  const formatted = computed<string>(() => {
    const value = sharpeRef.value
    if (value === null) return 'N/A'
    return value.toFixed(2)
  })

  return { band, color, bgColor, label, description, gaugeProgress, gaugeColor, formatted }
}
