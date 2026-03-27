<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useTheme } from '@/composables/useTheme'
import { useDisclaimer } from '@/composables/useDisclaimer'
import AppHeader from '@/components/ui/AppHeader.vue'

const { initTheme } = useTheme()
const { disclaimerAccepted, accept } = useDisclaimer()

const showDisclaimer = computed(() => !disclaimerAccepted.value)

onMounted(() => {
  initTheme()
})
</script>

<template>
  <transition name="disclaimer-fade">
    <div v-if="showDisclaimer" class="disclaimer-overlay">
      <div class="disclaimer-card">
        <div class="disclaimer-badge">START Hack 2026</div>
        <img src="/bull_default.png" alt="Barry the Bull" class="disclaimer-barry" />
        <h1 class="disclaimer-title">The Wealthy Way</h1>
        <p class="disclaimer-subtitle">The Duolingo of Financial Literacy</p>
        <div class="disclaimer-divider" />
        <div class="disclaimer-notice">
          <span class="disclaimer-icon">⚠️</span>
          <div>
            <p>
            This app is a <strong>student project</strong> created at START Hack 2026.
            Nothing on this platform constitutes financial advice, an investment
            recommendation, or a solicitation to buy or sell any asset.
            Historical market data is shown for <strong>illustrative purposes only</strong>
            and does not guarantee future results. Do not make real investment decisions based on this app.
          </p>
          <p style="margin-top: 0.6rem;">
            There is no guraentee for accuracy of data or results.
            This app is provided <strong>"as is"</strong>,
            without warranty of any kind, expressed or implied.
          </p>
          </div>
        </div>
        <button class="disclaimer-btn" @click="accept">
          I understand
        </button>
      </div>
    </div>
  </transition>

  <AppHeader />
  <main class="app-main">
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </main>
</template>

<style scoped>
.disclaimer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1.5rem;
}

.disclaimer-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  padding: 2.5rem 2rem;
  max-width: 440px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.3);
  text-align: center;
}

.disclaimer-badge {
  background: var(--color-primary);
  color: var(--color-secondary);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 0.35rem 0.9rem;
  border-radius: 999px;
}

.disclaimer-barry {
  width: 90px;
  height: auto;
  filter: drop-shadow(0 6px 14px rgba(0, 0, 0, 0.15));
}

.disclaimer-title {
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--color-heading);
  margin: 0;
}

.disclaimer-subtitle {
  font-size: 0.95rem;
  color: var(--color-text-secondary);
  margin: -0.5rem 0 0;
}

.disclaimer-divider {
  width: 100%;
  height: 1px;
  background: var(--color-border);
}

.disclaimer-notice {
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1rem 1.25rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  text-align: left;
}

.disclaimer-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
  margin-top: 1px;
}

.disclaimer-notice p {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin: 0;
}

.disclaimer-notice strong {
  color: var(--color-text);
}

.disclaimer-btn {
  width: 100%;
  padding: 0.85rem 1.5rem;
  background: var(--color-primary);
  color: var(--color-secondary);
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease;
  margin-top: 0.25rem;
}

.disclaimer-btn:hover {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(255, 203, 0, 0.35);
}

.disclaimer-fade-enter-active,
.disclaimer-fade-leave-active {
  transition: opacity 0.4s ease;
}
.disclaimer-fade-enter-from,
.disclaimer-fade-leave-to {
  opacity: 0;
}

.app-main {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
