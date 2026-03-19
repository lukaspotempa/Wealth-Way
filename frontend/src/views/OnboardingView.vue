<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import type { AgeGroup, ExperienceLevel, FinancialGoal } from '@/types'

const router = useRouter()
const userStore = useUserStore()

const currentStep = ref(1)
const totalSteps = 3

const showIntro = ref(true)
const isMovingDown = ref(false)
const showSpeech = ref(false)

onMounted(() => {
  // Wait a moment before showing the speech bubble
  setTimeout(() => {
    showSpeech.value = true
  }, 500)

  // Fade out both Barry and his speech bubble simultaneously
  setTimeout(() => {
    showIntro.value = false
    showSpeech.value = false
  }, 3500)
})

const progress = computed(() => (currentStep.value / totalSteps) * 100)

// Step 1 - Age Group
const ageOptions: { value: AgeGroup; label: string; range: string; description: string }[] = [
  {
    value: 'junior',
    label: 'Junior',
    range: '5 - 14',
    description: 'School days, pocket money, first savings goals, learning the basics of numbers and value',
  },
  {
    value: 'adolescent',
    label: 'Adolescent',
    range: '15 - 24',
    description: 'First jobs, apprenticeships or studies, building financial independence, navigating big life choices',
  },
  {
    value: 'grown-up',
    label: 'Grown Up',
    range: '25 - 54',
    description: 'Fixed income, finished studies, career building, family planning, mortgages and long-term investing',
  },
  {
    value: 'senior',
    label: 'Senior',
    range: '55+',
    description: 'Retirement planning, wealth preservation, passing on knowledge, pension optimization',
  },
]

// Step 2 - Experience Level
const experienceOptions: { value: ExperienceLevel; label: string; quote: string; description: string }[] = [
  {
    value: 'beginner',
    label: 'Beginner',
    quote: 'My money is still under my pillow',
    description: 'Just starting out or keeping it safe at home.',
  },
  {
    value: 'intermediate',
    label: 'Intermediate',
    quote: "I've dipped my toes in the market",
    description: 'Some experience, juggling stocks, ETFs, or crypto.',
  },
  {
    value: 'advanced',
    label: 'Advanced',
    quote: 'I make my money work overtime',
    description: 'Seasoned investor, confident in portfolio management.',
  },
]

// Step 3 - Financial Goal
const goalOptions: { value: FinancialGoal; label: string; icon: string; estimate: string }[] = [
  { value: 'gaming-pc', label: 'Gaming PC', icon: '🖥️', estimate: '~CHF 2,000' },
  { value: 'bicycle', label: 'Bicycle', icon: '🚲', estimate: '~CHF 3,000' },
  { value: 'car', label: 'Car', icon: '🚗', estimate: '~CHF 25,000' },
  { value: 'house', label: 'House', icon: '🏠', estimate: '~CHF 800,000' },
  { value: 'vacation', label: 'Vacation', icon: '✈️', estimate: '~CHF 5,000' },
  { value: 'early-retirement', label: 'Early Retirement', icon: '🏖️', estimate: '~CHF 1,000,000+' },
  { value: 'start-business', label: 'Start a Business', icon: '💼', estimate: '~CHF 50,000+' },
]

const selectedAge = ref<AgeGroup | null>(null)
const selectedExperience = ref<ExperienceLevel | null>(null)
const selectedGoal = ref<FinancialGoal | null>(null)

function canProceed(): boolean {
  switch (currentStep.value) {
    case 1: return selectedAge.value !== null
    case 2: return selectedExperience.value !== null
    case 3: return selectedGoal.value !== null
    default: return false
  }
}

function nextStep() {
  if (!canProceed()) return

  if (currentStep.value === 1 && selectedAge.value) {
    userStore.setAgeGroup(selectedAge.value)
  } else if (currentStep.value === 2 && selectedExperience.value) {
    userStore.setExperienceLevel(selectedExperience.value)
  } else if (currentStep.value === 3 && selectedGoal.value) {
    userStore.setFinancialGoal(selectedGoal.value)
    userStore.completeOnboarding()
    router.push('/journey')
    return
  }

  currentStep.value++
}

