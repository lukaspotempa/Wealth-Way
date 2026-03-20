<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  text: {
    type: String,
    required: true
  },
  time: {
    type: Number,
    required: true
  },
  id: {
    type: String,
    required: false
  }
})

const isVisible = ref(false)
let timer: ReturnType<typeof setTimeout> | null = null

onMounted(() => {
  if (props.id) {
    const hasSeen = localStorage.getItem(`barry_tip_${props.id}`)
    if (hasSeen) return
    localStorage.setItem(`barry_tip_${props.id}`, 'true')
  }

  isVisible.value = true
  if (props.time > 0) {
    timer = setTimeout(() => {
      isVisible.value = false
    }, props.time * 1000)
  }
})

onUnmounted(() => {
  if (timer) clearTimeout(timer)
})
</script>

<template>
  <transition name="slide-up">
    <div v-if="isVisible" class="barry-container">
      <div class="speech-bubble">
        {{ text }}
      </div>
      <img src="/bull_default.png" alt="Barry the Bull" class="barry-img" />
    </div>
  </transition>
</template>

<style scoped>
.barry-container {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  z-index: 1000;
  pointer-events: none;
}

.speech-bubble {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 0.5rem;
  max-width: 250px;
  text-align: center;
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--color-heading);
  box-shadow: var(--shadow-md);
  position: relative;
  pointer-events: auto;
}

.speech-bubble::before {
  content: '';
  position: absolute;
  bottom: -8px;
  right: 40px;
  border-width: 8px 8px 0;
  border-style: solid;
  border-color: var(--color-surface) transparent transparent transparent;
  z-index: 2;
}

.speech-bubble::after {
  content: '';
  position: absolute;
  bottom: -9px;
  right: 39px;
  border-width: 9px 9px 0;
  border-style: solid;
  border-color: var(--color-border) transparent transparent transparent;
  z-index: 1;
}

.barry-img {
  width: 120px;
  height: auto;
  filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.15));
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(100px) scale(0.9);
}
</style>