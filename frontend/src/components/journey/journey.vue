<script setup lang="ts">
// @ts-nocheck
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { BookOpen, HelpCircle, Flag, Swords, Check, Lock, Star } from 'lucide-vue-next'
import { LEVELS, getUnlockedLevelIds } from '@/data/levels'
import { useUserStore } from '@/stores/userStore'

const router = useRouter()
const user = useUserStore()

// Canvas dimensions
const W = 320
const H = 720

// Map levels to pixel positions
const nodes = computed(() => {
  const unlocked = getUnlockedLevelIds(user.completedLevels, user.assessmentScore)
  return LEVELS.map((level) => ({
    ...level,
    px: level.mapX * W,
    py: level.mapY * H,
    isUnlocked: unlocked.includes(level.id),
    isCompleted: user.isLevelCompleted(level.id),
    isCurrent: unlocked.includes(level.id) && !user.isLevelCompleted(level.id),
  }))
})

// Build SVG path connecting all nodes in order
function buildPath(): string {
  const pts = nodes.value.map((n) => ({ x: n.px, y: n.py }))
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

function openLevel(node: (typeof nodes.value)[0]) {
  if (!node.isUnlocked) return
  if (!node.implemented) {
    alert('ðŸš§ Coming soon! This level is still being built.')
    return
  }
  router.push({ name: 'lesson', params: { id: node.id } })
}
</script>

<template>
  <div class="map-container">
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
        stroke="var(--primary)"
        stroke-width="6"
        stroke-linecap="round"
        opacity="0.3"
      />

      <!-- Nodes -->
      <g
        v-for="node in nodes"
        :key="node.id"
        class="node-group"
        :class="{
          unlocked: node.isUnlocked,
          locked: !node.isUnlocked,
          completed: node.isCompleted,
          current: node.isCurrent,
        }"
        @click="openLevel(node)"
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
          :fill="node.isCompleted ? node.color : node.isUnlocked ? 'var(--card-bg)' : '#0D1B2A'"
          :stroke="node.isUnlocked ? node.color : 'var(--card-border)'"
          stroke-width="3"
          class="node-circle"
          :style="{ transformOrigin: `${node.px}px ${node.py}px` }"
        />

        <!-- Icon / lock -->
        <component
          v-if="node.isCompleted"
          :is="Check"
          :x="node.px - 12"
          :y="node.py - 12"
          :size="24"
          color="white"
          class="node-icon-svg"
          :style="{ transformOrigin: `${node.px}px ${node.py}px` }"
        />
        <component
          v-else-if="node.isUnlocked"
          :is="node.icon"
          :x="node.px - 12"
          :y="node.py - 12"
          :size="24"
          color="black"
          class="node-icon-svg"
          :style="{ transformOrigin: `${node.px}px ${node.py}px` }"
        />
        <component
          v-else
          :is="Lock"
          :x="node.px - 12"
          :y="node.py - 12"
          :size="24"
          color="white"
          opacity="0.5"
          class="node-icon-svg"
          :style="{ transformOrigin: `${node.px}px ${node.py}px` }"
        />

        <!-- Label bubble -->
        <g class="node-label">
          <!-- Position label on alternating sides -->
          <text
            :x="node.mapX > 0.5 ? node.px - 32 : node.px + 32"
            :y="node.py - 2"
            :text-anchor="node.mapX > 0.5 ? 'end' : 'start'"
            dominant-baseline="middle"
            font-size="11"
            font-weight="700"
            font-family="Nunito, sans-serif"
            :fill="node.isUnlocked ? 'var(--text)' : 'var(--text-dim)'"
          >{{ node.title.length > 20 ? node.title.substring(0, 18) + 'â€¦' : node.title }}</text>

          <!-- XP label -->
          <component
            :is="Star"
            :x="node.mapX > 0.5 ? node.px - 32 - 12 : node.px + 32 - 12"
            :y="node.py + 4"
            :width="12"
            :height="12"
            :color="node.isUnlocked ? 'var(--primary)' : 'var(--text-dim)'"
          />
          <text
            :x="node.mapX > 0.5 ? node.px - 32 + 4 : node.px + 32 + 4"
            :y="node.py + 12"
            :text-anchor="node.mapX > 0.5 ? 'end' : 'start'"
            dominant-baseline="middle"
            font-size="9"
            font-family="Nunito, sans-serif"
            :fill="node.isUnlocked ? 'var(--primary)' : 'var(--text-dim)'"
          >{{ node.xp }} XP</text>
        </g>

        <!-- Coming soon badge -->
        <g v-if="node.isUnlocked && !node.implemented" class="coming-soon">
          <rect
            :x="node.px - 22"
            :y="node.py + 24"
            width="44"
            height="13"
            rx="6"
            fill="var(--secondary)"
          />
          <text
            :x="node.px"
            :y="node.py + 30"
            text-anchor="middle"
            dominant-baseline="middle"
            font-size="7"
            font-weight="700"
            font-family="Nunito, sans-serif"
            fill="var(--text-muted)"
          >SOON</text>
        </g>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.map-container {
  display: flex;
  justify-content: center;
  padding: 1rem 0;
}

.journey-svg {
  overflow: visible;
  max-width: 100%;
}

.node-group.unlocked .node-circle,
.node-group.unlocked .node-icon-svg {
  transition: transform 0.2s ease, filter 0.2s ease;
}
.node-group.unlocked .node-circle {

}
.node-group.unlocked:hover .node-circle,
.node-group.unlocked:hover .node-icon-svg {
  transform: scale(1.1);
}
.node-group.unlocked:hover .node-circle {
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
</style>

