<script setup lang="ts">
/**
 * SharpeRatioBadge
 *
 * Displays the current Sharpe Ratio with:
 * - A color-coded badge (red → green spectrum)
 * - A horizontal gauge bar
 * - A label indicating quality band (Very Poor → Excellent)
 * - A tooltip description explaining what the ratio means
 */
import { ref, computed } from 'vue'
import { useSharpeRatio, SHARPE_BANDS } from '@/composables/useSharpeRatio'
import { useTheme } from '@/composables/useTheme'

interface Props {
  sharpe: number | null
  animated?: boolean
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  animated: true,
  compact: false,
})

const { isDark } = useTheme()
const sharpeRef = computed(() => props.sharpe)
const { color, bgColor, label, description, gaugeProgress, gaugeColor, formatted } =
  useSharpeRatio(sharpeRef, isDark)

const showTooltip = ref(false)

// Gauge width with a minimum pip for visibility
const gaugeWidth = computed(() => {
  const p = gaugeProgress.value
  return `${Math.max(p * 100, 2)}%`
})

// Reference lines for the gauge (visual guides)
const bands = SHARPE_BANDS
</script>

<template>
  <div
    class="sharpe-badge"
    :class="{ 'sharpe-badge--compact': compact, 'sharpe-badge--animated': animated }"
    :style="{ '--sharpe-color': color, '--sharpe-bg': bgColor }"
    @mouseenter="showTooltip = true"
    @mouseleave="showTooltip = false"
    @focusin="showTooltip = true"
    @focusout="showTooltip = false"
    tabindex="0"
    role="status"
    :aria-label="`Sharpe Ratio: ${formatted} — ${label}`"
  >
    <!-- Header row -->
    <div class="sharpe-header">
      <span class="sharpe-title">Sharpe Ratio</span>
      <div class="sharpe-value-row">
        <span class="sharpe-value" :style="{ color }">{{ formatted }}</span>
        <span class="sharpe-label" :style="{ color, background: bgColor }">{{ label }}</span>
      </div>
    </div>

    <!-- Gauge bar -->
    <div class="sharpe-gauge" aria-hidden="true">
      <!-- Band reference lines -->
      <div
        v-for="(band, i) in bands"
        :key="i"
        class="gauge-band-line"
        :style="{ left: `${((band.min === -Infinity ? -1 : band.min) + 1) / 4 * 100}%` }"
      />

      <!-- Fill bar -->
      <div
        class="sharpe-gauge-track"
        :class="{ 'sharpe-gauge-track--animated': animated }"
      >
        <div
          class="sharpe-gauge-fill"
          :style="{ width: gaugeWidth, background: `linear-gradient(90deg, #dc2626, ${gaugeColor})` }"
        />
        <!-- Current value marker -->
        <div
          class="sharpe-gauge-marker"
          :style="{ left: gaugeWidth, background: gaugeColor }"
        />
      </div>

      <!-- Scale labels -->
      <div class="gauge-scale" aria-hidden="true">
        <span>&lt;0</span>
        <span>0.5</span>
        <span>1.0</span>
        <span>1.5</span>
        <span>2.0+</span>
      </div>
    </div>

    <!-- Tooltip -->
    <Transition name="tooltip">
      <div v-if="showTooltip && !compact" class="sharpe-tooltip" role="tooltip">
        <p class="tooltip-title">What is the Sharpe Ratio?</p>
        <p class="tooltip-formula">
          Sharpe = (Portfolio Return &minus; Risk-Free Rate) / Volatility
        </p>
        <p class="tooltip-desc">{{ description }}</p>
        <div class="tooltip-bands">
          <div
            v-for="band in SHARPE_BANDS"
            :key="band.label"
            class="tooltip-band-row"
          >
            <span class="tooltip-band-dot" :style="{ background: band.color }" />
            <span class="tooltip-band-range">
              {{ band.min === -Infinity ? '&lt; 0' : band.min }}
              {{ band.max === Infinity ? '+' : `– ${band.max}` }}
            </span>
            <span class="tooltip-band-label" :style="{ color: band.color }">{{ band.label }}</span>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.sharpe-badge {
  position: relative;
  background: var(--sharpe-bg, var(--color-background-mute));
  border: 2px solid var(--color-primary);
  border-radius: var(--radius-lg);
  padding: 1rem 1.25rem;
  transition:
    border-color var(--transition-base),
    background var(--transition-base);
  cursor: help;
}

.sharpe-badge--compact {
  padding: 0.6rem 0.9rem;
}

.sharpe-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}

.sharpe-title {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--color-text-secondary);
}

.sharpe-value-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.sharpe-value {
  font-size: 1.6rem;
  font-weight: 800;
  line-height: 1;
  transition: color var(--transition-base);
  font-variant-numeric: tabular-nums;
}

.sharpe-badge--compact .sharpe-value {
  font-size: 1.2rem;
}

.sharpe-label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  padding: 0.2rem 0.6rem;
  border-radius: var(--radius-full);
  transition:
    color var(--transition-base),
    background var(--transition-base);
}

/* Gauge */
.sharpe-gauge {
  position: relative;
}

.sharpe-gauge-track {
  height: 10px;
  background: var(--color-border);
  border-radius: var(--radius-full);
  overflow: visible;
  position: relative;
  margin-bottom: 0.35rem;
}

.sharpe-gauge-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
}

.sharpe-gauge-track--animated .sharpe-gauge-fill {
  transition: width 1.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.sharpe-gauge-marker {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2.5px solid var(--color-surface);
  box-shadow: var(--shadow-md);
  transition: left 1.2s cubic-bezier(0.34, 1.56, 0.64, 1), background var(--transition-base);
  z-index: 2;
}

.gauge-band-line {
  position: absolute;
  top: 0;
  width: 1px;
  height: 10px;
  background: var(--color-surface);
  opacity: 0.5;
  z-index: 1;
  pointer-events: none;
}

.gauge-scale {
  display: flex;
  justify-content: space-between;
  font-size: 0.65rem;
  color: var(--color-text-muted);
  margin-top: 0.2rem;
  font-variant-numeric: tabular-nums;
}

/* Tooltip */
.sharpe-tooltip {
  position: absolute;
  bottom: calc(100% + 12px);
  left: 50%;
  transform: translateX(-50%);
  width: 320px;
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1rem;
  box-shadow: var(--shadow-xl);
  z-index: 100;
  pointer-events: none;
}

.tooltip-title {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--color-heading);
  margin-bottom: 0.35rem;
}

.tooltip-formula {
  font-size: 0.72rem;
  color: var(--color-text-secondary);
  font-family: monospace;
  background: var(--color-background-mute);
  padding: 0.35rem 0.6rem;
  border-radius: var(--radius-sm);
  margin-bottom: 0.5rem;
}

.tooltip-desc {
  font-size: 0.78rem;
  color: var(--color-text);
  line-height: 1.5;
  margin-bottom: 0.75rem;
}

.tooltip-bands {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  border-top: 1px solid var(--color-border);
  padding-top: 0.5rem;
}

.tooltip-band-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tooltip-band-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.tooltip-band-range {
  font-size: 0.7rem;
  color: var(--color-text-muted);
  min-width: 60px;
  font-variant-numeric: tabular-nums;
}

.tooltip-band-label {
  font-size: 0.7rem;
  font-weight: 700;
}

/* Tooltip transition */
.tooltip-enter-active,
.tooltip-leave-active {
  transition:
    opacity var(--transition-fast),
    transform var(--transition-fast);
}

.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(4px);
}
</style>
