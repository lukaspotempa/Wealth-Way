<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { MultiplayerConnection } from '@/services/multiplayerService'
import type { LobbyInfo, YearTick, LeaderboardEntry, ServerMessage } from '@/types/multiplayer'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend, Filler
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const props = defineProps<{
  connection: MultiplayerConnection
  lobbyInfo: LobbyInfo
  myPlayerId: string
  initialStartYear?: number
  initialEndYear?: number
}>()

const emit = defineEmits<{
  playAgain: []
  backToJourney: []
}>()

// ── Race state ────────────────────────────────────────────────────────────────
const racePhase = ref<'racing' | 'finished'>('racing')
const startYear = ref(props.initialStartYear ?? 2015)
const endYear = ref(props.initialEndYear ?? 2024)
const currentYear = ref(startYear.value)
const leaderboard = ref<LeaderboardEntry[]>([])
const sp500Final = ref(10000)
const msciiFinal = ref(10000)
const inflationFinal = ref(10000)

// Track history: {playerId: value[]} — pre-seeded so chart starts from 10k baseline
const playerHistory = ref<Record<string, number[]>>(
  Object.fromEntries(props.lobbyInfo.players.map(p => [p.id, [10000]]))
)
const sp500History = ref<number[]>([10000])
const msciHistory = ref<number[]>([10000])
const inflationHistory = ref<number[]>([10000])
const yearLabels = ref<string[]>([String(startYear.value - 1)])

// Player name map
const playerNames = computed<Record<string, string>>(() => {
  const map: Record<string, string> = {}
  props.lobbyInfo.players.forEach(p => { map[p.id] = p.name })
  return map
})

// ── Chart colors ──────────────────────────────────────────────────────────────
const PLAYER_COLORS = ['#FFCB00', '#ef4444', '#3b82f6', '#10b981', '#8b5cf6', '#f97316', '#06b6d4', '#ec4899', '#a3e635', '#14b8a6']

const chartData = computed(() => {
  const players = props.lobbyInfo.players
  const datasets = players.map((p, i) => ({
    label: p.id === props.myPlayerId ? `${p.name} (You)` : p.name,
    data: playerHistory.value[p.id] ?? [],
    borderColor: PLAYER_COLORS[i % PLAYER_COLORS.length],
    backgroundColor: 'transparent',
    borderWidth: p.id === props.myPlayerId ? 3 : 2,
    borderDash: p.id === props.myPlayerId ? [] : [],
    pointRadius: 2,
    tension: 0.3,
  }))

  datasets.push({
    label: 'S&P 500',
    data: sp500History.value,
    borderColor: '#94a3b8',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderDash: [4, 4] as any,
    pointRadius: 0,
    tension: 0.3,
  })
  datasets.push({
    label: 'Inflation',
    data: inflationHistory.value,
    borderColor: '#fb923c',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderDash: [2, 2] as any,
    pointRadius: 0,
    tension: 0.3,
  })

  return { labels: yearLabels.value, datasets }
})



const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 300 },
  plugins: {
    legend: { position: 'bottom' as const, labels: { boxWidth: 12, font: { size: 11 } } },
    tooltip: { mode: 'index' as const, intersect: false },
  },
  scales: {
    x: { grid: { color: 'rgba(128,128,128,0.1)' } },
    y: {
      grid: { color: 'rgba(128,128,128,0.1)' },
      ticks: { callback: (v: number) => `CHF ${v.toLocaleString('de-CH', { maximumFractionDigits: 0 })}` }
    },
  },
}

// ── Progress ──────────────────────────────────────────────────────────────────
const totalYears = computed(() => endYear.value - startYear.value + 1)
const progressPct = computed(() => yearLabels.value.length / Math.max(1, totalYears.value) * 100)

// ── WebSocket listeners ───────────────────────────────────────────────────────
const cleanups: (() => void)[] = []

onMounted(() => {
  // Handle RACE_STARTED if a play-again triggers a new race while this component is mounted
  cleanups.push(props.connection.on('RACE_STARTED', (msg: any) => {
    startYear.value = msg.startYear
    endYear.value = msg.endYear
    currentYear.value = msg.startYear
    racePhase.value = 'racing'
    playerHistory.value = Object.fromEntries(props.lobbyInfo.players.map(p => [p.id, [10000] as number[]]))
    sp500History.value = [10000]
    msciHistory.value = [10000]
    inflationHistory.value = [10000]
    yearLabels.value = [...[String(msg.startYear - 1)]]
  }))

  cleanups.push(props.connection.on('YEAR_TICK', (msg: any) => {
    const tick = msg as YearTick
    currentYear.value = tick.year

    // Spread into new array references so vue-chartjs detects the change
    yearLabels.value = [...yearLabels.value, String(tick.year)]

    const newHistory: Record<string, number[]> = {}
    for (const pid of Object.keys(playerHistory.value)) {
      newHistory[pid] = playerHistory.value[pid] ? [...playerHistory.value[pid]] : [10000]
    }
    for (const [pid, val] of Object.entries(tick.portfolios)) {
      if (!newHistory[pid]) newHistory[pid] = [10000]
      newHistory[pid] = [...newHistory[pid], val as number]
    }
    playerHistory.value = newHistory

    sp500History.value = [...sp500History.value, tick.sp500]
    msciHistory.value = [...msciHistory.value, tick.msci]
    inflationHistory.value = [...inflationHistory.value, tick.inflation]


  }))

  cleanups.push(props.connection.on('RACE_FINISHED', (msg: any) => {
    leaderboard.value = msg.leaderboard
    sp500Final.value = msg.sp500Final
    msciiFinal.value = msg.msciiFinal ?? msg.msciFinal
    inflationFinal.value = msg.inflationFinal
    racePhase.value = 'finished'
  }))
})

