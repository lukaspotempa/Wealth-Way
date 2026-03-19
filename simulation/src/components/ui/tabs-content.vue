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
  <div
    v-if="isActive"
    :class="cn(
      'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      props.class,
    )"
  >
    <slot />
  </div>
</template>
