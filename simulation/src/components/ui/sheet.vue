<script setup lang="ts">
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  side?: 'left' | 'right'
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  side: 'right',
  class: '',
})

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

function close() {
  emit('update:open', false)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="open" class="fixed inset-0 z-50">
        <div class="fixed inset-0 bg-black/80" @click="close" />
        <div
          :class="cn(
            'fixed inset-y-0 z-50 w-80 border-border bg-card p-6 shadow-lg transition-transform overflow-y-auto',
            side === 'right' ? 'right-0 border-l' : 'left-0 border-r',
            props.class,
          )"
        >
          <button
            class="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 transition-opacity text-muted-foreground cursor-pointer"
            @click="close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
