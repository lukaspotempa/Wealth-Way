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
    const statuses = new Map<string, 'locked' | 'available' | 'completed'>()
    
    for (let i = 0; i < allNodes.length; i++) {
      const node = allNodes[i]
      if (!node) continue
      
      const nodeNumber = i + 1

      if (completedNodes.value.has(node.id)) {
        statuses.set(node.id, 'completed')
        continue
      }

      const prevNode = i > 0 ? allNodes[i - 1] : null
      const prevStatus = prevNode ? statuses.get(prevNode.id) : null

      if (i === 0) {
        statuses.set(node.id, nodeNumber <= startLevel ? (node.type === 'checkpoint' ? 'completed' : 'available') : 'available')
      } else if (prevStatus === 'completed') {
        if (node.type === 'checkpoint') {
          // Checkpoints auto-complete if reached
          statuses.set(node.id, 'completed')
        } else {
          statuses.set(node.id, 'available')
        }
      } else {
        if (nodeNumber <= startLevel) {
          statuses.set(node.id, node.type === 'checkpoint' ? 'completed' : 'available')
        } else {
          statuses.set(node.id, 'locked')
        }
      }
    }

    return allNodes.map((node) => ({
      ...node,
      status: statuses.get(node.id) || 'locked'
    }))
  })

  // We should count progress without checkpoints
  const progressPercent = computed(() => {
    const playableNodes = nodes.value.filter(n => n.type !== 'checkpoint')
    if (playableNodes.length === 0) return 0
    const completedCount = playableNodes.filter(n => completedNodes.value.has(n.id)).length
    return Math.round((completedCount / playableNodes.length) * 100)
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
