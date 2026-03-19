<script setup lang="ts">
/**
 * ChallengeView — AutoBattle Mode
 *
 * The player builds a portfolio, selects a historical period, and watches
 * it battle year-by-year against S&P 500 and MSCI World with real data.
 *
 * Key educational goal: Sharpe Ratio (risk-adjusted return) > raw return.
 */
import { ref, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useJourneyStore } from '@/stores/journey'
import { runSimulation, AVAILABLE_YEARS } from '@/services/autoBattleEngine'
import type { AutoBattleAsset, YearlyPortfolioSnapshot, AutoBattleResult } from '@/types'
import BattleChart from '@/components/autobattle/BattleChart.vue'
import SharpeRatioBadge from '@/components/autobattle/SharpeRatioBadge.vue'

const router = useRouter()
const journeyStore = useJourneyStore()

// ─── Phase state ─────────────────────────────────────────────────────────────

type Phase = 'configure' | 'battling' | 'results'
const phase = ref<Phase>('configure')

// ─── Portfolio definition ────────────────────────────────────────────────────

const assets = ref<AutoBattleAsset[]>([
  {
    key: 'SMI',
    name: 'Swiss Market Index',
    ticker: 'SMI',
    description: "Switzerland's blue-chip index — 20 largest Swiss companies",
    category: 'Swiss Stocks',
    risk: 'medium',
    color: '#FFCB00',
    allocation: 0,
  },
  {
    key: 'BONDS_CHF',
    name: 'Swiss Government Bonds',
    ticker: 'CHF-BOND',
    description: 'AAA-rated Swiss Confederation bonds, 5–10 year maturity',
    category: 'Bonds',
    risk: 'low',
    color: '#004A5A',
    allocation: 0,
  },
  {
    key: 'GLOBAL_ETF',
    name: 'Global ETF (MSCI World)',
    ticker: 'MSCI-ETF',
    description: 'Low-cost passive ETF tracking the MSCI World index',
    category: 'Global ETF',
    risk: 'medium',
    color: '#8b5cf6',
    allocation: 0,
  },
  {
    key: 'REAL_ESTATE',
    name: 'Swiss Real Estate Fund',
    ticker: 'RE-CH',
    description: 'Listed Swiss real estate fund — residential and commercial',
    category: 'Real Estate',
    risk: 'medium',
    color: '#10b981',
    allocation: 0,
  },
  {
    key: 'EMERGING_MARKETS',
    name: 'Emerging Markets ETF',
    ticker: 'EM',
    description: 'Broad exposure to China, India, Brazil and more',
    category: 'Emerging Markets',
    risk: 'high',
    color: '#f59e0b',
    allocation: 0,
  },
  {
    key: 'CASH',
    name: 'Cash Reserve',
    ticker: 'CASH',
    description: 'Swiss franc cash equivalents — near-zero return, max stability',
    category: 'Cash',
    risk: 'low',
    color: '#6b7280',
    allocation: 0,
  },
])

// ─── Configuration ───────────────────────────────────────────────────────────

const startingCapital = ref(10000)
const startYear = ref(2000)
const endYear = ref(2023)

const capitalOptions = [5000, 10000, 25000, 50000, 100000]
const yearOptions = Array.from(
  { length: AVAILABLE_YEARS.max - AVAILABLE_YEARS.min + 1 },
  (_, i) => AVAILABLE_YEARS.min + i,
)

// ─── Portfolio derived state ─────────────────────────────────────────────────

const totalAllocation = computed(() =>
  assets.value.reduce((sum, a) => sum + a.allocation, 0),
)

const isValid = computed(
  () => totalAllocation.value === 100 && startYear.value < endYear.value,
)

const riskScore = computed(() => {
  const weights = { low: 1, medium: 2, high: 3 }
  const weighted = assets.value.reduce(
    (sum, a) => sum + a.allocation * weights[a.risk],
    0,
  )
  return totalAllocation.value > 0 ? weighted / totalAllocation.value : 0
})

const riskLabel = computed(() => {
  if (riskScore.value < 1.5) return 'Conservative'
  if (riskScore.value < 2.2) return 'Balanced'
  return 'Aggressive'
})

const riskColor = computed(() => {
  if (riskScore.value < 1.5) return '#10b981'
  if (riskScore.value < 2.2) return '#f59e0b'
  return '#ef4444'
})

const allocationRemaining = computed(() => 100 - totalAllocation.value)

// ─── Battle state ─────────────────────────────────────────────────────────────

const liveSnapshots = ref<YearlyPortfolioSnapshot[]>([])
const currentSharpe = computed<number | null>(() => {
  const last = liveSnapshots.value[liveSnapshots.value.length - 1]
  return last?.sharpeRatio ?? null
})

