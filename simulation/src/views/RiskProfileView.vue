<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Progress, Badge } from '@/components/ui'
import { useUserStore } from '@/stores/userStore'
import { usePortfolioStore } from '@/stores/portfolioStore'
import { riskQuestions, calculateRiskProfile, type RiskProfileResult } from '@/data/riskQuestions'
import { getAssetById, ASSET_CLASS_LABELS } from '@/data/assets'

const router = useRouter()
const userStore = useUserStore()
const portfolioStore = usePortfolioStore()

const currentStep = ref(0)
const answers = ref<Record<string, number>>({})
const result = ref<RiskProfileResult | null>(null)
const showResult = ref(false)

const totalSteps = computed(() => riskQuestions.length)
const progress = computed(() => ((currentStep.value) / totalSteps.value) * 100)
const currentQuestion = computed(() => riskQuestions[currentStep.value])
const isLastQuestion = computed(() => currentStep.value === totalSteps.value - 1)
const hasAnswered = computed(() => currentQuestion.value && answers.value[currentQuestion.value.id] !== undefined)

function selectOption(value: number) {
  answers.value[currentQuestion.value.id] = value
}

function nextStep() {
  if (isLastQuestion.value) {
    // Calculate result
    result.value = calculateRiskProfile(answers.value)
    userStore.setRiskProfile(result.value)
    showResult.value = true
  } else {
    currentStep.value++
  }
}

function prevStep() {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

function applyAndGoToSandbox() {
  if (result.value) {
    portfolioStore.loadSuggestedAllocation(result.value.suggestedAllocation)
    router.push('/sandbox')
  }
}

function retakeQuiz() {
  currentStep.value = 0
  answers.value = {}
  result.value = null
  showResult.value = false
  userStore.resetProfile()
}

// Group suggested allocation by asset class for display
function getAllocationDisplay(alloc: Record<string, number>) {
  return Object.entries(alloc)
    .map(([id, weight]) => {
      const asset = getAssetById(id)
      return { id, weight, name: asset?.name || id, assetClass: asset?.class || 'unknown', color: asset?.color || '#666' }
    })
    .sort((a, b) => b.weight - a.weight)
}
</script>

<template>
  <div class="container mx-auto px-4 py-8 max-w-2xl">
    <!-- Header -->
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold mb-2">Risk Profile Assessment</h1>
      <p class="text-muted-foreground">
        Answer {{ totalSteps }} questions to discover your investor type and get a personalized portfolio recommendation.
      </p>
    </div>

    <!-- Quiz -->
    <div v-if="!showResult">
      <!-- Progress -->
      <div class="mb-6">
        <div class="flex items-center justify-between text-sm text-muted-foreground mb-2">
          <span>Question {{ currentStep + 1 }} of {{ totalSteps }}</span>
          <span>{{ Math.round(progress) }}%</span>
        </div>
        <Progress :value="progress" />
      </div>

      <!-- Question Card -->
      <transition name="slide-up" mode="out-in">
        <Card :key="currentQuestion.id" class="mb-6">
          <CardHeader>
            <CardTitle class="text-xl">{{ currentQuestion.question }}</CardTitle>
            <CardDescription>{{ currentQuestion.description }}</CardDescription>
          </CardHeader>
          <CardContent>
            <div class="space-y-3">
              <button
                v-for="option in currentQuestion.options"
                :key="option.value"
                :class="[
                  'w-full text-left p-4 rounded-lg border transition-all cursor-pointer',
                  answers[currentQuestion.id] === option.value
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border hover:border-primary/50 hover:bg-accent text-foreground',
                ]"
                @click="selectOption(option.value)"
              >
                <div class="font-medium text-sm">{{ option.label }}</div>
                <div class="text-xs text-muted-foreground mt-0.5">{{ option.description }}</div>
              </button>
            </div>
          </CardContent>
        </Card>
      </transition>

      <!-- Navigation -->
      <div class="flex justify-between">
        <Button variant="outline" :disabled="currentStep === 0" @click="prevStep">
          Back
        </Button>
        <Button :disabled="!hasAnswered" @click="nextStep">
          {{ isLastQuestion ? 'See Results' : 'Next' }}
        </Button>
      </div>
    </div>

    <!-- Result -->
    <transition name="slide-up">
      <div v-if="showResult && result">
        <Card class="mb-6">
          <CardHeader>
            <div class="flex items-center gap-3 mb-2">
              <div
                class="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                :style="{ backgroundColor: result.color }"
              >
                {{ result.label.charAt(0) }}
              </div>
              <div>
                <CardTitle class="text-2xl">{{ result.label }}</CardTitle>
                <Badge :style="{ backgroundColor: result.color + '20', color: result.color }">
                  {{ result.profile }}
                </Badge>
              </div>
            </div>
            <CardDescription class="text-sm leading-relaxed">
              {{ result.description }}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <h4 class="font-semibold text-sm mb-3">Suggested Portfolio Allocation</h4>
            <div class="space-y-2">
              <div
                v-for="item in getAllocationDisplay(result.suggestedAllocation)"
                :key="item.id"
                class="flex items-center gap-3"
              >
                <div class="w-3 h-3 rounded-full shrink-0" :style="{ backgroundColor: item.color }" />
                <span class="text-sm flex-1">{{ item.name }}</span>
                <span class="text-sm font-mono font-semibold">{{ item.weight }}%</span>
              </div>
            </div>

            <!-- Visual bar -->
            <div class="flex h-3 rounded-full overflow-hidden mt-4 mb-2">
              <div
                v-for="item in getAllocationDisplay(result.suggestedAllocation)"
                :key="item.id"
                :style="{ width: `${item.weight}%`, backgroundColor: item.color }"
                class="transition-all duration-500"
              />
            </div>
          </CardContent>
        </Card>

        <div class="flex flex-col sm:flex-row gap-3">
          <Button class="flex-1" @click="applyAndGoToSandbox">
            Apply & Go to Sandbox
          </Button>
          <Button variant="outline" @click="router.push('/sandbox')">
            Customize Myself
          </Button>
          <Button variant="ghost" @click="retakeQuiz">
            Retake Quiz
          </Button>
        </div>
      </div>
    </transition>
  </div>
</template>
