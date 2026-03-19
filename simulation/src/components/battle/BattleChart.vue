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
import { useBattleStore } from '@/stores/battleStore'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

const battleStore = useBattleStore()

const playerColors = ['#22c55e', '#f97316']

const chartData = computed(() => {
  const datasets = battleStore.players.map((player, idx) => {
    const maxPoints = 240
    const step = Math.max(1, Math.floor(player.history.length / maxPoints))
    const sampled = player.history.filter((_, i) => i % step === 0 || i === player.history.length - 1)

    return {
      label: player.name,
      data: sampled.map((s) => s.value),
      borderColor: playerColors[idx],
      backgroundColor: idx === 0 ? 'rgba(34, 197, 94, 0.1)' : 'transparent',
      borderWidth: 2,
      fill: idx === 0,
      tension: 0.3,
      pointRadius: 0,
      pointHitRadius: 10,
    }
  })

  // Labels based on first player
  const p1 = battleStore.players[0]
  const maxPoints = 240
  const step = Math.max(1, Math.floor((p1?.history.length || 0) / maxPoints))
  const sampled = (p1?.history || []).filter((_, i) => i % step === 0 || i === (p1?.history.length || 0) - 1)
  const labels = sampled.map((s) => {
    const year = Math.floor(s.month / 12) + 1
    const month = (s.month % 12) + 1
    return month === 1 || s.month === 0 ? `Y${year}` : ''
  })

  return { labels, datasets }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index' as const,
    intersect: false,
  },
  scales: {
    x: {
      grid: { color: 'rgba(42, 42, 42, 0.5)' },
      ticks: { color: '#a1a1aa', font: { size: 10 }, maxRotation: 0 },
    },
    y: {
      grid: { color: 'rgba(42, 42, 42, 0.5)' },
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
      labels: { color: '#a1a1aa', font: { size: 11 }, boxWidth: 12, boxHeight: 2, padding: 16 },
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
  animation: { duration: 0 },
}
</script>

<template>
  <div class="w-full h-full min-h-[300px]">
    <Line :data="chartData" :options="chartOptions" />
  </div>
</template>