const battleResult = ref<AutoBattleResult | null>(null)
const battleError = ref<string | null>(null)
const isLoading = ref(false)

// Animated year counter during battle
const currentBattleYear = computed(() => {
  const last = liveSnapshots.value[liveSnapshots.value.length - 1]
  return last?.year ?? startYear.value
})
const totalYears = computed(() => endYear.value - startYear.value + 1)
const progressPercent = computed(() =>
  Math.round((liveSnapshots.value.length / totalYears.value) * 100),
)

// ─── Preset portfolios ───────────────────────────────────────────────────────

interface Preset {
  name: string
  description: string
  allocations: Partial<Record<string, number>>
}

const presets: Preset[] = [
  {
    name: 'All-Weather',
    description: 'Balanced across asset classes for resilience',
    allocations: { SMI: 20, BONDS_CHF: 30, GLOBAL_ETF: 25, REAL_ESTATE: 15, EMERGING_MARKETS: 0, CASH: 10 },
  },
  {
    name: 'Growth',
    description: 'Equity-heavy for maximum long-term growth',
    allocations: { SMI: 20, BONDS_CHF: 5, GLOBAL_ETF: 50, REAL_ESTATE: 5, EMERGING_MARKETS: 20, CASH: 0 },
  },
  {
    name: 'Conservative',
    description: 'Capital preservation with low volatility',
    allocations: { SMI: 10, BONDS_CHF: 50, GLOBAL_ETF: 10, REAL_ESTATE: 10, EMERGING_MARKETS: 0, CASH: 20 },
  },
  {
    name: 'All-In Stocks',
    description: 'Maximum risk — 100% equities',
    allocations: { SMI: 10, BONDS_CHF: 0, GLOBAL_ETF: 60, REAL_ESTATE: 0, EMERGING_MARKETS: 30, CASH: 0 },
  },
]

function applyPreset(preset: Preset) {
  assets.value.forEach((a) => {
    a.allocation = preset.allocations[a.key] ?? 0
  })
}

// ─── Actions ─────────────────────────────────────────────────────────────────

function updateAllocation(index: number, value: number) {
  assets.value[index]!.allocation = Math.max(0, Math.min(100, value))
}

async function startBattle() {
  if (!isValid.value) return

  phase.value = 'battling'
  liveSnapshots.value = []
  battleResult.value = null
  battleError.value = null
  isLoading.value = true

  try {
    const result = await runSimulation(
      assets.value,
      startingCapital.value,
      startYear.value,
      endYear.value,
      async (snapshot) => {
        // Animate one year at a time with a delay
        await new Promise((resolve) => setTimeout(resolve, 180))
        liveSnapshots.value = [...liveSnapshots.value, snapshot]
        await nextTick()
      },
    )

    battleResult.value = result
    journeyStore.completeNode('challenge-final')
    phase.value = 'results'
  } catch (err) {
    battleError.value =
      err instanceof Error ? err.message : 'An error occurred during simulation.'
    phase.value = 'configure'
  } finally {
    isLoading.value = false
  }
}

function resetBattle() {
  phase.value = 'configure'
  battleResult.value = null
  liveSnapshots.value = []
  battleError.value = null
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

function formatCHF(value: number): string {
  return `CHF ${value.toLocaleString('de-CH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function formatPercent(value: number, decimals = 1): string {
  const sign = value > 0 ? '+' : ''
  return `${sign}${(value * 100).toFixed(decimals)}%`
}

function formatSharpe(value: number | null): string {
  if (value === null) return 'N/A'
  return value.toFixed(2)
}

// ─── Result insight generation ────────────────────────────────────────────────

const resultInsights = computed(() => {
  const r = battleResult.value
  if (!r) return []

  const insights: { icon: string; text: string; type: 'good' | 'neutral' | 'warning' }[] = []

  const sharpe = r.sharpeRatio

  if (sharpe !== null) {
    if (sharpe >= 1.5) {
      insights.push({ icon: '✓', text: `Your Sharpe Ratio of ${formatSharpe(sharpe)} is excellent — you earned high returns per unit of risk taken.`, type: 'good' })
    } else if (sharpe >= 1.0) {
      insights.push({ icon: '✓', text: `Sharpe Ratio ${formatSharpe(sharpe)} is solid. Most professional funds aim for 1.0+.`, type: 'good' })
    } else if (sharpe >= 0.5) {
      insights.push({ icon: '~', text: `Sharpe Ratio ${formatSharpe(sharpe)} is acceptable but there's room to improve diversification.`, type: 'neutral' })
    } else {
      insights.push({ icon: '!', text: `Sharpe Ratio ${formatSharpe(sharpe)} is low — you took on more risk than the returns justify.`, type: 'warning' })
    }
  }

  if (r.maxDrawdown < -0.3) {
    insights.push({ icon: '!', text: `Your portfolio dropped ${formatPercent(r.maxDrawdown)} at its worst point. High drawdowns test investor discipline.`, type: 'warning' })
  } else if (r.maxDrawdown < -0.15) {
    insights.push({ icon: '~', text: `Max drawdown of ${formatPercent(r.maxDrawdown)} — moderate dip. Bonds or cash could have cushioned this.`, type: 'neutral' })
  } else {
    insights.push({ icon: '✓', text: `Max drawdown was only ${formatPercent(r.maxDrawdown)} — well-contained downside risk.`, type: 'good' })
  }

  if (r.beatInflation) {
    insights.push({ icon: '✓', text: 'Your portfolio preserved purchasing power — it beat Swiss inflation.', type: 'good' })
  } else {
    insights.push({ icon: '!', text: 'Your portfolio did NOT beat inflation. Your real purchasing power declined.', type: 'warning' })
  }

  return insights
})
</script>

