<template>
  <Transition name="modal">
    <div v-if="show"
         class="fixed inset-0 flex items-center justify-center z-50"
         style="background: rgba(10,14,26,0.85); backdrop-filter: blur(4px);">
      <div class="panel rounded-xl w-full max-w-lg mx-4 overflow-hidden fade-in">
        <!-- Header bar -->
        <div class="px-6 py-4 border-b flex items-center justify-between"
             style="border-color: var(--color-game-border);">
          <div>
            <div class="text-xs font-mono uppercase tracking-widest mb-1"
                 style="color: var(--color-game-text-3);">
              Round {{ result.round }} / {{ totalRounds }} Complete
            </div>
            <h2 class="text-lg font-bold" style="color: var(--color-game-text);">
              {{ result.year }} — {{ result.yearLabel }}
            </h2>
          </div>
          <div class="text-right">
            <div class="text-3xl font-mono font-bold"
                 :style="{ color: result.portfolioReturn >= 0 ? 'var(--color-game-bull)' : 'var(--color-game-bear)' }">
              {{ result.portfolioReturn >= 0 ? '+' : '' }}{{ (result.portfolioReturn * 100).toFixed(1) }}%
            </div>
            <div class="text-xs" style="color: var(--color-game-text-3);">Your return</div>
          </div>
        </div>

        <!-- Portfolio value -->
        <div class="px-6 py-4 grid grid-cols-2 gap-4 border-b"
             style="border-color: var(--color-game-border);">
          <div class="rounded-lg p-3" style="background: var(--color-game-bg);">
            <div class="text-xs mb-1" style="color: var(--color-game-text-3);">Portfolio Value</div>
            <div class="text-xl font-mono font-bold" style="color: var(--color-game-text);">
              ${{ result.portfolioValue.toLocaleString('en-US', { maximumFractionDigits: 0 }) }}
            </div>
          </div>
          <div class="rounded-lg p-3"
               :style="{
                 background: result.beatBenchmark ? 'rgba(0,212,170,0.08)' : 'rgba(255,71,87,0.08)',
               }">
            <div class="text-xs mb-1 flex items-center gap-1"
                 :style="{ color: result.beatBenchmark ? 'var(--color-game-bull)' : 'var(--color-game-bear)' }">
              {{ result.beatBenchmark ? '▲ Beat' : '▼ Behind' }} Benchmark
            </div>
            <div class="text-xl font-mono font-bold"
                 :style="{ color: result.benchmarkReturn >= 0 ? 'var(--color-game-bull)' : 'var(--color-game-bear)' }">
              {{ result.benchmarkReturn >= 0 ? '+' : '' }}{{ (result.benchmarkReturn * 100).toFixed(1) }}%
            </div>
            <div class="text-xs" style="color: var(--color-game-text-3);">60/40 benchmark</div>
          </div>
        </div>

        <!-- Best / Worst asset -->
        <div class="px-6 py-4 grid grid-cols-2 gap-4 border-b text-sm"
             style="border-color: var(--color-game-border);">
          <div v-if="result.bestAsset">
            <div class="text-xs mb-1" style="color: var(--color-game-text-3);">Best Asset</div>
            <span class="font-mono font-bold" style="color: var(--color-game-bull);">
              {{ result.bestAsset.name }}
            </span>
            <span class="ml-2 font-mono text-xs" style="color: var(--color-game-bull);">
              +{{ (result.bestAsset.return * 100).toFixed(1) }}%
            </span>
          </div>
          <div v-if="result.worstAsset">
            <div class="text-xs mb-1" style="color: var(--color-game-text-3);">Worst Asset</div>
            <span class="font-mono font-bold" style="color: var(--color-game-bear);">
              {{ result.worstAsset.name }}
            </span>
            <span class="ml-2 font-mono text-xs" style="color: var(--color-game-bear);">
              {{ (result.worstAsset.return * 100).toFixed(1) }}%
            </span>
          </div>
        </div>

        <!-- Learning tip -->
        <div class="px-6 py-4 border-b"
             style="border-color: var(--color-game-border);">
          <div class="text-xs font-mono uppercase tracking-widest mb-2"
               style="color: var(--color-game-accent);">
            💡 Learning Insight
          </div>
          <p class="text-sm leading-relaxed" style="color: var(--color-game-text-2);">
            {{ result.tip }}
          </p>
        </div>

        <!-- Action -->
        <div class="px-6 py-4">
          <button
            @click="$emit('next')"
            class="w-full py-3 rounded-lg font-semibold text-sm cursor-pointer transition-all"
            :style="{ background: 'var(--color-game-accent)', color: '#0a0e1a' }"
          >
            {{ isLastRound ? '🏆 View Final Results' : `Next Round →  ${nextYear}` }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import type { RoundResult } from '@/stores/gameStore'

const props = defineProps<{ show: boolean; result: RoundResult }>()
defineEmits<{ next: [] }>()

const game = useGameStore()
const totalRounds = computed(() => game.totalRounds)
const isLastRound = computed(() => props.result.round >= totalRounds.value)
const nextYear = computed(() => {
  const next = game.scenario.years[game.currentRoundIndex + 1]
  return next ? next.year : ''
})
</script>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
