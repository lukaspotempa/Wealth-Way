import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      redirect: () => {
        const userStore = useUserStore()
        return userStore.profile.onboardingComplete ? '/journey' : '/onboarding'
      },
    },
    {
      path: '/onboarding',
      name: 'onboarding',
      component: () => import('@/views/OnboardingView.vue'),
    },
    {
      path: '/journey',
      name: 'journey',
      component: () => import('@/views/JourneyView.vue'),
      meta: { requiresOnboarding: true },
    },
    {
      path: '/lesson/:id',
      name: 'lesson',
      component: () => import('@/views/LessonView.vue'),
      meta: { requiresOnboarding: true },
    },
    {
      path: '/challenge',
      name: 'challenge',
      component: () => import('@/views/ChallengeView.vue'),
      meta: { requiresOnboarding: true },
    },
    {
      // Standalone AutoBattle — accessible without completing the full journey
      path: '/autobattle',
      name: 'autobattle',
      component: () => import('@/views/ChallengeView.vue'),
      meta: { requiresOnboarding: true },
    },
  ],
})

router.beforeEach((to) => {
  const userStore = useUserStore()

  if (to.meta.requiresOnboarding && !userStore.profile.onboardingComplete) {
    return { name: 'onboarding' }
  }

  if (to.name === 'onboarding' && userStore.profile.onboardingComplete) {
    return { name: 'journey' }
  }
})

export default router
