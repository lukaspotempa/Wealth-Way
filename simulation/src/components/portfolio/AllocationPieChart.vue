<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Pie } from 'vue-chartjs'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { usePortfolioStore } from '@/stores/portfolioStore'

ChartJS.register(ArcElement, Tooltip, Legend)

const portfolioStore = usePortfolioStore()

const chartData = computed(() => {
  const items = portfolioStore.selectedAssets
  return {
    labels: items.map((i) => i.asset.name),
    datasets: [
      {
        data: items.map((i) => i.weight),
        backgroundColor: items.map((i) => i.asset.color),
        borderColor: '#0a0a0a',
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      backgroundColor: '#1c1c1c',
      titleColor: '#fafafa',
      bodyColor: '#a1a1aa',
      borderColor: '#2a2a2a',
      borderWidth: 1,
      cornerRadius: 8,
      padding: 10,
      callbacks: {
        label: (context: any) => `${context.label}: ${context.parsed}%`,
      },
    },
  },
}
</script>

<template>
  <div class="w-full max-w-[200px] mx-auto">
    <Pie :data="chartData" :options="chartOptions" />
  </div>
</template>