<template>
  <div class="challenge-view">
    <div class="challenge-container">

      <!-- Back button -->
      <button class="back-btn" @click="router.push('/journey')">
        &#8592; Back to Journey
      </button>

      <!-- Header -->
      <div class="challenge-title">
        <span class="challenge-badge">AutoBattle Mode</span>
        <h1>Portfolio Arena</h1>
        <p class="challenge-subtitle">
          Build a portfolio with real asset classes. Watch it battle historical markets year by year.
          Learn why <strong>risk-adjusted return</strong> matters more than raw gains.
        </p>
      </div>

      <!-- Error banner -->
      <div v-if="battleError" class="error-banner">
        <span>&#9888; {{ battleError }}</span>
        <button @click="battleError = null">&#10005;</button>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════════ -->
      <!-- CONFIGURE PHASE                                                      -->
      <!-- ═══════════════════════════════════════════════════════════════════ -->
      <template v-if="phase === 'configure'">

        <!-- Preset quick-starts -->
        <section class="config-section">
          <h3 class="section-label">Quick Start Presets</h3>
          <div class="presets-grid">
            <button
              v-for="preset in presets"
              :key="preset.name"
              class="preset-btn"
              @click="applyPreset(preset)"
            >
              <span class="preset-name">{{ preset.name }}</span>
              <span class="preset-desc">{{ preset.description }}</span>
            </button>
          </div>
        </section>

        <!-- Asset sliders -->
        <section class="config-section portfolio-builder">
          <div class="allocation-header">
            <h2>Build Your Portfolio</h2>
            <div
              class="total-badge"
              :class="{
                'total-badge--valid': totalAllocation === 100,
                'total-badge--over': totalAllocation > 100,
              }"
            >
              {{ totalAllocation }}% / 100%
            </div>
          </div>

          <div class="assets-list">
            <div
              v-for="(asset, i) in assets"
              :key="asset.key"
              class="asset-row"
            >
              <div class="asset-info">
                <div class="asset-dot" :style="{ background: asset.color }" />
                <div>
                  <span class="asset-name">{{ asset.name }}</span>
                  <span class="asset-meta">{{ asset.category }} &middot;
                    <span
                      class="risk-chip"
                      :class="`risk-chip--${asset.risk}`"
                    >{{ asset.risk }} risk</span>
                  </span>
                </div>
              </div>
              <div class="asset-control">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  :value="asset.allocation"
                  :style="{ accentColor: asset.color }"
                  @input="updateAllocation(i, parseInt(($event.target as HTMLInputElement).value))"
                />
                <span class="asset-percent">{{ asset.allocation }}%</span>
              </div>
            </div>
          </div>

          <!-- Allocation visualization bar -->
          <div v-if="totalAllocation > 0" class="allocation-bar" role="img" aria-label="Portfolio allocation">
            <div
              v-for="asset in assets.filter(a => a.allocation > 0)"
              :key="asset.key"
              class="allocation-segment"
              :style="{
                width: (asset.allocation / totalAllocation) * 100 + '%',
                background: asset.color,
              }"
              :title="`${asset.name}: ${asset.allocation}%`"
            />
          </div>

          <!-- Risk meter -->
          <div class="risk-meter">
            <span class="risk-meter-label">Portfolio Risk</span>
            <div class="risk-bar">
              <div
                class="risk-fill"
                :style="{ width: (riskScore / 3) * 100 + '%' }"
              />
            </div>
            <span class="risk-value" :style="{ color: riskColor }">{{ riskLabel }}</span>
          </div>

          <!-- Remaining allocation hint -->
          <p v-if="allocationRemaining > 0" class="allocation-hint">
            {{ allocationRemaining }}% still unallocated — adjust sliders to reach 100%.
          </p>
          <p v-else-if="totalAllocation > 100" class="allocation-hint allocation-hint--error">
            Over-allocated by {{ totalAllocation - 100 }}% — reduce some assets.
          </p>
        </section>

        <!-- Time & Capital settings -->
        <section class="config-section settings-row">
          <div class="setting-group">
            <label class="setting-label">Starting Capital</label>
            <div class="btn-group">
              <button
                v-for="cap in capitalOptions"
                :key="cap"
                class="toggle-btn"
                :class="{ 'toggle-btn--active': startingCapital === cap }"
                @click="startingCapital = cap"
              >
                {{ cap.toLocaleString('de-CH') }}
              </button>
            </div>
          </div>

          <div class="setting-group">
            <label class="setting-label">Historical Period</label>
            <div class="year-range">
              <select v-model="startYear" class="year-select">
                <option v-for="y in yearOptions.slice(0, -1)" :key="y" :value="y">{{ y }}</option>
              </select>
              <span class="year-separator">to</span>
              <select v-model="endYear" class="year-select">
                <option
                  v-for="y in yearOptions"
                  :key="y"
                  :value="y"
                  :disabled="y <= startYear"
                >{{ y }}</option>
              </select>
              <span class="year-duration">({{ endYear - startYear }} years)</span>
            </div>
          </div>
        </section>

        <!-- Start button -->
        <button
          class="btn btn--primary btn--large"
          :disabled="!isValid"
          @click="startBattle"
        >
          <template v-if="isValid">
            &#9654; Start AutoBattle
          </template>
          <template v-else-if="totalAllocation !== 100">
            Allocate {{ allocationRemaining > 0 ? allocationRemaining + '% more' : (100 - totalAllocation) * -1 + '% over' }}
          </template>
          <template v-else>
            Select a valid year range
          </template>
        </button>

      </template>

      <!-- ═══════════════════════════════════════════════════════════════════ -->
      <!-- BATTLING PHASE                                                       -->
      <!-- ═══════════════════════════════════════════════════════════════════ -->
      <template v-else-if="phase === 'battling'">
        <div class="battle-phase">

          <!-- Header row: bull/bear + year counter -->
          <div class="battle-header">
            <div class="battle-combatants">
              <span class="battle-bull" role="img" aria-label="Bull">&#128002;</span>
              <span class="battle-vs">VS</span>
              <span class="battle-bear" role="img" aria-label="Bear">&#128059;</span>
            </div>
            <div class="battle-year-info">
              <span class="battle-year-label">Simulating year</span>
              <span class="battle-year-value">{{ currentBattleYear }}</span>
              <div class="battle-progress-bar" role="progressbar" :aria-valuenow="progressPercent">
                <div class="battle-progress-fill" :style="{ width: progressPercent + '%' }" />
              </div>
              <span class="battle-year-sub">{{ liveSnapshots.length }} / {{ totalYears }} years</span>
            </div>
          </div>

          <!-- Live Sharpe Ratio badge — always visible -->
          <div class="battle-sharpe-row">
            <SharpeRatioBadge :sharpe="currentSharpe" :animated="true" />
            <div class="sharpe-callout">
              <p class="sharpe-callout-title">Why Sharpe Ratio?</p>
              <p class="sharpe-callout-text">
                Raw return alone can be misleading. A portfolio that gains 20% with massive swings
                is <em>worse</em> than one that gains 12% steadily. The Sharpe Ratio measures
                <strong>return per unit of risk</strong> — higher is always better.
              </p>
            </div>
          </div>

          <!-- Live chart -->
          <div v-if="liveSnapshots.length > 0" class="battle-chart-wrapper">
            <BattleChart :snapshots="liveSnapshots" :starting-capital="startingCapital" />
          </div>
          <div v-else class="chart-placeholder">
            <div class="chart-loading-dots">
              <span /><span /><span />
            </div>
            <p>Loading market data...</p>
          </div>

          <!-- Live mini-stats -->
          <div v-if="liveSnapshots.length > 0" class="live-stats">
            <div class="live-stat">
              <span class="live-stat-label">Portfolio</span>
              <span class="live-stat-value live-stat-value--gold">
                {{ formatCHF(liveSnapshots[liveSnapshots.length - 1]!.portfolioValue) }}
              </span>
            </div>
            <div class="live-stat">
              <span class="live-stat-label">vs S&amp;P 500</span>
              <span class="live-stat-value live-stat-value--red">
                {{ formatCHF(liveSnapshots[liveSnapshots.length - 1]!.sp500Value) }}
              </span>
            </div>
            <div class="live-stat">
              <span class="live-stat-label">vs MSCI World</span>
              <span class="live-stat-value live-stat-value--blue">
                {{ formatCHF(liveSnapshots[liveSnapshots.length - 1]!.msciWorldValue) }}
              </span>
            </div>
            <div class="live-stat">
              <span class="live-stat-label">Inflation Cost</span>
              <span class="live-stat-value live-stat-value--gray">
                {{ formatCHF(liveSnapshots[liveSnapshots.length - 1]!.inflationValue) }}
              </span>
            </div>
          </div>

        </div>
      </template>

      <!-- ═══════════════════════════════════════════════════════════════════ -->
      <!-- RESULTS PHASE                                                        -->
      <!-- ═══════════════════════════════════════════════════════════════════ -->
      <template v-else-if="phase === 'results' && battleResult">
        <div class="results-phase">

          <!-- Outcome header -->
          <div class="result-header">
            <div class="result-emoji">
              {{ battleResult.beatInflation ? '&#127942;' : '&#128200;' }}
            </div>
            <div>
              <h2 :class="battleResult.beatInflation ? 'text-success' : 'text-error'">
                {{ battleResult.beatInflation ? 'Purchasing Power Preserved!' : 'Inflation Won This Round' }}
              </h2>
              <p class="result-period">
                {{ battleResult.startYear }} – {{ battleResult.endYear }} &middot;
                Starting capital: {{ formatCHF(battleResult.startingCapital) }}
              </p>
            </div>
          </div>

          <!-- Sharpe Ratio — prominently featured -->
          <div class="result-sharpe-section">
            <SharpeRatioBadge :sharpe="battleResult.sharpeRatio" :animated="true" />
            <div class="sharpe-explanation">
              <h4>The metric that matters most</h4>
              <p>
                Even if you didn't beat the S&P 500, a high Sharpe Ratio means you got great
                <em>risk-adjusted</em> returns. A portfolio with Sharpe &ge; 1.0 is something
                most professional fund managers strive for.
              </p>
            </div>
          </div>

          <!-- Full results chart -->
          <div class="result-chart-wrapper">
            <BattleChart :snapshots="liveSnapshots" :starting-capital="battleResult.startingCapital" />
          </div>

          <!-- Key stats grid -->
          <div class="result-stats-grid">
            <div class="stat-card">
              <span class="stat-label">Final Portfolio</span>
              <span
                class="stat-value"
                :class="battleResult.finalPortfolioValue >= battleResult.startingCapital ? 'text-success' : 'text-error'"
              >
                {{ formatCHF(battleResult.finalPortfolioValue) }}
              </span>
              <span class="stat-sub">
                {{ formatPercent(battleResult.finalPortfolioValue / battleResult.startingCapital - 1) }}
                total
              </span>
            </div>

            <div class="stat-card">
              <span class="stat-label">Annualized Return (CAGR)</span>
              <span
                class="stat-value"
                :class="battleResult.annualizedReturn >= 0 ? 'text-success' : 'text-error'"
              >
                {{ formatPercent(battleResult.annualizedReturn) }}
              </span>
              <span class="stat-sub">per year</span>
            </div>

            <div class="stat-card">
              <span class="stat-label">Volatility</span>
              <span class="stat-value">{{ formatPercent(battleResult.volatility) }}</span>
              <span class="stat-sub">annual std dev</span>
            </div>

            <div class="stat-card">
              <span class="stat-label">Max Drawdown</span>
              <span class="stat-value text-error">
                {{ formatPercent(battleResult.maxDrawdown) }}
              </span>
              <span class="stat-sub">worst peak-to-trough</span>
            </div>

            <div class="stat-card">
              <span class="stat-label">vs S&amp;P 500</span>
              <span class="stat-value" :class="battleResult.beatSP500 ? 'text-success' : 'text-error'">
                {{ battleResult.beatSP500 ? 'Beat it!' : 'Below' }}
              </span>
              <span class="stat-sub">{{ formatCHF(battleResult.finalSP500Value) }}</span>
            </div>

            <div class="stat-card">
              <span class="stat-label">vs MSCI World</span>
              <span class="stat-value" :class="battleResult.beatMSCI ? 'text-success' : 'text-error'">
                {{ battleResult.beatMSCI ? 'Beat it!' : 'Below' }}
              </span>
              <span class="stat-sub">{{ formatCHF(battleResult.finalMSCIValue) }}</span>
            </div>
          </div>

          <!-- Educational insight cards -->
          <div class="insights-section">
            <h3 class="insights-title">What this battle taught you</h3>
            <div class="insights-list">
              <div
                v-for="(insight, i) in resultInsights"
                :key="i"
                class="insight-card"
                :class="`insight-card--${insight.type}`"
              >
                <span class="insight-icon">{{ insight.icon }}</span>
                <p class="insight-text">{{ insight.text }}</p>
              </div>
            </div>

            <!-- Core lesson callout -->
            <div class="lesson-callout">
              <h4>Key Takeaway: Return vs. Risk-Adjusted Return</h4>
              <p>
                Chasing the highest return often means taking extreme risks. In 2008, an
                all-stocks portfolio lost 40%+ — erasing years of gains. A diversified portfolio
                with bonds and real estate would have lost far less.
                <br /><br />
                The <strong>Sharpe Ratio</strong> rewards you for consistency and penalizes wild swings.
                A portfolio with Sharpe &ge; 1.0 is generating strong returns <em>relative to the risk it takes</em>.
                That is the hallmark of smart investing.
              </p>
            </div>
          </div>

          <!-- Actions -->
          <div class="result-actions">
            <button class="btn btn--ghost" @click="resetBattle">
              &#8635; Try a Different Portfolio
            </button>
            <button class="btn btn--primary" @click="router.push('/journey')">
              Back to Journey
            </button>
          </div>

        </div>
      </template>

    </div>
  </div>
