<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Input, Badge, Progress, Slider } from '@/components/ui'
import { useBattleStore } from '@/stores/battleStore'
import { assets, ASSET_CLASS_LABELS, ASSET_CLASS_COLORS, type AssetClass } from '@/data/assets'
import { formatCurrency, formatPercent } from '@/lib/utils'
import EventCard from '@/components/simulation/EventCard.vue'
import BattleChart from '@/components/battle/BattleChart.vue'

const router = useRouter()
const battleStore = useBattleStore()

const player1Name = ref('Player 1')
const player2Name = ref('Player 2')
const activePlayerSetup = ref(0)

const assetClasses: AssetClass[] = ['equity', 'bond', 'commodity', 'currency', 'crypto']
const groupedAssets = computed(() => {
  const groups: Record<string, typeof assets> = {}
  for (const cls of assetClasses) {
    groups[cls] = assets.filter((a) => a.class === cls)
  }
  return groups
})

const currentPlayerAllocations = computed(() => {
  const player = battleStore.players[activePlayerSetup.value]
  return player ? player.allocations : {}
})

const currentTotalAllocation = computed(() =>
  Object.values(currentPlayerAllocations.value).reduce((s, v) => s + v, 0),
)

// Auto-pause on event
watch(() => battleStore.activeEvent, (event) => {
  if (event && battleStore.isRunning) {
    battleStore.pauseBattle()
  }
})

function createBattle() {
  battleStore.resetBattle()
  battleStore.addPlayer(player1Name.value || 'Player 1')
  battleStore.addPlayer(player2Name.value || 'Player 2')
  battleStore.initializeBattle()
  activePlayerSetup.value = 0
}

function setAllocation(assetId: string, weight: number) {
  const player = battleStore.players[activePlayerSetup.value]
  if (!player) return
  const newAlloc = { ...player.allocations }
  if (weight <= 0) {
    delete newAlloc[assetId]
  } else {
    newAlloc[assetId] = weight
  }
  battleStore.setPlayerAllocations(activePlayerSetup.value, newAlloc)
}

function toggleAsset(assetId: string) {
  const current = currentPlayerAllocations.value[assetId]
  if (current && current > 0) {
    setAllocation(assetId, 0)
  } else {
    const remaining = 100 - currentTotalAllocation.value
    setAllocation(assetId, Math.min(10, remaining))
  }
}

function equalWeight() {
  const ids = Object.keys(currentPlayerAllocations.value).filter(
    (id) => currentPlayerAllocations.value[id] > 0,
  )
  if (ids.length === 0) return
  const w = Math.floor(100 / ids.length)
  const rem = 100 - w * ids.length
  const alloc: Record<string, number> = {}
  ids.forEach((id, i) => { alloc[id] = w + (i < rem ? 1 : 0) })
  battleStore.setPlayerAllocations(activePlayerSetup.value, alloc)
}

function confirmPlayerSetup() {
  battleStore.setPlayerReady(activePlayerSetup.value)
  if (activePlayerSetup.value === 0) {
    activePlayerSetup.value = 1
  }
}

function startBattle() {
  battleStore.startBattle()
}

function handleDismissEvent() {
  battleStore.dismissEvent()
  if (battleStore.state === 'paused') {
    battleStore.resumeBattle()
  }
}

function handlePlayPause() {
  if (battleStore.isRunning) {
    battleStore.pauseBattle()
  } else {
    battleStore.resumeBattle()
  }
}

function handleReset() {
  battleStore.resetBattle()
}

onUnmounted(() => {
  battleStore.stopBattle()
})

const speeds = [1, 2, 5, 10] as const

// Battle results
const winner = computed(() => {
  if (battleStore.state !== 'finished' || battleStore.players.length < 2) return null
  const p1 = battleStore.players[0].history
  const p2 = battleStore.players[1].history
  const v1 = p1.length > 0 ? p1[p1.length - 1].value : 0
  const v2 = p2.length > 0 ? p2[p2.length - 1].value : 0
  if (v1 > v2) return 0
  if (v2 > v1) return 1
  return -1
})
</script>

