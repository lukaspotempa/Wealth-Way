<script setup lang="ts">
import { ref, computed, onUnmounted, watch } from 'vue'
import { createLobby, joinLobby, MultiplayerConnection } from '@/services/multiplayerService'
import type { LobbyInfo, LobbyPlayer, ServerMessage } from '@/types/multiplayer'

const emit = defineEmits<{
  raceStarted: [connection: MultiplayerConnection, lobbyInfo: LobbyInfo, playerId: string, startYear: number, endYear: number]
  configuring: [connection: MultiplayerConnection, lobbyInfo: LobbyInfo, playerId: string]
  back: []
}>()

// Flag to prevent disconnecting the socket when handing off to MultiplayerRace
let raceHasStarted = false

// ── UI state ─────────────────────────────────────────────────────────────────
type LobbyScreen = 'setup' | 'lobby' | 'configuring'
const screen = ref<LobbyScreen>('setup')
const mode = ref<'create' | 'join'>('create')
const playerName = ref('')
const joinCode = ref('')
const selectedDuration = ref(10)
const error = ref<string | null>(null)
const loading = ref(false)

// ── Lobby state ───────────────────────────────────────────────────────────────
const lobbyInfo = ref<LobbyInfo | null>(null)
const myPlayerId = ref('')
const connection = ref<MultiplayerConnection | null>(null)
const configTimeLeft = ref(120) // seconds
const configTimer = ref<ReturnType<typeof setInterval> | null>(null)
const portfolioSubmitted = ref<Set<string>>(new Set())

// ── Computed ──────────────────────────────────────────────────────────────────
const isHost = computed(() => lobbyInfo.value?.hostId === myPlayerId.value)
const joinUrl = computed(() => {
  if (!lobbyInfo.value) return ''
  return `${window.location.origin}/?join=${lobbyInfo.value.code}`
})
const canStart = computed(() => (lobbyInfo.value?.players.length ?? 0) >= 1)
const allSubmitted = computed(() => {
  const players = lobbyInfo.value?.players ?? []
  return players.every(p => portfolioSubmitted.value.has(p.id))
})

