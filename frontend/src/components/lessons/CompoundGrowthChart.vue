<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Chart, registerables } from 'chart.js'
import { calculateCompoundGrowth } from '@/services/lessonData'
import { useTheme } from '@/composables/useTheme'

Chart.register(...registerables)

const { isDark } = useTheme()
const canvasRef = ref<HTMLCanvasElement | null>(null)
const chartInstance = ref<Chart | null>(null)
const growth = calculateCompoundGrowth()

function getColors() {
  return {
    gridColor: isDark.value ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
    textColor: isDark.value ? '#e5e7eb' : '#374151',
    tooltipBg: isDark.value ? '#1f2937' : '#ffffff',
    tooltipTitle: isDark.value ? '#f9fafb' : '#111827',
    tooltipBody: isDark.value ? '#e5e7eb' : '#374151',
    tooltipBorder: isDark.value ? '#374151' : '#e5e7eb',
  }
}

function createChart() {
  if (!canvasRef.value) return
  chartInstance.value?.destroy()

  const c = getColors()

  chartInstance.value = new Chart(canvasRef.value, {
    type: 'line',
    data: {
      labels: growth.labels,
      datasets: growth.datasets.map((ds) => ({
        label: ds.label,
        data: ds.values,
        borderColor: ds.color,
        backgroundColor: ds.color + '18',
        borderWidth: ds.color === '#FFCB00' ? 3 : 2,
        fill: ds.color === '#FFCB00',
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: ds.color,
      })),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: c.textColor,
            padding: 16,
            usePointStyle: true,
            pointStyle: 'circle',
            boxWidth: 10,
            boxHeight: 10,
            font: { size: 12, family: 'Inter' },
            generateLabels: (chart) => {
              const defaultLabels = Chart.defaults.plugins.legend.labels.generateLabels(chart)
              return defaultLabels.map((label) => {
                const dataset = chart.data.datasets[label.datasetIndex ?? 0] as any
                const color = Array.isArray(dataset?.borderColor)
                  ? dataset.borderColor[0]
                  : (dataset?.borderColor ?? label.fillStyle)

                return {
                  ...label,
                  pointStyle: 'circle',
                  fillStyle: color,
                  strokeStyle: color,
                  lineWidth: 0,
                }
              })
            },
          },
        },
        tooltip: {
          backgroundColor: c.tooltipBg,
          titleColor: c.tooltipTitle,
          bodyColor: c.tooltipBody,
          borderColor: c.tooltipBorder,
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: CHF ${(ctx.parsed.y as number).toLocaleString('de-CH')}`,
          },
        },
      },
      scales: {
        x: {
          grid: { color: c.gridColor },
          ticks: {
            color: c.textColor,
            font: { family: 'Inter', size: 11 },
            maxTicksLimit: 7,
          },
        },
        y: {
          grid: { color: c.gridColor },
          ticks: {
            color: c.textColor,
            font: { family: 'Inter' },
            callback: (v) => `CHF ${Number(v).toLocaleString('de-CH')}`,
          },
        },
      },
    },
  })
}

onMounted(() => createChart())
</script>

<template>
  <div class="chart-wrapper">
    <div class="chart-container">
      <canvas ref="canvasRef" />
    </div>
    <p class="chart-subtitle">Starting capital: CHF 10,000 · No additional contributions · Returns are approximate averages</p>
  </div>
</template>

<style scoped>
.chart-wrapper { width: 100%; }

.chart-container {
  position: relative;
  height: 320px;
  width: 100%;
}

.chart-subtitle {
  text-align: center;
  font-size: 0.72rem;
  color: var(--color-text-muted);
  margin-top: 0.75rem;
  font-style: italic;
}
</style>
