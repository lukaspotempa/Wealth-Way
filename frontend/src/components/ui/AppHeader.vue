<script setup lang="ts">
import { useTheme } from '@/composables/useTheme'
import { useUserStore } from '@/stores/user'
import { useJourneyStore } from '@/stores/journey'
import { useRoute } from 'vue-router'
import { computed } from 'vue'

const { isDark, toggleTheme } = useTheme()
const userStore = useUserStore()
const journeyStore = useJourneyStore()
const route = useRoute()

const showProgress = computed(() => {
  return userStore.profile.onboardingComplete && route.name !== 'onboarding'
})
</script>

<template>
  <header class="app-header">
    <div class="header-inner">
      <router-link to="/" class="logo">
        <span class="logo-icon">$</span>
        <span class="logo-text">Finance Journey</span>
      </router-link>

      <div class="header-right">
        <!-- AutoBattle shortcut — visible once onboarding is complete -->
        <router-link
          v-if="showProgress"
          to="/autobattle"
          class="autobattle-link"
          title="Open AutoBattle Portfolio Mode"
          style="user-select: none;"
        >
          <span class="autobattle-link-icon">&#9876;</span>
          <span class="autobattle-link-text">AutoBattle</span>
        </router-link>

        <div v-if="showProgress" class="progress-badge">
          <div class="progress-bar-mini">
            <div
              class="progress-bar-fill"
              :style="{ width: journeyStore.progressPercent + '%' }"
            />
          </div>
          <span class="progress-label">{{ journeyStore.progressPercent }}%</span>
        </div>

        <button
          class="theme-toggle"
          :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
          @click="toggleTheme"
        >
          <span v-if="isDark" class="theme-icon">&#9728;</span>
          <span v-else class="theme-icon">&#9790;</span>
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 100;
  transition: background var(--transition-slow), border-color var(--transition-slow);
}

.header-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0.75rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  color: var(--color-heading);
  font-weight: 700;
  font-size: 1.125rem;
}

.logo:hover {
  color: var(--color-heading);
}

.logo-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: var(--color-primary);
  color: var(--color-secondary);
  border-radius: var(--radius-md);
  font-weight: 800;
  font-size: 1.25rem;
}

.logo-text {
  color: var(--color-heading);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.progress-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.progress-bar-mini {
  width: 80px;
  height: 6px;
  background: var(--color-background-mute);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: var(--radius-full);
  transition: width var(--transition-base);
}

.progress-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.autobattle-link {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.8rem;
  background: var(--color-secondary);
  color: var(--color-primary) !important;
  border-radius: var(--radius-md);
  font-size: 0.8rem;
  font-weight: 700;
  text-decoration: none;
  transition: all var(--transition-fast);
  white-space: nowrap;
}

.autobattle-link:hover {
  background: var(--color-secondary-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.autobattle-link-icon {
  font-size: 1rem;
  line-height: 1;
}

.autobattle-link-text {
  letter-spacing: 0.02em;
}

@media (max-width: 480px) {
  .autobattle-link-text {
    display: none;
  }
}

.theme-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: var(--color-background-mute);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.theme-toggle:hover {
  background: var(--color-background-soft);
  border-color: var(--color-border-hover);
}

.theme-icon {
  font-size: 1.25rem;
}
</style>
