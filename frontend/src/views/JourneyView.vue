<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useJourneyStore } from '@/stores/journey'
import { useUserStore } from '@/stores/user'
import type { JourneyNode } from '@/types'

const router = useRouter()
const journeyStore = useJourneyStore()
const userStore = useUserStore()

const mapContainer = ref<HTMLElement | null>(null)
const isLoaded = ref(false)

onMounted(() => {
  setTimeout(() => {
    isLoaded.value = true
  }, 100)
})

const nodeTypeIcons: Record<string, string> = {
  lesson: '📖',
  quiz: '❓',
  checkpoint: '🏁',
  challenge: '⚔️',
}

const nodeTypeColors: Record<string, string> = {
  lesson: 'var(--color-primary)',
  quiz: 'var(--color-info)',
  checkpoint: 'var(--color-success)',
  challenge: 'var(--color-error)',
}

// Canvas dimensions
const W = 320
const H = 720

// Map store nodes to SVG map nodes
const svgNodes = computed(() => {
  const sourceNodes = journeyStore.nodes
  const total = sourceNodes.length

  return sourceNodes.map((node, i) => {
    // Generate sine/S-curve mapping exactly as journey.vue did
    const mapY = (i + 0.6) / (total + 0.2) // spread evenly top to bottom
    const mapX = 0.5 + Math.sin(i * 1.4) * 0.35 // sine wave side to side

    const isUnlocked = node.status !== 'locked'
    const isCompleted = node.status === 'completed'
    const isCurrent = node.status === 'available'
    const color = nodeTypeColors[node.type] || 'var(--color-primary)'
    const icon = nodeTypeIcons[node.type] || '📖'

    return {
      ...node,
      px: mapX * W,
      py: mapY * H,
      mapX,
      mapY,
      isUnlocked,
      isCompleted,
      isCurrent,
      color,
      icon,
    }
  })
})

// Build SVG path connecting all nodes in order
function buildPath(): string {
  const pts = svgNodes.value.map((n) => ({ x: n.px, y: n.py }))
  if (pts.length < 2) return ''

  let d = `M ${pts[0]!.x} ${pts[0]!.y}`
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1]!
    const curr = pts[i]!
    const midY = (prev.y + curr.y) / 2
    d += ` C ${prev.x} ${midY}, ${curr.x} ${midY}, ${curr.x} ${curr.y}`
  }
  return d
}

function navigateToNode(node: JourneyNode) {
  if (node.status === 'locked') return
  router.push(node.route)
}

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
})
</script>

<template>
  <div class="journey-view">
    <div class="journey-header">
      <div class="container">
        <h1>{{ greeting }}, {{ userStore.displayName }}</h1>
        <p class="journey-subtitle">Continue your path to financial mastery</p>
      </div>
    </div>

    <!-- AutoBattle call-to-action banner -->
    <div class="autobattle-banner">
      <div class="autobattle-banner-inner container">
        <div class="autobattle-banner-text">
          <span class="autobattle-banner-badge">New</span>
          <strong>Portfolio Battle Mode</strong>
          <span class="autobattle-banner-sub">
            Build a real portfolio and battle 24 years of historical market data.
            Learn why Sharpe Ratio beats raw return.
          </span>
        </div>
        <router-link to="/autobattle" class="autobattle-banner-btn">
          Play Portfolio Battle &#8594;
        </router-link>
      </div>
    </div>

    <div class="journey-map-wrapper">
      <div ref="mapContainer" class="journey-map map-container" :class="{ 'journey-map--loaded': isLoaded }">
        <svg
          :viewBox="`0 0 ${W} ${H}`"
          :width="W"
          :height="H"
          class="journey-svg"
          xmlns="http://www.w3.org/2000/svg"
        >
          <!-- Background path (full, dim) -->
          <path
            :d="buildPath()"
            fill="none"
            stroke="rgba(42, 74, 106, 0.6)"
            stroke-width="6"
            stroke-linecap="round"
            stroke-dasharray="12 8"
          />

          <!-- Completed path overlay (solid gold) -->
          <path
            :d="buildPath()"
            fill="none"
            stroke="var(--color-primary)"
            stroke-width="6"
            stroke-linecap="round"
            opacity="0.3"
          />

          <!-- Nodes -->
          <g
            v-for="node in svgNodes"
            :key="node.id"
            class="node-group"
            :class="{
              unlocked: node.isUnlocked,
              locked: !node.isUnlocked,
              completed: node.isCompleted,
              current: node.isCurrent,
            }"
            @click="navigateToNode(node)"
            style="cursor: pointer"
          >
            <!-- Glow ring for current node -->
            <circle
              v-if="node.isCurrent"
              :cx="node.px"
              :cy="node.py"
              r="30"
              :fill="node.color"
              opacity="0.15"
              class="pulse-ring"
            />
            <circle
              v-if="node.isCurrent"
              :cx="node.px"
              :cy="node.py"
              r="24"
              :fill="node.color"
              opacity="0.1"
            />

            <!-- Main circle -->
            <circle
              :cx="node.px"
              :cy="node.py"
              r="22"
              :fill="node.isCompleted ? node.color : node.isUnlocked ? 'var(--color-surface)' : 'var(--color-background-mute)'"
              :stroke="node.isUnlocked ? node.color : 'var(--color-border)'"
              stroke-width="3"
              class="node-circle"
            />

            <!-- Icon / lock -->
            <text
              :x="node.px"
              :y="node.py + 1"
              text-anchor="middle"
              dominant-baseline="middle"
              font-size="18"
              class="node-icon"
              :opacity="node.isUnlocked ? 1 : 0.3"
            >
              {{ node.isCompleted ? '✅' : node.isUnlocked ? node.icon : '🔒' }}
            </text>

            <!-- Label bubble -->
            <g class="node-label">
              <!-- Position label on alternating sides -->
              <text
                :x="node.mapX > 0.5 ? node.px - 32 : node.px + 32"
                :y="node.py"
                :text-anchor="node.mapX > 0.5 ? 'end' : 'start'"
                dominant-baseline="middle"
                font-size="11"
                font-weight="700"
                font-family="Nunito, sans-serif"
                :fill="node.isUnlocked ? 'var(--color-heading)' : 'var(--color-text-muted)'"
              >{{ node.title.length > 20 ? node.title.substring(0, 18) + '…' : node.title }}</text>
            </g>
          </g>
        </svg>
      </div>
    </div>
  </div>
