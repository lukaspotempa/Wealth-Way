<script setup lang="ts">
import { Card, CardContent, Badge, Button } from '@/components/ui'
import type { MarketEvent } from '@/data/events'

interface Props {
  event: MarketEvent
}

defineProps<Props>()

const emit = defineEmits<{
  dismiss: []
}>()

const severityStyles = {
  positive: {
    border: 'border-green-500/50',
    bg: 'bg-green-500/10',
    badge: 'bg-green-500/20 text-green-400',
    icon: 'text-green-400',
  },
  negative: {
    border: 'border-red-500/50',
    bg: 'bg-red-500/10',
    badge: 'bg-red-500/20 text-red-400',
    icon: 'text-red-400',
  },
  neutral: {
    border: 'border-yellow-500/50',
    bg: 'bg-yellow-500/10',
    badge: 'bg-yellow-500/20 text-yellow-400',
    icon: 'text-yellow-400',
  },
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" @click.self="emit('dismiss')">
    <Card :class="`max-w-md w-full border-2 animate-in fade-in zoom-in duration-300 ${severityStyles[event.severity].border}`">
      <CardContent class="p-6">
        <!-- Header -->
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center gap-3">
            <div :class="['w-10 h-10 rounded-lg flex items-center justify-center', severityStyles[event.severity].bg]">
              <svg v-if="event.severity === 'positive'" :class="severityStyles[event.severity].icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" />
              </svg>
              <svg v-else-if="event.severity === 'negative'" :class="severityStyles[event.severity].icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" /><polyline points="16 17 22 17 22 11" />
              </svg>
              <svg v-else :class="severityStyles[event.severity].icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" />
              </svg>
            </div>
            <div>
              <h3 class="font-bold text-lg">{{ event.title }}</h3>
              <Badge :class="severityStyles[event.severity].badge" class="text-xs mt-1">
                {{ event.severity === 'positive' ? 'Bullish' : event.severity === 'negative' ? 'Bearish' : 'Mixed' }}
              </Badge>
            </div>
          </div>
        </div>

        <!-- Description -->
        <p class="text-sm text-muted-foreground mb-4">{{ event.description }}</p>

        <!-- Educational Tip -->
        <div class="rounded-lg bg-primary/5 border border-primary/20 p-3 mb-4">
          <div class="flex items-center gap-2 mb-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary">
              <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
            </svg>
            <span class="text-xs font-semibold text-primary">Learning Moment</span>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed">{{ event.educationalTip }}</p>
        </div>

        <Button class="w-full" @click="emit('dismiss')">
          Continue Simulation
        </Button>
      </CardContent>
    </Card>
  </div>
</template>
