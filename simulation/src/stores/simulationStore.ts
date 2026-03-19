import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { PricePoint } from '@/data/marketData'
import { generateMarketData, calculatePortfolioValue, calculateTotalInvested } from '@/data/marketData'
import { getEventAtMonth, getEventsUpToMonth, getEventImpacts, type MarketEvent } from '@/data/events'
import { assets } from '@/data/assets'

export type SimulationSpeed = 1 | 2 | 5 | 10
export type SimulationState = 'idle' | 'setup' | 'running' | 'paused' | 'finished'

export interface PortfolioSnapshot {
  month: number
  value: number
  invested: number
  returnPct: number
}

export const useSimulationStore = defineStore('simulation', () => {
  const state = ref<SimulationState>('idle')
  const currentMonth = ref(0)
  const totalMonths = ref(240) // 20 years
  const speed = ref<SimulationSpeed>(1)
  const marketData = ref<Map<string, PricePoint[]>>(new Map())
  const portfolioHistory = ref<PortfolioSnapshot[]>([])
  const benchmarkHistory = ref<PortfolioSnapshot[]>([])
  const activeEvent = ref<MarketEvent | null>(null)
  const pastEvents = ref<MarketEvent[]>([])
  const seed = ref(42)

  let intervalId: ReturnType<typeof setInterval> | null = null

  // Simulation interval in ms (base: 2000ms per month at 1x speed)
  const tickInterval = computed(() => 2000 / speed.value)

  const currentYear = computed(() => Math.floor(currentMonth.value / 12) + 1)
  const currentMonthInYear = computed(() => (currentMonth.value % 12) + 1)
  const progressPercent = computed(() => (currentMonth.value / totalMonths.value) * 100)
  const isRunning = computed(() => state.value === 'running')
  const isFinished = computed(() => state.value === 'finished')

  const latestSnapshot = computed(() =>
    portfolioHistory.value.length > 0
      ? portfolioHistory.value[portfolioHistory.value.length - 1]
      : null,
  )

  const latestBenchmark = computed(() =>
    benchmarkHistory.value.length > 0
      ? benchmarkHistory.value[benchmarkHistory.value.length - 1]
      : null,
  )

  // Performance metrics
  const totalReturn = computed(() => {
    if (!latestSnapshot.value) return 0
    return (latestSnapshot.value.value - latestSnapshot.value.invested) / latestSnapshot.value.invested
  })

  const annualizedReturn = computed(() => {
    if (!latestSnapshot.value || currentMonth.value === 0) return 0
    const years = currentMonth.value / 12
    const totalRet = latestSnapshot.value.value / latestSnapshot.value.invested
    return Math.pow(totalRet, 1 / years) - 1
  })

  const maxDrawdown = computed(() => {
    let peak = 0
    let maxDd = 0
    for (const snap of portfolioHistory.value) {
      if (snap.value > peak) peak = snap.value
      const dd = (peak - snap.value) / peak
      if (dd > maxDd) maxDd = dd
    }
    return maxDd
  })

  const volatility = computed(() => {
    if (portfolioHistory.value.length < 2) return 0
    const returns: number[] = []
    for (let i = 1; i < portfolioHistory.value.length; i++) {
      const prev = portfolioHistory.value[i - 1].value
      const curr = portfolioHistory.value[i].value
      if (prev > 0) returns.push((curr - prev) / prev)
    }
    if (returns.length === 0) return 0
    const mean = returns.reduce((s, r) => s + r, 0) / returns.length
    const variance = returns.reduce((s, r) => s + (r - mean) ** 2, 0) / returns.length
    return Math.sqrt(variance) * Math.sqrt(12) // Annualized
  })

  const sharpeRatio = computed(() => {
    const riskFreeRate = 0.02 // 2% annual
    if (volatility.value === 0) return 0
    return (annualizedReturn.value - riskFreeRate) / volatility.value
  })

  function initializeSimulation(
    allocations: Record<string, number>,
    initialCapital: number,
    monthlySavings: number,
    gameSeed?: number,
  ) {
    if (gameSeed !== undefined) seed.value = gameSeed

    // Generate market data with event impacts
    const eventImpacts = getEventImpacts()
    marketData.value = generateMarketData(assets, totalMonths.value, seed.value, eventImpacts)

    // Reset state
    currentMonth.value = 0
    portfolioHistory.value = []
    benchmarkHistory.value = []
    pastEvents.value = []
    activeEvent.value = null
    state.value = 'setup'

    // Calculate initial snapshot
    recordSnapshot(allocations, initialCapital, monthlySavings)
    recordBenchmarkSnapshot(initialCapital, monthlySavings)
  }

  function recordSnapshot(
    allocations: Record<string, number>,
    initialCapital: number,
    monthlySavings: number,
  ) {
    const value = calculatePortfolioValue(
      allocations,
      marketData.value,
      currentMonth.value,
      initialCapital,
      monthlySavings,
    )
    const invested = calculateTotalInvested(initialCapital, monthlySavings, currentMonth.value)

    portfolioHistory.value.push({
      month: currentMonth.value,
      value,
      invested,
      returnPct: invested > 0 ? (value - invested) / invested : 0,
    })
  }

  function recordBenchmarkSnapshot(initialCapital: number, monthlySavings: number) {
    // Benchmark: 100% SMI
    const benchmarkAllocations = { smi: 100 }
    const value = calculatePortfolioValue(
      benchmarkAllocations,
      marketData.value,
      currentMonth.value,
      initialCapital,
      monthlySavings,
    )
    const invested = calculateTotalInvested(initialCapital, monthlySavings, currentMonth.value)

    benchmarkHistory.value.push({
      month: currentMonth.value,
      value,
      invested,
      returnPct: invested > 0 ? (value - invested) / invested : 0,
    })
  }

  function startSimulation(
    allocations: Record<string, number>,
    initialCapital: number,
    monthlySavings: number,
  ) {
    if (state.value === 'idle') {
      initializeSimulation(allocations, initialCapital, monthlySavings)
    }

    state.value = 'running'

    intervalId = setInterval(() => {
      if (currentMonth.value >= totalMonths.value) {
        stopSimulation()
        state.value = 'finished'
        return
      }

      currentMonth.value++

      // Check for events
      const event = getEventAtMonth(currentMonth.value)
      if (event) {
        activeEvent.value = event
        pastEvents.value.push(event)
      }

      // Record snapshots
      recordSnapshot(allocations, initialCapital, monthlySavings)
      recordBenchmarkSnapshot(initialCapital, monthlySavings)
    }, tickInterval.value)
  }

  function pauseSimulation() {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
    state.value = 'paused'
  }

  function resumeSimulation(
    allocations: Record<string, number>,
    initialCapital: number,
    monthlySavings: number,
  ) {
    startSimulation(allocations, initialCapital, monthlySavings)
  }

  function stopSimulation() {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  function setSpeed(newSpeed: SimulationSpeed) {
    speed.value = newSpeed
  }

  function dismissEvent() {
    activeEvent.value = null
  }

  function resetSimulation() {
    stopSimulation()
    state.value = 'idle'
    currentMonth.value = 0
    portfolioHistory.value = []
    benchmarkHistory.value = []
    activeEvent.value = null
    pastEvents.value = []
    marketData.value = new Map()
  }

  return {
    state,
    currentMonth,
    totalMonths,
    speed,
    marketData,
    portfolioHistory,
    benchmarkHistory,
    activeEvent,
    pastEvents,
    seed,
    tickInterval,
    currentYear,
    currentMonthInYear,
    progressPercent,
    isRunning,
    isFinished,
    latestSnapshot,
    latestBenchmark,
    totalReturn,
    annualizedReturn,
    maxDrawdown,
    volatility,
    sharpeRatio,
    initializeSimulation,
    startSimulation,
    pauseSimulation,
    resumeSimulation,
    stopSimulation,
    setSpeed,
    dismissEvent,
    resetSimulation,
  }
})
