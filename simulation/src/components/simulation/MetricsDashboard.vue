<script setup lang="ts">
import { computed } from 'vue'
import { Card, CardContent, Tooltip } from '@/components/ui'
import { useSimulationStore } from '@/stores/simulationStore'
import { formatCurrency, formatPercent, formatNumber } from '@/lib/utils'

const simulationStore = useSimulationStore()

const metrics = computed(() => {
  const snap = simulationStore.latestSnapshot
  const bench = simulationStore.latestBenchmark

  return [
    {
      label: 'Portfolio Value',
      value: snap ? formatCurrency(snap.value) : 'CHF 0',
      change: snap ? formatPercent(snap.returnPct) : '+0.0%',
      isPositive: snap ? snap.returnPct >= 0 : true,
      tooltip: 'Current total value of your portfolio including invested capital and gains/losses.',
    },
    {
      label: 'Total Invested',
      value: snap ? formatCurrency(snap.invested) : 'CHF 0',
      change: '',
      isPositive: true,
      tooltip: 'Total amount you have put into the portfolio (initial + monthly savings).',
    },
    {
      label: 'Total Return',
      value: formatPercent(simulationStore.totalReturn),
      change: '',
      isPositive: simulationStore.totalReturn >= 0,
      tooltip: 'Total percentage gain or loss on your invested capital.',
    },
    {
      label: 'Annual Return',
      value: formatPercent(simulationStore.annualizedReturn),
      change: '',
      isPositive: simulationStore.annualizedReturn >= 0,
      tooltip: 'Average annual return, accounting for compounding.',
    },
    {
      label: 'Max Drawdown',
      value: formatPercent(-simulationStore.maxDrawdown),
      change: '',
      isPositive: false,
      tooltip: 'Largest peak-to-trough decline. Lower is better.',
    },
    {
      label: 'Sharpe Ratio',
      value: formatNumber(simulationStore.sharpeRatio),
      change: simulationStore.sharpeRatio > 1 ? 'Good' : simulationStore.sharpeRatio > 0.5 ? 'Average' : 'Low',
      isPositive: simulationStore.sharpeRatio > 0.5,
      tooltip: 'Risk-adjusted return. Above 1.0 is good, above 2.0 is excellent.',
    },
    {
      label: 'Benchmark (SMI)',
      value: bench ? formatCurrency(bench.value) : 'CHF 0',
      change: bench ? formatPercent(bench.returnPct) : '+0.0%',
      isPositive: bench ? bench.returnPct >= 0 : true,
      tooltip: 'What you would have if you invested 100% in the SMI index.',
    },
    {
      label: 'vs Benchmark',
      value: snap && bench ? formatPercent((snap.value - bench.value) / bench.value) : '+0.0%',
      change: snap && bench && snap.value > bench.value ? 'Beating' : 'Trailing',
      isPositive: snap && bench ? snap.value >= bench.value : true,
      tooltip: 'How your portfolio performs compared to the SMI benchmark.',
    },
  ]
})
</script>

<template>
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-2">
    <Tooltip v-for="metric in metrics" :key="metric.label" :content="metric.tooltip">
      <Card class="cursor-help">
        <CardContent class="p-3">
          <p class="text-xs text-muted-foreground mb-1">{{ metric.label }}</p>
          <p :class="['text-sm font-bold font-mono', metric.isPositive ? 'text-primary' : 'text-destructive']">
            {{ metric.value }}
          </p>
          <p v-if="metric.change" :class="['text-xs', metric.isPositive ? 'text-primary/70' : 'text-destructive/70']">
            {{ metric.change }}
          </p>
        </CardContent>
      </Card>
    </Tooltip>
  </div>
</template>
