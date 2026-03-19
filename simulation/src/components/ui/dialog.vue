<script setup lang="ts">
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  class?: string
}

const props = withDefaults(defineProps<Props>(), { class: '' })

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
      <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="fixed inset-0 bg-black/80" @click="close" />
        <div
          :class="cn(
            'relative z-50 w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-lg',
            props.class,
          )"
        >
          <slot />
          <button
            class="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 transition-opacity text-muted-foreground cursor-pointer"
            @click="close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
