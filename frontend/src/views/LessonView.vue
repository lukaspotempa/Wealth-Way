<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useJourneyStore } from '@/stores/journey'
import { lesson1Slides, lesson2Slides, lesson3Slides, quiz1Slides, calculateChildrenSavings } from '@/services/lessonData'
import NetWorthChart from '@/components/lessons/NetWorthChart.vue'
import InflationChart from '@/components/lessons/InflationChart.vue'
import SamRealValueChart from '@/components/lessons/SamRealValueChart.vue'
import MarketMissedDaysChart from '@/components/lessons/MarketMissedDaysChart.vue'
import CompoundGrowthChart from '@/components/lessons/CompoundGrowthChart.vue'
import StockVsEtfChart from '@/components/lessons/StockVsEtfChart.vue'
import FeeDragChart from '@/components/lessons/FeeDragChart.vue'

const route = useRoute()
const router = useRouter()
const journeyStore = useJourneyStore()

const isQuiz = computed(() => route.name === 'quiz')
const id = computed(() => route.params.id as string)

const currentSlide = ref(0)

type GenericSlide = {
  type: string
  [key: string]: any
}

const slides = computed<GenericSlide[]>(() => {
  if (isQuiz.value) {
    if (id.value === '1') return quiz1Slides
  } else {
    if (id.value === '1') return lesson1Slides
    if (id.value === '2') return lesson2Slides
    if (id.value === '3') return lesson3Slides
  }
  return []
})

// Human-readable lesson titles shown in the header
const lessonTitle = computed(() => {
  if (isQuiz.value) {
    if (id.value === '1') return 'Inflation and Value Loss'
    return ''
  }
  if (id.value === '1') return 'Introduction'
  if (id.value === '2') return 'Time in Market'
  if (id.value === '3') return 'ETFs & Diversification'
  return ''
})

const savingsData = calculateChildrenSavings()
const finalData = savingsData[savingsData.length - 1]

const totalSlides = computed(() => slides.value.length)

const selectedOptionId = ref<number | null>(null)
const multiSelectedOptions = ref<Record<number, number>>({})

const progressPercent = computed(() => ((currentSlide.value + 1) / totalSlides.value) * 100)

function nextSlide() {
  selectedOptionId.value = null
  multiSelectedOptions.value = {}
  if (currentSlide.value < totalSlides.value - 1) {
    currentSlide.value++
  } else {
    // Complete the node
    const nodeId = isQuiz.value ? `quiz-${id.value}` : `lesson-${id.value}`
    journeyStore.completeNode(nodeId)
    router.push('/journey')
  }
}

function prevSlide() {
  selectedOptionId.value = null
  multiSelectedOptions.value = {}
  if (currentSlide.value > 0) {
    currentSlide.value--
  }
}

function selectOption(index: number) {
  selectedOptionId.value = index
}

function selectMultiOption(qIndex: number, oIndex: number) {
  multiSelectedOptions.value = {
    ...multiSelectedOptions.value,
    [qIndex]: oIndex
  }
}

const currentSlideData = computed(() => slides.value[currentSlide.value])
</script>