</template>

<style scoped>
/* ─── Layout ────────────────────────────────────────────────────────────── */
.challenge-view {
  flex: 1;
  padding: 1.5rem;
  display: flex;
  justify-content: center;
}

.challenge-container {
  max-width: 800px;
  width: 100%;
}

.back-btn {
  background: none;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
  padding: 0.5rem 0;
  margin-bottom: 1rem;
  transition: color var(--transition-fast);
}

.back-btn:hover {
  color: var(--color-text);
}

/* ─── Title ─────────────────────────────────────────────────────────────── */
.challenge-title {
  margin-bottom: 2rem;
}

.challenge-badge {
  display: inline-block;
  background: var(--color-secondary);
  color: var(--color-primary);
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-full);
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 0.5rem;
}

.challenge-title h1 {
  font-size: 2rem;
  margin-bottom: 0.4rem;
}

.challenge-subtitle {
  color: var(--color-text-secondary);
  max-width: 580px;
  line-height: 1.6;
}

/* ─── Error banner ──────────────────────────────────────────────────────── */
.error-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--color-error-light);
  color: var(--color-error);
  padding: 0.75rem 1rem;
  border-radius: var(--radius-md);
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.error-banner button {
  background: none;
  color: var(--color-error);
  font-size: 1rem;
  line-height: 1;
}

