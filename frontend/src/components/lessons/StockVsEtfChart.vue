<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Chart, registerables } from 'chart.js'
import { stockVsEtfData } from '@/services/lessonData'
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
    zeroLine: isDark.value ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)',
  }
}

function createChart() {
  if (!canvasRef.value) return
  chartInstance.value?.destroy()

  const c = getColors()

  chartInstance.value = new Chart(canvasRef.value, {
    type: 'bar',
    data: {
      labels: stockVsEtfData.years,
      datasets: [
        {
          label: 'Apple (AAPL) — Single Stock',
          data: stockVsEtfData.singleStock,
          backgroundColor: stockVsEtfData.singleStock.map(v =>
            v >= 0 ? 'rgba(239,68,68,0.75)' : 'rgba(239,68,68,0.45)',
          ),
          borderColor: '#ef4444',
          borderWidth: 1,
          borderRadius: 4,
        },
        {
          label: 'MSCI World ETF — 1,400+ companies',
          data: stockVsEtfData.etf,
          backgroundColor: stockVsEtfData.etf.map(v =>
            v >= 0 ? 'rgba(255,203,0,0.8)' : 'rgba(255,203,0,0.45)',
          ),
          borderColor: '#FFCB00',
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
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
            pointStyle: 'rect',
            boxWidth: 12,
            boxHeight: 12,
            font: { size: 12, family: 'Inter' },
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
            label: (ctx) => {
              const v = ctx.parsed.y as number
              return `${ctx.dataset.label}: ${v >= 0 ? '+' : ''}${v.toFixed(1)}%`
            },
          },
        },
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
            callback: (v) => `${v}%`,
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
    <p class="chart-subtitle">Annual total returns · AAPL vs MSCI World index · 2014 – 2023 · For illustration of volatility contrast</p>
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
