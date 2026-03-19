<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'

interface Props {
  modelValue: number
  min?: number
  max?: number
  step?: number
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  min: 0,
  max: 100,
  step: 1,
  class: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const percentage = computed(() =>
  ((props.modelValue - props.min) / (props.max - props.min)) * 100,
)

function onInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', Number(target.value))
}
</script>

<template>
  <div :class="cn('relative flex w-full touch-none select-none items-center', props.class)">
    <div class="relative h-1.5 w-full grow overflow-hidden rounded-full bg-secondary">
      <div class="absolute h-full bg-primary rounded-full" :style="{ width: `${percentage}%` }" />
    </div>
    <input
      type="range"
      :min="min"
      :max="max"
      :step="step"
      :value="modelValue"
      class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      @input="onInput"
    />
    <div
      class="absolute h-4 w-4 rounded-full border-2 border-primary bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      :style="{ left: `calc(${percentage}% - 8px)` }"
    />
  </div>
</template>
