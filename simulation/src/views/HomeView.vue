<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Card, CardContent } from '@/components/ui'

const router = useRouter()

const features = [
  {
    title: 'Risk Profile',
    description: 'Discover your investor type with our quick quiz. Get a personalized asset allocation recommendation.',
    icon: 'user-check',
    path: '/risk-profile',
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
  },
  {
    title: 'Sandbox Mode',
    description: 'Build your portfolio and simulate 20 years of market history. Experience bull and bear markets in minutes.',
    icon: 'play',
    path: '/sandbox',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    title: 'Battle Mode',
    description: 'Challenge a friend! Both players face the same market - who builds the better portfolio?',
    icon: 'swords',
    path: '/battle',
    color: 'text-orange-400',
    bgColor: 'bg-orange-400/10',
  },
  {
    title: 'Leaderboard',
    description: 'See how you rank against other players. Track the best portfolio strategies.',
    icon: 'trophy',
    path: '/leaderboard',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-400/10',
  },
]

const learningPoints = [
  { title: 'Diversification', desc: 'Learn why not putting all eggs in one basket matters' },
  { title: 'Risk & Return', desc: 'Understand the relationship between risk and potential gains' },
  { title: 'Long-term Thinking', desc: 'See how time in the market beats timing the market' },
  { title: 'Volatility', desc: 'Experience market ups and downs without risking real money' },
  { title: 'Asset Classes', desc: 'Explore stocks, bonds, gold, currencies, and crypto' },
  { title: 'Compound Growth', desc: 'Watch your money grow exponentially over decades' },
]
</script>

<template>
  <div class="container mx-auto px-4 py-8 max-w-6xl">
    <!-- Hero -->
    <div class="text-center mb-12">
      <div class="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm text-primary mb-6">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
          <polyline points="16 7 22 7 22 13" />
        </svg>
        PostFinance Investment Education
      </div>

      <h1 class="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
        Wealth Manager
        <span class="text-primary"> Arena</span>
      </h1>
      <p class="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-2">
        The Investing Game
        <span class="text-primary font-semibold"> Bull</span>
        vs
        <span class="text-destructive font-semibold"> Bear</span>
        Edition
      </p>
      <p class="text-sm text-muted-foreground max-w-xl mx-auto mb-8">
        Learn to invest without risking real money. Build portfolios, simulate 20 years of market history,
        and compete with friends. Experience the power of long-term investing in minutes.
      </p>

      <div class="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          class="inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground px-6 py-3 text-sm font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
          @click="router.push('/risk-profile')"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
          </svg>
          Start with Risk Profile
        </button>
        <button
          class="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-secondary px-6 py-3 text-sm font-semibold hover:bg-accent transition-colors cursor-pointer"
          @click="router.push('/sandbox')"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="6 3 20 12 6 21 6 3" />
          </svg>
          Jump to Sandbox
        </button>
      </div>
    </div>

    <!-- Feature Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
      <Card
        v-for="feature in features"
        :key="feature.path"
        class="cursor-pointer hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
        @click="router.push(feature.path)"
      >
        <CardContent class="p-6">
          <div :class="['w-10 h-10 rounded-lg flex items-center justify-center mb-4', feature.bgColor]">
            <svg v-if="feature.icon === 'user-check'" :class="feature.color" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/>
            </svg>
            <svg v-else-if="feature.icon === 'play'" :class="feature.color" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="6 3 20 12 6 21 6 3"/>
            </svg>
            <svg v-else-if="feature.icon === 'swords'" :class="feature.color" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><line x1="13" x2="19" y1="19" y2="13"/><line x1="16" x2="20" y1="16" y2="20"/><line x1="19" x2="21" y1="21" y2="19"/><polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5"/><line x1="5" x2="9" y1="14" y2="18"/><line x1="7" x2="4" y1="17" y2="20"/><line x1="3" x2="5" y1="19" y2="21"/>
            </svg>
            <svg v-else :class="feature.color" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
            </svg>
          </div>
          <h3 class="font-semibold mb-1">{{ feature.title }}</h3>
          <p class="text-sm text-muted-foreground">{{ feature.description }}</p>
        </CardContent>
      </Card>
    </div>

    <!-- What You'll Learn -->
    <div class="mb-12">
      <h2 class="text-2xl font-bold text-center mb-6">What You'll Learn</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div
          v-for="point in learningPoints"
          :key="point.title"
          class="flex items-start gap-3 rounded-lg border border-border p-4 bg-card"
        >
          <div class="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center mt-0.5 shrink-0">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" class="text-primary">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div>
            <p class="font-medium text-sm">{{ point.title }}</p>
            <p class="text-xs text-muted-foreground">{{ point.desc }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="text-center text-xs text-muted-foreground pb-8">
      <p>Wealth Manager Arena - A PostFinance Investment Education Prototype</p>
      <p class="mt-1">No real money is involved. All market data is simulated.</p>
    </div>
  </div>
</template>
