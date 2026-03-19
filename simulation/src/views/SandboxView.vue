<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { usePortfolioStore } from '@/stores/portfolioStore'
import { useSimulationStore } from '@/stores/simulationStore'
import PortfolioBuilder from '@/components/portfolio/PortfolioBuilder.vue'
import SimulationControls from '@/components/simulation/SimulationControls.vue'
import MarketChart from '@/components/simulation/MarketChart.vue'
import MetricsDashboard from '@/components/simulation/MetricsDashboard.vue'
import EventCard from '@/components/simulation/EventCard.vue'
import SimulationSummary from '@/components/simulation/SimulationSummary.vue'
import GlossaryPanel from '@/components/education/GlossaryPanel.vue'

const router = useRouter()
const portfolioStore = usePortfolioStore()
const simulationStore = useSimulationStore()

const glossaryRef = ref<InstanceType<typeof GlossaryPanel> | null>(null)

// Auto-pause simulation on event
watch(() => simulationStore.activeEvent, (event) => {
  if (event && simulationStore.isRunning) {
    simulationStore.pauseSimulation()
  }
})

function handleDismissEvent() {
  simulationStore.dismissEvent()
  // Auto-resume after dismissing event
  if (simulationStore.state === 'paused') {
    simulationStore.resumeSimulation(
      portfolioStore.allocations,
      portfolioStore.initialCapital,
      portfolioStore.monthlySavings,
    )
  }
}

function handleRestart() {
  simulationStore.resetSimulation()
  portfolioStore.resetPortfolio()
}

function handleGoToLeaderboard() {
  router.push('/leaderboard')
}

onUnmounted(() => {
  simulationStore.stopSimulation()
})
</script>

<template>
  <div class="container mx-auto px-4 py-6 max-w-7xl">
    <!-- Page Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold">Sandbox Mode</h1>
        <p class="text-sm text-muted-foreground">
          Build your portfolio and simulate 20 years of market history
        </p>
      </div>
      <GlossaryPanel ref="glossaryRef" />
    </div>

    <!-- Event Overlay -->
    <EventCard
      v-if="simulationStore.activeEvent"
      :event="simulationStore.activeEvent"
      @dismiss="handleDismissEvent"
    />

    <!-- Summary (when finished) -->
    <SimulationSummary
      v-if="simulationStore.isFinished"
      @restart="handleRestart"
      @go-to-leaderboard="handleGoToLeaderboard"
    />

    <!-- Main Layout -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-4">
      <!-- Left: Portfolio Builder -->
      <div class="lg:col-span-4 xl:col-span-3 space-y-4 order-2 lg:order-1">
        <PortfolioBuilder />
      </div>

      <!-- Right: Simulation Area -->
      <div class="lg:col-span-8 xl:col-span-9 space-y-4 order-1 lg:order-2">
        <!-- Controls -->
        <Card>
          <CardContent class="p-4">
            <SimulationControls />
          </CardContent>
        </Card>

        <!-- Metrics -->
        <MetricsDashboard />

        <!-- Chart -->
        <Card>
          <CardHeader class="pb-2">
            <CardTitle class="text-sm">Portfolio Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="h-[350px]">
              <MarketChart />
            </div>
          </CardContent>
        </Card>

        <!-- Event History -->
        <Card v-if="simulationStore.pastEvents.length > 0">
          <CardHeader class="pb-2">
            <CardTitle class="text-sm">Event History</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="space-y-2 max-h-[200px] overflow-y-auto">
              <div
                v-for="event in [...simulationStore.pastEvents].reverse()"
                :key="event.id"
                :class="[
                  'flex items-center gap-3 rounded-lg p-2 text-xs',
                  event.severity === 'positive' ? 'bg-green-500/5' :
                  event.severity === 'negative' ? 'bg-red-500/5' : 'bg-yellow-500/5',
                ]"
              >
                <div :class="[
                  'w-2 h-2 rounded-full shrink-0',
                  event.severity === 'positive' ? 'bg-green-500' :
                  event.severity === 'negative' ? 'bg-red-500' : 'bg-yellow-500',
                ]" />
                <span class="text-muted-foreground font-mono">
                  Y{{ Math.floor(event.month / 12) + 1 }}
                </span>
                <span class="font-medium">{{ event.title }}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