</template>

<style scoped>
.journey-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.journey-header {
  padding: 2rem 0 1rem;
  background: var(--color-background);
}

.journey-header h1 {
  font-size: 1.5rem;
  margin-bottom: 0.25rem;
}

.journey-subtitle {
  color: var(--color-text-secondary);
  font-size: 0.95rem;
}

/* Map wrapper */
.journey-map-wrapper {
  flex: 1;
  overflow: auto;
  background:
    radial-gradient(circle at 30% 40%, rgba(255, 203, 0, 0.05) 0%, transparent 50%),
    radial-gradient(circle at 70% 60%, rgba(0, 74, 90, 0.05) 0%, transparent 50%),
    var(--color-background-soft);
}

.map-container {
  display: flex;
  justify-content: center;
  padding: 2rem 0;
  min-height: 800px;
}

.journey-svg {
  overflow: visible;
  max-width: 100%;
}

.node-group.unlocked .node-circle {
  transition: all 0.2s ease;
  filter: drop-shadow(0 0 6px rgba(255,203,0,0.3));
}
.node-group.unlocked:hover .node-circle {
  transform: scale(1.1);
  filter: drop-shadow(0 0 12px rgba(255,203,0,0.6));
}

.node-group.current .node-circle {
  filter: drop-shadow(0 0 10px rgba(255,203,0,0.5));
}

.pulse-ring {
  animation: pulse-svg 2s ease-in-out infinite;
  transform-origin: center;
}

@keyframes pulse-svg {
  0%, 100% { r: 28; opacity: 0.15; }
  50% { r: 34; opacity: 0.08; }
}

.node-icon {
  pointer-events: none;
  user-select: none;
}

/* AutoBattle banner */
.autobattle-banner {
  background: var(--color-secondary);
  padding: 0.75rem 0;
  flex-shrink: 0;
}

.autobattle-banner-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.autobattle-banner-text {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  color: rgba(255,255,255,0.85);
  font-size: 0.875rem;
}

.autobattle-banner-badge {
  background: var(--color-primary);
  color: var(--color-secondary);
  padding: 0.1rem 0.5rem;
  border-radius: var(--radius-full);
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  flex-shrink: 0;
}

.autobattle-banner-text strong {
  color: var(--color-primary);
  font-weight: 700;
}

.autobattle-banner-sub {
  color: rgba(255,255,255,0.7);
}

.autobattle-banner-btn {
  background: var(--color-primary);
  color: var(--color-secondary);
  padding: 0.45rem 1.1rem;
  border-radius: var(--radius-md);
  font-size: 0.85rem;
  font-weight: 700;
  text-decoration: none;
  white-space: nowrap;
  flex-shrink: 0;
  transition: all var(--transition-fast);
}

.autobattle-banner-btn:hover {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
}
</style>
