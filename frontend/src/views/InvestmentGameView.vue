<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useJourneyStore } from '@/stores/journey'
import { Chart, registerables } from 'chart.js'
import { useTheme } from '@/composables/useTheme'

Chart.register(...registerables)

const router = useRouter()
const journeyStore = useJourneyStore()
const { isDark } = useTheme()

// ── Game constants ───────────────────────────────────────────────────────────
const INITIAL_MONEY = 10_000
const TARGET = 13_000
const YEARS = [0, 1, 2, 3, 4, 5]
const YEAR_LABELS = ['Start', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5']

// Annual returns per asset (realistic-ish, designed so ETF is the steady winner)
const RETURNS = {
  etf:    [0.09, 0.14, -0.03, 0.18, 0.12],   // MSCI World – steady
  stock:  [0.25, -0.18, 0.35, -0.30, 0.20],   // Apple – volatile
  crypto: [0.90, -0.55, 0.70, -0.65, 1.20],   // BTC – very volatile
  savings: [0.01, 0.01, 0.01, 0.01, 0.01],    // Savings account – 1%
}

// Cumulative value of $1 at each year for each asset
function cumulativeValues(returns: number[]): number[] {
  const vals = [1]
  for (const r of returns) {
    vals.push(vals[vals.length - 1]! * (1 + r))
  }
  return vals
}

const etfCumul = cumulativeValues(RETURNS.etf)
const stockCumul = cumulativeValues(RETURNS.stock)
const cryptoCumul = cumulativeValues(RETURNS.crypto)
const savingsCumul = cumulativeValues(RETURNS.savings)

// ── Sliders ──────────────────────────────────────────────────────────────────
const etfPct = ref(34)
const stockPct = ref(33)
const cryptoPct = ref(33)

// When one slider changes, adjust the other two proportionally
function adjustSliders(changed: 'etf' | 'stock' | 'crypto') {
  const total = etfPct.value + stockPct.value + cryptoPct.value
  if (total === 100) return

  const diff = total - 100
  if (changed === 'etf') {
    const otherTotal = stockPct.value + cryptoPct.value
    if (otherTotal === 0) {
      stockPct.value = Math.max(0, Math.round((100 - etfPct.value) / 2))
      cryptoPct.value = Math.max(0, 100 - etfPct.value - stockPct.value)
    } else {
      const stockShare = stockPct.value / otherTotal
      stockPct.value = Math.max(0, Math.round(stockPct.value - diff * stockShare))
      cryptoPct.value = Math.max(0, 100 - etfPct.value - stockPct.value)
    }
  } else if (changed === 'stock') {
    const otherTotal = etfPct.value + cryptoPct.value
    if (otherTotal === 0) {
      etfPct.value = Math.max(0, Math.round((100 - stockPct.value) / 2))
      cryptoPct.value = Math.max(0, 100 - stockPct.value - etfPct.value)
    } else {
      const etfShare = etfPct.value / otherTotal
      etfPct.value = Math.max(0, Math.round(etfPct.value - diff * etfShare))
      cryptoPct.value = Math.max(0, 100 - etfPct.value - stockPct.value)
    }
  } else {
    const otherTotal = etfPct.value + stockPct.value
    if (otherTotal === 0) {
      etfPct.value = Math.max(0, Math.round((100 - cryptoPct.value) / 2))
      stockPct.value = Math.max(0, 100 - cryptoPct.value - etfPct.value)
    } else {
      const etfShare = etfPct.value / otherTotal
      etfPct.value = Math.max(0, Math.round(etfPct.value - diff * etfShare))
      stockPct.value = Math.max(0, 100 - etfPct.value - cryptoPct.value)
    }
  }
}

// ── Portfolio calculation ────────────────────────────────────────────────────
const portfolioValues = computed(() => {
  return YEARS.map((_, i) => {
    const etfVal = (etfPct.value / 100) * INITIAL_MONEY * etfCumul[i]!
    const stockVal = (stockPct.value / 100) * INITIAL_MONEY * stockCumul[i]!
    const cryptoVal = (cryptoPct.value / 100) * INITIAL_MONEY * cryptoCumul[i]!
    return etfVal + stockVal + cryptoVal
  })
})

const savingsValues = computed(() => {
  return YEARS.map((_, i) => INITIAL_MONEY * savingsCumul[i]!)
})

const finalValue = computed(() => portfolioValues.value[5]!)
const reachedGoal = computed(() => finalValue.value >= TARGET)

// ── Individual asset lines (for breakdown) ───────────────────────────────────
const etfLineValues = computed(() =>
  YEARS.map((_, i) => (etfPct.value / 100) * INITIAL_MONEY * etfCumul[i]!)
)
const stockLineValues = computed(() =>
  YEARS.map((_, i) => (stockPct.value / 100) * INITIAL_MONEY * stockCumul[i]!)
)
const cryptoLineValues = computed(() =>
  YEARS.map((_, i) => (cryptoPct.value / 100) * INITIAL_MONEY * cryptoCumul[i]!)
)

// ── Chart ────────────────────────────────────────────────────────────────────
const canvasRef = ref<HTMLCanvasElement | null>(null)
let chartInstance: Chart | null = null

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

function buildChart() {
  if (!canvasRef.value) return
  chartInstance?.destroy()

  const c = getColors()

  chartInstance = new Chart(canvasRef.value, {
    type: 'line',
    data: {
      labels: YEAR_LABELS,
      datasets: [
        {
          label: 'Your Portfolio',
          data: portfolioValues.value,
          borderColor: '#FFCB00',
          backgroundColor: 'rgba(255,203,0,0.1)',
          borderWidth: 3,
          pointRadius: 5,
          pointBackgroundColor: '#FFCB00',
          fill: false,
          tension: 0.3,
        },
        {
          label: `Target ($${TARGET.toLocaleString()})`,
          data: YEARS.map(() => TARGET),
          borderColor: reachedGoal.value ? '#22c55e' : '#ef4444',
          backgroundColor: reachedGoal.value ? '#22c55e' : '#ef4444',
          borderWidth: 2,
          pointRadius: 0,
          fill: false,
        },
        {
          label: 'Savings Account (1%)',
          data: savingsValues.value,
          borderColor: isDark.value ? 'rgba(156,163,175,0.6)' : 'rgba(107,114,128,0.6)',
          borderWidth: 2,
          borderDash: [4, 4],
          pointRadius: 0,
          fill: false,
        },
        {
          label: 'ETF portion',
          data: etfLineValues.value,
          borderColor: 'rgba(59,130,246,0.5)',
          borderWidth: 1.5,
          borderDash: [3, 3],
          pointRadius: 0,
          fill: false,
          hidden: true,
        },
        {
          label: 'Stock portion',
          data: stockLineValues.value,
          borderColor: 'rgba(239,68,68,0.5)',
          borderWidth: 1.5,
          borderDash: [3, 3],
          pointRadius: 0,
          fill: false,
          hidden: true,
        },
        {
          label: 'Crypto portion',
          data: cryptoLineValues.value,
          borderColor: 'rgba(168,85,247,0.5)',
          borderWidth: 1.5,
          borderDash: [3, 3],
          pointRadius: 0,
          fill: false,
          hidden: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 300 },
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: c.textColor,
            padding: 12,
            usePointStyle: true,
            font: { size: 11, family: 'Inter' },
            filter: (item) => {
              // Hide the individual asset portion datasets from the legend
              const hidden = ['ETF portion', 'Stock portion', 'Crypto portion']
              return !hidden.includes(item.text)
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
            label: (ctx) => {
              const v = ctx.parsed.y
              return `${ctx.dataset.label}: $${v.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: c.textColor, font: { family: 'Inter', size: 12 } },
        },
        y: {
          grid: { color: c.gridColor },
          min: 0,
          ticks: {
            color: c.textColor,
            font: { family: 'Inter' },
            callback: (v) => `$${Number(v).toLocaleString()}`,
          },
        },
      },
    },
  })
}

function updateChart() {
  if (!chartInstance) return
  chartInstance.data.datasets[0]!.data = portfolioValues.value
  chartInstance.data.datasets[1]!.data = YEARS.map(() => TARGET)
  chartInstance.data.datasets[1]!.borderColor = reachedGoal.value ? '#22c55e' : '#ef4444'
  chartInstance.data.datasets[2]!.data = savingsValues.value
  chartInstance.data.datasets[3]!.data = etfLineValues.value
  chartInstance.data.datasets[4]!.data = stockLineValues.value
  chartInstance.data.datasets[5]!.data = cryptoLineValues.value
  chartInstance.update()
}

watch([etfPct, stockPct, cryptoPct], () => {
  updateChart()
})

onMounted(() => {
  nextTick(() => buildChart())
})

// ── Game state ───────────────────────────────────────────────────────────────
const showResult = ref(false)

function confirmAllocation() {
  showResult.value = true
}

function resetGame() {
  etfPct.value = 34
  stockPct.value = 33
  cryptoPct.value = 33
  showResult.value = false
  nextTick(() => adjustSliders('etf'))
}

function completeGame() {
  journeyStore.completeNode('game-1')
  router.push('/journey')
}
</script>

<template>
  <div class="game-view">
    <div class="game-container">
      <!-- Header -->
      <div class="game-header">
        <button class="back-btn" @click="router.push('/journey')">
          &#8592; Back to Journey
        </button>
      </div>

      <div class="game-title-section">
        <span class="game-badge">Mini Game</span>
        <h1>Investment Simulator</h1>
        <p class="game-subtitle">
          You have <strong>${{ INITIAL_MONEY.toLocaleString() }}</strong> to invest over 5 years.
          Reach <strong>${{ TARGET.toLocaleString() }}</strong> to win!
        </p>
      </div>

      <!-- Sliders -->
      <div class="sliders-section">
        <h2 class="section-heading">Allocate Your Money</h2>
        <p class="section-hint">Move the sliders to decide how much goes into each investment. They always add up to 100%.</p>

        <div class="slider-row">
          <div class="slider-label">
            <span class="asset-dot asset-dot--etf"></span>
            <span class="asset-name">MSCI World ETF</span>
            <span class="asset-tag asset-tag--low">Steady</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            v-model.number="etfPct"
            class="slider slider--etf"
            @input="adjustSliders('etf')"
          />
          <span class="slider-value">{{ etfPct }}%</span>
        </div>

        <div class="slider-row">
          <div class="slider-label">
            <span class="asset-dot asset-dot--stock"></span>
            <span class="asset-name">Apple Stock</span>
            <span class="asset-tag asset-tag--med">Volatile</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            v-model.number="stockPct"
            class="slider slider--stock"
            @input="adjustSliders('stock')"
          />
          <span class="slider-value">{{ stockPct }}%</span>
        </div>

        <div class="slider-row">
          <div class="slider-label">
            <span class="asset-dot asset-dot--crypto"></span>
            <span class="asset-name">Bitcoin (BTC)</span>
            <span class="asset-tag asset-tag--high">Very Volatile</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            v-model.number="cryptoPct"
            class="slider slider--crypto"
            @input="adjustSliders('crypto')"
          />
          <span class="slider-value">{{ cryptoPct }}%</span>
        </div>

        <div class="allocation-bar">
          <div class="alloc-segment alloc-segment--etf" :style="{ width: etfPct + '%' }">
            <span v-if="etfPct > 10">ETF {{ etfPct }}%</span>
          </div>
          <div class="alloc-segment alloc-segment--stock" :style="{ width: stockPct + '%' }">
            <span v-if="stockPct > 10">AAPL {{ stockPct }}%</span>
          </div>
          <div class="alloc-segment alloc-segment--crypto" :style="{ width: cryptoPct + '%' }">
            <span v-if="cryptoPct > 10">BTC {{ cryptoPct }}%</span>
          </div>
        </div>
      </div>

      <!-- Chart -->
      <div class="chart-section">
        <h2 class="section-heading">Portfolio Growth Over 5 Years</h2>
        <div class="chart-container">
          <canvas ref="canvasRef" />
        </div>
      </div>

      <!-- Final value display -->
      <div class="value-display" :class="{ 'value-display--success': reachedGoal, 'value-display--fail': !reachedGoal }">
        <div class="value-row">
          <span class="value-label">Final Portfolio Value:</span>
          <span class="value-amount">${{ Math.round(finalValue).toLocaleString() }}</span>
        </div>
        <div class="value-row">
          <span class="value-label">Target:</span>
          <span class="value-target">${{ TARGET.toLocaleString() }}</span>
        </div>
        <div class="value-status">
          {{ reachedGoal ? 'You reached the goal!' : 'Not enough — try adding more ETF!' }}
        </div>
      </div>

      <!-- Action buttons -->
      <div class="game-actions" v-if="!showResult">
        <button class="btn btn--primary" @click="confirmAllocation">
          Lock In My Allocation
        </button>
      </div>

      <!-- Result panel -->
      <div v-if="showResult" class="result-panel">
        <div class="result-header" :class="{ 'result-header--win': reachedGoal }">
          <h2>{{ reachedGoal ? 'Congratulations!' : 'Not quite...' }}</h2>
        </div>

        <div class="result-body">
          <div class="result-stat">
            <span class="stat-label">Starting Capital</span>
            <span class="stat-value">${{ INITIAL_MONEY.toLocaleString() }}</span>
          </div>
          <div class="result-stat">
            <span class="stat-label">Final Value</span>
            <span class="stat-value" :class="{ 'stat-value--green': reachedGoal, 'stat-value--red': !reachedGoal }">
              ${{ Math.round(finalValue).toLocaleString() }}
            </span>
          </div>
          <div class="result-stat">
            <span class="stat-label">Return</span>
            <span class="stat-value">{{ ((finalValue / INITIAL_MONEY - 1) * 100).toFixed(1) }}%</span>
          </div>
          <div class="result-stat">
            <span class="stat-label">Savings Account Would Give</span>
            <span class="stat-value">${{ Math.round(savingsValues[5]!).toLocaleString() }}</span>
          </div>
        </div>

        <div class="result-insight">
          <template v-if="reachedGoal">
            <p><strong>Key takeaway:</strong> ETFs like the MSCI World provide steady, diversified growth. While single stocks and crypto can be exciting, their volatility makes them unreliable for reaching financial goals. A solid ETF allocation is the backbone of smart investing.</p>
          </template>
          <template v-else>
            <p><strong>Tip:</strong> Try increasing your ETF allocation! The MSCI World ETF spreads risk across 1,400+ companies worldwide, giving you steady growth without the wild swings of individual stocks or crypto. That stability is what helps you reliably reach your goals.</p>
          </template>
        </div>

        <div class="result-actions">
          <button class="btn btn--ghost" @click="resetGame">
            &#8634; Try Again
          </button>
          <button v-if="reachedGoal" class="btn btn--primary" @click="completeGame">
            Complete &amp; Continue &#10003;
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.game-view {
  flex: 1;
  padding: 1.5rem;
  display: flex;
  justify-content: center;
}

.game-container {
  max-width: 800px;
  width: 100%;
}

/* Header */
.game-header {
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;
}

.back-btn {
  background: none;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
  padding: 0.5rem 0;
  transition: color var(--transition-fast);
}

.back-btn:hover {
  color: var(--color-text);
}

/* Title */
.game-title-section {
  margin-bottom: 2rem;
}

.game-badge {
  display: inline-block;
  background: var(--color-secondary);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
}

.game-title-section h1 {
  font-size: 1.75rem;
  margin-bottom: 0.5rem;
}

.game-subtitle {
  color: var(--color-text-secondary);
  font-size: 1.05rem;
  line-height: 1.6;
}

/* Section heading */
.section-heading {
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
}

.section-hint {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  margin-bottom: 1.25rem;
}

/* Sliders */
.sliders-section {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.slider-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.slider-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 200px;
}

.asset-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.asset-dot--etf { background: #3b82f6; }
.asset-dot--stock { background: #ef4444; }
.asset-dot--crypto { background: #a855f7; }

.asset-name {
  font-weight: 600;
  font-size: 0.95rem;
}

.asset-tag {
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  padding: 0.1rem 0.4rem;
  border-radius: var(--radius-full);
}

.asset-tag--low {
  background: rgba(34, 197, 94, 0.15);
  color: #16a34a;
}

.asset-tag--med {
  background: rgba(245, 158, 11, 0.15);
  color: #d97706;
}

.asset-tag--high {
  background: rgba(239, 68, 68, 0.15);
  color: #dc2626;
}

.slider {
  flex: 1;
  -webkit-appearance: none;
  appearance: none;
  height: 8px;
  border-radius: 4px;
  outline: none;
  cursor: pointer;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  cursor: pointer;
  border: 3px solid white;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
}

.slider--etf {
  background: linear-gradient(to right, #dbeafe, #3b82f6);
}
.slider--etf::-webkit-slider-thumb {
  background: #3b82f6;
}

.slider--stock {
  background: linear-gradient(to right, #fee2e2, #ef4444);
}
.slider--stock::-webkit-slider-thumb {
  background: #ef4444;
}

.slider--crypto {
  background: linear-gradient(to right, #f3e8ff, #a855f7);
}
.slider--crypto::-webkit-slider-thumb {
  background: #a855f7;
}

.slider-value {
  font-weight: 700;
  font-size: 1rem;
  min-width: 45px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

/* Allocation bar */
.allocation-bar {
  display: flex;
  height: 28px;
  border-radius: var(--radius-md);
  overflow: hidden;
  margin-top: 0.5rem;
}

.alloc-segment {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 600;
  color: white;
  transition: width 0.2s ease;
  overflow: hidden;
  white-space: nowrap;
}

.alloc-segment--etf { background: #3b82f6; }
.alloc-segment--stock { background: #ef4444; }
.alloc-segment--crypto { background: #a855f7; }

/* Chart */
.chart-section {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.chart-container {
  position: relative;
  height: 350px;
  width: 100%;
}

.chart-legend-hint {
  text-align: center;
  font-size: 0.72rem;
  color: var(--color-text-muted);
  margin-top: 0.5rem;
  font-style: italic;
}

/* Value display */
.value-display {
  border-radius: var(--radius-xl);
  padding: 1.25rem 1.5rem;
  margin-bottom: 1.5rem;
  border: 2px solid var(--color-border);
  text-align: center;
}

.value-display--success {
  border-color: #22c55e;
  background: rgba(34, 197, 94, 0.08);
}

.value-display--fail {
  border-color: #ef4444;
  background: rgba(239, 68, 68, 0.06);
}

.value-row {
  display: flex;
  justify-content: center;
  align-items: baseline;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.value-label {
  font-size: 0.95rem;
  color: var(--color-text-secondary);
}

.value-amount {
  font-size: 1.6rem;
  font-weight: 800;
}

.value-display--success .value-amount { color: #22c55e; }
.value-display--fail .value-amount { color: #ef4444; }

.value-target {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-text-muted);
}

.value-status {
  font-weight: 600;
  font-size: 0.95rem;
  margin-top: 0.5rem;
}

.value-display--success .value-status { color: #22c55e; }
.value-display--fail .value-status { color: #ef4444; }

/* Actions */
.game-actions {
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
}

/* Result panel */
.result-panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
  margin-bottom: 2rem;
}

.result-header {
  padding: 1.25rem;
  text-align: center;
  background: rgba(239, 68, 68, 0.1);
}

.result-header h2 {
  color: #ef4444;
  font-size: 1.3rem;
}

.result-header--win {
  background: rgba(34, 197, 94, 0.1);
}

.result-header--win h2 {
  color: #22c55e;
}

.result-body {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  padding: 1.5rem;
}

.result-stat {
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 0.8rem;
  color: var(--color-text-muted);
  margin-bottom: 0.25rem;
}

.stat-value {
  font-size: 1.2rem;
  font-weight: 700;
}

.stat-value--green { color: #22c55e; }
.stat-value--red { color: #ef4444; }

.result-insight {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--color-border);
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--color-text-secondary);
}

.result-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  border-top: 1px solid var(--color-border);
}

/* Buttons */
.btn {
  padding: 0.75rem 2rem;
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: 1rem;
  transition: all var(--transition-fast);
  cursor: pointer;
}

.btn--primary {
  background: var(--color-primary);
  color: var(--color-secondary);
}

.btn--primary:hover {
  background: var(--color-primary-hover);
  box-shadow: var(--shadow-md);
}

.btn--ghost {
  background: transparent;
  color: var(--color-text-secondary);
}

.btn--ghost:hover {
  color: var(--color-text);
  background: var(--color-background-mute);
}

@media (max-width: 600px) {
  .slider-label {
    min-width: 130px;
  }

  .asset-tag {
    display: none;
  }

  .result-body {
    grid-template-columns: 1fr;
  }
}
</style>