<template>
  <div class="lesson-view">
    <div class="lesson-container">
      <!-- Lesson header -->
      <div class="lesson-header">
        <button class="back-btn" @click="router.push('/journey')">
          &#8592; Back to Journey
        </button>
        <div class="lesson-progress">
          <div class="lesson-progress-bar">
            <div class="lesson-progress-fill" :style="{ width: progressPercent + '%' }" />
          </div>
          <span class="slide-counter">{{ currentSlide + 1 }} / {{ totalSlides }}</span>
        </div>
      </div>

      <!-- Lesson title -->
      <div class="lesson-title-section">
        <span class="lesson-badge">{{ isQuiz ? 'Quiz' : 'Lesson' }} {{ id }}</span>
        <h1>{{ lessonTitle }}</h1>
      </div>

      <!-- Slide content -->
      <transition name="slide-fade" mode="out-in">
        <div :key="currentSlide" class="slide-content">

          <!-- Story Intro -->
          <template v-if="currentSlideData?.type === 'story-intro'">
            <div class="slide-card slide-card--intro">
              <div class="intro-illustration">
                <div class="house-icon">🏠</div>
                <div class="kids-row">
                  <span class="kid-emoji">👧</span>
                  <span class="kid-emoji">👦</span>
                  <span class="kid-emoji">🧒</span>
                </div>
                <div class="money-badge">$30 / month each</div>
              </div>
              <h2>{{ currentSlideData.title }}</h2>
              <p class="slide-text">{{ currentSlideData.content }}</p>
            </div>
          </template>

          <!-- Comparison (3 children) -->
          <template v-else-if="currentSlideData?.type === 'comparison'">
            <h2 class="slide-heading">{{ currentSlideData.title }}</h2>
            <div class="comparison-grid">
              <div
                v-for="child in currentSlideData.children"
                :key="child.name"
                class="child-card"
              >
                <h3>{{ child.name }}</h3>
                <span class="strategy-badge">{{ child.strategy }}</span>
                <p class="child-decision">{{ child.decision }}</p>
                <p class="child-detail">{{ child.detail }}</p>
              </div>
            </div>
          </template>

          <!-- Time skip / Results -->
          <template v-else-if="currentSlideData?.type === 'timeskip'">
            <h2 class="slide-heading">{{ currentSlideData.title }}</h2>
            <p class="slide-text">{{ currentSlideData.content }}</p>
            <div class="results-grid">
              <div
                v-for="(result, i) in currentSlideData.results"
                :key="result.name"
                class="result-card"
                :class="{ 'result-card--winner': i === 2 }"
              >
                <h3>{{ result.name }}</h3>
                <p class="result-outcome">{{ result.outcome }}</p>
                <p class="result-detail">{{ result.detail }}</p>
                <div class="result-amount">
                  <template v-if="i === 0">$0</template>
                  <template v-else-if="i === 1">${{ finalData?.child2Savings.toFixed(2) }} (worth ${{ finalData?.child2RealValue.toFixed(2) }})</template>
                  <template v-else>${{ finalData?.child3Portfolio.toFixed(2) }}</template>
                </div>
              </div>
            </div>
          </template>

          <!-- Net Worth Chart -->
          <template v-else-if="currentSlideData?.type === 'chart-networth'">
            <h2 class="slide-heading">{{ currentSlideData.title }}</h2>
            <p class="slide-text">{{ currentSlideData.content }}</p>
            <div class="chart-section">
              <NetWorthChart />
            </div>
          </template>

          <!-- Sam Real Value Chart -->
          <template v-else-if="currentSlideData?.type === 'chart-sam-real-value'">
            <h2 class="slide-heading">{{ currentSlideData.title }}</h2>
            <p class="slide-text">{{ currentSlideData.content }}</p>
            <div class="chart-section">
              <SamRealValueChart />
            </div>
          </template>

          <!-- Interactive Question -->
          <template v-else-if="currentSlideData?.type === 'question'">
            <h2 class="slide-heading">{{ currentSlideData.title }}</h2>
            <p class="slide-text">{{ currentSlideData.question }}</p>
            <div class="question-options">
              <button
                v-for="(option, idx) in currentSlideData.options"
                :key="idx"
                class="option-btn"
                :class="{ 
                  'selected': selectedOptionId === Number(idx),
                  'correct': selectedOptionId === Number(idx) && option.isCorrect,
                  'incorrect': selectedOptionId === Number(idx) && !option.isCorrect 
                }"
                @click="selectOption(Number(idx))"
              >
                {{ option.text }}
              </button>
            </div>
            <div v-if="selectedOptionId !== null && currentSlideData?.options" class="question-feedback" :class="{ 'feedback-correct': currentSlideData.options?.[selectedOptionId]?.isCorrect }">
              <p>{{ currentSlideData.options?.[selectedOptionId]?.feedback }}</p>
            </div>
          </template>

          <!-- Inflation Chart -->
          <template v-else-if="currentSlideData?.type === 'chart-inflation'">
            <h2 class="slide-heading">{{ currentSlideData.title }}</h2>
            <p class="slide-text">{{ currentSlideData.content }}</p>
            <div class="chart-section">
              <InflationChart />
            </div>
          </template>

          <!-- Analogy Intro (Oak Tree / Fruit Basket) -->
          <template v-else-if="currentSlideData?.type === 'analogy-intro'">
            <div class="slide-card slide-card--analogy">
              <div class="analogy-icon">{{ currentSlideData.icon }}</div>
              <h2>{{ currentSlideData.title }}</h2>
              <div class="analogy-text">
                <p
                  v-for="(para, i) in currentSlideData.content.split('\n\n')"
                  :key="i"
                  class="analogy-para"
                >{{ para }}</p>
              </div>
            </div>
          </template>

          <!-- Key Insights (icon + heading + text list) -->
          <template v-else-if="currentSlideData?.type === 'key-insight'">
            <h2 class="slide-heading">{{ currentSlideData.title }}</h2>
            <div class="key-insights-list">
              <div
                v-for="(insight, i) in currentSlideData.insights"
                :key="i"
                class="key-insight-card"
              >
                <div class="ki-icon">{{ insight.icon }}</div>
                <div class="ki-body">
                  <h3 class="ki-heading">{{ insight.heading }}</h3>
                  <p class="ki-text">{{ insight.text }}</p>
                </div>
              </div>
            </div>
          </template>

          <!-- Missed Best Days Chart (Lesson 2) -->
          <template v-else-if="currentSlideData?.type === 'chart-missed-days'">
            <h2 class="slide-heading">{{ currentSlideData.title }}</h2>
            <p class="slide-text">{{ currentSlideData.content }}</p>
            <div class="chart-section">
              <MarketMissedDaysChart />
            </div>
          </template>

          <!-- Compound Growth Chart (Lesson 2) -->
          <template v-else-if="currentSlideData?.type === 'chart-compound-growth'">
            <h2 class="slide-heading">{{ currentSlideData.title }}</h2>
            <p class="slide-text">{{ currentSlideData.content }}</p>
            <div class="chart-section">
              <CompoundGrowthChart />
            </div>
          </template>

          <!-- Single Stock vs ETF Chart (Lesson 3) -->
          <template v-else-if="currentSlideData?.type === 'chart-stock-vs-etf'">
            <h2 class="slide-heading">{{ currentSlideData.title }}</h2>
            <p class="slide-text">{{ currentSlideData.content }}</p>
            <div class="chart-section">
              <StockVsEtfChart />
            </div>
          </template>

          <!-- Fee Drag Chart (Lesson 3) -->
          <template v-else-if="currentSlideData?.type === 'chart-fee-drag'">
            <h2 class="slide-heading">{{ currentSlideData.title }}</h2>
            <p class="slide-text">{{ currentSlideData.content }}</p>
            <div class="chart-section">
              <FeeDragChart />
            </div>
          </template>

          <!-- Summary -->
          <template v-else-if="currentSlideData?.type === 'summary'">
            <div class="slide-card slide-card--summary">
              <h2>{{ currentSlideData.title }}</h2>
              <ul class="summary-list">
                <li v-for="(point, i) in currentSlideData.points" :key="i">
                  <span class="summary-check">&#10003;</span>
                  <span>{{ point }}</span>
                </li>
              </ul>
            </div>
          </template>

          <!-- Multi Quiz -->
          <template v-else-if="currentSlideData?.type === 'quiz-multi'">
            <h2 class="slide-heading">{{ currentSlideData.title }}</h2>
            <div class="quiz-questions">
               <div v-for="(q, qIndex) in currentSlideData.questions" :key="qIndex" class="quiz-q-block" style="margin-bottom: 2rem;">
                 <p class="slide-text" style="font-weight: bold; margin-bottom: 1rem;">{{ q.question }}</p>
                 <div class="question-options">
                   <button
                     v-for="(option, oIdx) in q.options"
                     :key="oIdx"
                     class="option-btn"
                     :class="{ 
                       'selected': multiSelectedOptions[Number(qIndex)] === Number(oIdx),
                       'correct': multiSelectedOptions[Number(qIndex)] === Number(oIdx) && option.isCorrect,
                       'incorrect': multiSelectedOptions[Number(qIndex)] === Number(oIdx) && !option.isCorrect 
                     }"
                     @click="selectMultiOption(Number(qIndex), Number(oIdx))"
                   >
                     {{ option.text }}
                   </button>
                 </div>
                 <div v-if="multiSelectedOptions[Number(qIndex)] !== undefined && q.options" class="question-feedback" :class="{ 'feedback-correct': q.options?.[multiSelectedOptions[Number(qIndex)] ?? -1]?.isCorrect }">
                   <p>{{ q.options?.[multiSelectedOptions[Number(qIndex)] ?? -1]?.feedback }}</p>
                 </div>
               </div>
            </div>
          </template>

        </div>
      </transition>

      <!-- Slide navigation -->
      <div class="slide-nav">
        <button
          v-if="currentSlide > 0"
          class="btn btn--ghost"
          @click="prevSlide"
        >
          &#8592; Previous
        </button>
        <div v-else />
        <button
          class="btn btn--primary"
          @click="nextSlide"
          :disabled="currentSlideData?.type === 'question' && (selectedOptionId === null || !currentSlideData.options?.[selectedOptionId]?.isCorrect)"
        >
          {{ currentSlide === totalSlides - 1 ? (isQuiz ? 'Complete Quiz &#10003;' : 'Complete Lesson &#10003;') : 'Next &#8594;' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lesson-view {
  flex: 1;
  padding: 1.5rem;
  display: flex;
  justify-content: center;
}

.lesson-container {
  max-width: 800px;
  width: 100%;
}

/* Header */
.lesson-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.back-btn {
  background: none;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
  padding: 0.5rem 0;
  transition: color var(--transition-fast);
}

.back-btn:hover {
  color: var(--color-text);
}

.lesson-progress {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.lesson-progress-bar {
  width: 120px;
  height: 6px;
  background: var(--color-background-mute);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.lesson-progress-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: var(--radius-full);
  transition: width 0.3s ease;
}

.slide-counter {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-muted);
}

/* Title */
.lesson-title-section {
  margin-bottom: 2rem;
}

.lesson-badge {
  display: inline-block;
  background: var(--color-secondary);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
}

.lesson-title-section h1 {
  font-size: 1.75rem;
}

/* Slide content */
.slide-content {
  min-height: auto;
}

.slide-heading {
  font-size: 1.5rem;
  margin-bottom: 0.75rem;
}

.slide-text {
  color: var(--color-text-secondary);
  font-size: 1.05rem;
  line-height: 1.7;
  margin-bottom: 1.5rem;
}

/* Slide card */
.slide-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 2.5rem;
  text-align: center;
}

.slide-card h2 {
  margin-bottom: 1rem;
}

/* Intro illustration */
.intro-illustration {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.house-icon {
  font-size: 4rem;
}

.kids-row {
  display: flex;
  gap: 1rem;
}

.kid-emoji {
  font-size: 2.5rem;
}

.money-badge {
  background: var(--color-primary);
  color: var(--color-secondary);
  padding: 0.5rem 1.5rem;
  border-radius: var(--radius-full);
  font-weight: 700;
  font-size: 1.1rem;
}

/* Comparison grid */
.comparison-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

@media (max-width: 700px) {
  .comparison-grid {
    grid-template-columns: 1fr;
  }
}

.child-card {
  background: var(--color-surface);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1.5rem 1rem;
  text-align: center;
}

.child-emoji {
  font-size: 3rem;
  margin-bottom: 0.5rem;
}

.child-card h3 {
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
}

.strategy-badge {
  display: inline-block;
  background: var(--color-primary-light);
  color: var(--color-secondary);
  padding: 0.15rem 0.6rem;
  border-radius: var(--radius-full);
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  margin-bottom: 0.75rem;
}

html.dark .strategy-badge {
  background: rgba(255, 203, 0, 0.15);
  color: var(--color-primary);
}

.child-decision {
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--color-heading);
  margin-bottom: 0.5rem;
}

.child-detail {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  line-height: 1.5;
}

/* Results grid */
.results-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-top: 1.5rem;
}

