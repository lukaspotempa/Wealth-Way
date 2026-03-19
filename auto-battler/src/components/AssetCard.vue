<template>
  <button
    @click="$emit('select', asset.id)"
    class="p-3 rounded-lg border text-left transition-all duration-150 cursor-pointer flex-shrink-0"
    :style="{
      background: isSelected ? 'var(--color-game-surface-2)' : 'var(--color-game-surface)',
      borderColor: isSelected ? asset.color : 'var(--color-game-border)',
      minWidth: '120px',
    }"
  >
    <!-- Top row -->
    <div class="flex justify-between items-center mb-1">
      <span class="text-xs font-mono font-semibold" :style="{ color: asset.color }">
        {{ asset.shortName }}
      </span>
      <span class="text-xs font-mono"
            :style="{ color: ytdReturn >= 0 ? 'var(--color-game-bull)' : 'var(--color-game-bear)' }">
        {{ ytdReturn >= 0 ? '+' : '' }}{{ (ytdReturn * 100).toFixed(1) }}%
      </span>
    </div>

    <!-- Sparkline -->
    <div class="w-full" style="height: 32px;">
      <canvas :ref="el => (canvas = el as HTMLCanvasElement)" class="w-full h-full block"></canvas>
    </div>

    <!-- Category label -->
    <div class="mt-1 text-xs" style="color: var(--color-game-text-3);">
      {{ categoryLabel }}
    </div>
  </button>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale } from 'chart.js'
import { useMarketStore } from '@/stores/marketStore'
import { CATEGORY_LABELS, type AssetMeta } from '@/utils/gameConstants'

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale)

const props = defineProps<{ asset: AssetMeta; isSelected: boolean }>()
defineEmits<{ select: [id: string] }>()

const market = useMarketStore()
const canvas = ref<HTMLCanvasElement | null>(null)
let sparkChart: Chart | null = null

const ytdReturn = computed(() => market.ytdReturns[props.asset.id] ?? 0)
const categoryLabel = computed(() => CATEGORY_LABELS[props.asset.category])

function getSparkData() {
  return market.getSparkline(props.asset.id, 60)
}

function drawSparkline() {
  if (!canvas.value) return
  const data = getSparkData()
  if (!data.length) return

  if (sparkChart) { sparkChart.destroy() }
  const ctx = canvas.value.getContext('2d')!
  const color = ytdReturn.value >= 0 ? '#00d4aa' : '#ff4757'

  sparkChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map((_, i) => i),
      datasets: [{
        data,
        borderColor: color,
        borderWidth: 1.5,
        pointRadius: 0,
        tension: 0.3,
        fill: false,
      }],
    },
    options: {
      responsive: false,
      animation: false,
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      scales: {
        x: { display: false },
        y: { display: false },
      },
    },
  })
}

watch(() => market.simulationIndex, () => {
  const data = getSparkData()
  if (!sparkChart || !data.length) { drawSparkline(); return }
  sparkChart.data.labels = data.map((_, i) => i)
  if (sparkChart.data.datasets[0]) {
    sparkChart.data.datasets[0].data = data
    sparkChart.data.datasets[0].borderColor = ytdReturn.value >= 0 ? '#00d4aa' : '#ff4757'
  }
  sparkChart.update('none')
})

onMounted(() => drawSparkline())
onUnmounted(() => sparkChart?.destroy())
</script>
