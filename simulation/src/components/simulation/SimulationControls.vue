<script setup lang="ts">
import { Button, Badge, Progress } from '@/components/ui'
import { useSimulationStore, type SimulationSpeed } from '@/stores/simulationStore'
import { usePortfolioStore } from '@/stores/portfolioStore'

const simulationStore = useSimulationStore()
const portfolioStore = usePortfolioStore()

const speeds: SimulationSpeed[] = [1, 2, 5, 10]

function handlePlayPause() {
  const allocs = portfolioStore.allocations
  const capital = portfolioStore.initialCapital
  const savings = portfolioStore.monthlySavings

  if (simulationStore.state === 'idle' || simulationStore.state === 'setup') {
    simulationStore.startSimulation(allocs, capital, savings)
  } else if (simulationStore.state === 'running') {
    simulationStore.pauseSimulation()
  } else if (simulationStore.state === 'paused') {
    simulationStore.resumeSimulation(allocs, capital, savings)
  }
}

function handleReset() {
  simulationStore.resetSimulation()
}

function changeSpeed(speed: SimulationSpeed) {
  const wasRunning = simulationStore.isRunning
  if (wasRunning) {
    simulationStore.pauseSimulation()
  }
  simulationStore.setSpeed(speed)
  if (wasRunning) {
    simulationStore.resumeSimulation(
      portfolioStore.allocations,
      portfolioStore.initialCapital,
      portfolioStore.monthlySavings,
    )
  }
}
</script>

<template>
  <div class="space-y-3">
    <!-- Timeline -->
    <div class="flex items-center justify-between text-sm">
      <span class="text-muted-foreground">
        Year {{ simulationStore.currentYear }} / Month {{ simulationStore.currentMonthInYear }}
      </span>
      <Badge variant="outline" class="font-mono">
        {{ simulationStore.currentMonth }} / {{ simulationStore.totalMonths }} months
      </Badge>
    </div>

    <Progress :value="simulationStore.progressPercent" />

    <!-- Controls -->
    <div class="flex items-center gap-2 flex-wrap">
      <!-- Play/Pause -->
      <Button
        :variant="simulationStore.isRunning ? 'outline' : 'default'"
        size="sm"
        :disabled="!portfolioStore.isValid && simulationStore.state === 'idle'"
        @click="handlePlayPause"
      >
        <svg v-if="!simulationStore.isRunning" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
          <polygon points="6 3 20 12 6 21 6 3" />
        </svg>
        <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
          <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
        </svg>
        {{ simulationStore.isRunning ? 'Pause' : simulationStore.state === 'paused' ? 'Resume' : 'Start' }}
      </Button>

      <!-- Reset -->
      <Button variant="outline" size="sm" @click="handleReset">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" />
        </svg>
        Reset
      </Button>

      <!-- Speed -->
      <div class="flex items-center gap-1 ml-auto">
        <span class="text-xs text-muted-foreground mr-1">Speed:</span>
        <button
          v-for="s in speeds"
          :key="s"
          :class="[
            'px-2 py-1 rounded text-xs font-mono transition-colors cursor-pointer',
            simulationStore.speed === s
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-muted-foreground hover:text-foreground',
          ]"
          @click="changeSpeed(s)"
        >
          {{ s }}x
        </button>
      </div>
    </div>

    <!-- Validation warning -->
    <div v-if="!portfolioStore.isValid && simulationStore.state === 'idle'" class="text-xs text-yellow-400 flex items-center gap-1">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" />
      </svg>
      Allocate exactly 100% to start the simulation
    </div>
  </div>
</template>
