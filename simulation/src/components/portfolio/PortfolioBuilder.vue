<script setup lang="ts">
import { computed } from 'vue'
import { Card, CardContent, CardHeader, CardTitle, Badge, Slider, Input } from '@/components/ui'
import { usePortfolioStore } from '@/stores/portfolioStore'
import { assets, ASSET_CLASS_LABELS, ASSET_CLASS_COLORS, type AssetClass } from '@/data/assets'
import AllocationPieChart from './AllocationPieChart.vue'

const portfolioStore = usePortfolioStore()

const assetClasses: AssetClass[] = ['equity', 'bond', 'commodity', 'currency', 'crypto']

const groupedAssets = computed(() => {
  const groups: Record<string, typeof assets> = {}
  for (const cls of assetClasses) {
    groups[cls] = assets.filter((a) => a.class === cls)
  }
  return groups
})

const remainingAllocation = computed(() => 100 - portfolioStore.totalAllocation)

function toggleAsset(assetId: string) {
  const current = portfolioStore.allocations[assetId]
  if (current && current > 0) {
    portfolioStore.setAllocation(assetId, 0)
  } else {
    // Add with a small default weight
    const remaining = remainingAllocation.value
    portfolioStore.setAllocation(assetId, Math.min(10, remaining))
  }
}

function onSliderChange(assetId: string, value: number) {
  portfolioStore.setAllocation(assetId, value)
}

function quickDistribute() {
  const selectedIds = Object.keys(portfolioStore.allocations).filter(
    (id) => portfolioStore.allocations[id] > 0,
  )
  if (selectedIds.length === 0) return
  portfolioStore.equalWeight(selectedIds)
}
</script>

<template>
  <div class="space-y-4">
    <!-- Capital Settings -->
    <Card>
      <CardHeader class="pb-3">
        <CardTitle class="text-sm">Investment Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="text-xs text-muted-foreground mb-1 block">Initial Capital (CHF)</label>
            <Input
              type="number"
              :model-value="portfolioStore.initialCapital"
              @update:model-value="portfolioStore.initialCapital = Number($event)"
            />
          </div>
          <div>
            <label class="text-xs text-muted-foreground mb-1 block">Monthly Savings (CHF)</label>
            <Input
              type="number"
              :model-value="portfolioStore.monthlySavings"
              @update:model-value="portfolioStore.monthlySavings = Number($event)"
            />
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Allocation Summary -->
    <Card>
      <CardHeader class="pb-3">
        <div class="flex items-center justify-between">
          <CardTitle class="text-sm">Allocation</CardTitle>
          <div class="flex items-center gap-2">
            <span
              :class="[
                'text-sm font-mono font-bold',
                portfolioStore.isValid ? 'text-primary' : remainingAllocation < 0 ? 'text-destructive' : 'text-yellow-400',
              ]"
            >
              {{ portfolioStore.totalAllocation.toFixed(0) }}%
            </span>
            <button
              v-if="Object.keys(portfolioStore.allocations).length > 0"
              class="text-xs text-primary hover:underline cursor-pointer"
              @click="quickDistribute"
            >
              Equal Weight
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <!-- Progress bar showing allocation -->
        <div class="flex h-2 rounded-full overflow-hidden bg-secondary mb-3">
          <div
            v-for="item in portfolioStore.selectedAssets"
            :key="item.asset.id"
            :style="{ width: `${item.weight}%`, backgroundColor: item.asset.color }"
            class="transition-all duration-300"
          />
        </div>
        <div v-if="!portfolioStore.isValid" class="text-xs text-yellow-400">
          {{ remainingAllocation > 0 ? `${remainingAllocation.toFixed(0)}% remaining` : `${Math.abs(remainingAllocation).toFixed(0)}% over-allocated` }}
        </div>

        <!-- Pie Chart -->
        <div v-if="portfolioStore.selectedAssets.length > 0" class="mt-4">
          <AllocationPieChart />
        </div>
      </CardContent>
    </Card>

    <!-- Asset Selection -->
    <div v-for="cls in assetClasses" :key="cls" class="space-y-2">
      <div class="flex items-center gap-2 px-1">
        <div class="w-2 h-2 rounded-full" :style="{ backgroundColor: ASSET_CLASS_COLORS[cls] }" />
        <span class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {{ ASSET_CLASS_LABELS[cls] }}
        </span>
      </div>

      <div class="space-y-1">
        <div
          v-for="asset in groupedAssets[cls]"
          :key="asset.id"
          :class="[
            'rounded-lg border p-3 transition-all',
            portfolioStore.allocations[asset.id] > 0
              ? 'border-primary/50 bg-primary/5'
              : 'border-border hover:border-border/80',
          ]"
        >
          <div class="flex items-center justify-between mb-1">
            <button
              class="flex items-center gap-2 cursor-pointer flex-1 text-left"
              @click="toggleAsset(asset.id)"
            >
              <div class="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold" :style="{ backgroundColor: asset.color + '20', color: asset.color }">
                {{ asset.ticker.charAt(0) }}
              </div>
              <div>
                <span class="text-sm font-medium">{{ asset.name }}</span>
                <span class="text-xs text-muted-foreground ml-2">{{ asset.ticker }}</span>
              </div>
            </button>
            <div class="flex items-center gap-2">
              <Badge variant="outline" class="text-xs">
                Vol: {{ (asset.sigma * 100).toFixed(0) }}%
              </Badge>
              <span v-if="portfolioStore.allocations[asset.id] > 0" class="text-sm font-mono font-bold text-primary w-10 text-right">
                {{ portfolioStore.allocations[asset.id] }}%
              </span>
            </div>
          </div>

          <!-- Slider for selected assets -->
          <div v-if="portfolioStore.allocations[asset.id] > 0" class="mt-2 pl-8">
            <Slider
              :model-value="portfolioStore.allocations[asset.id]"
              :min="0"
              :max="100"
              :step="1"
              @update:model-value="onSliderChange(asset.id, $event)"
            />
            <p class="text-xs text-muted-foreground mt-1">{{ asset.description }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
