<script setup lang="ts">
import { ref } from 'vue'
import { cn } from '@/lib/utils'

interface Props {
  content: string
  class?: string
}

const props = withDefaults(defineProps<Props>(), { class: '' })

const show = ref(false)
</script>

<template>
  <div
    class="relative inline-flex"
    @mouseenter="show = true"
    @mouseleave="show = false"
  >
    <slot />
    <Transition name="fade">
      <div
        v-if="show"
        :class="cn(
          'absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 rounded-md bg-popover px-3 py-1.5 text-xs text-popover-foreground border border-border shadow-md whitespace-nowrap',
          props.class,
        )"
      >
        {{ content }}
      </div>
    </Transition>
  </div>
</template>
