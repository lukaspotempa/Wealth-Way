<script setup lang="ts">
/**
 * BattleChart
 *
 * Renders the portfolio-vs-benchmarks line chart using Chart.js.
 * Displays portfolio value, S&P 500, MSCI World, and inflation-adjusted
 * purchasing power as four distinct lines.
 *
 * Designed to work incrementally — pass snapshots as the battle progresses
 * and the chart will animate as data arrives.
 */
import { ref, watch, onMounted, onUnmounted, computed, type PropType } from 'vue'
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  Filler,
  type ChartData,
  type ChartOptions,
} from 'chart.js'
import type { YearlyPortfolioSnapshot } from '@/types'
import { useTheme } from '@/composables/useTheme'

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  Filler,
)

const props = defineProps({
  snapshots: {
    type: Array as PropType<YearlyPortfolioSnapshot[]>,
    default: () => [],
  },
  startingCapital: {
    type: Number,
    default: 10000,
  },
})

const canvasRef = ref<HTMLCanvasElement | null>(null)
let chart: Chart | null = null
const { isDark } = useTheme()

// ─── Chart colour palette ─────────────────────────────────────────────────────

const PORTFOLIO_COLOR = '#FFCB00'
const SP500_COLOR = '#ef4444'
const MSCI_COLOR = '#3b82f6'
const INFLATION_COLOR = '#9ca3af'

// ─── Build Chart.js dataset from snapshots ────────────────────────────────────

function buildChartData(
  snapshots: YearlyPortfolioSnapshot[],
  startingCapital: number,
  dark: boolean,
): ChartData<'line'> {
  const labels = snapshots.map((s) => String(s.year))
  const portfolioData = snapshots.map((s) => s.portfolioValue)
  const sp500Data = snapshots.map((s) => s.sp500Value)
  const msciData = snapshots.map((s) => s.msciWorldValue)
  const inflationData = snapshots.map((s) => s.inflationValue)

  const gridColor = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'

  return {
    labels,
    datasets: [
      {
        label: 'Your Portfolio',
        data: portfolioData,
        borderColor: PORTFOLIO_COLOR,
        backgroundColor: `${PORTFOLIO_COLOR}22`,
        borderWidth: 3,
        pointRadius: 4,
        pointHoverRadius: 7,
        pointBackgroundColor: PORTFOLIO_COLOR,
        fill: false,
        tension: 0.3,
        order: 1,
      },
      {
        label: 'S&P 500',
        data: sp500Data,
        borderColor: SP500_COLOR,
        backgroundColor: `${SP500_COLOR}11`,
        borderWidth: 2,
        pointRadius: 2,
        pointHoverRadius: 6,
        borderDash: [6, 3],
        fill: false,
        tension: 0.3,
        order: 2,
      },
      {
        label: 'MSCI World',
        data: msciData,
        borderColor: MSCI_COLOR,
        backgroundColor: `${MSCI_COLOR}11`,
        borderWidth: 2,
        pointRadius: 2,
        pointHoverRadius: 6,
        borderDash: [4, 4],
        fill: false,
        tension: 0.3,
        order: 3,
      },
      {
        label: 'Required to keep purchasing power',
        data: inflationData,
        borderColor: INFLATION_COLOR,
        backgroundColor: `${INFLATION_COLOR}11`,
        borderWidth: 1.5,
        pointRadius: 1,
        pointHoverRadius: 4,
        borderDash: [2, 4],
        fill: false,
        tension: 0.3,
        order: 4,
      },
    ],
  }
}

function buildChartOptions(dark: boolean): ChartOptions<'line'> {
  const textColor = dark ? '#d1d5db' : '#374151'
  const gridColor = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'

  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 400 },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    scales: {
      x: {
        grid: { color: gridColor },
        ticks: {
          color: textColor,
          font: { size: 11, family: 'Inter, sans-serif' },
        },
        border: { color: gridColor },
      },
      y: {
        grid: { color: gridColor },
        ticks: {
          color: textColor,
          font: { size: 11, family: 'Inter, sans-serif' },
          callback: (value) => `CHF ${Number(value).toLocaleString('de-CH', { maximumFractionDigits: 0 })}`,
        },
        border: { color: gridColor },
      },
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: textColor,
          font: { size: 11, family: 'Inter, sans-serif' },
          padding: 16,
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 10,
          boxHeight: 10,
        },
      },
      tooltip: {
        backgroundColor: dark ? '#1f2937' : '#ffffff',
        borderColor: dark ? '#374151' : '#e5e7eb',
        borderWidth: 1,
        titleColor: dark ? '#f9fafb' : '#111827',
        bodyColor: dark ? '#d1d5db' : '#374151',
        titleFont: { size: 13, weight: 'bold', family: 'Inter, sans-serif' },
        bodyFont: { size: 12, family: 'Inter, sans-serif' },
        padding: 12,
        callbacks: {
          label: (ctx) => {
            const val = ctx.parsed.y ?? 0
            return ` ${ctx.dataset.label}: CHF ${val.toLocaleString('de-CH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
          },
        },
      },
    },
  }
}

// ─── Chart lifecycle ──────────────────────────────────────────────────────────

function createChart() {
  if (!canvasRef.value) return

  chart?.destroy()

  chart = new Chart(canvasRef.value, {
    type: 'line',
    data: buildChartData(props.snapshots, props.startingCapital, isDark.value),
    options: buildChartOptions(isDark.value),
  })
}

function updateChart() {
  if (!chart) return
  const newData = buildChartData(props.snapshots, props.startingCapital, isDark.value)
  chart.data = newData
  chart.update('active')
}

onMounted(() => {
  createChart()
})

onUnmounted(() => {
  chart?.destroy()
  chart = null
})

watch(
  () => props.snapshots,
  () => updateChart(),
  { deep: true },
)

watch(isDark, () => {
  // Full rebuild on theme switch to get updated colors
  createChart()
})
</script>

<template>
  <div class="battle-chart">
    <div class="chart-canvas-wrapper">
      <canvas ref="canvasRef" />
    </div>
  </div>
</template>

<style scoped>
.battle-chart {
  width: 100%;
}

.chart-canvas-wrapper {
  position: relative;
  height: 320px;
  width: 100%;
}
</style>
