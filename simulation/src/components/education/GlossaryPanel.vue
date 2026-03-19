<script setup lang="ts">
import { ref } from 'vue'
import { Sheet } from '@/components/ui'

const isOpen = ref(false)

const glossaryTerms = [
  {
    term: 'Diversification',
    definition: 'Spreading investments across different asset classes, sectors, and regions to reduce risk. When one investment falls, others may rise, cushioning the overall impact.',
  },
  {
    term: 'Volatility',
    definition: 'A measure of how much an asset\'s price fluctuates. Higher volatility means bigger price swings - both up and down. Crypto and individual stocks tend to be more volatile than bonds.',
  },
  {
    term: 'Bull Market',
    definition: 'A period when prices are rising or expected to rise. Named after a bull\'s upward horn thrust. Bull markets can last months or years.',
  },
  {
    term: 'Bear Market',
    definition: 'A period when prices fall 20% or more from recent highs. Named after a bear\'s downward paw swipe. Bear markets test investor discipline.',
  },
  {
    term: 'Compound Interest',
    definition: 'Earning returns on your returns. Over time, compound growth becomes exponential. This is why starting to invest early matters so much.',
  },
  {
    term: 'Asset Class',
    definition: 'A category of investments with similar characteristics. Main classes include equities (stocks), bonds (fixed income), commodities (gold), currencies, and crypto.',
  },
  {
    term: 'Drawdown',
    definition: 'The decline from a portfolio\'s peak value to its lowest point before a new peak. A key measure of downside risk.',
  },
  {
    term: 'Sharpe Ratio',
    definition: 'A measure of risk-adjusted return. It shows how much extra return you earn per unit of risk taken. Higher is better: above 1.0 is good, above 2.0 is excellent.',
  },
  {
    term: 'Risk Profile',
    definition: 'An assessment of your ability and willingness to take investment risk, based on factors like time horizon, financial goals, and emotional tolerance for losses.',
  },
  {
    term: 'Dollar-Cost Averaging',
    definition: 'Investing a fixed amount regularly regardless of price. You buy more shares when prices are low and fewer when high, lowering your average cost over time.',
  },
  {
    term: 'ETF (Exchange-Traded Fund)',
    definition: 'A fund that tracks an index (like the SMI or S&P 500) and can be bought like a stock. ETFs provide instant diversification at low cost.',
  },
  {
    term: 'Benchmark',
    definition: 'A standard against which portfolio performance is measured. Common benchmarks include the SMI, S&P 500, or a simple bonds/stocks mix.',
  },
]

function toggle() {
  isOpen.value = !isOpen.value
}

defineExpose({ toggle })
</script>

<template>
  <button
    class="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
    @click="toggle"
  >
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />
    </svg>
    Glossary
  </button>

  <Sheet :open="isOpen" @update:open="isOpen = $event">
    <h2 class="text-lg font-bold mb-4 mt-4">Investment Glossary</h2>
    <p class="text-xs text-muted-foreground mb-4">Key terms to understand while playing.</p>

    <div class="space-y-4">
      <div
        v-for="item in glossaryTerms"
        :key="item.term"
        class="border-b border-border pb-3 last:border-0"
      >
        <h3 class="text-sm font-semibold text-primary mb-1">{{ item.term }}</h3>
        <p class="text-xs text-muted-foreground leading-relaxed">{{ item.definition }}</p>
      </div>
    </div>
  </Sheet>
</template>
