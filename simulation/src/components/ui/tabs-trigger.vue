<script setup lang="ts">
import { inject, computed, type Ref } from 'vue'
import { cn } from '@/lib/utils'

interface Props {
  value: string
  class?: string
}

const props = withDefaults(defineProps<Props>(), { class: '' })

const tabs = inject<{ activeTab: Ref<string>; setActiveTab: (v: string) => void }>('tabs')!

const isActive = computed(() => tabs.activeTab.value === props.value)
</script>

<template>
  <button
    :class="cn(
      'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
      isActive
        ? 'bg-background text-foreground shadow'
        : 'text-muted-foreground hover:text-foreground',
      props.class,
    )"
    @click="tabs.setActiveTab(value)"
  >
    <slot />
  </button>
</template>