@media (max-width: 700px) {
  .results-grid {
    grid-template-columns: 1fr;
  }
}

.result-card {
  background: var(--color-surface);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1.5rem 1rem;
  text-align: center;
  transition: all var(--transition-fast);
}

.result-card--winner {
  border-color: var(--color-primary);
}

.result-emoji {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.result-card h3 {
  font-size: 1rem;
  margin-bottom: 0.5rem;
}

.result-outcome {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--color-heading);
  margin-bottom: 0.5rem;
}

.result-detail {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  line-height: 1.5;
  margin-bottom: 0.75rem;
}

.result-amount {
  font-weight: 800;
  font-size: 1.2rem;
  color: var(--color-primary);
}

.result-card--winner .result-amount {
  color: var(--color-success);
}

/* Chart section */
.chart-section {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
}

/* Summary */
.slide-card--summary {
  text-align: left;
}

/* Questions */
.question-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1.5rem;
}

.option-btn {
  padding: 1rem;
  border: 2px solid var(--color-border);
  background: var(--color-surface);
  border-radius: var(--radius-md);
  font-size: 1rem;
  font-weight: 500;
  color: var(--color-text);
  cursor: pointer;
  transition: all var(--transition-fast);
  text-align: center;
}

.option-btn:hover {
  border-color: var(--color-primary-hover);
  background: var(--color-background-soft);
}