/* ─── Config sections ───────────────────────────────────────────────────── */
.config-section {
  margin-bottom: 1.5rem;
}

.section-label {
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--color-text-secondary);
  margin-bottom: 0.75rem;
}

/* Presets */
.presets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 0.75rem;
}

.preset-btn {
  background: var(--color-surface);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0.75rem 1rem;
  text-align: left;
  transition: all var(--transition-fast);
  cursor: pointer;
}

.preset-btn:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.preset-name {
  display: block;
  font-weight: 700;
  font-size: 0.875rem;
  color: var(--color-heading);
  margin-bottom: 0.2rem;
}

.preset-desc {
  display: block;
  font-size: 0.72rem;
  color: var(--color-text-muted);
  line-height: 1.3;
}

/* Portfolio builder */
.portfolio-builder {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 1.75rem;
}

.allocation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.allocation-header h2 {
  font-size: 1.15rem;
}

.total-badge {
  padding: 0.3rem 0.8rem;
  border-radius: var(--radius-full);
  font-weight: 700;
  font-size: 0.85rem;
  background: var(--color-warning-light);
  color: var(--color-warning);
  transition: all var(--transition-fast);
}

.total-badge--valid {
  background: var(--color-success-light);
  color: var(--color-success);
}

.total-badge--over {
  background: var(--color-error-light);
  color: var(--color-error);
}

