<template>
  <div class="h-screen w-screen flex flex-col overflow-hidden" style="background: var(--color-game-bg);">

    <!-- Loading overlay -->
    <div v-if="isLoading"
         class="fixed inset-0 flex items-center justify-center z-50"
         style="background: var(--color-game-bg);">
      <div class="text-center">
        <div class="text-2xl font-mono mb-3" style="color: var(--color-game-accent);">
          Loading market data...
        </div>
        <div class="text-sm" style="color: var(--color-game-text-3);">
          Fetching 19 years of historical data
        </div>
      </div>
    </div>

    <!-- Game End Screen -->
    <div v-else-if="phase === 'game_end'"
         class="flex-1 flex items-center justify-center p-8">
      <div class="max-w-2xl w-full">
        <div class="text-center mb-8">
          <div class="text-xs font-mono uppercase tracking-widest mb-2" style="color: var(--color-game-accent);">
            Campaign Complete
          </div>
          <h1 class="text-4xl font-bold mb-2" style="color: var(--color-game-text);">
            {{ scenario.name }}
          </h1>
          <p class="text-sm" style="color: var(--color-game-text-2);">{{ scenario.tagline }}</p>
        </div>

        <!-- Final value -->
        <div class="panel rounded-xl p-6 mb-6 text-center">
          <div class="text-xs font-mono uppercase tracking-widest mb-2" style="color: var(--color-game-text-3);">
            Final Portfolio Value
          </div>
          <div class="text-5xl font-mono font-bold mb-2"
               :style="{ color: portfolioValue >= STARTING_CAPITAL ? 'var(--color-game-bull)' : 'var(--color-game-bear)' }">
            ${{ portfolioValue.toLocaleString('en-US', { maximumFractionDigits: 0 }) }}
          </div>
          <div class="text-lg font-mono"
               :style="{ color: totalReturn >= 0 ? 'var(--color-game-bull)' : 'var(--color-game-bear)' }">
            {{ totalReturn >= 0 ? '+' : '' }}{{ (totalReturn * 100).toFixed(1) }}% total return
          </div>
          <div class="text-xs mt-1" style="color: var(--color-game-text-3);">
            Benchmark: {{ totalBenchReturn >= 0 ? '+' : '' }}{{ (totalBenchReturn * 100).toFixed(1) }}%
          </div>
        </div>

        <!-- Round history -->
        <div class="panel rounded-xl overflow-hidden mb-6">
          <div class="px-4 py-3 border-b text-xs font-mono uppercase tracking-widest"
               style="border-color: var(--color-game-border); color: var(--color-game-text-3);">
            Year by Year
          </div>
          <div class="divide-y" style="border-color: var(--color-game-border);">
            <div v-for="r in roundHistory" :key="r.round"
                 class="px-4 py-3 flex items-center justify-between text-sm">
              <div class="flex items-center gap-3">
                <span class="font-mono text-xs w-8" style="color: var(--color-game-text-3);">{{ r.year }}</span>
                <span style="color: var(--color-game-text);">{{ r.yearLabel }}</span>
              </div>
              <div class="flex items-center gap-4">
                <span class="font-mono text-xs"
                      :style="{ color: r.portfolioReturn >= 0 ? 'var(--color-game-bull)' : 'var(--color-game-bear)' }">
                  {{ r.portfolioReturn >= 0 ? '+' : '' }}{{ (r.portfolioReturn * 100).toFixed(1) }}%
                </span>
                <span class="text-xs font-mono"
                      :style="{ color: r.beatBenchmark ? 'var(--color-game-bull)' : 'var(--color-game-text-3)' }">
                  {{ r.beatBenchmark ? '▲' : '▼' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="flex gap-4">
          <button @click="router.push('/')"
                  class="flex-1 py-3 rounded-lg border text-sm font-semibold cursor-pointer"
                  style="border-color: var(--color-game-border); color: var(--color-game-text-2);">
            ← Main Menu
          </button>
          <button @click="restartGame"
                  class="flex-1 py-3 rounded-lg text-sm font-semibold cursor-pointer"
                  style="background: var(--color-game-accent); color: #0a0e1a;">
            Play Again
          </button>
        </div>
      </div>
    </div>

    <!-- Normal game view -->
    <template v-else>
      <!-- Ticker tape -->
      <TickerTape />

      <!-- HUD bar -->
      <div class="flex items-center justify-between px-4 py-2 border-b flex-shrink-0 text-xs"
           style="border-color: var(--color-game-border); background: var(--color-game-surface);">
        <div class="flex items-center gap-4">
          <span style="color: var(--color-game-text-2);">
            <span class="font-mono" style="color: var(--color-game-text);">{{ scenario.name }}</span>
          </span>
          <span style="color: var(--color-game-text-3);">·</span>
          <span style="color: var(--color-game-text-2);">
            Round
            <span class="font-mono font-bold" style="color: var(--color-game-accent);">{{ currentRound }}</span>
            / {{ totalRounds }}
          </span>
          <span v-if="currentYearData" style="color: var(--color-game-text-3);">
            {{ currentYearData.year }} — {{ currentYearData.label }}
          </span>
        </div>
        <div class="flex items-center gap-3">
          <span style="color: var(--color-game-text-3);">Phase:</span>
          <span class="font-mono uppercase"
                :style="{ color: phaseColor }">
            {{ phase }}
          </span>
          <button @click="router.push('/')" class="ml-2 px-2 py-1 rounded border text-xs cursor-pointer hover:opacity-75"
                  style="border-color: var(--color-game-border); color: var(--color-game-text-3);">
            ✕ Exit
          </button>
        </div>
      </div>

      <!-- Main layout: chart + portfolio panel -->
      <div class="flex-1 flex overflow-hidden min-h-0">

        <!-- Left: chart + asset row -->
        <div class="flex-1 flex flex-col min-w-0 overflow-hidden">

          <!-- Main chart area -->
          <div class="flex-1 relative min-h-0">
            <!-- Event card overlay -->
            <EventCard :event="activeEvent" />

            <!-- Prep overlay -->
            <div v-if="phase === 'prep'"
                 class="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10"
                 style="background: rgba(10,14,26,0.7); backdrop-filter: blur(2px);">
              <div class="text-center">
                <div class="text-xs font-mono uppercase tracking-widest mb-3"
                     style="color: var(--color-game-accent);">
                  Round {{ currentRound }} — Prep Phase
                </div>
                <h2 class="text-2xl font-bold mb-2" style="color: var(--color-game-text);">
                  {{ currentYearData?.year }}: {{ currentYearData?.label }}
                </h2>
                <p v-if="currentYearData?.hint" class="text-sm max-w-md"
                   style="color: var(--color-game-text-2);">
                  {{ currentYearData.hint }}
                </p>
              </div>
              <div class="text-sm" style="color: var(--color-game-text-3);">
                ← Set your portfolio allocation, then commit
              </div>
            </div>

            <MainChart />
          </div>

          <!-- Asset cards row -->
          <div class="border-t flex-shrink-0 px-3 py-2 flex gap-2 overflow-x-auto"
               style="border-color: var(--color-game-border); background: var(--color-game-surface);">
            <AssetCard
              v-for="asset in unlockedAssetsMeta"
              :key="asset.id"
              :asset="asset"
              :is-selected="selectedAssetId === asset.id"
              @select="game.selectedAssetId = $event"
            />
          </div>
        </div>

        <!-- Right: portfolio panel -->
        <div class="w-72 flex-shrink-0">
          <PortfolioPanel />
        </div>
      </div>

      <!-- Round summary overlay -->
      <RoundSummary
        :show="phase === 'round_end' && !!lastResult"
        :result="lastResult!"
        @next="onNext"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/gameStore'
import { useMarketStore } from '@/stores/marketStore'
import { ASSETS, STARTING_CAPITAL } from '@/utils/gameConstants'
import type { MarketEvent } from '@/utils/scenarios'
import TickerTape from '@/components/TickerTape.vue'
import MainChart from '@/components/MainChart.vue'
import AssetCard from '@/components/AssetCard.vue'
import PortfolioPanel from '@/components/PortfolioPanel.vue'
import RoundSummary from '@/components/RoundSummary.vue'
import EventCard from '@/components/EventCard.vue'

const router = useRouter()
const game = useGameStore()
const market = useMarketStore()

const isLoading = computed(() => market.isLoading)
const phase = computed(() => game.phase)
const scenario = computed(() => game.scenario)
const currentRound = computed(() => game.currentRound)
const totalRounds = computed(() => game.totalRounds)
const currentYearData = computed(() => game.currentYearData)
const selectedAssetId = computed(() => game.selectedAssetId)
const portfolioValue = computed(() => game.portfolioValue)
const roundHistory = computed(() => game.roundHistory)

const unlockedAssetsMeta = computed(() =>
  ASSETS.filter(a => game.unlockedAssets.includes(a.id))
)

const lastResult = computed(() =>
  roundHistory.value[roundHistory.value.length - 1] ?? null
)

const totalReturn = computed(() =>
  (portfolioValue.value - STARTING_CAPITAL) / STARTING_CAPITAL
)
const totalBenchReturn = computed(() => {
  const last = roundHistory.value[roundHistory.value.length - 1]
  if (!last) return 0
  return (last.benchmarkValue - STARTING_CAPITAL) / STARTING_CAPITAL
})

const phaseColor = computed(() => {
  const colors: Record<string, string> = {
    prep: 'var(--color-game-gold)',
    playing: 'var(--color-game-bull)',
    round_end: 'var(--color-game-text-2)',
    game_end: 'var(--color-game-accent)',
  }
  return colors[phase.value] ?? 'var(--color-game-text)'
})

// Event cards — fire at approximate month during simulation
const activeEvent = ref<MarketEvent | null>(null)
let eventTimeout: ReturnType<typeof setTimeout> | null = null

watch(() => market.simulationIndex, (idx) => {
  if (!currentYearData.value?.events.length) return
  const total = market.totalDays
  if (total === 0) return

  for (const event of currentYearData.value.events) {
    // month 1-12, map to approximate day index
    const targetFraction = (event.month - 0.5) / 12
    const targetIdx = Math.floor(targetFraction * total)
    if (idx === targetIdx) {
      activeEvent.value = event
      if (eventTimeout) clearTimeout(eventTimeout)
      eventTimeout = setTimeout(() => { activeEvent.value = null }, 5000)
    }
  }
})

function onNext() {
  activeEvent.value = null
  game.nextRound()
}

function restartGame() {
  game.restartGame()
}

onMounted(async () => {
  await market.loadData()
  // If we land here without a game in progress, redirect home
  if (!game.currentYearData) {
    router.push('/')
  }
})
</script>
