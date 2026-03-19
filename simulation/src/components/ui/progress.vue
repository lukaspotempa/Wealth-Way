<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'

interface Props {
  value?: number
  max?: number
  class?: string
  indicatorClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  value: 0,
  max: 100,
  class: '',
  indicatorClass: '',
})

const percentage = computed(() => Math.min(100, Math.max(0, (props.value / props.max) * 100)))
</script>

<template>
  <div :class="cn('relative h-2 w-full overflow-hidden rounded-full bg-secondary', props.class)">
    <div
      :class="cn('h-full rounded-full bg-primary transition-all duration-500 ease-out', indicatorClass)"
      :style="{ width: `${percentage}%` }"
    />
  </div>
</template>