/* Asset rows */
.assets-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.asset-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.asset-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 210px;
  flex: 1;
}

.asset-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.asset-name {
  display: block;
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--color-heading);
  margin-bottom: 0.15rem;
}

.asset-meta {
  display: block;
  font-size: 0.7rem;
  color: var(--color-text-muted);
}

.risk-chip {
  padding: 0.1rem 0.4rem;
  border-radius: var(--radius-sm);
  font-weight: 600;
  font-size: 0.65rem;
  text-transform: uppercase;
}

.risk-chip--low { background: #d1fae5; color: #065f46; }
.risk-chip--medium { background: #fef3c7; color: #92400e; }
.risk-chip--high { background: #fee2e2; color: #991b1b; }

.asset-control {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  max-width: 280px;
}

.asset-control input[type="range"] {
  flex: 1;
  height: 6px;
}

.asset-percent {
  min-width: 38px;
  text-align: right;
  font-weight: 700;
  font-size: 0.875rem;
  color: var(--color-heading);
  font-variant-numeric: tabular-nums;
}

/* Allocation bar */
.allocation-bar {
  display: flex;
  height: 14px;
  border-radius: var(--radius-full);
  overflow: hidden;
  margin-bottom: 1.25rem;
  background: var(--color-background-mute);
}

.allocation-segment {
  transition: width var(--transition-base);
  min-width: 2px;
}

/* Risk meter */
.risk-meter {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  background: var(--color-background-mute);
  border-radius: var(--radius-md);
  margin-bottom: 0.75rem;
}

.risk-meter-label {
  font-weight: 600;
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.risk-bar {
  flex: 1;
  height: 8px;
  background: var(--color-border);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.risk-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981, #f59e0b, #ef4444);
  border-radius: var(--radius-full);
  transition: width var(--transition-base);
}

.risk-value {
  font-weight: 700;
  font-size: 0.85rem;
  white-space: nowrap;
  transition: color var(--transition-base);
}

.allocation-hint {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  text-align: center;
  padding: 0.25rem;
}

.allocation-hint--error {
  color: var(--color-error);
}

/* Settings row */
.settings-row {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 1.5rem;
}

.setting-group {
  flex: 1;
  min-width: 240px;
}

.setting-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-secondary);
  margin-bottom: 0.6rem;
}

.btn-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.toggle-btn {
  padding: 0.35rem 0.7rem;
  border-radius: var(--radius-md);
  font-size: 0.8rem;
  font-weight: 600;
  background: var(--color-background-mute);
  color: var(--color-text-secondary);
  border: 1.5px solid transparent;
  transition: all var(--transition-fast);
}

.toggle-btn:hover {
  background: var(--color-primary-light);
  color: var(--color-secondary);
}

.toggle-btn--active {
  background: var(--color-primary);
  color: var(--color-secondary);
  border-color: var(--color-primary-hover);
}

.year-range {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.year-select {
  padding: 0.35rem 0.6rem;
  border-radius: var(--radius-md);
  border: 1.5px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-text);
  font-size: 0.85rem;
  font-family: inherit;
  cursor: pointer;
}

.year-select:focus {
  outline: none;
  border-color: var(--color-primary);
}

.year-separator {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.year-duration {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-left: 0.25rem;
}

/* ─── Buttons ───────────────────────────────────────────────────────────── */
.btn {
  padding: 0.75rem 2rem;
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: 1rem;
  transition: all var(--transition-fast);
}

.btn--large {
  width: 100%;
  padding: 1rem;
  font-size: 1.1rem;
}

.btn--primary {
  background: var(--color-primary);
  color: var(--color-secondary);
}

.btn--primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn--primary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn--ghost {
  background: transparent;
  color: var(--color-text-secondary);
}

.btn--ghost:hover {
  color: var(--color-text);
  background: var(--color-background-mute);
}

/* ─── Battle phase ──────────────────────────────────────────────────────── */
.battle-phase {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.battle-header {
  display: flex;
  align-items: center;
  gap: 2rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 1.5rem;
  flex-wrap: wrap;
}

.battle-combatants {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
}

.battle-bull,
.battle-bear {
  font-size: 3rem;
  animation: bounce 1s infinite alternate ease-in-out;
  line-height: 1;
}

.battle-bear {
  animation-delay: 0.5s;
}

.battle-vs {
  font-weight: 900;
  font-size: 1.1rem;
  color: var(--color-error);
  letter-spacing: 0.05em;
}

.battle-year-info {
  flex: 1;
  min-width: 200px;
}

.battle-year-label {
  display: block;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-secondary);
  margin-bottom: 0.2rem;
}

.battle-year-value {
  display: block;
  font-size: 2rem;
  font-weight: 800;
  color: var(--color-heading);
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}

.battle-progress-bar {
  width: 100%;
  height: 8px;
  background: var(--color-background-mute);
  border-radius: var(--radius-full);
  overflow: hidden;
  margin: 0.5rem 0 0.3rem;
}

.battle-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), #10b981);
  border-radius: var(--radius-full);
  transition: width 0.2s ease;
}

.battle-year-sub {
  font-size: 0.7rem;
  color: var(--color-text-muted);
}

/* Sharpe row during battle */
.battle-sharpe-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
  align-items: start;
}

