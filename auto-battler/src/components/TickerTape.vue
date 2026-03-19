<template>
  <div class="ticker-wrapper overflow-hidden border-b flex items-center"
       style="height: 36px; background: var(--color-game-surface); border-color: var(--color-game-border);">
    <!-- Left label -->
    <div class="flex-shrink-0 px-3 flex items-center gap-2 border-r h-full"
         style="border-color: var(--color-game-border); min-width: 120px;">
      <span class="pulse-dot w-1.5 h-1.5 rounded-full flex-shrink-0"
            :style="{ background: isPlaying ? 'var(--color-game-bull)' : 'var(--color-game-text-3)' }"></span>
      <span class="text-xs font-mono uppercase tracking-wider"
            style="color: var(--color-game-text-2);">
        {{ isPlaying ? 'LIVE' : 'MARKET' }}
      </span>
    </div>

    <!-- Scrolling ticker -->
    <div class="ticker-inner flex items-center gap-6 px-4" style="white-space: nowrap;">
      <template v-for="item in tickerItems" :key="item.id">
        <span class="inline-flex items-center gap-1.5 text-xs font-mono">
          <span style="color: var(--color-game-text-2);">{{ item.shortName }}</span>
          <span :style="{ color: item.change >= 0 ? 'var(--color-game-bull)' : 'var(--color-game-bear)' }">
            {{ item.change >= 0 ? '+' : '' }}{{ item.change.toFixed(2) }}%
          </span>
        </span>
      </template>
      <!-- Duplicate for seamless loop -->
      <template v-for="item in tickerItems" :key="'dup-' + item.id">
        <span class="inline-flex items-center gap-1.5 text-xs font-mono">
          <span style="color: var(--color-game-text-2);">{{ item.shortName }}</span>
          <span :style="{ color: item.change >= 0 ? 'var(--color-game-bull)' : 'var(--color-game-bear)' }">
            {{ item.change >= 0 ? '+' : '' }}{{ item.change.toFixed(2) }}%
          </span>
        </span>
      </template>
    </div>

    <!-- Right: year indicator -->
    <div class="flex-shrink-0 px-3 border-l ml-auto h-full flex items-center"
         style="border-color: var(--color-game-border);">
      <span class="text-xs font-mono" style="color: var(--color-game-text-2);">
        {{ year ? `FY ${year}` : '—' }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useMarketStore } from '@/stores/marketStore'
import { ASSETS } from '@/utils/gameConstants'
import { useGameStore } from '@/stores/gameStore'

const market = useMarketStore()
const game = useGameStore()

const isPlaying = computed(() => market.isPlaying)
const year = computed(() => market.currentYear || null)

const tickerItems = computed(() => {
  return game.unlockedAssets.map(id => {
    const meta = ASSETS.find(a => a.id === id)
    const change = (market.ytdReturns[id] ?? 0) * 100
    return { id, shortName: meta?.shortName ?? id, change }
  })
})
</script>
