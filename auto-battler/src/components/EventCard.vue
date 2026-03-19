<template>
  <Transition name="event">
    <div v-if="event"
         class="absolute top-4 left-1/2 -translate-x-1/2 z-40 rounded-lg border px-5 py-3 max-w-sm w-full mx-auto text-sm shadow-xl"
         :style="{
           background: severityColors[event.severity]?.bg,
           borderColor: severityColors[event.severity]?.border,
         }">
      <div class="flex items-start gap-3">
        <span class="text-lg flex-shrink-0">{{ severityIcons[event.severity] }}</span>
        <div>
          <div class="font-semibold mb-0.5" :style="{ color: severityColors[event.severity]?.title }">
            {{ event.title }}
          </div>
          <div class="text-xs leading-relaxed" style="color: var(--color-game-text-2);">
            {{ event.body }}
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import type { MarketEvent } from '@/utils/scenarios'

defineProps<{ event: MarketEvent | null }>()

const severityColors: Record<string, { bg: string; border: string; title: string }> = {
  info:     { bg: 'rgba(15,22,41,0.96)',       border: '#1e2d4a',  title: '#e8eaf0' },
  warning:  { bg: 'rgba(251,191,36,0.12)',      border: '#fbbf2477', title: '#fbbf24' },
  crash:    { bg: 'rgba(255,71,87,0.12)',        border: '#ff475777', title: '#ff4757' },
  recovery: { bg: 'rgba(0,212,170,0.12)',        border: '#00d4aa77', title: '#00d4aa' },
}

const severityIcons: Record<string, string> = {
  info: 'ℹ️',
  warning: '⚠️',
  crash: '📉',
  recovery: '📈',
}
</script>

<style scoped>
.event-enter-active { animation: slide-in 0.3s ease-out; }
.event-leave-active { animation: slide-out 0.25s ease-in forwards; }
@keyframes slide-in  { from { transform: translateX(-50%) translateY(-16px); opacity: 0; } to { transform: translateX(-50%) translateY(0); opacity: 1; } }
@keyframes slide-out { from { opacity: 1; } to { opacity: 0; transform: translateX(-50%) translateY(-8px); } }
</style>