.sharpe-callout {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1rem 1.25rem;
}

.sharpe-callout-title {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-secondary);
  margin-bottom: 0.4rem;
}

.sharpe-callout-text {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  line-height: 1.5;
}

.battle-chart-wrapper {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 1.25rem;
}

.chart-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  gap: 1rem;
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

.chart-loading-dots {
  display: flex;
  gap: 0.5rem;
}

.chart-loading-dots span {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--color-primary);
  animation: pulse 1.2s infinite ease-in-out;
}

.chart-loading-dots span:nth-child(2) { animation-delay: 0.2s; }
.chart-loading-dots span:nth-child(3) { animation-delay: 0.4s; }

/* Live stats mini-row */
.live-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
}

.live-stat {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0.75rem 1rem;
  text-align: center;
}

.live-stat-label {
  display: block;
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
  margin-bottom: 0.3rem;
}

.live-stat-value {
  display: block;
  font-size: 0.85rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--color-heading);
}

.live-stat-value--gold { color: #FFCB00; }
.live-stat-value--red  { color: #ef4444; }
.live-stat-value--blue { color: #3b82f6; }
.live-stat-value--gray { color: var(--color-text-muted); }

/* ─── Results phase ─────────────────────────────────────────────────────── */
.results-phase {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.result-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.result-emoji {
  font-size: 3.5rem;
  line-height: 1;
  flex-shrink: 0;
}

.result-header h2 {
  font-size: 1.5rem;
  margin-bottom: 0.25rem;
}

.result-period {
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.text-success { color: var(--color-success); }
.text-error   { color: var(--color-error); }

/* Sharpe section in results */
.result-sharpe-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
  align-items: start;
}

.sharpe-explanation {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1.25rem;
}

.sharpe-explanation h4 {
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
  color: var(--color-heading);
}

.sharpe-explanation p {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  line-height: 1.55;
}

.result-chart-wrapper {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 1.25rem;
}

/* Stats grid */
.result-stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.875rem;
}

.stat-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1.1rem 1.25rem;
}

.stat-label {
  display: block;
  font-size: 0.68rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.4rem;
}

.stat-value {
  display: block;
  font-weight: 800;
  font-size: 1.15rem;
  color: var(--color-heading);
  font-variant-numeric: tabular-nums;
}

.stat-sub {
  display: block;
  font-size: 0.7rem;
  color: var(--color-text-muted);
  margin-top: 0.2rem;
}

/* Insights */
.insights-section {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 1.75rem;
}

.insights-title {
  font-size: 1rem;
  margin-bottom: 1rem;
  color: var(--color-heading);
}

.insights-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.insight-card {
  display: flex;
  align-items: flex-start;
  gap: 0.875rem;
  padding: 0.875rem 1rem;
  border-radius: var(--radius-md);
  border-left: 3px solid;
}

.insight-card--good {
  background: #f0fdf4;
  border-color: #16a34a;
}

.insight-card--neutral {
  background: #fffbeb;
  border-color: #d97706;
}

.insight-card--warning {
  background: #fef2f2;
  border-color: #dc2626;
}

html.dark .insight-card--good    { background: rgba(22,163,74,0.12); }
html.dark .insight-card--neutral { background: rgba(217,119,6,0.12); }
html.dark .insight-card--warning { background: rgba(220,38,38,0.12); }

.insight-icon {
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.5;
  flex-shrink: 0;
  width: 1.25rem;
  text-align: center;
}

.insight-text {
  font-size: 0.8rem;
  color: var(--color-text);
  line-height: 1.5;
}

.lesson-callout {
  background: var(--color-secondary-light);
  border-left: 4px solid var(--color-secondary);
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
  padding: 1.1rem 1.25rem;
}

html.dark .lesson-callout {
  background: rgba(0, 74, 90, 0.25);
}

.lesson-callout h4 {
  font-size: 0.875rem;
  color: var(--color-secondary);
  margin-bottom: 0.5rem;
}

.lesson-callout p {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  line-height: 1.6;
}

/* Result actions */
.result-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  padding-bottom: 2rem;
}

/* ─── Animations ────────────────────────────────────────────────────────── */
@keyframes bounce {
  from { transform: translateY(0); }
  to   { transform: translateY(-10px); }
}

@keyframes pulse {
  0%, 100% { transform: scale(0.8); opacity: 0.5; }
  50%       { transform: scale(1.2); opacity: 1; }
}

/* ─── Responsive ────────────────────────────────────────────────────────── */
@media (max-width: 640px) {
  .battle-sharpe-row,
  .result-sharpe-section {
    grid-template-columns: 1fr;
  }

  .result-stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .live-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .settings-row {
    flex-direction: column;
  }
}

@media (max-width: 420px) {
  .result-stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
