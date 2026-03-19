<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Chart, registerables } from 'chart.js'
import { calculateChildrenSavings } from '@/services/lessonData'
import { useTheme } from '@/composables/useTheme'

Chart.register(...registerables)

const { isDark } = useTheme()
const canvasRef = ref<HTMLCanvasElement | null>(null)
const chartInstance = ref<Chart | null>(null)
const data = calculateChildrenSavings()

function getChartColors() {
  return {
    gridColor: isDark.value ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
    textColor: isDark.value ? '#e5e7eb' : '#374151',
  }
}

function createChart() {
  if (!canvasRef.value) return
  if (chartInstance.value) {
    chartInstance.value.destroy()
  }

  const colors = getChartColors()

  chartInstance.value = new Chart(canvasRef.value, {
    type: 'bar',
    data: {
      labels: data.map(d => d.year.toString()),
      datasets: [
        {
          label: 'Purchasing Power Lost to Inflation ($)',
          data: data.map(d => d.inflationLoss),
          backgroundColor: 'rgba(239, 68, 68, 0.7)',
          borderColor: '#ef4444',
          borderWidth: 2,
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: colors.textColor,
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
          backgroundColor: isDark.value ? '#1f2937' : '#ffffff',
          titleColor: isDark.value ? '#f9fafb' : '#111827',
          bodyColor: isDark.value ? '#e5e7eb' : '#374151',
          borderColor: isDark.value ? '#374151' : '#e5e7eb',
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label: (ctx) => `Lost to inflation: $${(ctx.parsed.y ?? 0).toFixed(2)}`,
          },
        },
      },
      scales: {
        x: {
          grid: { color: colors.gridColor },
          ticks: { color: colors.textColor, font: { family: 'Inter' } },
        },
        y: {
          grid: { color: colors.gridColor },
          ticks: {
            color: colors.textColor,
            font: { family: 'Inter' },
            callback: (value) => `$${value}`,
          },
          beginAtZero: true,
        },
      },
    },
  })
}

onMounted(() => {
  createChart()
})
</script>

<template>
  <div class="chart-wrapper">
    <div class="chart-container">
      <canvas ref="canvasRef" />
    </div>
    <p class="chart-subtitle">cumulative inflation loss on piggy bank savings, using 2% annual rate from 2012 to 2018</p>
  </div>
</template>

<style scoped>
.chart-wrapper {
  width: 100%;
}

.chart-container {
  position: relative;
  height: 350px;
  width: 100%;
}

.chart-subtitle {
  text-align: center;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-top: 0.75rem;
  font-style: italic;
  text-transform: lowercase;
}
</style>
