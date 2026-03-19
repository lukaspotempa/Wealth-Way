import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserProfile, AgeGroup, ExperienceLevel, FinancialGoal } from '@/types'

const STORAGE_KEY = 'finance-journey-user'

function loadFromStorage(): UserProfile {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      return JSON.parse(saved) as UserProfile
    }
  } catch {
    // Ignore parse errors
  }
  return {
    ageGroup: null,
    experienceLevel: null,
    financialGoal: null,
    onboardingComplete: false,
  }
}

function saveToStorage(profile: UserProfile) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
}

export const useUserStore = defineStore('user', () => {
  const profile = ref<UserProfile>(loadFromStorage())

  const displayName = computed(() => {
    const labels: Record<string, string> = {
      junior: 'Junior Explorer',
      adolescent: 'Rising Investor',
      'grown-up': 'Wealth Builder',
      senior: 'Wise Investor',
    }
    return profile.value.ageGroup ? labels[profile.value.ageGroup] ?? 'Investor' : 'Investor'
  })

  const startingLevel = computed(() => {
    // Determine which node the user starts at based on experience
    switch (profile.value.experienceLevel) {
      case 'intermediate':
        return 3 // Skip basics
      case 'advanced':
        return 5 // Skip to advanced content
      default:
        return 1 // Start from the beginning
    }
  })

  function setAgeGroup(ageGroup: AgeGroup) {
    profile.value.ageGroup = ageGroup
    saveToStorage(profile.value)
  }

  function setExperienceLevel(level: ExperienceLevel) {
    profile.value.experienceLevel = level
    saveToStorage(profile.value)
  }

  function setFinancialGoal(goal: FinancialGoal) {
    profile.value.financialGoal = goal
    saveToStorage(profile.value)
  }

  function completeOnboarding() {
    profile.value.onboardingComplete = true
    saveToStorage(profile.value)
  }

  function resetProfile() {
    profile.value = {
      ageGroup: null,
      experienceLevel: null,
      financialGoal: null,
      onboardingComplete: false,
    }
    saveToStorage(profile.value)
  }

  return {
    profile,
    displayName,
    startingLevel,
    setAgeGroup,
    setExperienceLevel,
    setFinancialGoal,
    completeOnboarding,
    resetProfile,
  }
})
