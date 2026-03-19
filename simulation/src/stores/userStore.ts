import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { RiskProfile, RiskProfileResult } from '@/data/riskQuestions'

export const useUserStore = defineStore('user', () => {
  const playerName = ref(localStorage.getItem('playerName') || '')
  const riskProfile = ref<RiskProfile | null>(
    (localStorage.getItem('riskProfile') as RiskProfile) || null,
  )
  const riskResult = ref<RiskProfileResult | null>(null)
  const quizAnswers = ref<Record<string, number>>({})

  function setPlayerName(name: string) {
    playerName.value = name
    localStorage.setItem('playerName', name)
  }

  function setRiskProfile(result: RiskProfileResult) {
    riskProfile.value = result.profile
    riskResult.value = result
    localStorage.setItem('riskProfile', result.profile)
  }

  function resetProfile() {
    riskProfile.value = null
    riskResult.value = null
    quizAnswers.value = {}
    localStorage.removeItem('riskProfile')
  }

  return {
    playerName,
    riskProfile,
    riskResult,
    quizAnswers,
    setPlayerName,
    setRiskProfile,
    resetProfile,
  }
})
