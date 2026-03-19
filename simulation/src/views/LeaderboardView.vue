<script setup lang="ts">
import { ref, computed } from 'vue'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Badge } from '@/components/ui'
import { useBattleStore } from '@/stores/battleStore'
import { formatCurrency, formatPercent, formatNumber } from '@/lib/utils'
import { getAssetById } from '@/data/assets'

const battleStore = useBattleStore()

type SortKey = 'finalValue' | 'totalReturn' | 'sharpeRatio' | 'maxDrawdown'
const sortBy = ref<SortKey>('finalValue')

const sortedLeaderboard = computed(() => {
  const entries = [...battleStore.leaderboard]
  entries.sort((a, b) => {
    if (sortBy.value === 'maxDrawdown') return a.maxDrawdown - b.maxDrawdown
    return (b as any)[sortBy.value] - (a as any)[sortBy.value]
  })
  return entries
})

const sortOptions: Array<{ key: SortKey; label: string }> = [
  { key: 'finalValue', label: 'Final Value' },
  { key: 'totalReturn', label: 'Total Return' },
  { key: 'sharpeRatio', label: 'Sharpe Ratio' },
  { key: 'maxDrawdown', label: 'Lowest Drawdown' },
]

function getAllocationSummary(alloc: Record<string, number>): string {
  return Object.entries(alloc)
    .filter(([, w]) => w > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id, w]) => {
      const asset = getAssetById(id)
      return `${asset?.ticker || id} ${w}%`
    })
    .join(', ')
}

function getRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
</script>

<template>
  <div class="container mx-auto px-4 py-6 max-w-4xl">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold">Leaderboard</h1>
        <p class="text-sm text-muted-foreground">Top portfolio managers ranked by performance</p>
      </div>
      <Button
        v-if="battleStore.leaderboard.length > 0"
        variant="outline"
        size="sm"
        @click="battleStore.clearLeaderboard()"
      >
        Clear All
      </Button>
    </div>

    <!-- Empty State -->
    <Card v-if="sortedLeaderboard.length === 0">
      <CardContent class="p-12 text-center">
        <div class="text-4xl mb-4">&#127942;</div>
        <h3 class="text-lg font-semibold mb-2">No scores yet</h3>
        <p class="text-sm text-muted-foreground mb-4">
          Complete a simulation in Sandbox or Battle mode to appear here.
        </p>
        <div class="flex gap-3 justify-center">
          <Button @click="$router.push('/sandbox')">Play Sandbox</Button>
          <Button variant="outline" @click="$router.push('/battle')">Start Battle</Button>
        </div>
      </CardContent>
    </Card>

    <div v-else class="space-y-4">
      <!-- Sort Controls -->
      <div class="flex items-center gap-2 flex-wrap">
        <span class="text-xs text-muted-foreground">Sort by:</span>
        <button
          v-for="option in sortOptions"
          :key="option.key"
          :class="[
            'px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer',
            sortBy === option.key
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-muted-foreground hover:text-foreground',
          ]"
          @click="sortBy = option.key"
        >
          {{ option.label }}
        </button>
      </div>

      <!-- Entries -->
      <div class="space-y-2">
        <Card
          v-for="(entry, idx) in sortedLeaderboard"
          :key="entry.timestamp"
          :class="`transition-all ${idx === 0 ? 'border-primary/50' : ''}`"
        >
          <CardContent class="p-4">
            <div class="flex items-center gap-4">
              <!-- Rank -->
              <div :class="[
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0',
                idx === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                idx === 1 ? 'bg-gray-400/20 text-gray-300' :
                idx === 2 ? 'bg-orange-600/20 text-orange-400' :
                'bg-secondary text-muted-foreground',
              ]">
                {{ idx + 1 }}
              </div>

              <!-- Info -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="font-semibold text-sm">{{ entry.playerName }}</span>
                  <span class="text-xs text-muted-foreground">{{ getRelativeTime(entry.timestamp) }}</span>
                </div>
                <p class="text-xs text-muted-foreground truncate">
                  {{ getAllocationSummary(entry.allocations) }}
                </p>
              </div>

              <!-- Stats -->
              <div class="flex items-center gap-4 text-right">
                <div class="hidden sm:block">
                  <p class="text-xs text-muted-foreground">Return</p>
                  <p :class="['text-sm font-mono font-bold', entry.totalReturn >= 0 ? 'text-primary' : 'text-destructive']">
                    {{ formatPercent(entry.totalReturn) }}
                  </p>
                </div>
                <div class="hidden md:block">
                  <p class="text-xs text-muted-foreground">Sharpe</p>
                  <p class="text-sm font-mono font-bold">{{ formatNumber(entry.sharpeRatio) }}</p>
                </div>
                <div>
                  <p class="text-xs text-muted-foreground">Final Value</p>
                  <p class="text-sm font-mono font-bold text-primary">{{ formatCurrency(entry.finalValue) }}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
