import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { loadAllMarketData, sliceToYear, normalizeSeries, type MarketDataset, type PricePoint } from '@/utils/csvParser'
import { ASSETS } from '@/utils/gameConstants'

const TICK_MS = 80       // ms per trading day → full year (~250 days) in ~20 seconds
const DAYS_PER_TICK = 1  // advance this many days per tick

export const useMarketStore = defineStore('market', () => {
  const allData = ref<MarketDataset>({})
  const isLoaded = ref(false)
  const isLoading = ref(false)

  // Per-round state
  const currentYearData = ref<Record<string, PricePoint[]>>({})  // normalized to 100
  const rawYearData = ref<Record<string, PricePoint[]>>({})       // actual prices
  const simulationIndex = ref(0)
  const isPlaying = ref(false)
  const currentYear = ref(0)

  let tickInterval: ReturnType<typeof setInterval> | null = null
  let onRoundEndCallback: (() => void) | null = null

  // ── Computed ──────────────────────────────────────────────────────────────

  const totalDays = computed(() => {
    const first = Object.values(currentYearData.value)[0]
    return first?.length ?? 0
  })

  const progress = computed(() =>
    totalDays.value > 0 ? simulationIndex.value / totalDays.value : 0
  )

  /** Current slice of each asset's data up to simulationIndex */
  const visibleData = computed<Record<string, PricePoint[]>>(() => {
    const result: Record<string, PricePoint[]> = {}
    const idx = Math.min(simulationIndex.value, totalDays.value)
    for (const [id, points] of Object.entries(currentYearData.value)) {
      result[id] = points.slice(0, idx)
    }
    return result
  })

  /** Latest normalized price for each asset */
  const currentPrices = computed<Record<string, number>>(() => {
    const result: Record<string, number> = {}
    const idx = Math.max(0, Math.min(simulationIndex.value, totalDays.value) - 1)
    for (const [id, points] of Object.entries(currentYearData.value)) {
      result[id] = points[idx]?.value ?? 100
    }
    return result
  })

  /** YTD return for each asset: (currentPrice - 100) / 100 */
  const ytdReturns = computed<Record<string, number>>(() => {
    const result: Record<string, number> = {}
    for (const [id, price] of Object.entries(currentPrices.value)) {
      result[id] = (price - 100) / 100
    }
    return result
  })

  // ── Actions ───────────────────────────────────────────────────────────────

  async function loadData() {
    if (isLoaded.value || isLoading.value) return
    isLoading.value = true
    try {
      allData.value = await loadAllMarketData()
      isLoaded.value = true
    } catch (e) {
      console.error('Failed to load market data:', e)
    } finally {
      isLoading.value = false
    }
  }

  function prepareRound(year: number, unlockedAssetIds: string[]) {
    currentYear.value = year
    currentYearData.value = {}
    rawYearData.value = {}
    simulationIndex.value = 0

    for (const id of unlockedAssetIds) {
      const raw = allData.value[id]
      if (!raw?.length) continue
      const yearSlice = sliceToYear(raw, year)
      if (!yearSlice.length) continue
      rawYearData.value[id] = yearSlice
      currentYearData.value[id] = normalizeSeries(yearSlice)
    }
  }

  function startPlayback(onEnd: () => void) {
    if (isPlaying.value) return
    onRoundEndCallback = onEnd
    isPlaying.value = true
    simulationIndex.value = 1

    tickInterval = setInterval(() => {
      simulationIndex.value += DAYS_PER_TICK
      if (simulationIndex.value >= totalDays.value) {
        simulationIndex.value = totalDays.value
        stopPlayback()
        onRoundEndCallback?.()
      }
    }, TICK_MS)
  }

  function stopPlayback() {
    isPlaying.value = false
    if (tickInterval) {
      clearInterval(tickInterval)
      tickInterval = null
    }
  }

  /** Actual return for a given asset over the full year just played */
  function getYearReturn(assetId: string): number | null {
    const points = currentYearData.value[assetId]
    if (!points?.length) return null
    const last = points[points.length - 1]!.value
    return (last - 100) / 100
  }

  /** Weighted portfolio return given allocation map (assetId -> %) */
  function calcPortfolioReturn(allocation: Record<string, number>): number {
    let total = 0
    let weightSum = 0
    for (const [id, pct] of Object.entries(allocation)) {
      const ret = getYearReturn(id)
      if (ret !== null && pct > 0) {
        total += ret * (pct / 100)
        weightSum += pct / 100
      }
    }
    return weightSum > 0 ? total / weightSum : 0
  }

  /** Get sparkline data (last N points, normalized) for mini cards */
  function getSparkline(assetId: string, points = 50): number[] {
    const data = visibleData.value[assetId]
    if (!data?.length) return []
    return data.slice(-points).map(p => p.value)
  }

  // ── Asset metadata helpers ─────────────────────────────────────────────
  function getAvailableAssets(unlockedIds: string[]) {
    return ASSETS.filter(a => unlockedIds.includes(a.id))
  }

  return {
    allData,
    isLoaded,
    isLoading,
    currentYearData,
    simulationIndex,
    isPlaying,
    currentYear,
    totalDays,
    progress,
    visibleData,
    currentPrices,
    ytdReturns,
    loadData,
    prepareRound,
    startPlayback,
    stopPlayback,
    getYearReturn,
    calcPortfolioReturn,
    getSparkline,
    getAvailableAssets,
  }
})
