<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const navItems = [
  { path: '/', label: 'Home', icon: 'home' },
  { path: '/risk-profile', label: 'Risk Profile', icon: 'user-check' },
  { path: '/sandbox', label: 'Sandbox', icon: 'play' },
  { path: '/battle', label: 'Battle', icon: 'swords' },
  { path: '/leaderboard', label: 'Leaderboard', icon: 'trophy' },
]

const currentPath = computed(() => route.path)

function navigate(path: string) {
  router.push(path)
}
</script>

<template>
  <header class="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
    <div class="flex h-14 items-center px-4 lg:px-6">
      <!-- Logo -->
      <button
        class="flex items-center gap-2 mr-6 cursor-pointer hover:opacity-80 transition-opacity"
        @click="navigate('/')"
      >
        <div class="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary">
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
            <polyline points="16 7 22 7 22 13" />
          </svg>
        </div>
        <span class="hidden sm:inline-block font-bold text-sm">
          Wealth Manager <span class="text-primary">Arena</span>
        </span>
      </button>

      <!-- Navigation -->
      <nav class="flex items-center gap-1 flex-1">
        <button
          v-for="item in navItems"
          :key="item.path"
          :class="[
            'px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer',
            currentPath === item.path
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent',
          ]"
          @click="navigate(item.path)"
        >
          {{ item.label }}
        </button>
      </nav>

      <!-- Status -->
      <div class="flex items-center gap-2">
        <div class="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
          <div class="w-2 h-2 rounded-full bg-primary animate-pulse" />
          Prototype
        </div>
      </div>
    </div>
  </header>
</template>
