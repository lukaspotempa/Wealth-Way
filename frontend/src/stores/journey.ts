import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { JourneyNode } from '@/types'
import { useUserStore } from './user'

const STORAGE_KEY = 'finance-journey-progress'

function loadProgress(): Set<string> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      return new Set(JSON.parse(saved) as string[])
    }
  } catch {
    // Ignore parse errors
  }
  return new Set()
}

function saveProgress(completed: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...completed]))
}

export const useJourneyStore = defineStore('journey', () => {
  const completedNodes = ref<Set<string>>(loadProgress())

  const nodes = computed<JourneyNode[]>(() => {
    const userStore = useUserStore()
    const startLevel = userStore.startingLevel

    const allNodes: JourneyNode[] = [
      {
        id: 'lesson-1',
        title: 'Introduction',
        description: 'Learn about inflation and how money changes value over time',
        type: 'lesson',
        status: 'available',
        position: { x: 0, y: 0 },
        route: '/lesson/1',
      },
      {
        id: 'quiz-1',
        title: 'Inflation and value loss',
        description: 'Test your knowledge about inflation and value loss over time',
        type: 'quiz',
        status: 'locked',
        position: { x: 1, y: 1 },
        route: '/quiz/1',
      },
      {
        id: 'checkpoint-1',
        title: 'Checkpoint: Basics',
        description: 'You understand the fundamentals of money and inflation',
        type: 'checkpoint',
        status: 'locked',
        position: { x: 2, y: 0 },
        route: '/journey',
      },
      {
        id: 'lesson-2',
        title: 'The Stock Market',
        description: 'Discover how the stock market works and why companies go public',
        type: 'lesson',
        status: 'locked',
        position: { x: 3, y: 1 },
        route: '/journey',
      },
      {
        id: 'lesson-3',
        title: 'ETFs & Diversification',
        description: 'Learn about ETFs and how to spread risk across investments',
        type: 'lesson',
        status: 'locked',
        position: { x: 4, y: 0 },
        route: '/journey',
      },
      {
        id: 'checkpoint-2',
        title: 'Checkpoint: Intermediate',
        description: 'You are ready for more advanced concepts',
        type: 'checkpoint',
        status: 'locked',
        position: { x: 5, y: 1 },
        route: '/journey',
      },
      {
        id: 'lesson-4',
        title: 'Swiss Market (SPI)',
        description: 'Explore the Swiss Performance Index and Swiss investing',
        type: 'lesson',
        status: 'locked',
        position: { x: 6, y: 0 },
        route: '/journey',
      },
      {
        id: 'lesson-5',
        title: 'Portfolio Strategy',
        description: 'Learn how to build and manage your investment portfolio',
        type: 'lesson',
        status: 'locked',
        position: { x: 7, y: 1 },
        route: '/journey',
      },
      {
        id: 'challenge-final',
        title: 'Bull vs Bear Arena',
        description: 'Configure your portfolio and battle against the market!',
        type: 'challenge',
        status: 'locked',
        position: { x: 8, y: 0 },
        route: '/challenge',
      },
    ]

    // Determine status for each node
    return allNodes.map((node, index) => {
      const nodeNumber = index + 1

      if (completedNodes.value.has(node.id)) {
        return { ...node, status: 'completed' as const }
      }

      // Unlock nodes up to starting level
      if (nodeNumber <= startLevel) {
        return { ...node, status: 'available' as const }
      }

      // A node is available if the previous node is completed
      if (index === 0) {
        return { ...node, status: 'available' as const }
      }

      const prevNode = allNodes[index - 1]
      if (prevNode && completedNodes.value.has(prevNode.id)) {
        return { ...node, status: 'available' as const }
      }

      return { ...node, status: 'locked' as const }
    })
  })

  const progressPercent = computed(() => {
    if (nodes.value.length === 0) return 0
    return Math.round((completedNodes.value.size / nodes.value.length) * 100)
  })

  function completeNode(nodeId: string) {
    completedNodes.value.add(nodeId)
    saveProgress(completedNodes.value)
  }

  function resetProgress() {
    completedNodes.value.clear()
    saveProgress(completedNodes.value)
  }

  return {
    nodes,
    completedNodes,
    progressPercent,
    completeNode,
    resetProgress,
  }
})
