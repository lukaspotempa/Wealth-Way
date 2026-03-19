import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { generateMarketData, calculatePortfolioValue, calculateTotalInvested } from '@/data/marketData'
import { getEventAtMonth, getEventImpacts, type MarketEvent } from '@/data/events'
import { assets } from '@/data/assets'
import type { PricePoint } from '@/data/marketData'
import type { SimulationSpeed, PortfolioSnapshot } from './simulationStore'

export type BattleState = 'lobby' | 'setup' | 'running' | 'paused' | 'finished'

export interface BattlePlayer {
  name: string
  allocations: Record<string, number>
  initialCapital: number
  monthlySavings: number
  history: PortfolioSnapshot[]
  ready: boolean
}

export interface LeaderboardEntry {
  playerName: string
  finalValue: number
  totalReturn: number
  sharpeRatio: number
  maxDrawdown: number
  allocations: Record<string, number>
  timestamp: number
}

export const useBattleStore = defineStore('battle', () => {
  const state = ref<BattleState>('lobby')
  const players = ref<BattlePlayer[]>([])
  const currentMonth = ref(0)
  const totalMonths = ref(240)
  const speed = ref<SimulationSpeed>(2)
  const marketData = ref<Map<string, PricePoint[]>>(new Map())
  const activeEvent = ref<MarketEvent | null>(null)
  const pastEvents = ref<MarketEvent[]>([])
  const seed = ref(Math.floor(Math.random() * 10000))

  let intervalId: ReturnType<typeof setInterval> | null = null

  const tickInterval = computed(() => 2000 / speed.value)
  const currentYear = computed(() => Math.floor(currentMonth.value / 12) + 1)
  const progressPercent = computed(() => (currentMonth.value / totalMonths.value) * 100)
  const isRunning = computed(() => state.value === 'running')
  const allPlayersReady = computed(() => players.value.length >= 2 && players.value.every((p) => p.ready))

  // Leaderboard from localStorage
  const leaderboard = ref<LeaderboardEntry[]>(loadLeaderboard())

  function loadLeaderboard(): LeaderboardEntry[] {
    try {
      const data = localStorage.getItem('wma-leaderboard')
      return data ? JSON.parse(data) : []
    } catch {
      return []
    }
  }

  function saveLeaderboard() {
    localStorage.setItem('wma-leaderboard', JSON.stringify(leaderboard.value))
  }

  function addPlayer(name: string) {
    players.value.push({
      name,
      allocations: {},
      initialCapital: 100000,
      monthlySavings: 500,
      history: [],
      ready: false,
    })
  }

  function setPlayerAllocations(index: number, allocations: Record<string, number>) {
    if (players.value[index]) {
      players.value[index].allocations = { ...allocations }
    }
  }

  function setPlayerReady(index: number) {
    if (players.value[index]) {
      players.value[index].ready = true
    }
  }

  function initializeBattle() {
    const eventImpacts = getEventImpacts()
    marketData.value = generateMarketData(assets, totalMonths.value, seed.value, eventImpacts)
    currentMonth.value = 0
    pastEvents.value = []
    activeEvent.value = null
    state.value = 'setup'

    // Initial snapshot for each player
    for (const player of players.value) {
      player.history = []
      recordPlayerSnapshot(player)
    }
  }

  function recordPlayerSnapshot(player: BattlePlayer) {
    const value = calculatePortfolioValue(
      player.allocations,
      marketData.value,
      currentMonth.value,
      player.initialCapital,
      player.monthlySavings,
    )
    const invested = calculateTotalInvested(
      player.initialCapital,
      player.monthlySavings,
      currentMonth.value,
    )
    player.history.push({
      month: currentMonth.value,
      value,
      invested,
      returnPct: invested > 0 ? (value - invested) / invested : 0,
    })
  }

  function startBattle() {
    state.value = 'running'

    intervalId = setInterval(() => {
      if (currentMonth.value >= totalMonths.value) {
        stopBattle()
        state.value = 'finished'
        addToLeaderboard()
        return
      }

      currentMonth.value++

      const event = getEventAtMonth(currentMonth.value)
      if (event) {
        activeEvent.value = event
        pastEvents.value.push(event)
      }

      for (const player of players.value) {
        recordPlayerSnapshot(player)
      }
    }, tickInterval.value)
  }

  function pauseBattle() {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
    state.value = 'paused'
  }

  function resumeBattle() {
    startBattle()
  }

  function stopBattle() {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  function addToLeaderboard() {
    for (const player of players.value) {
      const last = player.history[player.history.length - 1]
      if (!last) continue

      // Calculate metrics
      let peak = 0
      let maxDd = 0
      const returns: number[] = []
      for (let i = 0; i < player.history.length; i++) {
        if (player.history[i].value > peak) peak = player.history[i].value
        const dd = (peak - player.history[i].value) / peak
        if (dd > maxDd) maxDd = dd
        if (i > 0) {
          const prev = player.history[i - 1].value
          const curr = player.history[i].value
          if (prev > 0) returns.push((curr - prev) / prev)
        }
      }

      const mean = returns.length > 0 ? returns.reduce((s, r) => s + r, 0) / returns.length : 0
      const variance = returns.length > 0
        ? returns.reduce((s, r) => s + (r - mean) ** 2, 0) / returns.length
        : 0
      const vol = Math.sqrt(variance) * Math.sqrt(12)
      const annReturn = currentMonth.value > 0
        ? Math.pow(last.value / last.invested, 12 / currentMonth.value) - 1
        : 0
      const sharpe = vol > 0 ? (annReturn - 0.02) / vol : 0

      leaderboard.value.push({
        playerName: player.name,
        finalValue: last.value,
        totalReturn: last.returnPct,
        sharpeRatio: sharpe,
        maxDrawdown: maxDd,
        allocations: { ...player.allocations },
        timestamp: Date.now(),
      })
    }

    // Sort by final value descending, keep top 50
    leaderboard.value.sort((a, b) => b.finalValue - a.finalValue)
    leaderboard.value = leaderboard.value.slice(0, 50)
    saveLeaderboard()
  }

  function dismissEvent() {
    activeEvent.value = null
  }

  function setSpeed(newSpeed: SimulationSpeed) {
    speed.value = newSpeed
  }

  function resetBattle() {
    stopBattle()
    state.value = 'lobby'
    players.value = []
    currentMonth.value = 0
    marketData.value = new Map()
    activeEvent.value = null
    pastEvents.value = []
    seed.value = Math.floor(Math.random() * 10000)
  }

  function clearLeaderboard() {
    leaderboard.value = []
    localStorage.removeItem('wma-leaderboard')
  }

  return {
    state,
    players,
    currentMonth,
    totalMonths,
    speed,
    marketData,
    activeEvent,
    pastEvents,
    seed,
    tickInterval,
    currentYear,
    progressPercent,
    isRunning,
    allPlayersReady,
    leaderboard,
    addPlayer,
    setPlayerAllocations,
    setPlayerReady,
    initializeBattle,
    startBattle,
    pauseBattle,
    resumeBattle,
    stopBattle,
    dismissEvent,
    setSpeed,
    resetBattle,
    clearLeaderboard,
  }
})
