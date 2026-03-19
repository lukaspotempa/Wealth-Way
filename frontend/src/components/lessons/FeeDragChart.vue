<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Chart, registerables } from 'chart.js'
import { calculateFeeDrag } from '@/services/lessonData'
import { useTheme } from '@/composables/useTheme'

Chart.register(...registerables)

const { isDark } = useTheme()
const canvasRef = ref<HTMLCanvasElement | null>(null)
const chartInstance = ref<Chart | null>(null)
const drag = calculateFeeDrag()

// Final values for the callout
const finalEtf = drag.etf[drag.etf.length - 1] ?? 0
const finalActive = drag.active[drag.active.length - 1] ?? 0
const feeLoss = finalEtf - finalActive

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
      labels: drag.labels,
      datasets: [
        {
          label: 'Low-cost ETF (TER 0.2%)',
          data: drag.etf,
          borderColor: '#FFCB00',
          backgroundColor: 'rgba(255,203,0,0.12)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: '#FFCB00',
        },
        {
          label: 'Active Fund (TER 1.5%)',
          data: drag.active,
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239,68,68,0.06)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: '#ef4444',
          borderDash: [6, 3],
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
            pointStyle: 'circle',
            boxWidth: 10,
            boxHeight: 10,
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
    <!-- Fee callout -->
    <div class="fee-callout">
      <div class="fee-item fee-item--etf">
        <span class="fee-label">ETF after 30 years</span>
        <span class="fee-value">CHF {{ finalEtf.toLocaleString('de-CH') }}</span>
      </div>
      <div class="fee-item fee-item--active">
        <span class="fee-label">Active fund after 30 years</span>
        <span class="fee-value">CHF {{ finalActive.toLocaleString('de-CH') }}</span>
      </div>
      <div class="fee-item fee-item--loss">
        <span class="fee-label">Lost to fees</span>
        <span class="fee-value">CHF {{ feeLoss.toLocaleString('de-CH') }}</span>
      </div>
    </div>
    <p class="chart-subtitle">Starting capital CHF 10,000 · 7% gross annual return · No additional contributions</p>
  </div>
</template>

<style scoped>
.chart-wrapper { width: 100%; }

.chart-container {
  position: relative;
  height: 300px;
  width: 100%;
}

.fee-callout {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
  flex-wrap: wrap;
  justify-content: center;
}

.fee-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.6rem 1rem;
  border-radius: var(--radius-md);
  min-width: 130px;
  border: 1px solid var(--color-border);
  background: var(--color-background-mute);
}

.fee-item--etf   { border-color: #FFCB00; }
.fee-item--active { border-color: #ef4444; }
.fee-item--loss  { border-color: #dc2626; background: rgba(220,38,38,0.07); }

.fee-label {
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-muted);
  margin-bottom: 0.25rem;
}

.fee-value {
  font-size: 1rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--color-heading);
}

.fee-item--loss .fee-value { color: #ef4444; }
.fee-item--etf  .fee-value { color: #FFCB00; }

.chart-subtitle {
  text-align: center;
  font-size: 0.72rem;
  color: var(--color-text-muted);
  margin-top: 0.6rem;
  font-style: italic;
}
</style>
