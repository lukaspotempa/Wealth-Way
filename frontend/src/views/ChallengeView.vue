<script setup lang="ts">
/**
 * ChallengeView — AutoBattle Mode
 *
 * The player builds a portfolio, selects a historical period, and watches
 * it battle year-by-year against S&P 500 and MSCI World with real data.
 *
 * Key educational goal: Sharpe Ratio (risk-adjusted return) > raw return.
 */
import { ref, computed, nextTick, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import MultiplayerLobby from '@/components/autobattle/MultiplayerLobby.vue'
import MultiplayerRace from '@/components/autobattle/MultiplayerRace.vue'
import type { LobbyInfo } from '@/types/multiplayer'
import type { MultiplayerConnection } from '@/services/multiplayerService'
import { useJourneyStore } from '@/stores/journey'
import { runSimulation, AVAILABLE_YEARS } from '@/services/autoBattleEngine'
import type { AutoBattleAsset, YearlyPortfolioSnapshot, AutoBattleResult } from '@/types'
import BattleChart from '@/components/autobattle/BattleChart.vue'
import SharpeRatioBadge from '@/components/autobattle/SharpeRatioBadge.vue'
import { Trophy, TrendingDown } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const journeyStore = useJourneyStore()

// ─── Phase state ─────────────────────────────────────────────────────────────

type Phase = 'configure' | 'battling' | 'results'
const phase = ref<Phase>('configure')

// ─── App mode ─────────────────────────────────────────────────────────────────
type AppMode = 'choose' | 'solo' | 'multiplayer'
const appMode = ref<AppMode>('choose')
const mpConnection = ref<MultiplayerConnection | null>(null)
const mpLobbyInfo = ref<LobbyInfo | null>(null)
const mpPlayerId = ref('')
const mpRaceActive = ref(false)
const mpIsConfiguring = ref(false)
const mpPortfolioSubmitted = ref(false)
const mpStartYear = ref(0)
const mpEndYear = ref(0)

// Check for ?join= query param (deep link)
onMounted(() => {
  const joinCode = route.query.join as string | undefined
  if (joinCode) {
    appMode.value = 'multiplayer'
  }
})

function startSolo() {
  appMode.value = 'solo'
}

function startMultiplayer() {
  appMode.value = 'multiplayer'
}

function handleRaceStarted(conn: MultiplayerConnection, lobby: LobbyInfo, playerId: string, startYear: number, endYear: number) {
  mpConnection.value = conn
  mpLobbyInfo.value = lobby
  mpPlayerId.value = playerId
  mpStartYear.value = startYear
  mpEndYear.value = endYear
  mpRaceActive.value = true
}

function handleMpConfiguring(conn: MultiplayerConnection, lobby: LobbyInfo, playerId: string) {
  mpConnection.value = conn
  mpLobbyInfo.value = lobby
  mpPlayerId.value = playerId
  mpIsConfiguring.value = true
  mpPortfolioSubmitted.value = false
}

function lockInPortfolio() {
  if (!mpConnection.value || !isValid.value) return
  const allocations: Record<string, number> = {}
  assets.value.forEach((a) => { if (a.allocation > 0) allocations[a.key] = a.allocation })
  mpConnection.value.submitPortfolio(allocations, selectedDuration.value)
  mpPortfolioSubmitted.value = true
}

function handleMpBack() {
  appMode.value = 'choose'
  mpRaceActive.value = false
  mpIsConfiguring.value = false
  mpPortfolioSubmitted.value = false
  mpConnection.value = null
}

// ─── Portfolio definition ────────────────────────────────────────────────────

const assets = ref<AutoBattleAsset[]>([
  // ── Equity Indices ────────────────────────────────────────────────────────
  {
    key: 'SMI_INDEX',
    name: 'Swiss Market Index (SMI)',
    ticker: 'SMI',
    description: "Switzerland's blue-chip price-return index — top 20 companies",
    category: 'Indices',
    risk: 'medium',
    color: '#FFCB00',
    allocation: 0,
  },
  {
    key: 'DAX',
    name: 'DAX (Germany)',
    ticker: 'DAX',
    description: 'German blue-chip total-return index — 40 largest companies',
    category: 'Indices',
    risk: 'medium',
    color: '#ef4444',
    allocation: 0,
  },
  {
    key: 'EUROSTOXX50',
    name: 'EuroStoxx 50',
    ticker: 'SX5E',
    description: 'Eurozone blue-chip price-return index — top 50 companies',
    category: 'Indices',
    risk: 'medium',
    color: '#3b82f6',
    allocation: 0,
  },
  {
    key: 'DJIA_INDEX',
    name: 'Dow Jones (DJIA)',
    ticker: 'DJIA',
    description: 'US blue-chip price-return index — 30 industrial companies',
    category: 'Indices',
    risk: 'medium',
    color: '#6366f1',
    allocation: 0,
  },
  {
    key: 'NIKKEI',
    name: 'Nikkei 225 (Japan)',
    ticker: 'NKY',
    description: 'Japanese blue-chip price-return index — top 225 companies',
    category: 'Indices',
    risk: 'medium',
    color: '#ec4899',
    allocation: 0,
  },
  // ── Bonds ─────────────────────────────────────────────────────────────────
  {
    key: 'SWISS_BOND_TRI',
    name: 'Swiss Bond AAA-BBB (TRI)',
    ticker: 'SBOND',
    description: 'Swiss investment-grade bond total-return index',
    category: 'Bonds',
    risk: 'low',
    color: '#004A5A',
    allocation: 0,
  },
  {
    key: 'BLOOMBERG_GLOBAL_AGG',
    name: 'Bloomberg Global Agg (CHF hedged)',
    ticker: 'BAGG',
    description: 'Global investment-grade bonds, hedged to CHF',
    category: 'Bonds',
    risk: 'low',
    color: '#0ea5e9',
    allocation: 0,
  },
  // ── Commodities ───────────────────────────────────────────────────────────
  {
    key: 'GOLD_CHF',
    name: 'Gold (CHF)',
    ticker: 'GOLD',
    description: 'Gold spot price denominated in Swiss francs',
    category: 'Commodities',
    risk: 'medium',
    color: '#f59e0b',
    allocation: 0,
  },
  // ── SMI Single Stocks ─────────────────────────────────────────────────────
  {
    key: 'NESN',
    name: 'Nestlé',
    ticker: 'NESN',
    description: "World's largest food & beverage company",
    category: 'CH Stocks',
    risk: 'medium',
    color: '#dc2626',
    allocation: 0,
  },
  {
    key: 'NOVN',
    name: 'Novartis',
    ticker: 'NOVN',
    description: 'Global pharmaceutical & healthcare company',
    category: 'CH Stocks',
    risk: 'medium',
    color: '#16a34a',
    allocation: 0,
  },
  {
    key: 'ROG',
    name: 'Roche',
    ticker: 'ROG',
    description: 'Global leader in diagnostics and oncology',
    category: 'CH Stocks',
    risk: 'medium',
    color: '#2563eb',
    allocation: 0,
  },
  {
    key: 'ABBN',
    name: 'ABB',
    ticker: 'ABBN',
    description: 'Global technology leader in electrification and automation',
    category: 'CH Stocks',
    risk: 'medium',
    color: '#7c3aed',
    allocation: 0,
  },
  {
    key: 'UBSG',
    name: 'UBS Group',
    ticker: 'UBSG',
    description: "Switzerland's largest bank and wealth manager",
    category: 'CH Stocks',
    risk: 'high',
    color: '#d97706',
    allocation: 0,
  },
  {
    key: 'ZURN',
    name: 'Zurich Insurance',
    ticker: 'ZURN',
    description: 'Global insurance group headquartered in Zurich',
    category: 'CH Stocks',
    risk: 'medium',
    color: '#059669',
    allocation: 0,
  },
  {
    key: 'CFR',
    name: 'Richemont',
    ticker: 'CFR',
    description: 'Luxury goods group — Cartier, IWC, Vacheron Constantin',
    category: 'CH Stocks',
    risk: 'medium',
    color: '#b45309',
    allocation: 0,
  },
  {
    key: 'SIKA',
    name: 'Sika',
    ticker: 'SIKA',
    description: 'Specialty chemicals for construction and industry',
    category: 'CH Stocks',
    risk: 'medium',
    color: '#0891b2',
    allocation: 0,
  },
  {
    key: 'GIVN',
    name: 'Givaudan',
    ticker: 'GIVN',
    description: "World's leading flavour and fragrance company",
    category: 'CH Stocks',
    risk: 'medium',
    color: '#9333ea',
    allocation: 0,
  },
  {
    key: 'LONN',
    name: 'Lonza',
    ticker: 'LONN',
    description: 'Global leader in life sciences contract manufacturing',
    category: 'CH Stocks',
    risk: 'high',
    color: '#e11d48',
    allocation: 0,
  },
  {
    key: 'LOGN',
    name: 'Logitech',
    ticker: 'LOGN',
    description: 'Global peripherals and software company',
    category: 'CH Stocks',
    risk: 'high',
    color: '#64748b',
    allocation: 0,
  },
  // ── US Single Stocks ──────────────────────────────────────────────────────
  {
    key: 'AAPL',
    name: 'Apple',
    ticker: 'AAPL',
    description: 'Consumer electronics, software and services giant',
    category: 'US Stocks',
    risk: 'medium',
    color: '#6b7280',
    allocation: 0,
  },
  {
    key: 'MSFT',
    name: 'Microsoft',
    ticker: 'MSFT',
    description: 'Software, cloud computing and AI leader',
    category: 'US Stocks',
    risk: 'medium',
    color: '#2563eb',
    allocation: 0,
  },
  {
    key: 'NVDA',
    name: 'NVIDIA',
    ticker: 'NVDA',
    description: 'Semiconductors and AI accelerator chips',
    category: 'US Stocks',
    risk: 'high',
    color: '#16a34a',
    allocation: 0,
  },
  {
    key: 'AMZN',
    name: 'Amazon',
    ticker: 'AMZN',
    description: 'E-commerce and cloud computing (AWS)',
    category: 'US Stocks',
    risk: 'high',
    color: '#d97706',
    allocation: 0,
  },
  {
    key: 'JPM',
    name: 'JPMorgan Chase',
    ticker: 'JPM',
    description: "America's largest bank by assets",
    category: 'US Stocks',
    risk: 'medium',
    color: '#1d4ed8',
    allocation: 0,
  },
  {
    key: 'JNJ',
    name: 'Johnson & Johnson',
    ticker: 'JNJ',
    description: 'Pharmaceuticals, medical devices and consumer health',
    category: 'US Stocks',
    risk: 'low',
    color: '#dc2626',
    allocation: 0,
  },
  {
    key: 'KO',
    name: 'Coca-Cola',
    ticker: 'KO',
    description: 'World-leading beverage brand',
    category: 'US Stocks',
    risk: 'low',
    color: '#ef4444',
    allocation: 0,
  },
  {
    key: 'MCD',
    name: "McDonald's",
    ticker: 'MCD',
    description: "World's largest fast-food chain",
    category: 'US Stocks',
    risk: 'low',
    color: '#eab308',
    allocation: 0,
  },
  {
    key: 'GS',
    name: 'Goldman Sachs',
    ticker: 'GS',
    description: 'Global investment banking and financial services',
    category: 'US Stocks',
    risk: 'high',
    color: '#475569',
    allocation: 0,
  },
  {
    key: 'V',
    name: 'Visa',
    ticker: 'V',
    description: 'Global payments network',
    category: 'US Stocks',
    risk: 'medium',
    color: '#1e40af',
    allocation: 0,
  },
])

// ─── Category filter ─────────────────────────────────────────────────────────

const categoryFilter = ref<string>('All')

const allCategories = computed(() => {
  const cats = new Set(assets.value.map((a) => a.category))
  return ['All', ...Array.from(cats)]
})

const filteredAssets = computed(() =>
  categoryFilter.value === 'All'
    ? assets.value
    : assets.value.filter((a) => a.category === categoryFilter.value),
)

// ─── Configuration ───────────────────────────────────────────────────────────

// Starting capital is static at CHF 10,000
const startingCapital = 10000

// Duration in years (5, 10, or 20)
const durationOptions = [5, 10, 20]
const selectedDuration = ref(10)

// Derive start/end years from duration (always use the most recent data)
const endYear = computed(() => AVAILABLE_YEARS.max)
const startYear = computed(() => {
  const candidate = AVAILABLE_YEARS.max - selectedDuration.value + 1
  return Math.max(candidate, AVAILABLE_YEARS.min)
})

// ─── Portfolio derived state ─────────────────────────────────────────────────

const totalAllocation = computed(() =>
  assets.value.reduce((sum, a) => sum + a.allocation, 0),
)

const isValid = computed(() => totalAllocation.value === 100)

// ─── Portfolio Risk: Concentration-Adjusted Volatility Score ────────────────
// Uses the Herfindahl-Hirschman Index (HHI) to penalise undiversified portfolios.
//
// Steps:
//   1. Each asset is assigned a representative annual volatility (σ) based on
//      asset class and individual name — figures sourced from long-run empirical data.
//   2. Weighted average volatility:  σ_w = Σ( w_i × σ_i )   (upper-bound estimate)
//   3. Concentration index (HHI):    HHI  = Σ( w_i² )
//      - Perfectly diversified across N assets → HHI = 1/N  (low)
//      - Single-asset portfolio                → HHI = 1.0   (high)
//   4. Concentration multiplier:     k = 0.5 + 0.5 × HHI
//      - Ranges from 0.5 (fully spread) to 1.0 (all-in one asset)
//      - Reflects that correlated / concentrated positions amplify realised vol
//   5. Adjusted vol:  σ_adj = σ_w × k
//   6. Normalise to 0–100 % for display against a reference ceiling of 40 % annual vol.
//      (A single-name high-vol stock at 100 % allocation reaches ~35 %×1.0 ≈ 35 %,
//       while a bond-only portfolio gives ~5 %×0.5 ≈ 2.5 %.)
//
// Result is clamped to [0, 100] and used for the risk bar width and label.

// Representative annual volatilities (%) by asset key
const ASSET_VOLATILITIES: Record<string, number> = {
  // Equity indices — broad diversification internally, ~18 % annual vol
  SMI_INDEX:       0.18,
  DAX:             0.20,
  EUROSTOXX50:     0.19,
  DJIA_INDEX:      0.17,
  NIKKEI:          0.22,
  // Investment-grade bonds — very low vol
  SWISS_BOND_TRI:        0.04,
  BLOOMBERG_GLOBAL_AGG:  0.05,
  // Gold — moderate vol, diversifier
  GOLD_CHF:        0.15,
  // CH large-cap stocks
  NESN:   0.18,
  NOVN:   0.20,
  ROG:    0.22,
  ABBN:   0.25,
  UBSG:   0.30,
  ZURN:   0.20,
  CFR:    0.28,
  SIKA:   0.27,
  GIVN:   0.25,
  LONN:   0.32,
  LOGN:   0.35,
  // US large-cap stocks
  AAPL:   0.28,
  MSFT:   0.26,
  NVDA:   0.45,
  AMZN:   0.35,
  JPM:    0.26,
  JNJ:    0.18,
  KO:     0.16,
  MCD:    0.18,
  GS:     0.30,
  V:      0.22,
}

const riskScore = computed(() => {
  const total = totalAllocation.value
  if (total <= 0) return 0

  // Fractional weights (sum to 1 when fully allocated)
  const weights = assets.value.map((a) => a.allocation / 100)

  // 1. Weighted average volatility  σ_w = Σ( w_i × σ_i )
  let sigmaW = 0
  for (const a of assets.value) {
    const w = a.allocation / 100
    const sigma = ASSET_VOLATILITIES[a.key] ?? 0.20   // fallback: 20 %
    sigmaW += w * sigma
  }

  // 2. Herfindahl-Hirschman Index  HHI = Σ( w_i² )  (0 < HHI ≤ 1)
  const hhi = weights.reduce((sum, w) => sum + w * w, 0)

  // 3. Concentration multiplier  k ∈ [0.5, 1.0]
  const k = 0.5 + 0.5 * hhi

  // 4. Adjusted volatility
  const sigmaAdj = sigmaW * k

  // 5. Normalise: reference ceiling = 0.40 (40 % annual vol)
  const RAW_CEILING = 0.40
  return Math.min(sigmaAdj / RAW_CEILING, 1)   // 0–1, clamped
})

// Thresholds against the 0–1 normalised riskScore:
//   < 0.20  → Conservative  (adj vol < ~8 %)
//   < 0.45  → Balanced      (adj vol < ~18 %)
//   ≥ 0.45  → Aggressive    (adj vol ≥ ~18 %)
const riskLabel = computed(() => {
  if (riskScore.value < 0.20) return 'Conservative'
  if (riskScore.value < 0.45) return 'Balanced'
  return 'Aggressive'
})

const riskColor = computed(() => {
  if (riskScore.value < 0.20) return '#10b981'
  if (riskScore.value < 0.45) return '#f59e0b'
  return '#ef4444'
})

// The actual estimated annual volatility (% string) shown as a numeric hint
const riskVolatilityPct = computed(() => {
  const total = totalAllocation.value
  if (total <= 0) return null

  let sigmaW = 0
  for (const a of assets.value) {
    const w = a.allocation / 100
    const sigma = ASSET_VOLATILITIES[a.key] ?? 0.20
    sigmaW += w * sigma
  }
  const weights = assets.value.map((a) => a.allocation / 100)
  const hhi = weights.reduce((sum, w) => sum + w * w, 0)
  const k = 0.5 + 0.5 * hhi
  const sigmaAdj = sigmaW * k
  return Math.round(sigmaAdj * 100)   // integer percentage, e.g. 14
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

// ─── Actions ─────────────────────────────────────────────────────────────────

function updateAllocation(key: string, value: number) {
  const asset = assets.value.find((a) => a.key === key)
  if (asset) asset.allocation = Math.max(0, Math.min(100, value))
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
      startingCapital,
      startYear.value,
      endYear.value,
      async (snapshot) => {
        // Animate one year at a time — 2 seconds per year
        await new Promise((resolve) => setTimeout(resolve, 2000))
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
        <span class="challenge-badge">Portfolio Battle Mode</span>
        <h1>Portfolio Arena</h1>
        <p class="challenge-subtitle">
          Build a portfolio with real asset classes. Watch it battle historical markets year by year.
          Learn why <strong>risk-adjusted return</strong> matters more than raw gains.
        </p>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════════ -->
      <!-- MODE SELECTION                                                        -->
      <!-- ═══════════════════════════════════════════════════════════════════ -->
      <div v-if="appMode === 'choose'" class="mode-select">
        <h2 class="mode-title">Choose Your Battle</h2>
        <div class="mode-cards">
          <button class="mode-card" @click="startSolo">
            <div class="mode-card-icon">&#128100;</div>
            <h3>Solo</h3>
            <p>Battle historical markets alone. Test your portfolio against S&amp;P 500 and MSCI World.</p>
          </button>
          <button class="mode-card mode-card--multiplayer" @click="startMultiplayer">
            <div class="mode-card-icon">&#128101;</div>
            <h3>Multiplayer</h3>
            <p>Challenge up to 10 friends! Create a lobby or join with a code. Compete in real-time.</p>
            <span class="mode-card-badge">New!</span>
          </button>
        </div>
      </div>

      <template v-else-if="appMode === 'solo'">
      <!-- Error banner -->
      <div v-if="battleError" class="error-banner">
        <span>&#9888; {{ battleError }}</span>
        <button @click="battleError = null">&#10005;</button>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════════ -->
      <!-- CONFIGURE PHASE                                                      -->
      <!-- ═══════════════════════════════════════════════════════════════════ -->
      <template v-if="phase === 'configure'">

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

          <!-- Category filter buttons -->
          <div class="category-filter">
            <button
              v-for="cat in allCategories"
              :key="cat"
              class="category-btn"
              :class="{ 'category-btn--active': categoryFilter === cat }"
              @click="categoryFilter = cat"
            >
              {{ cat }}
            </button>
          </div>

          <div class="assets-list">
            <div
              v-for="asset in filteredAssets"
              :key="asset.key"
              class="asset-row"
            >
              <div class="asset-info">
                <div class="asset-dot" :style="{ background: asset.color }" />
                <div>
                  <span class="asset-name">{{ asset.name }}</span>
                  <span class="asset-meta">{{ asset.category }}</span>
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
                  @input="updateAllocation(asset.key, parseInt(($event.target as HTMLInputElement).value))"
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
          <div
            class="risk-meter"
            :title="riskVolatilityPct !== null
              ? `Estimated annual volatility: ~${riskVolatilityPct}%\nHHI concentration-adjusted weighted volatility.\nConservative < 8% · Balanced 8–18% · Aggressive > 18%`
              : 'Allocate assets to see portfolio risk'"
          >
            <span class="risk-meter-label">Portfolio Risk</span>
            <div class="risk-bar">
              <div
                class="risk-fill"
                :style="{ width: riskScore * 100 + '%' }"
              />
            </div>
            <span class="risk-value" :style="{ color: riskColor }">
              {{ riskLabel }}
              <span v-if="riskVolatilityPct !== null" class="risk-vol-hint">~{{ riskVolatilityPct }}% vol</span>
            </span>
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
            <div class="static-capital">CHF 10,000</div>
          </div>

          <div class="setting-group">
            <label class="setting-label">Simulation Period</label>
            <div class="btn-group">
              <button
                v-for="dur in durationOptions"
                :key="dur"
                class="toggle-btn"
                :class="{ 'toggle-btn--active': selectedDuration === dur }"
                @click="selectedDuration = dur"
              >
                {{ dur }} years
              </button>
            </div>
            <span class="year-duration">{{ startYear }} – {{ endYear }}</span>
          </div>
        </section>

        <!-- Start button -->
        <button
          class="btn btn--primary btn--large"
          :disabled="!isValid"
          @click="startBattle"
        >
          <template v-if="isValid">
            &#9654; Start Portfolio Battle
          </template>
          <template v-else>
            Allocate {{ allocationRemaining > 0 ? allocationRemaining + '% more' : Math.abs(100 - totalAllocation) + '% over limit' }}
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
              <span class="live-stat-label">Purchasing Power Target</span>
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
              <Trophy v-if="battleResult.beatInflation" :size="48" class="text-success" />
              <TrendingDown v-if="!battleResult.beatInflation" :size="48" class="text-error" />
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

          <!-- Per-asset performance breakdown -->
          <div v-if="battleResult.assetPerformances.length" class="asset-breakdown">
            <h3 class="asset-breakdown-title">Investment Performance Breakdown</h3>
            <div class="asset-breakdown-list">
              <div
                v-for="ap in battleResult.assetPerformances"
                :key="ap.key"
                class="asset-breakdown-row"
              >
                <!-- Color dot + name -->
                <div class="ab-identity">
                  <span class="ab-dot" :style="{ background: ap.color }" />
                  <div class="ab-name-group">
                    <span class="ab-name">{{ ap.name }}</span>
                    <span class="ab-ticker">{{ ap.ticker }} · {{ ap.allocation }}%</span>
                  </div>
                </div>

                <!-- Trend icon + return figures -->
                <div class="ab-returns">
                  <span
                    class="ab-trend-icon"
                    :class="ap.totalReturnDecimal >= 0 ? 'ab-trend--up' : 'ab-trend--down'"
                  >
                    {{ ap.totalReturnDecimal >= 0 ? '▲' : '▼' }}
                  </span>
                  <span
                    class="ab-pct"
                    :class="ap.totalReturnDecimal >= 0 ? 'text-success' : 'text-error'"
                  >
                    {{ ap.totalReturnDecimal >= 0 ? '+' : '' }}{{ (ap.totalReturnDecimal * 100).toFixed(1) }}%
                  </span>
                  <span
                    class="ab-chf"
                    :class="ap.absoluteGainCHF >= 0 ? 'text-success' : 'text-error'"
                  >
                    {{ ap.absoluteGainCHF >= 0 ? '+' : '' }}{{ formatCHF(ap.absoluteGainCHF) }}
                  </span>
                </div>
              </div>
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

      </template> <!-- end solo -->

      <!-- ═══════════════════════════════════════════════════════════════════ -->
      <!-- MULTIPLAYER MODE                                                     -->
      <!-- ═══════════════════════════════════════════════════════════════════ -->
      <template v-else-if="appMode === 'multiplayer'">
        <template v-if="!mpRaceActive">
          <MultiplayerLobby
            @race-started="handleRaceStarted"
            @configuring="handleMpConfiguring"
            @back="handleMpBack"
          />

          <!-- Portfolio builder shown during CONFIGURING phase -->
          <template v-if="mpIsConfiguring">
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

              <div class="category-filter">
                <button
                  v-for="cat in ['All', 'Indices', 'Bonds', 'Commodities', 'CH Stocks', 'US Stocks']"
                  :key="cat"
                  class="category-btn"
                  :class="{ 'category-btn--active': categoryFilter === cat }"
                  @click="categoryFilter = cat"
                >
                  {{ cat }}
                </button>
              </div>

              <div class="assets-list">
                <div v-for="asset in filteredAssets" :key="asset.key" class="asset-row">
                  <div class="asset-info">
                    <div class="asset-dot" :style="{ background: asset.color }" />
                    <div>
                      <span class="asset-name">{{ asset.name }}</span>
                      <span class="asset-meta">{{ asset.category }}</span>
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
                      @input="updateAllocation(asset.key, parseInt(($event.target as HTMLInputElement).value))"
                    />
                    <span class="asset-percent">{{ asset.allocation }}%</span>
                  </div>
                </div>
              </div>

              <div v-if="totalAllocation > 0" class="allocation-bar" role="img">
                <div
                  v-for="asset in assets.filter(a => a.allocation > 0)"
                  :key="asset.key"
                  class="allocation-segment"
                  :style="{ width: (asset.allocation / totalAllocation) * 100 + '%', background: asset.color }"
                />
              </div>
            </section>

            <button
              class="btn btn--primary btn--large"
              :disabled="!isValid || mpPortfolioSubmitted"
              @click="lockInPortfolio"
            >
              <template v-if="mpPortfolioSubmitted">&#10003; Portfolio Locked In!</template>
              <template v-else-if="isValid">&#128274; Lock In Portfolio</template>
              <template v-else>Allocate {{ allocationRemaining > 0 ? allocationRemaining + '% more' : Math.abs(100 - totalAllocation) + '% over limit' }}</template>
            </button>
          </template>
        </template>

        <template v-else>
          <MultiplayerRace
            v-if="mpConnection && mpLobbyInfo"
            :connection="mpConnection"
            :lobby-info="mpLobbyInfo"
            :my-player-id="mpPlayerId"
            :initial-start-year="mpStartYear"
            :initial-end-year="mpEndYear"
            @play-again="handleMpBack"
            @back-to-journey="router.push('/journey')"
          />
        </template>
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

/* Category filter */
.category-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 1.25rem;
}

.category-btn {
  padding: 0.3rem 0.75rem;
  border-radius: var(--radius-full);
  font-size: 0.78rem;
  font-weight: 600;
  background: var(--color-background-mute);
  color: var(--color-text-secondary);
  border: 1.5px solid transparent;
  transition: all var(--transition-fast);
  cursor: pointer;
}

.category-btn:hover {
  background: var(--color-primary-light);
  color: var(--color-secondary);
}

.category-btn--active {
  background: var(--color-primary);
  color: var(--color-secondary);
  border-color: var(--color-primary-hover);
}

/* Static capital display */
.static-capital {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-heading);
  font-variant-numeric: tabular-nums;
  padding: 0.35rem 0;
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
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.1rem;
}

.risk-vol-hint {
  font-weight: 400;
  font-size: 0.7rem;
  color: var(--color-text-muted);
  letter-spacing: 0.01em;
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
  align-items: stretch;
}

.result-sharpe-section :deep(.sharpe-badge) {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
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

/* ─── Asset breakdown ───────────────────────────────────────────────────── */
.asset-breakdown {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 1.5rem 1.75rem;
}

.asset-breakdown-title {
  font-size: 1rem;
  margin-bottom: 1rem;
  color: var(--color-heading);
}

.asset-breakdown-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.asset-breakdown-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.65rem 0;
  border-bottom: 1px solid var(--color-border);
}

.asset-breakdown-row:last-child {
  border-bottom: none;
}

.ab-identity {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
  flex: 1;
}

.ab-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.ab-name-group {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.ab-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-heading);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ab-ticker {
  font-size: 0.7rem;
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
}

.ab-returns {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-shrink: 0;
}

.ab-trend-icon {
  font-size: 0.7rem;
  line-height: 1;
}

.ab-trend--up   { color: var(--color-success); }
.ab-trend--down { color: var(--color-error); }

.ab-pct {
  font-size: 0.9rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  min-width: 5.5ch;
  text-align: right;
}

.ab-chf {
  font-size: 0.8rem;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  min-width: 7.5ch;
  text-align: right;
  color: var(--color-text-secondary);
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

/* ─── Mode selection ────────────────────────────────────────────────────── */
.mode-select { padding: 2rem 0; }
.mode-title { text-align: center; font-size: 1.4rem; font-weight: 700; margin: 0 0 1.5rem; }
.mode-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; max-width: 600px; margin: 0 auto; }
.mode-card {
  position: relative;
  background: var(--color-surface, #f8f8f8);
  border: 2px solid var(--color-border, #e5e7eb);
  border-radius: 16px;
  padding: 1.5rem;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s;
}
.mode-card:hover { border-color: var(--color-primary, #FFCB00); transform: translateY(-2px); }
.mode-card--multiplayer { border-color: var(--color-secondary, #004A5A); }
.mode-card--multiplayer:hover { background: #f0f9ff; }
.mode-card-icon { font-size: 2.5rem; margin-bottom: 0.75rem; }
.mode-card h3 { margin: 0 0 0.4rem; font-size: 1.2rem; font-weight: 800; }
.mode-card p { margin: 0; font-size: 0.9rem; color: var(--color-text-secondary, #666); line-height: 1.4; }
.mode-card-badge {
  position: absolute; top: 0.75rem; right: 0.75rem;
  background: var(--color-primary, #FFCB00); color: #000;
  font-size: 0.7rem; font-weight: 800; padding: 0.15rem 0.4rem; border-radius: 4px;
}
@media (max-width: 480px) { .mode-cards { grid-template-columns: 1fr; } }
</style>