.option-btn.selected {
  border-color: var(--color-primary);
  background: rgba(255, 203, 0, 0.1);
  font-weight: 700;
}

.option-btn.selected.correct {
  border-color: var(--color-success);
  background: var(--color-success-light);
  color: var(--color-success);
}

.option-btn.selected.incorrect {
  border-color: var(--color-error);
  background: rgba(239, 68, 68, 0.1);
  color: var(--color-error);
}

.question-feedback {
  margin-top: 1.5rem;
  padding: 1rem;
  border-radius: var(--radius-md);
  background: var(--color-surface);
  border-left: 4px solid var(--color-primary);
  color: var(--color-text);
  font-size: 0.95rem;
  line-height: 1.5;
}

.question-feedback.feedback-correct {
  border-left-color: var(--color-success);
}

.summary-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.summary-list li {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  font-size: 1rem;
  line-height: 1.5;
}

.summary-check {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  background: var(--color-success-light);
  color: var(--color-success);
  border-radius: 50%;
  font-size: 0.8rem;
  font-weight: 700;
}

/* Navigation */
.slide-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 2rem;
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
  box-shadow: var(--shadow-md);
}

.btn--primary:disabled {
  background: var(--color-border);
  color: var(--color-text-muted);
  cursor: not-allowed;
  opacity: 0.7;
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
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.25s ease;
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

/* ── Analogy intro slide ──────────────────────────────────────────────────── */
.slide-card--analogy {
  text-align: left;
}

.analogy-icon {
  font-size: 4.5rem;
  line-height: 1;
  margin-bottom: 1.25rem;
  text-align: center;
}

.analogy-text {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  margin-top: 0.75rem;
}

.analogy-para {
  font-size: 1.05rem;
  line-height: 1.75;
  color: var(--color-text-secondary);
}

/* ── Key insight slide ────────────────────────────────────────────────────── */
.key-insights-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 0.5rem;
}

.key-insight-card {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1.25rem 1.5rem;
}

.ki-icon {
  font-size: 2rem;
  line-height: 1;
  flex-shrink: 0;
  width: 2.5rem;
  text-align: center;
}

.ki-body {
  flex: 1;
}

.ki-heading {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-heading);
  margin-bottom: 0.35rem;
}

.ki-text {
  font-size: 0.95rem;
  color: var(--color-text-secondary);
  line-height: 1.6;
}
</style>
