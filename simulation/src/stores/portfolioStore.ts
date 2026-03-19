import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { assets } from '@/data/assets'

export const usePortfolioStore = defineStore('portfolio', () => {
  const allocations = ref<Record<string, number>>({})
  const initialCapital = ref(100000)
  const monthlySavings = ref(500)

  const totalAllocation = computed(() =>
    Object.values(allocations.value).reduce((sum, v) => sum + v, 0),
  )

  const isValid = computed(() => {
    const total = totalAllocation.value
    return total >= 99.5 && total <= 100.5 // Allow small floating-point tolerance
  })

  const selectedAssets = computed(() =>
    Object.entries(allocations.value)
      .filter(([, weight]) => weight > 0)
      .map(([id, weight]) => ({
        asset: assets.find((a) => a.id === id)!,
        weight,
      }))
      .filter((item) => item.asset !== undefined),
  )

  function setAllocation(assetId: string, weight: number) {
    if (weight <= 0) {
      const newAllocations = { ...allocations.value }
      delete newAllocations[assetId]
      allocations.value = newAllocations
    } else {
      allocations.value = { ...allocations.value, [assetId]: weight }
    }
  }

  function loadSuggestedAllocation(suggested: Record<string, number>) {
    allocations.value = { ...suggested }
  }

  function resetPortfolio() {
    allocations.value = {}
    initialCapital.value = 100000
    monthlySavings.value = 500
  }

  function equalWeight(assetIds: string[]) {
    const weight = Math.floor(100 / assetIds.length)
    const remainder = 100 - weight * assetIds.length
    const newAllocations: Record<string, number> = {}
    assetIds.forEach((id, i) => {
      newAllocations[id] = weight + (i < remainder ? 1 : 0)
    })
    allocations.value = newAllocations
  }

  return {
    allocations,
    initialCapital,
    monthlySavings,
    totalAllocation,
    isValid,
    selectedAssets,
    setAllocation,
    loadSuggestedAllocation,
    resetPortfolio,
    equalWeight,
  }
})