<template>
  <div class="container mx-auto px-4 py-6 max-w-6xl">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold">
          Battle Mode
          <span class="text-primary">Bull</span> vs <span class="text-destructive">Bear</span>
        </h1>
        <p class="text-sm text-muted-foreground">Challenge a friend - same market, different strategies</p>
      </div>
    </div>

    <!-- Event Overlay -->
    <EventCard
      v-if="battleStore.activeEvent"
      :event="battleStore.activeEvent"
      @dismiss="handleDismissEvent"
    />

    <!-- Lobby -->
    <div v-if="battleStore.state === 'lobby'" class="max-w-md mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Battle</CardTitle>
          <CardDescription>Enter player names and start the challenge</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div>
            <label class="text-xs text-muted-foreground mb-1 block">Player 1 Name</label>
            <Input v-model="player1Name" placeholder="Player 1" />
          </div>
          <div>
            <label class="text-xs text-muted-foreground mb-1 block">Player 2 Name</label>
            <Input v-model="player2Name" placeholder="Player 2" />
          </div>
          <Button class="w-full" @click="createBattle">
            Create Battle
          </Button>
        </CardContent>
      </Card>
    </div>

    <!-- Setup Phase -->
    <div v-else-if="battleStore.state === 'setup'" class="space-y-4">
      <!-- Player tabs -->
      <div class="flex items-center gap-4 mb-4">
        <div
          v-for="(player, idx) in battleStore.players"
          :key="idx"
          :class="[
            'flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-all',
            activePlayerSetup === idx ? 'border-primary bg-primary/10' : 'border-border',
            player.ready ? 'opacity-60' : '',
          ]"
          @click="!player.ready && (activePlayerSetup = idx)"
        >
          <div :class="['w-3 h-3 rounded-full', idx === 0 ? 'bg-primary' : 'bg-orange-500']" />
          <span class="text-sm font-medium">{{ player.name }}</span>
          <Badge v-if="player.ready" variant="outline" class="text-xs">Ready</Badge>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <!-- Allocation builder -->
        <Card>
          <CardHeader class="pb-2">
            <CardTitle class="text-sm">
              {{ battleStore.players[activePlayerSetup]?.name }}'s Portfolio
            </CardTitle>
            <div class="flex items-center gap-2 mt-1">
              <span :class="['text-sm font-mono font-bold', currentTotalAllocation >= 99.5 && currentTotalAllocation <= 100.5 ? 'text-primary' : 'text-yellow-400']">
                {{ currentTotalAllocation.toFixed(0) }}% allocated
              </span>
              <button
                v-if="Object.keys(currentPlayerAllocations).length > 0"
                class="text-xs text-primary hover:underline cursor-pointer"
                @click="equalWeight"
              >
                Equal Weight
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div class="space-y-3 max-h-[400px] overflow-y-auto">
              <div v-for="cls in assetClasses" :key="cls">
                <div class="flex items-center gap-2 mb-1">
                  <div class="w-2 h-2 rounded-full" :style="{ backgroundColor: ASSET_CLASS_COLORS[cls] }" />
                  <span class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{{ ASSET_CLASS_LABELS[cls] }}</span>
                </div>
                <div class="space-y-1 mb-2">
                  <div
                    v-for="asset in groupedAssets[cls]"
                    :key="asset.id"
                    :class="['rounded-lg border p-2 transition-all', currentPlayerAllocations[asset.id] > 0 ? 'border-primary/50 bg-primary/5' : 'border-border']"
                  >
                    <div class="flex items-center justify-between">
                      <button class="flex items-center gap-2 cursor-pointer text-left" @click="toggleAsset(asset.id)">
                        <span class="text-xs font-medium">{{ asset.name }}</span>
                        <span class="text-xs text-muted-foreground">{{ asset.ticker }}</span>
                      </button>
                      <span v-if="currentPlayerAllocations[asset.id] > 0" class="text-xs font-mono font-bold text-primary">
                        {{ currentPlayerAllocations[asset.id] }}%
                      </span>
                    </div>
                    <div v-if="currentPlayerAllocations[asset.id] > 0" class="mt-1">
                      <Slider
                        :model-value="currentPlayerAllocations[asset.id]"
                        :min="0"
                        :max="100"
                        :step="1"
                        @update:model-value="setAllocation(asset.id, $event)"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Ready / instructions -->
        <Card>
          <CardContent class="p-6 flex flex-col items-center justify-center min-h-[300px]">
            <div v-if="!battleStore.players[activePlayerSetup]?.ready" class="text-center">
              <p class="text-sm text-muted-foreground mb-4">
                Allocate 100% of your portfolio, then click Ready.
                <br />
                <span class="text-xs">Both players invest CHF 100,000 with CHF 500/month.</span>
              </p>
              <Button
                :disabled="currentTotalAllocation < 99.5 || currentTotalAllocation > 100.5"
                @click="confirmPlayerSetup"
              >
                Confirm & Ready
              </Button>
            </div>
            <div v-else class="text-center">
              <p class="text-2xl mb-2">&#10003;</p>
              <p class="text-sm font-medium text-primary">
                {{ battleStore.players[activePlayerSetup]?.name }} is ready!
              </p>
              <p v-if="!battleStore.allPlayersReady" class="text-xs text-muted-foreground mt-2">
                Waiting for other player...
              </p>
            </div>

            <Button
              v-if="battleStore.allPlayersReady"
              class="mt-6"
              size="lg"
              @click="startBattle"
            >
              Start Battle!
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- Running / Paused / Finished -->
    <div v-else class="space-y-4">
      <!-- Controls -->
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between text-sm mb-2">
            <span class="text-muted-foreground">
              Year {{ battleStore.currentYear }} / {{ battleStore.currentMonth }} months
            </span>
            <Badge v-if="battleStore.state === 'finished'" variant="default">Complete</Badge>
            <Badge v-else variant="outline" class="font-mono">
              {{ battleStore.progressPercent.toFixed(0) }}%
            </Badge>
          </div>
          <Progress :value="battleStore.progressPercent" class="mb-3" />

          <div class="flex items-center gap-2 flex-wrap">
            <Button
              v-if="battleStore.state !== 'finished'"
              :variant="battleStore.isRunning ? 'outline' : 'default'"
              size="sm"
              @click="handlePlayPause"
            >
              {{ battleStore.isRunning ? 'Pause' : 'Resume' }}
            </Button>
            <Button variant="outline" size="sm" @click="handleReset">
              New Battle
            </Button>
            <div class="flex items-center gap-1 ml-auto">
              <span class="text-xs text-muted-foreground mr-1">Speed:</span>
              <button
                v-for="s in speeds"
                :key="s"
                :class="['px-2 py-1 rounded text-xs font-mono transition-colors cursor-pointer', battleStore.speed === s ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground']"
                @click="battleStore.setSpeed(s)"
              >
                {{ s }}x
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Battle Chart -->
      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-sm">Battle Arena</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="h-[350px]">
            <BattleChart />
          </div>
        </CardContent>
      </Card>

      <!-- Player Stats -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card
          v-for="(player, idx) in battleStore.players"
          :key="idx"
          :class="`border-2 ${battleStore.state === 'finished' && winner === idx ? 'border-primary' : 'border-border'}`"
        >
          <CardContent class="p-4">
            <div class="flex items-center gap-2 mb-3">
              <div :class="['w-3 h-3 rounded-full', idx === 0 ? 'bg-primary' : 'bg-orange-500']" />
              <span class="font-semibold text-sm">{{ player.name }}</span>
              <Badge v-if="battleStore.state === 'finished' && winner === idx" class="ml-auto">
                Winner!
              </Badge>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <p class="text-xs text-muted-foreground">Value</p>
                <p class="text-sm font-bold font-mono text-primary">
                  {{ player.history.length > 0 ? formatCurrency(player.history[player.history.length - 1].value) : 'CHF 0' }}
                </p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground">Return</p>
                <p :class="['text-sm font-bold font-mono', player.history.length > 0 && player.history[player.history.length - 1].returnPct >= 0 ? 'text-primary' : 'text-destructive']">
                  {{ player.history.length > 0 ? formatPercent(player.history[player.history.length - 1].returnPct) : '+0.0%' }}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Final results -->
      <div v-if="battleStore.state === 'finished'" class="flex flex-col sm:flex-row gap-3 justify-center">
        <Button @click="router.push('/leaderboard')">View Leaderboard</Button>
        <Button variant="outline" @click="handleReset">New Battle</Button>
      </div>
    </div>
  </div>
</template>
