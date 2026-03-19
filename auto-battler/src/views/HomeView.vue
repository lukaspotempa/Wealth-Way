<template>
  <div class="h-screen w-screen flex flex-col items-center justify-center overflow-hidden relative"
       style="background: var(--color-game-bg);">
    <!-- Animated background grid -->
    <div class="absolute inset-0 opacity-10" style="
      background-image: linear-gradient(var(--color-game-border) 1px, transparent 1px),
                        linear-gradient(90deg, var(--color-game-border) 1px, transparent 1px);
      background-size: 40px 40px;
    "></div>

    <!-- Floating chart lines (decorative) -->
    <svg class="absolute inset-0 w-full h-full opacity-5 pointer-events-none" preserveAspectRatio="none">
      <polyline points="0,400 120,380 200,320 300,350 400,200 500,180 600,240 700,160 800,180 900,120 1000,90 1100,100 1200,60 1400,40"
        fill="none" stroke="#00d4aa" stroke-width="2"/>
      <polyline points="0,450 100,460 250,400 350,420 450,380 550,400 650,350 750,380 850,340 950,360 1050,300 1200,280 1400,260"
        fill="none" stroke="#3b82f6" stroke-width="1.5"/>
    </svg>

    <!-- Content -->
    <div class="relative z-10 flex flex-col items-center gap-10 max-w-3xl w-full px-8">

      <!-- Logo / Title -->
      <div class="text-center">
        <div class="text-xs font-mono tracking-[0.4em] mb-3 uppercase"
             style="color: var(--color-game-accent);">
          BULL vs BEAR EDITION
        </div>
        <h1 class="text-5xl font-bold leading-tight mb-3"
            style="color: var(--color-game-text);">
          Wealth Manager
          <span style="color: var(--color-game-accent);">Arena</span>
        </h1>
        <p class="text-base" style="color: var(--color-game-text-2);">
          Build your portfolio. Watch it battle the market. Learn by doing.
        </p>
      </div>

      <!-- Scenario selector -->
      <div class="w-full">
        <p class="text-xs font-mono mb-3 uppercase tracking-widest" style="color: var(--color-game-text-3);">
          Select Scenario
        </p>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            v-for="s in SCENARIOS"
            :key="s.id"
            @click="selectedScenario = s.id"
            class="text-left p-4 rounded-lg border transition-all duration-200 cursor-pointer"
            :style="{
              background: selectedScenario === s.id ? 'var(--color-game-surface-2)' : 'var(--color-game-surface)',
              borderColor: selectedScenario === s.id ? 'var(--color-game-accent)' : 'var(--color-game-border)',
              boxShadow: selectedScenario === s.id ? '0 0 20px var(--color-game-accent-dim)' : 'none',
            }"
          >
            <div class="flex justify-between items-start mb-1">
              <span class="text-sm font-semibold" style="color: var(--color-game-text);">{{ s.name }}</span>
              <span class="text-xs font-mono px-2 py-0.5 rounded"
                    style="background: var(--color-game-border); color: var(--color-game-text-2);">
                {{ s.tagline }}
              </span>
            </div>
            <p class="text-xs leading-relaxed" style="color: var(--color-game-text-2);">{{ s.description }}</p>
            <div class="mt-2 text-xs font-mono" style="color: var(--color-game-text-3);">
              {{ s.years.length }} rounds · Real historical data
            </div>
          </button>
        </div>
      </div>

      <!-- Mode buttons -->
      <div class="flex gap-4 w-full">
        <button
          @click="startCampaign"
          class="flex-1 py-4 rounded-lg font-semibold text-base transition-all duration-200 cursor-pointer"
          style="background: var(--color-game-accent); color: #0a0e1a;"
          :class="{ 'opacity-50 cursor-not-allowed': !selectedScenario }"
        >
          ▶ Campaign Mode
        </button>
        <button
          disabled
          class="flex-1 py-4 rounded-lg font-semibold text-base opacity-40 cursor-not-allowed border"
          style="border-color: var(--color-game-border); color: var(--color-game-text-2);"
        >
          ⚔ Battle Mode
          <span class="block text-xs font-normal mt-0.5" style="color: var(--color-game-text-3);">
            Coming Soon
          </span>
        </button>
      </div>

      <!-- Data notice -->
      <p class="text-xs text-center" style="color: var(--color-game-text-3);">
        Uses real market data 2006–2025 · Educational purposes only · Not financial advice
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { SCENARIOS } from '@/utils/scenarios'
import { useGameStore } from '@/stores/gameStore'

const router = useRouter()
const game = useGameStore()

const selectedScenario = ref<string>(SCENARIOS[0]?.id ?? '')

function startCampaign() {
  if (!selectedScenario.value) return
  game.selectScenario(selectedScenario.value)
  game.initGame()
  router.push('/game')
}
</script>