function prevStep() {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}
</script>

<template>
  <div class="onboarding">
    <!-- Intro Screen -->
    <transition name="fade">
      <div v-if="showIntro" class="intro-screen">
        <div class="barry-wrapper">
          <transition name="pop">
            <div v-if="showSpeech" class="speech-bubble">
              So you want to invest huh?<br>First answer some of my questions.
            </div>
          </transition>
          <img src="/bull_default.png" alt="Barry the Bull" class="barry-img-intro" />
        </div>
      </div>
    </transition>

    <div v-if="!showIntro" class="onboarding-container">
      <!-- Progress bar -->
      <div class="step-progress">
        <div class="step-progress-bar">
          <div class="step-progress-fill" :style="{ width: progress + '%' }" />
        </div>
        <span class="step-indicator">{{ currentStep }} / {{ totalSteps }}</span>
      </div>

      <!-- Step 1: Age Group -->
      <transition name="slide" mode="out-in">
        <div v-if="currentStep === 1" key="step1" class="step">
          <h1 class="step-title">What describes your stage?</h1>
          <p class="step-subtitle">This helps us tailor the content to your life stage</p>

          <div class="options-grid options-grid--2col">
            <button
              v-for="option in ageOptions"
              :key="option.value"
              class="option-card"
              :class="{ 'option-card--selected': selectedAge === option.value }"
              @click="selectedAge = option.value"
            >
              <div class="option-card-header">
                <span class="option-label">{{ option.label }}</span>
              </div>
              <p class="option-description">{{ option.description }}</p>
            </button>
          </div>
        </div>

        <!-- Step 2: Experience Level -->
        <div v-else-if="currentStep === 2" key="step2" class="step">
          <h1 class="step-title">Do you have any experience with investing?</h1>
          <p class="step-subtitle">We'll adjust the difficulty based on what you already know</p>

          <div class="options-grid options-grid--1col">
            <button
              v-for="option in experienceOptions"
              :key="option.value"
              class="option-card option-card--horizontal"
              :class="{ 'option-card--selected': selectedExperience === option.value }"
              @click="selectedExperience = option.value"
            >
              <div class="option-card-content">
                <span class="option-label">{{ option.label }}</span>
                <p class="option-quote">"{{ option.quote }}"</p>
                <p class="option-description">{{ option.description }}</p>
              </div>
            </button>
          </div>
        </div>

        <!-- Step 3: Financial Goal -->
        <div v-else-if="currentStep === 3" key="step3" class="step">
          <h1 class="step-title">What is your financial goal?</h1>
          <p class="step-subtitle">Pick a dream - we'll show you how investing can get you there</p>

          <div class="options-grid options-grid--goals">
            <button
              v-for="option in goalOptions"
              :key="option.value"
              class="option-card option-card--goal"
              :class="{ 'option-card--selected': selectedGoal === option.value }"
              @click="selectedGoal = option.value"
            >
              <span class="goal-icon">{{ option.icon }}</span>
              <span class="option-label">{{ option.label }}</span>
              <span class="goal-estimate">{{ option.estimate }}</span>
            </button>
          </div>
        </div>
      </transition>

      <!-- Navigation -->
      <div class="step-nav">
        <button
          v-if="currentStep > 1"
          class="btn btn--ghost"
          @click="prevStep"
        >
          Back
        </button>
        <div v-else />
        <button
          class="btn btn--primary"
          :disabled="!canProceed()"
          @click="nextStep"
        >
          {{ currentStep === totalSteps ? "Let's Go!" : 'Continue' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Intro Animations & Styles */
.intro-screen {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-background);
  z-index: 50;
}

.barry-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.barry-img-intro {
  height: 40vh;
  min-height: 250px;
  width: auto;
  drop-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
  display: block;
}

.speech-bubble {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 25px;
  background: white;
  color: black;
  padding: 1rem 1.5rem;
  border-radius: var(--radius-lg);
  font-weight: 600;
  font-size: 1.125rem;
  text-align: center;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  border: 2px solid var(--color-primary);
  width: max-content;
  max-width: 300px;
  line-height: 1.4;
  z-index: 10;
}

.speech-bubble::after {
  content: "";
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  border-width: 10px 10px 0;
  border-style: solid;
  border-color: var(--color-primary) transparent transparent transparent;
}

.speech-bubble::before {
  content: "";
  position: absolute;
  bottom: -7px;
  left: 50%;
  transform: translateX(-50%);
  border-width: 9px 9px 0;
  border-style: solid;
  border-color: white transparent transparent transparent;
  z-index: 1;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.pop-enter-active,
.pop-leave-active {
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.pop-enter-from,
.pop-leave-to {
  opacity: 0;
  transform: scale(0.8) translateY(20px);
}

.onboarding {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1.5rem;
  position: relative;
}

.onboarding-container {
  max-width: 680px;
  width: 100%;
}

/* Progress */
.step-progress {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2.5rem;
}

.step-progress-bar {
  flex: 1;
  height: 8px;
  background: var(--color-background-mute);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.step-progress-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: var(--radius-full);
  transition: width 0.4s ease;
}

.step-indicator {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  white-space: nowrap;
}

/* Step content */
.step {
  min-height: 400px;
}

.step-title {
  font-size: 1.75rem;
  margin-bottom: 0.5rem;
}

.step-subtitle {
  color: var(--color-text-secondary);
  margin-bottom: 2rem;
  font-size: 1rem;
}

/* Options grid */
.options-grid {
  display: grid;
  gap: 1rem;
}

.options-grid--2col {
  grid-template-columns: repeat(2, 1fr);
}

.options-grid--1col {
  grid-template-columns: 1fr;
}

.options-grid--goals {
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 0.75rem;
}

@media (max-width: 600px) {
  .options-grid--2col {
    grid-template-columns: 1fr;
  }
}

/* Option card */
.option-card {
  background: var(--color-surface);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1.25rem;
  text-align: left;
  transition: all var(--transition-fast);
  cursor: pointer;
}

.option-card:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-md);
}

.option-card--selected {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
  box-shadow: 0 0 0 3px rgba(255, 203, 0, 0.2);
}

html.dark .option-card--selected {
  background: rgba(255, 203, 0, 0.1);
}

.option-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.option-label {
  font-weight: 700;
  font-size: 1.05rem;
  color: var(--color-heading);
}

.option-badge {
  background: var(--color-secondary);
  color: white;
  padding: 0.2rem 0.6rem;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 600;
}

.option-description {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  line-height: 1.5;
}

.option-quote {
  font-style: italic;
  color: var(--color-secondary);
  margin: 0.25rem 0 0.5rem;
  font-size: 0.95rem;
}

html.dark .option-quote {
  color: var(--color-primary);
}

/* Goal cards */
.option-card--goal {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 1.25rem 0.75rem;
  gap: 0.5rem;
}

.goal-icon {
  font-size: 2rem;
}

.goal-estimate {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  font-weight: 500;
}

/* Navigation */
.step-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 2.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-border);
}

/* Buttons */
.btn {
  padding: 0.75rem 2rem;
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: 1rem;
  transition: all var(--transition-fast);
}

.btn--primary {
  background: var(--color-primary);
  color: var(--color-secondary);
}

.btn--primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn--primary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn--ghost {
  background: transparent;
  color: var(--color-text-secondary);
}

.btn--ghost:hover {
  color: var(--color-text);
  background: var(--color-background-mute);
}

/* Transitions */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.slide-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}
</style>
