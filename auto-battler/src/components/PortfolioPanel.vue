<template>
  <div class="flex flex-col h-full overflow-hidden"
       style="background: var(--color-game-surface); border-left: 1px solid var(--color-game-border);">

    <!-- Panel header -->
    <div class="px-4 py-3 border-b flex-shrink-0"
         style="border-color: var(--color-game-border);">
      <div class="flex items-center justify-between mb-1">
        <span class="text-xs font-mono uppercase tracking-widest"
              style="color: var(--color-game-text-3);">Portfolio</span>
        <span class="text-xs font-mono px-2 py-0.5 rounded"
              :style="{
                background: liveReturn >= 0 ? 'rgba(0,212,170,0.15)' : 'rgba(255,71,87,0.15)',
                color: liveReturn >= 0 ? 'var(--color-game-bull)' : 'var(--color-game-bear)',
              }">
          {{ liveReturn >= 0 ? '+' : '' }}{{ liveReturn.toFixed(2) }}%
        </span>
      </div>
      <div class="font-mono text-2xl font-bold" style="color: var(--color-game-text);">
        ${{ liveValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) }}
      </div>
      <div class="text-xs mt-0.5" style="color: var(--color-game-text-3);">
        Started with ${{ startValue.toLocaleString('en-US') }}
      </div>
    </div>

    <!-- Benchmark comparison -->
    <div class="px-4 py-2 border-b flex items-center justify-between flex-shrink-0"
         style="border-color: var(--color-game-border); background: var(--color-game-bg);">
      <span class="text-xs" style="color: var(--color-game-text-3);">
        vs. 60/40 Benchmark
      </span>
      <span class="text-xs font-mono"
            :style="{ color: isBeatingBenchmark ? 'var(--color-game-bull)' : 'var(--color-game-bear)' }">
        {{ isBeatingBenchmark ? '▲ Beating' : '▼ Behind' }}
      </span>
    </div>

    <!-- Allocation sliders — only during prep -->
    <div class="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">

      <!-- New unlock notice -->
      <div v-if="newUnlocks.length && phase === 'prep'"
           class="rounded-lg p-3 border text-xs fade-in"
           style="background: rgba(0,212,170,0.08); border-color: var(--color-game-accent);">
        <div class="font-semibold mb-1" style="color: var(--color-game-accent);">
          🔓 New asset unlocked!
        </div>
        <div v-for="id in newUnlocks" :key="id" style="color: var(--color-game-text-2);">
          <strong>{{ assetMeta(id)?.shortName }}</strong> — {{ assetMeta(id)?.description }}
        </div>
      </div>

      <!-- Sliders -->
      <div
        v-for="asset in unlockedAssets"
        :key="asset.id"
        class="flex flex-col gap-1.5"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-2 h-2 rounded-sm flex-shrink-0" :style="{ background: asset.color }"></div>
            <span class="text-xs font-semibold" style="color: var(--color-game-text);">
              {{ asset.shortName }}
            </span>
            <span class="text-xs" style="color: var(--color-game-text-3);">
              {{ CATEGORY_LABELS[asset.category] }}
            </span>
          </div>
          <span class="text-xs font-mono font-bold"
                :style="{ color: (allocation[asset.id] ?? 0) > 0 ? asset.color : 'var(--color-game-text-3)' }">
            {{ Math.round(allocation[asset.id] ?? 0) }}%
          </span>
        </div>

        <input
          type="range" min="0" max="100" step="1"
          :value="allocation[asset.id] ?? 0"
          :disabled="phase !== 'prep'"
          @input="onSliderInput(asset.id, ($event.target as HTMLInputElement).value)"
          :style="{ '--slider-color': asset.color }"
          class="w-full"
        />

        <!-- YTD return (during play/end) -->
        <div v-if="phase !== 'prep'" class="text-right text-xs font-mono"
             :style="{ color: (ytdReturns[asset.id] ?? 0) >= 0 ? 'var(--color-game-bull)' : 'var(--color-game-bear)' }">
          {{ (ytdReturns[asset.id] ?? 0) >= 0 ? '+' : '' }}{{ ((ytdReturns[asset.id] ?? 0) * 100).toFixed(2) }}% YTD
        </div>
      </div>

      <!-- Allocation total warning -->
      <div v-if="phase === 'prep'"
           class="rounded p-2 text-xs font-mono text-center"
           :style="{
             background: allocationValid ? 'rgba(0,212,170,0.08)' : 'rgba(255,71,87,0.08)',
             color: allocationValid ? 'var(--color-game-bull)' : 'var(--color-game-bear)',
           }">
        {{ allocationTotal }}% allocated
        {{ allocationValid ? '✓ Ready' : `— need ${100 - allocationTotal}% more` }}
      </div>

      <!-- Hint -->
      <div v-if="phase === 'prep' && hint"
           class="rounded-lg p-3 text-xs leading-relaxed"
           style="background: var(--color-game-bg); color: var(--color-game-text-2); border: 1px solid var(--color-game-border);">
        <span class="font-semibold" style="color: var(--color-game-accent);">This year: </span>{{ hint }}
      </div>
    </div>

    <!-- Commit button (prep) / status (playing) -->
    <div class="px-4 py-4 border-t flex-shrink-0"
         style="border-color: var(--color-game-border);">
      <button
        v-if="phase === 'prep'"
        @click="commit"
        :disabled="!allocationValid"
        class="w-full py-3 rounded-lg font-semibold text-sm transition-all duration-200 cursor-pointer"
        :style="{
          background: allocationValid ? 'var(--color-game-accent)' : 'var(--color-game-surface-2)',
          color: allocationValid ? '#0a0e1a' : 'var(--color-game-text-3)',
          cursor: allocationValid ? 'pointer' : 'not-allowed',
        }"
      >
        ▶ Commit Portfolio
      </button>

      <div v-else-if="phase === 'playing'"
           class="text-center text-xs font-mono py-2"
           style="color: var(--color-game-text-3);">
        <span class="pulse-dot inline-block w-1.5 h-1.5 rounded-full mr-2 align-middle"
              style="background: var(--color-game-bull);"></span>
        Market simulation running...
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { useMarketStore } from '@/stores/marketStore'
import { ASSETS, CATEGORY_LABELS, STARTING_CAPITAL } from '@/utils/gameConstants'

const game = useGameStore()
const market = useMarketStore()

const phase = computed(() => game.phase)
const allocation = computed(() => game.portfolio)
const allocationTotal = computed(() => game.allocationTotal)
const allocationValid = computed(() => game.isAllocationValid)
const unlockedAssets = computed(() => ASSETS.filter(a => game.unlockedAssets.includes(a.id)))
const newUnlocks = computed(() => game.newUnlockThisRound)
const ytdReturns = computed(() => market.ytdReturns)
const hint = computed(() => game.currentYearData?.hint)

const liveValue = computed(() => game.livePortfolioValue)
const liveReturn = computed(() => game.liveReturnPct)
const startValue = computed(() => STARTING_CAPITAL)

const isBeatingBenchmark = computed(() => {
  const lastRound = game.roundHistory[game.roundHistory.length - 1]
  return lastRound ? lastRound.beatBenchmark : false
})

function assetMeta(id: string) {
  return ASSETS.find(a => a.id === id)
}

function onSliderInput(assetId: string, rawValue: string) {
  game.setAllocation(assetId, Number(rawValue))
}

function commit() {
  game.commitPortfolio()
}
</script>
