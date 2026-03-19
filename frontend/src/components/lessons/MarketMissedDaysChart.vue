<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Chart, registerables } from 'chart.js'
import { missedDaysData } from '@/services/lessonData'
import { useTheme } from '@/composables/useTheme'

Chart.register(...registerables)

const { isDark } = useTheme()
const canvasRef = ref<HTMLCanvasElement | null>(null)
const chartInstance = ref<Chart | null>(null)

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
    type: 'bar',
    data: {
      labels: missedDaysData.map(d => d.label),
      datasets: [
        {
          label: 'Final Portfolio Value (CHF)',
          data: missedDaysData.map(d => d.value),
          backgroundColor: missedDaysData.map(d => d.color),
          borderColor: missedDaysData.map(d => d.color),
          borderWidth: 1,
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: c.tooltipBg,
          titleColor: c.tooltipTitle,
          bodyColor: c.tooltipBody,
          borderColor: c.tooltipBorder,
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label: (ctx) => `CHF ${(ctx.parsed.y as number).toLocaleString('de-CH')}`,
          },
        },
        // Inline annotation showing starting value
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: c.textColor, font: { family: 'Inter', size: 11 } },
        },
        y: {
          grid: { color: c.gridColor },
          ticks: {
            color: c.textColor,
            font: { family: 'Inter' },
            callback: (v) => `CHF ${Number(v).toLocaleString('de-CH')}`,
          },
          beginAtZero: true,
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
    <div class="chart-legend-row">
      <span class="legend-dot" style="background:#FFCB00" />
      <span class="legend-label">Starting investment: CHF 10,000</span>
      <span class="legend-sep">·</span>
      <span class="legend-label">Period: 2004 – 2023 (S&amp;P 500)</span>
    </div>
    <p class="chart-subtitle">Source: J.P. Morgan "Guide to the Markets" — a widely cited study on the cost of market timing</p>
  </div>
</template>

<style scoped>
.chart-wrapper { width: 100%; }

.chart-container {
  position: relative;
  height: 320px;
  width: 100%;
}

.chart-legend-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: center;
  margin-top: 0.75rem;
  flex-wrap: wrap;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-label {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.legend-sep {
  color: var(--color-text-muted);
}

.chart-subtitle {
  text-align: center;
  font-size: 0.72rem;
  color: var(--color-text-muted);
  margin-top: 0.4rem;
  font-style: italic;
}
</style>
