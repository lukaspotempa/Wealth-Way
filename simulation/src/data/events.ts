export type EventSeverity = 'positive' | 'negative' | 'neutral'

export interface MarketEvent {
  id: string
  title: string
  description: string
  educationalTip: string
  severity: EventSeverity
  /** Month at which this event occurs in the simulation */
  month: number
  /** Impact on annual drift (added to mu) */
  driftShock: number
  /** Multiplier on volatility */
  volMultiplier: number
  /** Icon identifier */
  icon: string
}

export const marketEvents: MarketEvent[] = [
  // Year 1-2: Early growth
  {
    id: 'tech-boom',
    title: 'Tech Sector Boom',
    description: 'Technology companies report record earnings. AI revolution drives growth across the sector.',
    educationalTip: 'Growth phases reward patience. Investors who stay invested during booms capture gains that make up for slower periods.',
    severity: 'positive',
    month: 8,
    driftShock: 0.15,
    volMultiplier: 1.2,
    icon: 'rocket',
  },
  // Year 3: First correction
  {
    id: 'rate-hike',
    title: 'Interest Rate Hike',
    description: 'Central banks raise interest rates by 0.75% to combat inflation. Bond yields spike, equity valuations compress.',
    educationalTip: 'Rising interest rates typically hurt bond prices and high-growth stocks. Diversification across asset classes helps cushion the blow.',
    severity: 'negative',
    month: 30,
    driftShock: -0.10,
    volMultiplier: 1.5,
    icon: 'arrow-up',
  },
  // Year 4: Recovery
  {
    id: 'stimulus-package',
    title: 'Government Stimulus',
    description: 'Major fiscal stimulus package announced. Infrastructure spending boosts economic outlook.',
    educationalTip: 'Government spending can stimulate economic growth. Markets often react positively to fiscal expansion.',
    severity: 'positive',
    month: 48,
    driftShock: 0.08,
    volMultiplier: 0.9,
    icon: 'landmark',
  },
  // Year 5-6: Housing crisis
  {
    id: 'housing-crisis',
    title: 'Housing Market Correction',
    description: 'Real estate prices drop 15%. Banking sector under pressure as mortgage defaults rise.',
    educationalTip: 'Real estate crises can spill over into financial markets. This is why diversification beyond just stocks and real estate matters.',
    severity: 'negative',
    month: 62,
    driftShock: -0.20,
    volMultiplier: 2.0,
    icon: 'home',
  },
  // Year 7: Commodity surge
  {
    id: 'gold-surge',
    title: 'Gold Price Surge',
    description: 'Geopolitical tensions drive investors to safe-haven assets. Gold prices jump 20%.',
    educationalTip: 'Gold often acts as a "safe haven" during uncertainty. A small allocation to gold can reduce overall portfolio volatility.',
    severity: 'neutral',
    month: 78,
    driftShock: 0.05,
    volMultiplier: 1.3,
    icon: 'shield',
  },
  // Year 8-9: Strong bull market
  {
    id: 'bull-market',
    title: 'Extended Bull Market',
    description: 'Global economy enters longest expansion in decades. Corporate earnings hit all-time highs.',
    educationalTip: 'Bull markets can last years. The key lesson: time in the market beats timing the market. Stay invested!',
    severity: 'positive',
    month: 96,
    driftShock: 0.12,
    volMultiplier: 0.8,
    icon: 'trending-up',
  },
  // Year 10: Pandemic shock
  {
    id: 'pandemic',
    title: 'Global Pandemic',
    description: 'A worldwide health crisis causes markets to crash 30% in weeks. Unprecedented volatility.',
    educationalTip: 'Panic selling during crashes locks in losses. Historically, markets have always recovered from crashes - patience is key.',
    severity: 'negative',
    month: 118,
    driftShock: -0.35,
    volMultiplier: 3.0,
    icon: 'alert-triangle',
  },
  // Year 11: Recovery
  {
    id: 'pandemic-recovery',
    title: 'Post-Pandemic Recovery',
    description: 'Massive monetary stimulus and vaccine rollout fuel rapid market recovery. V-shaped bounce.',
    educationalTip: 'Recoveries often happen faster than expected. Those who sold during the panic missed the strongest recovery days.',
    severity: 'positive',
    month: 130,
    driftShock: 0.25,
    volMultiplier: 1.5,
    icon: 'activity',
  },
  // Year 12-13: Inflation spike
  {
    id: 'inflation-spike',
    title: 'Inflation Shock',
    description: 'Inflation reaches 8%, eroding purchasing power. Central banks begin aggressive tightening cycle.',
    educationalTip: 'Inflation eats into returns. Equities and real assets (gold, real estate) tend to be better inflation hedges than bonds or cash.',
    severity: 'negative',
    month: 150,
    driftShock: -0.12,
    volMultiplier: 1.8,
    icon: 'flame',
  },
  // Year 14: Crypto crash
  {
    id: 'crypto-crash',
    title: 'Crypto Winter',
    description: 'Major crypto exchange collapses. Bitcoin drops 60%. Regulatory crackdowns intensify.',
    educationalTip: 'Highly volatile assets like crypto can produce extreme losses. Never invest more in crypto than you can afford to lose.',
    severity: 'negative',
    month: 165,
    driftShock: -0.08,
    volMultiplier: 2.5,
    icon: 'zap',
  },
  // Year 15: Rate cuts
  {
    id: 'rate-cuts',
    title: 'Rate Cut Cycle Begins',
    description: 'Inflation tamed. Central banks begin cutting rates. Bonds rally, equities recover.',
    educationalTip: 'Falling interest rates boost both bond and stock prices. This is why long-term investors who weather storms are rewarded.',
    severity: 'positive',
    month: 180,
    driftShock: 0.10,
    volMultiplier: 0.9,
    icon: 'arrow-down',
  },
  // Year 16-17: Emerging markets boom
  {
    id: 'em-boom',
    title: 'Emerging Markets Rally',
    description: 'Developing economies surge. Strong GDP growth in Asia and Latin America lifts global markets.',
    educationalTip: 'Global diversification exposes your portfolio to growth opportunities beyond your home market.',
    severity: 'positive',
    month: 195,
    driftShock: 0.08,
    volMultiplier: 1.1,
    icon: 'globe',
  },
  // Year 18: Trade war
  {
    id: 'trade-war',
    title: 'Global Trade War',
    description: 'Major economies impose tariffs. Supply chains disrupted. Market uncertainty rises.',
    educationalTip: 'Geopolitical events cause short-term volatility but rarely derail long-term economic growth. Stay the course.',
    severity: 'negative',
    month: 210,
    driftShock: -0.10,
    volMultiplier: 1.6,
    icon: 'shield-alert',
  },
  // Year 19: Innovation boom
  {
    id: 'innovation-boom',
    title: 'Innovation Supercycle',
    description: 'Breakthroughs in AI, clean energy, and biotech drive a new wave of productivity growth.',
    educationalTip: 'Innovation drives long-term economic growth. Companies that invest in R&D tend to outperform over decades.',
    severity: 'positive',
    month: 225,
    driftShock: 0.15,
    volMultiplier: 1.2,
    icon: 'lightbulb',
  },
  // Year 20: Final assessment
  {
    id: 'final-rally',
    title: 'End of Cycle Rally',
    description: 'Markets consolidate gains. Long-term investors see the power of compounding over 20 years.',
    educationalTip: 'The most important factor in investing success is TIME. Even modest returns compound into significant wealth over 20 years.',
    severity: 'positive',
    month: 235,
    driftShock: 0.05,
    volMultiplier: 0.8,
    icon: 'trophy',
  },
]

export function getEventsUpToMonth(month: number): MarketEvent[] {
  return marketEvents.filter((e) => e.month <= month)
}

export function getEventAtMonth(month: number): MarketEvent | undefined {
  return marketEvents.find((e) => e.month === month)
}

export function getEventImpacts() {
  return marketEvents.map((e) => ({
    month: e.month,
    driftShock: e.driftShock,
    volMultiplier: e.volMultiplier,
  }))
}
