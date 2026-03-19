<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
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
    type: 'line',
    data: {
      labels: data.map(d => d.year.toString()),
      datasets: [
        {
          label: 'Sam - Piggy Bank (nominal)',
          data: data.map(d => d.child2Savings),
          borderColor: '#6b7280',
          backgroundColor: 'rgba(107, 114, 128, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.3,
          pointRadius: 5,
          pointBackgroundColor: '#6b7280',
        },
        {
          label: 'Sam - Piggy Bank (real value)',
          data: data.map(d => d.child2RealValue),
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.05)',
          borderWidth: 2,
          borderDash: [5, 5],
          fill: false,
          tension: 0.3,
          pointRadius: 5,
          pointBackgroundColor: '#ef4444',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index',
      },
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
            label: (ctx) => `${ctx.dataset.label}: $${(ctx.parsed.y ?? 0).toFixed(2)}`,
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
        },
      },
    },
  })
}

onMounted(() => {
  createChart()
})

// We expose data so parent can access final values
const finalData = computed(() => data[data.length - 1])
defineExpose({ finalData })
</script>

<template>
  <div class="chart-wrapper">
    <div class="chart-container">
      <canvas ref="canvasRef" />
    </div>
    <p class="chart-subtitle">data based on S&P 500 returns from 2012 to 2018, with 2% annual inflation rate</p>
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