// ── Actions ───────────────────────────────────────────────────────────────────
async function handleCreate() {
  if (!playerName.value.trim()) { error.value = 'Enter your name'; return }
  loading.value = true
  error.value = null
  try {
    const { lobbyCode, playerId } = await createLobby(playerName.value.trim())
    myPlayerId.value = playerId
    await connectToLobby(lobbyCode, playerId)
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function handleJoin() {
  if (!playerName.value.trim()) { error.value = 'Enter your name'; return }
  if (!joinCode.value.trim()) { error.value = 'Enter lobby code'; return }
  loading.value = true
  error.value = null
  try {
    const { lobbyCode, playerId } = await joinLobby(joinCode.value.trim().toUpperCase(), playerName.value.trim())
    myPlayerId.value = playerId
    await connectToLobby(lobbyCode, playerId)
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function connectToLobby(code: string, playerId: string) {
  const conn = new MultiplayerConnection(code, playerId)
  connection.value = conn

  conn.on('LOBBY_STATE', (msg: any) => {
    lobbyInfo.value = msg
    screen.value = msg.state === 'CONFIGURING' ? 'configuring' : 'lobby'
    if (msg.state === 'CONFIGURING' && msg.configDeadline) {
      startConfigTimer(msg.configDeadline)
    }
  })

  conn.on('PLAYER_JOINED', (msg: any) => {
    if (lobbyInfo.value) {
      const exists = lobbyInfo.value.players.find(p => p.id === msg.player.id)
      if (!exists) lobbyInfo.value.players.push(msg.player)
    }
  })

  conn.on('PLAYER_LEFT', (msg: any) => {
    if (lobbyInfo.value) {
      lobbyInfo.value.players = lobbyInfo.value.players.filter(p => p.id !== (msg as any).playerId)
    }
  })

  conn.on('GAME_STARTING', (msg: any) => {
    if (lobbyInfo.value) {
      lobbyInfo.value.state = 'CONFIGURING'
      lobbyInfo.value.configDeadline = msg.configDeadline
      lobbyInfo.value.duration = msg.duration
      lobbyInfo.value.players = msg.players
    }
    screen.value = 'configuring'
    startConfigTimer(msg.configDeadline)
    emit('configuring', conn, lobbyInfo.value!, myPlayerId.value)
  })

  conn.on('PORTFOLIO_RECEIVED', (msg: any) => {
    portfolioSubmitted.value.add((msg as any).playerId)
    if (lobbyInfo.value) {
      const p = lobbyInfo.value.players.find(pl => pl.id === (msg as any).playerId)
      if (p) p.hasPortfolio = true
    }
  })

  conn.on('RACE_STARTED', (msg: any) => {
    if (configTimer.value) clearInterval(configTimer.value)
    raceHasStarted = true
    emit('raceStarted', conn, lobbyInfo.value!, myPlayerId.value, msg.startYear ?? 2015, msg.endYear ?? 2024)
  })

  conn.on('ERROR', (msg: any) => {
    error.value = (msg as any).message
  })

  await conn.connect()
  screen.value = 'lobby'
}

function startConfigTimer(deadline: number) {
  if (configTimer.value) clearInterval(configTimer.value)
  const tick = () => {
    const left = Math.max(0, Math.ceil(deadline - Date.now() / 1000))
    configTimeLeft.value = left
    if (left <= 0 && configTimer.value) clearInterval(configTimer.value)
  }
  tick()
  configTimer.value = setInterval(tick, 500)
}

function handleStart() {
  connection.value?.startGame(selectedDuration.value)
}

function copyLink() {
  navigator.clipboard.writeText(joinUrl.value)
}

function copyCode() {
  navigator.clipboard.writeText(lobbyInfo.value?.code ?? '')
}

function handleBack() {
  connection.value?.disconnect()
  emit('back')
}

onUnmounted(() => {
  // Only disconnect if we haven't handed the socket off to the race view
  if (!raceHasStarted) connection.value?.disconnect()
  if (configTimer.value) clearInterval(configTimer.value)
})

// ── QR code ───────────────────────────────────────────────────────────────────
const qrDataUrl = ref<string>('')
const qrCanvas = ref<HTMLCanvasElement | null>(null)

watch(joinUrl, (url) => {
  if (!url) return
  generateQR(url)
}, { immediate: true })

async function generateQR(url: string) {
  // Minimal QR code via free public API image (no npm dep needed)
  qrDataUrl.value = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&margin=1&data=${encodeURIComponent(url)}`
}
</script>

<template>
  <div class="mp-lobby">

    <!-- SETUP SCREEN -->
    <div v-if="screen === 'setup'" class="mp-setup">
      <h2 class="mp-title">Multiplayer Arena</h2>
      <p class="mp-subtitle">Battle friends with real historical market data</p>

      <div class="mp-mode-tabs">
        <button :class="['mp-tab', { 'mp-tab--active': mode === 'create' }]" @click="mode = 'create'">Create Lobby</button>
        <button :class="['mp-tab', { 'mp-tab--active': mode === 'join' }]" @click="mode = 'join'">Join Lobby</button>
      </div>

      <div class="mp-form">
        <div class="mp-field">
          <label>Your Name</label>
          <input v-model="playerName" placeholder="e.g. WarrenB" maxlength="20" @keyup.enter="mode === 'create' ? handleCreate() : handleJoin()" />
        </div>

        <div v-if="mode === 'join'" class="mp-field">
          <label>Lobby Code</label>
          <input v-model="joinCode" placeholder="ABC123" maxlength="6" class="code-input" @keyup.enter="handleJoin" />
        </div>

        <div v-if="error" class="mp-error">{{ error }}</div>

        <button class="btn btn--primary" :disabled="loading" @click="mode === 'create' ? handleCreate() : handleJoin()">
          {{ loading ? 'Connecting...' : (mode === 'create' ? 'Create Lobby' : 'Join Lobby') }}
        </button>
        <button class="btn btn--ghost" @click="$emit('back')">&#8592; Back</button>
      </div>
    </div>

    <!-- LOBBY SCREEN -->
    <div v-else-if="screen === 'lobby'" class="mp-room">
      <div class="mp-room-header">
        <h2>Lobby <span class="lobby-code">{{ lobbyInfo?.code }}</span></h2>
        <p class="mp-room-subtitle">{{ lobbyInfo?.players.length ?? 0 }}/10 players</p>
      </div>

      <!-- Share section -->
      <div class="mp-share">
        <div class="mp-share-inner">
          <div class="mp-share-text">
            <div class="mp-code-display">
              <span class="code-label">Room Code</span>
              <span class="code-value">{{ lobbyInfo?.code }}</span>
              <button class="copy-btn" @click="copyCode" title="Copy code">&#128203;</button>
            </div>
            <p class="share-hint">Scan QR or share code/link to invite friends</p>
          </div>
          <div v-if="qrDataUrl" class="mp-qr">
            <img :src="qrDataUrl" alt="Join QR Code" width="120" height="120" />
          </div>
        </div>
      </div>

      <!-- Players list -->
      <div class="mp-players">
        <h3>Players</h3>
        <div class="mp-player-list">
          <div v-for="player in lobbyInfo?.players" :key="player.id" class="mp-player-row">
            <span class="player-avatar">{{ player.name[0]?.toUpperCase() }}</span>
            <span class="player-name">{{ player.name }}</span>
            <span v-if="player.isHost" class="host-badge">Host</span>
            <span v-if="player.id === myPlayerId" class="you-badge">You</span>
          </div>
        </div>
      </div>

      <!-- Host controls -->
      <div v-if="isHost" class="mp-host-controls">
        <div class="mp-field">
          <label>Simulation Duration</label>
          <div class="btn-group">
            <button v-for="dur in [5, 10, 20]" :key="dur"
              :class="['toggle-btn', { 'toggle-btn--active': selectedDuration === dur }]"
              @click="selectedDuration = dur">
              {{ dur }} years
            </button>
          </div>
        </div>
        <button class="btn btn--primary btn--large" :disabled="!canStart" @click="handleStart">
          &#9654; Start Game
        </button>
        <p class="host-hint">All players will have 2 minutes to configure their portfolio</p>
      </div>
      <div v-else class="mp-waiting">
        <div class="waiting-dots"><span/><span/><span/></div>
        <p>Waiting for host to start the game...</p>
      </div>

      <button class="btn btn--ghost" @click="handleBack">&#8592; Leave Lobby</button>
    </div>

    <!-- CONFIGURING SCREEN -->
    <div v-else-if="screen === 'configuring'" class="mp-configuring">
      <div class="config-timer-banner">
        <span class="timer-label">Configure your portfolio</span>
        <span class="timer-value" :class="{ 'timer-urgent': configTimeLeft <= 30 }">
          {{ Math.floor(configTimeLeft / 60) }}:{{ String(configTimeLeft % 60).padStart(2, '0') }}
        </span>
      </div>

      <div class="mp-players-status">
        <div v-for="player in lobbyInfo?.players" :key="player.id"
          :class="['mp-status-row', { 'status-done': player.hasPortfolio }]">
          <span class="player-avatar">{{ player.name[0]?.toUpperCase() }}</span>
          <span class="player-name">{{ player.name }}</span>
          <span class="status-icon">{{ player.hasPortfolio ? '&#10003; Ready' : '...' }}</span>
        </div>
      </div>

      <p class="config-instruction">
        Use the portfolio builder below to set your allocations, then hit <strong>"Lock In Portfolio"</strong>
      </p>
    </div>

  </div>
</template>

<style scoped>
.mp-lobby {
  max-width: 520px;
  margin: 0 auto;
  padding: 1.5rem;
}
.mp-title { font-size: 1.8rem; font-weight: 800; margin: 0 0 0.3rem; }
.mp-subtitle { color: var(--color-text-secondary, #666); margin: 0 0 1.5rem; }
.mp-mode-tabs { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; }
.mp-tab {
  flex: 1; padding: 0.6rem 1rem; border: 2px solid var(--color-border, #ddd);
  background: transparent; border-radius: 8px; cursor: pointer; font-weight: 600;
  transition: all 0.2s;
}
.mp-tab--active { border-color: var(--color-primary, #FFCB00); background: var(--color-primary, #FFCB00); color: #000; }
.mp-form { display: flex; flex-direction: column; gap: 1rem; }
.mp-field label { display: block; font-weight: 600; margin-bottom: 0.4rem; font-size: 0.9rem; }
.mp-field input {
  width: 100%; padding: 0.7rem 1rem; border: 2px solid var(--color-border, #ddd);
  border-radius: 8px; font-size: 1rem; box-sizing: border-box;
  background: var(--color-bg, #fff); color: var(--color-text, #000);
}
.mp-field input:focus { outline: none; border-color: var(--color-primary, #FFCB00); }
.code-input { text-transform: uppercase; letter-spacing: 0.15em; font-size: 1.2rem; font-weight: 700; }
.mp-error { background: #fee; border: 1px solid #f44; border-radius: 8px; padding: 0.6rem 1rem; color: #c00; font-size: 0.9rem; }
.btn { padding: 0.75rem 1.5rem; border-radius: 8px; border: none; cursor: pointer; font-size: 1rem; font-weight: 600; transition: all 0.2s; }
.btn--primary { background: var(--color-primary, #FFCB00); color: #000; }
.btn--primary:hover:not(:disabled) { filter: brightness(1.05); }
.btn--primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn--ghost { background: transparent; border: 2px solid var(--color-border, #ddd); color: var(--color-text, #000); }
.btn--ghost:hover { background: var(--color-surface, #f5f5f5); }
.btn--large { padding: 0.9rem 2rem; font-size: 1.1rem; width: 100%; }

/* Room */
.mp-room-header { margin-bottom: 1.5rem; }
.mp-room-header h2 { font-size: 1.5rem; font-weight: 800; margin: 0 0 0.2rem; }
.lobby-code { font-family: monospace; background: var(--color-primary, #FFCB00); padding: 0.1rem 0.5rem; border-radius: 6px; font-size: 1.1rem; }
.mp-room-subtitle { color: var(--color-text-secondary, #666); margin: 0; }
.mp-share { background: var(--color-surface, #f8f8f8); border-radius: 12px; padding: 1rem; margin-bottom: 1.5rem; }
.mp-share-inner { display: flex; align-items: center; gap: 1rem; }
.mp-share-text { flex: 1; display: flex; flex-direction: column; gap: 0.6rem; }
.mp-qr { flex-shrink: 0; border-radius: 8px; overflow: hidden; border: 2px solid var(--color-border, #ddd); }
.mp-qr img { display: block; }
.mp-code-display, .mp-link-display { display: flex; align-items: center; gap: 0.5rem; }
.code-label { font-size: 0.8rem; color: var(--color-text-secondary, #666); width: 80px; flex-shrink: 0; }
.code-value { font-family: monospace; font-size: 1.5rem; font-weight: 800; letter-spacing: 0.15em; color: var(--color-primary, #FFCB00); }
.link-url { font-size: 0.8rem; color: var(--color-text-secondary, #666); word-break: break-all; flex: 1; }
.copy-btn { background: none; border: none; cursor: pointer; font-size: 1.1rem; padding: 0.2rem; }
.share-hint { font-size: 0.8rem; color: var(--color-text-secondary, #666); margin: 0; }
.mp-players h3 { font-size: 1rem; font-weight: 700; margin: 0 0 0.75rem; }
.mp-player-list { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.5rem; }
.mp-player-row { display: flex; align-items: center; gap: 0.75rem; padding: 0.6rem 0.75rem; background: var(--color-surface, #f8f8f8); border-radius: 8px; }
.player-avatar { width: 32px; height: 32px; border-radius: 50%; background: var(--color-primary, #FFCB00); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.9rem; flex-shrink: 0; }
.player-name { flex: 1; font-weight: 600; }
.host-badge { background: var(--color-secondary, #004A5A); color: #fff; font-size: 0.7rem; padding: 0.15rem 0.4rem; border-radius: 4px; font-weight: 700; }
.you-badge { background: #e8f4fd; color: #0066cc; font-size: 0.7rem; padding: 0.15rem 0.4rem; border-radius: 4px; font-weight: 700; }
.mp-host-controls { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1rem; }
.btn-group { display: flex; gap: 0.5rem; }
.toggle-btn { flex: 1; padding: 0.5rem; border: 2px solid var(--color-border, #ddd); background: transparent; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.9rem; }
.toggle-btn--active { border-color: var(--color-primary, #FFCB00); background: var(--color-primary, #FFCB00); color: #000; }
.host-hint { font-size: 0.8rem; color: var(--color-text-secondary, #666); margin: 0; text-align: center; }
.mp-waiting { text-align: center; padding: 1.5rem; color: var(--color-text-secondary, #666); }
.waiting-dots { display: flex; gap: 0.3rem; justify-content: center; margin-bottom: 0.75rem; }
.waiting-dots span { width: 8px; height: 8px; border-radius: 50%; background: var(--color-primary, #FFCB00); animation: bounce 1.2s infinite both; }
.waiting-dots span:nth-child(2) { animation-delay: 0.2s; }
.waiting-dots span:nth-child(3) { animation-delay: 0.4s; }
@keyframes bounce { 0%, 80%, 100% { transform: scale(0.7); } 40% { transform: scale(1); } }

/* Config phase */
.config-timer-banner { display: flex; justify-content: space-between; align-items: center; background: var(--color-secondary, #004A5A); color: #fff; border-radius: 12px; padding: 1rem 1.5rem; margin-bottom: 1.5rem; }
.timer-label { font-weight: 600; }
.timer-value { font-size: 2rem; font-weight: 800; font-family: monospace; }
.timer-urgent { color: #f87171; }
.mp-players-status { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.5rem; }
.mp-status-row { display: flex; align-items: center; gap: 0.75rem; padding: 0.6rem 0.75rem; border-radius: 8px; border: 2px solid var(--color-border, #ddd); transition: all 0.3s; }
.status-done { border-color: #10b981; background: #f0fdf4; }
.status-icon { margin-left: auto; font-weight: 600; font-size: 0.9rem; color: #10b981; }
.mp-status-row:not(.status-done) .status-icon { color: var(--color-text-secondary, #999); }
.config-instruction { text-align: center; color: var(--color-text-secondary, #666); font-size: 0.9rem; }
</style>
