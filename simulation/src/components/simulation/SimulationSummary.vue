<script setup lang="ts">
import { computed } from 'vue'
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from '@/components/ui'
import { useSimulationStore } from '@/stores/simulationStore'
import { usePortfolioStore } from '@/stores/portfolioStore'
import { useBattleStore } from '@/stores/battleStore'
import { formatCurrency, formatPercent, formatNumber } from '@/lib/utils'

const simulationStore = useSimulationStore()
const portfolioStore = usePortfolioStore()
const battleStore = useBattleStore()

const emit = defineEmits<{
  restart: []
  goToLeaderboard: []
}>()

const summary = computed(() => {
  const snap = simulationStore.latestSnapshot
  const bench = simulationStore.latestBenchmark
  if (!snap) return null

  const beatBenchmark = bench ? snap.value > bench.value : false
  const profit = snap.value - snap.invested

  return {
    finalValue: snap.value,
    invested: snap.invested,
    profit,
    totalReturn: simulationStore.totalReturn,
    annualizedReturn: simulationStore.annualizedReturn,
    maxDrawdown: simulationStore.maxDrawdown,
    sharpeRatio: simulationStore.sharpeRatio,
    volatility: simulationStore.volatility,
    beatBenchmark,
    benchmarkValue: bench?.value || 0,
  }
})

const lessons = computed(() => {
  if (!summary.value) return []

  const items: Array<{ title: string; message: string; type: 'success' | 'info' | 'warning' }> = []

  if (summary.value.totalReturn > 0) {
    items.push({
      title: 'Positive Returns',
      message: `Your portfolio grew by ${formatPercent(summary.value.totalReturn)} over 20 years. Long-term investing works!`,
      type: 'success',
    })
  }

  if (summary.value.beatBenchmark) {
    items.push({
      title: 'Beat the Benchmark',
      message: 'Your diversified portfolio outperformed a 100% SMI strategy. Diversification can add value.',
      type: 'success',
    })
  }

  if (summary.value.maxDrawdown > 0.3) {
    items.push({
      title: 'Significant Drawdown',
      message: `Your portfolio experienced a ${formatPercent(-summary.value.maxDrawdown)} drawdown. Adding bonds or gold can help reduce these drops.`,
      type: 'warning',
    })
  }

  if (summary.value.sharpeRatio > 0.5) {
    items.push({
      title: 'Good Risk-Adjusted Returns',
      message: `A Sharpe ratio of ${formatNumber(summary.value.sharpeRatio)} means you earned solid returns for the risk taken.`,
      type: 'success',
    })
  }

  items.push({
    title: 'The Power of Time',
    message: `You invested ${formatCurrency(summary.value.invested)} over 20 years. Compound growth turned it into ${formatCurrency(summary.value.finalValue)}.`,
    type: 'info',
  })

  return items
})

function saveToLeaderboard() {
  const snap = simulationStore.latestSnapshot
  if (!snap) return

  // Calculate sharpe from simulation
  battleStore.leaderboard.push({
    playerName: 'Sandbox Player',
    finalValue: snap.value,
    totalReturn: simulationStore.totalReturn,
    sharpeRatio: simulationStore.sharpeRatio,
    maxDrawdown: simulationStore.maxDrawdown,
    allocations: { ...portfolioStore.allocations },
    timestamp: Date.now(),
  })
  battleStore.leaderboard.sort((a, b) => b.finalValue - a.finalValue)
  localStorage.setItem('wma-leaderboard', JSON.stringify(battleStore.leaderboard))
}
</script>

<template>
  <div v-if="summary" class="space-y-4">
    <Card class="border-primary/30">
      <CardHeader>
        <div class="text-center">
          <div class="text-4xl mb-2">
            {{ summary.totalReturn >= 0 ? '🏆' : '📉' }}
          </div>
          <CardTitle class="text-2xl">Simulation Complete!</CardTitle>
          <p class="text-sm text-muted-foreground mt-1">20 years of market history simulated</p>
        </div>
      </CardHeader>
      <CardContent>
        <!-- Final stats -->
        <div class="grid grid-cols-2 gap-4 mb-6">
          <div class="text-center p-3 rounded-lg bg-secondary">
            <p class="text-xs text-muted-foreground">Final Value</p>
            <p class="text-xl font-bold text-primary font-mono">{{ formatCurrency(summary.finalValue) }}</p>
          </div>
          <div class="text-center p-3 rounded-lg bg-secondary">
            <p class="text-xs text-muted-foreground">Total Return</p>
            <p :class="['text-xl font-bold font-mono', summary.totalReturn >= 0 ? 'text-primary' : 'text-destructive']">
              {{ formatPercent(summary.totalReturn) }}
            </p>
          </div>
          <div class="text-center p-3 rounded-lg bg-secondary">
            <p class="text-xs text-muted-foreground">Annual Return</p>
            <p class="text-lg font-bold font-mono">{{ formatPercent(summary.annualizedReturn) }}</p>
          </div>
          <div class="text-center p-3 rounded-lg bg-secondary">
            <p class="text-xs text-muted-foreground">Sharpe Ratio</p>
            <p class="text-lg font-bold font-mono">{{ formatNumber(summary.sharpeRatio) }}</p>
          </div>
        </div>

        <!-- Benchmark comparison -->
        <div class="flex items-center justify-between p-3 rounded-lg border border-border mb-6">
          <div>
            <p class="text-xs text-muted-foreground">vs Benchmark (100% SMI)</p>
            <p class="text-sm font-medium">
              {{ summary.beatBenchmark ? 'You won!' : 'Benchmark wins' }}
            </p>
          </div>
          <Badge :variant="summary.beatBenchmark ? 'default' : 'destructive'">
            {{ summary.beatBenchmark ? 'Outperformed' : 'Underperformed' }}
          </Badge>
        </div>

        <!-- Lessons learned -->
        <h4 class="font-semibold text-sm mb-3">Key Takeaways</h4>
        <div class="space-y-2 mb-6">
          <div
            v-for="lesson in lessons"
            :key="lesson.title"
            :class="[
              'rounded-lg p-3 border',
              lesson.type === 'success' ? 'border-green-500/20 bg-green-500/5' :
              lesson.type === 'warning' ? 'border-yellow-500/20 bg-yellow-500/5' :
              'border-blue-500/20 bg-blue-500/5',
            ]"
          >
            <p class="text-sm font-medium">{{ lesson.title }}</p>
            <p class="text-xs text-muted-foreground mt-0.5">{{ lesson.message }}</p>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex flex-col gap-2">
          <Button @click="() => { saveToLeaderboard(); emit('goToLeaderboard') }">
            Save Score & View Leaderboard
          </Button>
          <Button variant="outline" @click="emit('restart')">
            Try a Different Strategy
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
