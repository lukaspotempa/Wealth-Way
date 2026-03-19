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

// Generate isometric positions for the winding path
function getIsometricPosition(node: JourneyNode, index: number) {
  // Create a winding S-curve path
  const segmentWidth = 180
  const segmentHeight = 120
  const amplitude = 140

  const x = index * segmentWidth
  const wave = Math.sin(index * 0.8) * amplitude
  const y = wave + segmentHeight

  // Convert to isometric projection
  const isoX = (x - y) * 0.7
  const isoY = (x + y) * 0.35

  return {
    left: `${isoX + 600}px`,
    top: `${isoY + 50}px`,
  }
}

// SVG path connector between nodes
const pathSegments = computed(() => {
  const nodes = journeyStore.nodes
  const segments: { x1: number; y1: number; x2: number; y2: number; completed: boolean }[] = []

  for (let i = 0; i < nodes.length - 1; i++) {
    const segmentWidth = 180
    const segmentHeight = 120
    const amplitude = 140

    const x1Raw = i * segmentWidth
    const wave1 = Math.sin(i * 0.8) * amplitude
    const y1Raw = wave1 + segmentHeight

    const x2Raw = (i + 1) * segmentWidth
    const wave2 = Math.sin((i + 1) * 0.8) * amplitude
    const y2Raw = wave2 + segmentHeight

    const isoX1 = (x1Raw - y1Raw) * 0.7 + 600 + 40
    const isoY1 = (x1Raw + y1Raw) * 0.35 + 50 + 40
    const isoX2 = (x2Raw - y2Raw) * 0.7 + 600 + 40
    const isoY2 = (x2Raw + y2Raw) * 0.35 + 50 + 40

    segments.push({
      x1: isoX1,
      y1: isoY1,
      x2: isoX2,
      y2: isoY2,
      completed: nodes[i]!.status === 'completed',
    })
  }

  return segments
})

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
          <strong>AutoBattle Mode</strong>
          <span class="autobattle-banner-sub">
            Build a real portfolio and battle 24 years of historical market data.
            Learn why Sharpe Ratio beats raw return.
          </span>
        </div>
        <router-link to="/autobattle" class="autobattle-banner-btn">
          Play AutoBattle &#8594;
        </router-link>
      </div>
    </div>

    <div class="journey-map-wrapper">
      <div ref="mapContainer" class="journey-map" :class="{ 'journey-map--loaded': isLoaded }">
        <!-- Isometric grid background -->
        <div class="iso-grid" />

        <!-- Path connectors (SVG) -->
        <svg class="path-svg" width="2000" height="900">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <line
            v-for="(seg, i) in pathSegments"
            :key="'path-' + i"
            :x1="seg.x1"
            :y1="seg.y1"
            :x2="seg.x2"
            :y2="seg.y2"
            :stroke="seg.completed ? 'var(--color-primary)' : 'var(--color-border)'"
            stroke-width="4"
            stroke-dasharray="8,6"
            :stroke-opacity="seg.completed ? 1 : 0.4"
            stroke-linecap="round"
          />
        </svg>

        <!-- Nodes -->
        <div
          v-for="(node, index) in journeyStore.nodes"
          :key="node.id"
          class="journey-node"
          :class="[
            `journey-node--${node.status}`,
            `journey-node--${node.type}`,
          ]"
          :style="{
            ...getIsometricPosition(node, index),
            transitionDelay: `${index * 80}ms`,
          }"
          @click="navigateToNode(node)"
        >
          <!-- 3D platform base -->
          <div class="node-platform">
            <div class="node-platform-top" :style="{ borderColor: nodeTypeColors[node.type] }" />
            <div class="node-platform-left" />
            <div class="node-platform-right" />
          </div>

          <!-- Node content -->
          <div class="node-content">
            <span class="node-icon">{{ nodeTypeIcons[node.type] }}</span>
            <div class="node-status-indicator" v-if="node.status === 'completed'">&#10003;</div>
            <div class="node-lock" v-if="node.status === 'locked'">&#128274;</div>
          </div>

          <!-- Label -->
          <div class="node-label">
            <span class="node-title">{{ node.title }}</span>
            <span class="node-type-badge">{{ node.type }}</span>
          </div>
        </div>
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

.journey-map {
  position: relative;
  min-width: 1800px;
  min-height: 800px;
  padding: 2rem;
}

/* Isometric grid */
.iso-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(30deg, var(--color-border) 1px, transparent 1px),
    linear-gradient(150deg, var(--color-border) 1px, transparent 1px);
  background-size: 60px 60px;
  opacity: 0.15;
  pointer-events: none;
}

/* Path SVG */
.path-svg {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 1;
}

/* Journey Node */
.journey-node {
  position: absolute;
  width: 80px;
  height: 80px;
  cursor: pointer;
  z-index: 2;
  transition: all 0.3s ease;
  opacity: 0;
  transform: translateY(20px);
}

.journey-map--loaded .journey-node {
  opacity: 1;
  transform: translateY(0);
}

.journey-node:hover:not(.journey-node--locked) {
  transform: translateY(-8px) scale(1.05);
  z-index: 10;
}

.journey-node--locked {
  cursor: not-allowed;
  opacity: 0.5;
  filter: grayscale(0.6);
}

.journey-map--loaded .journey-node--locked {
  opacity: 0.5;
}

/* 3D Platform */
.node-platform {
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 70px;
  height: 20px;
}

.node-platform-top {
  width: 70px;
  height: 10px;
  background: var(--color-background-mute);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-sm);
  transform: rotateX(60deg);
}

.node-platform-left,
.node-platform-right {
  position: absolute;
  bottom: -6px;
  width: 35px;
  height: 8px;
  background: var(--color-border);
}

.node-platform-left {
  left: 0;
  border-radius: 0 0 0 var(--radius-sm);
  transform: skewY(-8deg);
}

.node-platform-right {
  right: 0;
  border-radius: 0 0 var(--radius-sm) 0;
  transform: skewY(8deg);
}

/* Node content */
.node-content {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-surface-elevated);
  border: 3px solid var(--color-border);
  box-shadow: var(--shadow-lg);
  transition: all var(--transition-fast);
}

.journey-node--available .node-content {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px rgba(255, 203, 0, 0.2), var(--shadow-lg);
  animation: pulse 2s infinite;
}

.journey-node--completed .node-content {
  border-color: var(--color-success);
  background: var(--color-success-light);
}

.node-icon {
  font-size: 1.75rem;
}

.node-status-indicator {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 24px;
  height: 24px;
  background: var(--color-success);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  border: 2px solid var(--color-surface);
}

.node-lock {
  position: absolute;
  top: -4px;
  right: -4px;
  font-size: 1rem;
}

/* Node label */
.node-label {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 16px;
  text-align: center;
  white-space: nowrap;
  pointer-events: none;
}

.node-title {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-heading);
}

.node-type-badge {
  display: inline-block;
  margin-top: 0.2rem;
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
  background: var(--color-background-mute);
  padding: 0.1rem 0.5rem;
  border-radius: var(--radius-full);
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

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 0 4px rgba(255, 203, 0, 0.2), var(--shadow-lg);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(255, 203, 0, 0.1), var(--shadow-lg);
  }
}
</style>
