import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ASSETS, STARTING_CAPITAL, BENCHMARK_ALLOCATION } from '@/utils/gameConstants'
import { SCENARIOS, DEFAULT_SCENARIO_ID, type Scenario, type ScenarioYear } from '@/utils/scenarios'
import { useMarketStore } from './marketStore'

export type GamePhase = 'prep' | 'playing' | 'round_end' | 'game_end'

export interface RoundResult {
  round: number
  year: number
  yearLabel: string
  portfolioReturn: number
  benchmarkReturn: number
  portfolioValue: number
  benchmarkValue: number
  beatBenchmark: boolean
  bestAsset: { id: string; name: string; return: number } | null
  worstAsset: { id: string; name: string; return: number } | null
  tip: string
}

export const useGameStore = defineStore('game', () => {
  const market = useMarketStore()

  // ── State ──────────────────────────────────────────────────────────────
  const scenario = ref<Scenario>(SCENARIOS.find(s => s.id === DEFAULT_SCENARIO_ID)!)
  const phase = ref<GamePhase>('prep')
  const currentRoundIndex = ref(0)   // 0-indexed
  const portfolio = ref<Record<string, number>>({})
  const portfolioValue = ref(STARTING_CAPITAL)
  const benchmarkValue = ref(STARTING_CAPITAL)
  const roundHistory = ref<RoundResult[]>([])
  const activeEventIndex = ref<number | null>(null)  // which event card is showing
  const selectedAssetId = ref<string>('djia')        // for main chart focus

  // ── Computed ────────────────────────────────────────────────────────────

  const currentRound = computed(() => currentRoundIndex.value + 1)  // 1-indexed for display
  const totalRounds = computed(() => scenario.value.years.length)

  const currentYearData = computed<ScenarioYear | null>(() =>
    scenario.value.years[currentRoundIndex.value] ?? null
  )

  const unlockedAssets = computed<string[]>(() => {
    const round = currentRound.value
    return ASSETS.filter(a => a.unlockRound <= round).map(a => a.id)
  })

  const newUnlockThisRound = computed<string[]>(() => {
    const round = currentRound.value
    return ASSETS.filter(a => a.unlockRound === round).map(a => a.id)
  })

  const allocationTotal = computed(() =>
    Object.values(portfolio.value).reduce((s, v) => s + v, 0)
  )

  const isAllocationValid = computed(() =>
    Math.abs(allocationTotal.value - 100) < 1
  )

  /** Live portfolio value during simulation */
  const livePortfolioValue = computed(() => {
    if (phase.value !== 'playing') return portfolioValue.value
    let multiplier = 0
    let weightSum = 0
    for (const [id, pct] of Object.entries(portfolio.value)) {
      if (pct <= 0) continue
      const price = market.currentPrices[id] ?? 100
      multiplier += (price / 100) * (pct / 100)
      weightSum += pct / 100
    }
    if (weightSum === 0) return portfolioValue.value
    const ret = multiplier / weightSum
    return portfolioValue.value * ret
  })

  const liveReturnPct = computed(() =>
    ((livePortfolioValue.value - portfolioValue.value) / portfolioValue.value) * 100
  )

  // ── Actions ─────────────────────────────────────────────────────────────

  function selectScenario(id: string) {
    const s = SCENARIOS.find(sc => sc.id === id)
    if (s) scenario.value = s
  }

  function initGame() {
    currentRoundIndex.value = 0
    portfolioValue.value = STARTING_CAPITAL
    benchmarkValue.value = STARTING_CAPITAL
    roundHistory.value = []
    activeEventIndex.value = null
    setDefaultPortfolio()
    phase.value = 'prep'
  }

  function setDefaultPortfolio() {
    const unlocked = unlockedAssets.value
    portfolio.value = {}
    // Equal weight across unlocked assets
    const pctEach = Math.floor(100 / unlocked.length)
    const remainder = 100 - pctEach * unlocked.length
    unlocked.forEach((id, i) => {
      portfolio.value[id] = pctEach + (i === 0 ? remainder : 0)
    })
  }

  function setAllocation(assetId: string, pct: number) {
    portfolio.value[assetId] = Math.max(0, Math.min(100, Math.round(pct)))
  }

  function commitPortfolio() {
    if (!isAllocationValid.value) return
    const yearData = currentYearData.value
    if (!yearData) return

    market.prepareRound(yearData.year, unlockedAssets.value)
    phase.value = 'playing'

    market.startPlayback(() => {
      endRound()
    })
  }

  function endRound() {
    const yearData = currentYearData.value!
    const marketStore = market

    // Calculate returns
    const portReturn = marketStore.calcPortfolioReturn(portfolio.value)
    const benchReturn = marketStore.calcPortfolioReturn(normalizeBenchmark(unlockedAssets.value))

    const newPortValue = portfolioValue.value * (1 + portReturn)
    const newBenchValue = benchmarkValue.value * (1 + benchReturn)

    // Find best and worst
    let bestAsset = null
    let worstAsset = null
    for (const id of unlockedAssets.value) {
      const ret = marketStore.getYearReturn(id)
      if (ret === null) continue
      const assetMeta = ASSETS.find(a => a.id === id)
      const entry = { id, name: assetMeta?.shortName ?? id, return: ret }
      if (!bestAsset || ret > bestAsset.return) bestAsset = entry
      if (!worstAsset || ret < worstAsset.return) worstAsset = entry
    }

    const result: RoundResult = {
      round: currentRound.value,
      year: yearData.year,
      yearLabel: yearData.label,
      portfolioReturn: portReturn,
      benchmarkReturn: benchReturn,
      portfolioValue: newPortValue,
      benchmarkValue: newBenchValue,
      beatBenchmark: portReturn > benchReturn,
      bestAsset,
      worstAsset,
      tip: yearData.tip,
    }

    roundHistory.value.push(result)
    portfolioValue.value = newPortValue
    benchmarkValue.value = newBenchValue
    phase.value = 'round_end'
    activeEventIndex.value = null
  }

  function nextRound() {
    if (currentRoundIndex.value + 1 >= totalRounds.value) {
      phase.value = 'game_end'
      return
    }
    currentRoundIndex.value++
    // Keep previous allocation but adjust for new unlocks
    const unlocked = unlockedAssets.value
    const newUnlocks = newUnlockThisRound.value
    if (newUnlocks.length) {
      // Redistribute a small slice to new assets
      const slice = Math.min(10, Math.floor(100 / unlocked.length))
      newUnlocks.forEach(id => {
        portfolio.value[id] = slice
      })
      // Proportionally reduce existing
      const total = Object.values(portfolio.value).reduce((s, v) => s + v, 0)
      const excess = total - 100
      if (excess > 0) {
        const existing = unlocked.filter(id => !newUnlocks.includes(id))
        existing.forEach(id => {
          if (portfolio.value[id]) {
            portfolio.value[id] = Math.max(0, (portfolio.value[id] ?? 0) - excess / existing.length)
          }
        })
      }
    }
    phase.value = 'prep'
  }

  function restartGame() {
    initGame()
  }

  // ── Helpers ───────────────────────────────────────────────────────────
  function normalizeBenchmark(unlocked: string[]): Record<string, number> {
    // Use global benchmark, but only for unlocked assets, renormalize to 100
    const relevant: Record<string, number> = {}
    let total = 0
    for (const [id, pct] of Object.entries(BENCHMARK_ALLOCATION)) {
      if (unlocked.includes(id)) {
        relevant[id] = pct
        total += pct
      }
    }
    if (total === 0) {
      // fallback: equal weight
      unlocked.forEach(id => { relevant[id] = 100 / unlocked.length })
      return relevant
    }
    // Normalize to 100
    for (const id of Object.keys(relevant)) {
      relevant[id] = ((relevant[id] ?? 0) / total) * 100
    }
    return relevant
  }

  return {
    scenario,
    phase,
    currentRoundIndex,
    currentRound,
    totalRounds,
    currentYearData,
    portfolio,
    portfolioValue,
    benchmarkValue,
    roundHistory,
    activeEventIndex,
    selectedAssetId,
    unlockedAssets,
    newUnlockThisRound,
    allocationTotal,
    isAllocationValid,
    livePortfolioValue,
    liveReturnPct,
    selectScenario,
    initGame,
    setDefaultPortfolio,
    setAllocation,
    commitPortfolio,
    nextRound,
    restartGame,
  }
})