onUnmounted(() => {
  cleanups.forEach(fn => fn())
})

function formatCHF(v: number) {
  return `CHF ${v.toLocaleString('de-CH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}
function formatPct(v: number) {
  return `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`
}

function handlePlayAgain() {
  props.connection.playAgain()
  emit('playAgain')
}
</script>

<template>
  <div class="mp-race">

    <!-- RACING PHASE -->
    <div v-if="racePhase === 'racing'" class="race-phase">
      <div class="race-header">
        <div class="race-combatants">
          <span class="race-bull">&#128002;</span>
          <span class="race-vs">VS</span>
          <span class="race-bear">&#128059;</span>
        </div>
        <div class="race-year-info">
          <span class="race-year-label">Year</span>
          <span class="race-year-value">{{ currentYear || startYear }}</span>
          <div class="race-progress-bar">
            <div class="race-progress-fill" :style="{ width: progressPct + '%' }" />
          </div>
          <span class="race-year-sub">{{ yearLabels.length - 1 }} / {{ totalYears }} years</span>
        </div>
      </div>

      <!-- Live chart -->
      <div class="race-chart-wrapper">
        <Line :data="chartData" :options="chartOptions" />
      </div>

      <!-- Live mini rankings -->
      <div class="live-rankings">
        <div v-for="player in lobbyInfo.players" :key="player.id" class="rank-row">
          <span class="rank-name">{{ player.id === myPlayerId ? `${player.name} (You)` : player.name }}</span>
          <span class="rank-value">
            {{ playerHistory[player.id]?.length ? formatCHF(playerHistory[player.id][playerHistory[player.id].length - 1]) : 'CHF 10,000' }}
          </span>
        </div>
      </div>
    </div>

    <!-- FINISHED PHASE -->
    <div v-else class="finished-phase">
      <div class="finish-header">
        <h2>&#127942; Race Complete!</h2>
        <p class="finish-period">{{ startYear }} &#8211; {{ endYear }}</p>
      </div>

      <!-- Leaderboard -->
      <div class="leaderboard">
        <h3>Final Leaderboard</h3>
        <div class="leaderboard-list">
          <div v-for="entry in leaderboard" :key="entry.playerId"
            :class="['lb-row', { 'lb-row--me': entry.playerId === myPlayerId, 'lb-row--first': entry.rank === 1 }]">
            <span class="lb-rank">
              {{ entry.rank === 1 ? '&#127942;' : entry.rank === 2 ? '&#129352;' : entry.rank === 3 ? '&#129353;' : `#${entry.rank}` }}
            </span>
            <span class="lb-name">
              {{ entry.playerName }}
              <span v-if="entry.playerId === myPlayerId" class="you-tag">You</span>
            </span>
            <div class="lb-stats">
              <span class="lb-value">{{ formatCHF(entry.finalValue) }}</span>
              <span :class="['lb-return', { 'lb-return--pos': entry.totalReturn >= 0, 'lb-return--neg': entry.totalReturn < 0 }]">
                {{ formatPct(entry.totalReturn) }}
              </span>
            </div>
            <div class="lb-badges">
              <span v-if="entry.beatInflation" class="badge badge--good">Beat Inflation &#10003;</span>
              <span v-if="entry.beatSP500" class="badge badge--gold">Beat S&amp;P &#10003;</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Benchmarks -->
      <div class="benchmark-row">
        <div class="benchmark-card">
          <span class="bm-label">S&amp;P 500</span>
          <span class="bm-value">{{ formatCHF(sp500Final) }}</span>
        </div>
        <div class="benchmark-card">
          <span class="bm-label">MSCI World</span>
          <span class="bm-value">{{ formatCHF(msciiFinal) }}</span>
        </div>
        <div class="benchmark-card">
          <span class="bm-label">Inflation</span>
          <span class="bm-value">{{ formatCHF(inflationFinal) }}</span>
        </div>
      </div>

      <!-- Final chart -->
      <div class="result-chart-wrapper">
        <Line :data="chartData" :options="chartOptions" />
      </div>

      <!-- Actions -->
      <div class="finish-actions">
        <button v-if="lobbyInfo.hostId === myPlayerId" class="btn btn--primary" @click="handlePlayAgain">
          &#9654; Play Again
        </button>
        <p v-else class="waiting-host">Waiting for host to start a new game...</p>
        <button class="btn btn--ghost" @click="$emit('backToJourney')">Back to Journey</button>
      </div>
    </div>

  </div>
</template>

<style scoped>
.mp-race { max-width: 800px; margin: 0 auto; padding: 1rem; }
.race-header { display: flex; align-items: center; gap: 1.5rem; margin-bottom: 1.5rem; background: var(--color-surface, #f8f8f8); border-radius: 12px; padding: 1rem 1.5rem; }
.race-combatants { display: flex; align-items: center; gap: 0.5rem; font-size: 2rem; }
.race-vs { font-weight: 900; font-size: 1rem; color: var(--color-text-secondary, #666); }
.race-year-info { flex: 1; }
.race-year-label { font-size: 0.8rem; color: var(--color-text-secondary, #666); display: block; }
.race-year-value { font-size: 1.8rem; font-weight: 800; display: block; }
.race-progress-bar { height: 6px; background: var(--color-border, #eee); border-radius: 3px; margin: 0.3rem 0; }
.race-progress-fill { height: 100%; background: var(--color-primary, #FFCB00); border-radius: 3px; transition: width 0.5s ease; }
.race-year-sub { font-size: 0.8rem; color: var(--color-text-secondary, #666); }
.race-chart-wrapper { height: 320px; margin-bottom: 1.5rem; }
.live-rankings { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 0.5rem; margin-bottom: 1rem; }
.rank-row { background: var(--color-surface, #f8f8f8); border-radius: 8px; padding: 0.5rem 0.75rem; }
.rank-name { display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 0.2rem; }
.rank-value { display: block; font-size: 0.9rem; font-weight: 700; color: var(--color-primary-dark, #b8940a); }

/* Finished */
.finish-header { text-align: center; margin-bottom: 1.5rem; }
.finish-header h2 { font-size: 2rem; font-weight: 800; margin: 0; }
.finish-period { color: var(--color-text-secondary, #666); margin: 0.3rem 0 0; }
.leaderboard { margin-bottom: 1.5rem; }
.leaderboard h3 { font-size: 1.1rem; font-weight: 700; margin: 0 0 0.75rem; }
.leaderboard-list { display: flex; flex-direction: column; gap: 0.5rem; }
.lb-row { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; border-radius: 10px; border: 2px solid var(--color-border, #eee); background: var(--color-bg, #fff); flex-wrap: wrap; }
.lb-row--me { border-color: var(--color-primary, #FFCB00); background: #fffbeb; }
.lb-row--first { border-color: #f59e0b; }
.lb-rank { font-size: 1.3rem; width: 2rem; text-align: center; }
.lb-name { flex: 1; font-weight: 600; min-width: 100px; }
.you-tag { font-size: 0.7rem; background: #dbeafe; color: #1d4ed8; padding: 0.1rem 0.3rem; border-radius: 4px; margin-left: 0.3rem; font-weight: 700; }
.lb-stats { text-align: right; }
.lb-value { display: block; font-weight: 700; font-size: 1rem; }
.lb-return { display: block; font-size: 0.85rem; font-weight: 600; }
.lb-return--pos { color: #10b981; }
.lb-return--neg { color: #ef4444; }
.lb-badges { display: flex; gap: 0.3rem; flex-wrap: wrap; }
.badge { font-size: 0.7rem; padding: 0.2rem 0.4rem; border-radius: 4px; font-weight: 700; }
.badge--good { background: #d1fae5; color: #065f46; }
.badge--gold { background: #fef3c7; color: #92400e; }
.benchmark-row { display: flex; gap: 0.75rem; margin-bottom: 1.5rem; }
.benchmark-card { flex: 1; background: var(--color-surface, #f8f8f8); border-radius: 10px; padding: 0.75rem; text-align: center; }
.bm-label { display: block; font-size: 0.8rem; color: var(--color-text-secondary, #666); }
.bm-value { display: block; font-weight: 700; font-size: 1rem; }
.result-chart-wrapper { height: 280px; margin-bottom: 1.5rem; }
.finish-actions { display: flex; flex-direction: column; gap: 0.75rem; align-items: center; }
.btn { padding: 0.75rem 2rem; border-radius: 8px; border: none; cursor: pointer; font-size: 1rem; font-weight: 600; transition: all 0.2s; }
.btn--primary { background: var(--color-primary, #FFCB00); color: #000; min-width: 200px; }
.btn--ghost { background: transparent; border: 2px solid var(--color-border, #ddd); color: var(--color-text, #000); }
.waiting-host { color: var(--color-text-secondary, #666); font-size: 0.9rem; }
</style>
