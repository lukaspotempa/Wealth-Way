<script setup lang="ts">
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js'
import { useSimulationStore } from '@/stores/simulationStore'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

const simulationStore = useSimulationStore()

const chartData = computed(() => {
  const history = simulationStore.portfolioHistory
  const benchmark = simulationStore.benchmarkHistory

  // Show every data point or sample for performance
  const maxPoints = 240
  const step = Math.max(1, Math.floor(history.length / maxPoints))

  const sampled = history.filter((_, i) => i % step === 0 || i === history.length - 1)
  const sampledBenchmark = benchmark.filter((_, i) => i % step === 0 || i === benchmark.length - 1)

  const labels = sampled.map((s) => {
    const year = Math.floor(s.month / 12) + 1
    const month = (s.month % 12) + 1
    return month === 1 || s.month === 0 ? `Y${year}` : ''
  })

  return {
    labels,
    datasets: [
      {
        label: 'Your Portfolio',
        data: sampled.map((s) => s.value),
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.3,
        pointRadius: 0,
        pointHitRadius: 10,
      },
      {
        label: 'Benchmark (100% SMI)',
        data: sampledBenchmark.map((s) => s.value),
        borderColor: '#6b7280',
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderDash: [5, 5],
        fill: false,
        tension: 0.3,
        pointRadius: 0,
        pointHitRadius: 10,
      },
      {
        label: 'Invested',
        data: sampled.map((s) => s.invested),
        borderColor: '#3b82f6',
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderDash: [3, 3],
        fill: false,
        tension: 0,
        pointRadius: 0,
        pointHitRadius: 10,
      },
    ],
  }
})

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index' as const,
    intersect: false,
  },
  scales: {
    x: {
      grid: {
        color: 'rgba(42, 42, 42, 0.5)',
      },
      ticks: {
        color: '#a1a1aa',
        font: { size: 10 },
        maxRotation: 0,
      },
    },
    y: {
      grid: {
        color: 'rgba(42, 42, 42, 0.5)',
      },
      ticks: {
        color: '#a1a1aa',
        font: { size: 10 },
        callback: (value: any) => {
          if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
          if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
          return value
        },
      },
    },
  },
  plugins: {
    legend: {
      display: true,
      position: 'top' as const,
      labels: {
        color: '#a1a1aa',
        font: { size: 11 },
        boxWidth: 12,
        boxHeight: 2,
        padding: 16,
        usePointStyle: false,
      },
    },
    tooltip: {
      backgroundColor: '#1c1c1c',
      titleColor: '#fafafa',
      bodyColor: '#a1a1aa',
      borderColor: '#2a2a2a',
      borderWidth: 1,
      cornerRadius: 8,
      padding: 12,
      callbacks: {
        label: (context: any) => {
          const value = context.parsed.y
          const formatted = new Intl.NumberFormat('de-CH', {
            style: 'currency',
            currency: 'CHF',
            minimumFractionDigits: 0,
          }).format(value)
          return `${context.dataset.label}: ${formatted}`
        },
      },
    },
  },
  animation: {
    duration: 0,
  },
}))
</script>

<template>
  <div class="w-full h-full min-h-[300px]">
    <Line :data="chartData" :options="chartOptions" />
  </div>
</template>
