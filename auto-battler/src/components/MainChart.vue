<template>
  <div class="relative w-full h-full flex flex-col">
    <!-- Chart header -->
    <div class="flex items-center justify-between px-4 py-2 border-b flex-shrink-0"
         style="border-color: var(--color-game-border);">
      <div class="flex items-center gap-3">
        <div class="w-2 h-2 rounded-full"
             :style="{ background: selectedColor }"></div>
        <span class="text-sm font-semibold" style="color: var(--color-game-text);">
          {{ selectedName }}
        </span>
        <span class="text-xs font-mono px-2 py-0.5 rounded"
              :style="{
                background: currentReturn >= 0 ? 'rgba(0,212,170,0.15)' : 'rgba(255,71,87,0.15)',
                color: currentReturn >= 0 ? 'var(--color-game-bull)' : 'var(--color-game-bear)',
              }">
          {{ currentReturn >= 0 ? '+' : '' }}{{ (currentReturn * 100).toFixed(2) }}%
        </span>
      </div>
      <div class="text-xs font-mono" style="color: var(--color-game-text-3);">
        {{ yearLabel }}  &nbsp;·&nbsp;  Indexed to 100
      </div>
    </div>

    <!-- Canvas container -->
    <div class="flex-1 relative p-2">
      <canvas ref="chartCanvas" class="w-full h-full block"></canvas>
    </div>

    <!-- Progress bar -->
    <div class="h-0.5 flex-shrink-0" style="background: var(--color-game-border);">
      <div class="h-full transition-all duration-100"
           :style="{ width: (progress * 100) + '%', background: 'var(--color-game-accent)' }"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip,
} from 'chart.js'
import { useMarketStore } from '@/stores/marketStore'
import { useGameStore } from '@/stores/gameStore'
import { ASSETS } from '@/utils/gameConstants'

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip)

const market = useMarketStore()
const game = useGameStore()

const chartCanvas = ref<HTMLCanvasElement | null>(null)
let chart: Chart | null = null

const selectedAsset = computed(() => game.selectedAssetId)
const selectedMeta = computed(() => ASSETS.find(a => a.id === selectedAsset.value))
const selectedColor = computed(() => selectedMeta.value?.color ?? '#00d4aa')
const selectedName = computed(() => selectedMeta.value?.shortName ?? selectedAsset.value)
const yearLabel = computed(() => game.currentYearData?.label ?? '')
const progress = computed(() => market.progress)

const currentReturn = computed(() => {
  return market.ytdReturns[selectedAsset.value] ?? 0
})

function buildChartData() {
  const visible = market.visibleData
  const unlocked = game.unlockedAssets

  const labels: string[] = []
  const firstAssetId = unlocked[0]
  const firstAsset = firstAssetId ? visible[firstAssetId] : undefined
  if (firstAsset) {
    firstAsset.forEach((p: { date: Date; value: number }) => {
      labels.push(p.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
    })
  }

  const datasets = unlocked.map(id => {
    const meta = ASSETS.find(a => a.id === id)
    const data = visible[id]?.map(p => p.value) ?? []
    const isSelected = id === selectedAsset.value
    return {
      label: meta?.shortName ?? id,
      data,
      borderColor: isSelected ? (meta?.color ?? '#00d4aa') : (meta?.color ?? '#ffffff') + '30',
      backgroundColor: isSelected
        ? (meta?.color ?? '#00d4aa') + '10'
        : 'transparent',
      fill: isSelected,
      borderWidth: isSelected ? 2 : 1,
      pointRadius: 0,
      tension: 0.2,
    }
  })

  return { labels, datasets }
}

function initChart() {
  if (!chartCanvas.value) return
  if (chart) { chart.destroy() }

  const ctx = chartCanvas.value.getContext('2d')!
  const { labels, datasets } = buildChartData()

  chart = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15,22,41,0.95)',
          borderColor: '#1e2d4a',
          borderWidth: 1,
          titleColor: '#8892b0',
          bodyColor: '#e8eaf0',
          padding: 10,
          callbacks: {
            label: (item: { raw: unknown; dataset: { label?: string } }) => {
              const val = item.raw as number
              const ret = ((val - 100) / 100 * 100).toFixed(2)
              return ` ${item.dataset.label}: ${ret}%`
            },
          },
        },
      },
      scales: {
        x: {
          grid: { color: '#1e2d4a44' },
          ticks: {
            color: '#8892b0',
            maxTicksLimit: 6,
            font: { family: 'JetBrains Mono', size: 10 },
          },
          border: { color: '#1e2d4a' },
        },
        y: {
          grid: { color: '#1e2d4a44' },
          ticks: {
            color: '#8892b0',
            font: { family: 'JetBrains Mono', size: 10 },
            callback: val => `${(val as number).toFixed(0)}`,
          },
          border: { color: '#1e2d4a' },
        },
      },
    },
  })

  // Draw reference line at 100
  const refPlugin = {
    id: 'referenceLine',
    afterDraw(c: Chart) {
      const { ctx, chartArea, scales } = c
      if (!chartArea || !scales['y']) return
      const y = scales['y'].getPixelForValue(100)
      ctx.save()
      ctx.strokeStyle = '#8892b044'
      ctx.lineWidth = 1
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      ctx.moveTo(chartArea.left, y)
      ctx.lineTo(chartArea.right, y)
      ctx.stroke()
      ctx.restore()
    },
  }
}

function updateChart() {
  if (!chart) { initChart(); return }
  const { labels, datasets } = buildChartData()
  chart.data.labels = labels
  chart.data.datasets = datasets
  chart.update('none')
}

// Watch simulation ticks
watch(() => market.simulationIndex, updateChart)
watch(() => game.selectedAssetId, updateChart)
watch(() => market.currentYearData, () => { initChart() }, { deep: false })

onMounted(() => { initChart() })
onUnmounted(() => { chart?.destroy() })
</script>
