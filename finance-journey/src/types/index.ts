export type AgeGroup = 'junior' | 'adolescent' | 'grown-up' | 'senior'

// ─── AutoBattle Types ────────────────────────────────────────────────────────

export type AssetKey = 'SMI' | 'BONDS_CHF' | 'GLOBAL_ETF' | 'REAL_ESTATE' | 'EMERGING_MARKETS' | 'CASH'

export type RiskLevel = 'low' | 'medium' | 'high'

export interface AutoBattleAsset {
  key: AssetKey
  name: string
  ticker: string
  description: string
  category: string
  risk: RiskLevel
  color: string
  allocation: number // 0–100
}

export interface YearlyPortfolioSnapshot {
  year: number
  portfolioValue: number
  portfolioReturn: number      // that year's return (decimal)
  sp500Value: number
  msciWorldValue: number
  inflationValue: number       // purchasing-power-eroded cash line
  sharpeRatio: number | null   // rolling Sharpe up to this year
  cumulativeReturn: number     // total return from start (decimal)
}

export interface AutoBattleResult {
  startYear: number
  endYear: number
  startingCapital: number
  snapshots: YearlyPortfolioSnapshot[]
  finalPortfolioValue: number
  finalSP500Value: number
  finalMSCIValue: number
  annualizedReturn: number      // CAGR
  volatility: number            // std dev of annual returns
  sharpeRatio: number | null
  maxDrawdown: number           // worst peak-to-trough (decimal)
  beatSP500: boolean
  beatMSCI: boolean
  beatInflation: boolean
}

export interface SharpeRatingBand {
  min: number
  max: number
  label: string
  description: string
  color: string
  bgColor: string
}

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced'

export type FinancialGoal =
  | 'gaming-pc'
  | 'bicycle'
  | 'car'
  | 'house'
  | 'vacation'
  | 'early-retirement'
  | 'start-business'

export interface UserProfile {
  ageGroup: AgeGroup | null
  experienceLevel: ExperienceLevel | null
  financialGoal: FinancialGoal | null
  onboardingComplete: boolean
}

export type NodeStatus = 'locked' | 'available' | 'completed'
export type NodeType = 'lesson' | 'quiz' | 'challenge' | 'checkpoint'

export interface JourneyNode {
  id: string
  title: string
  description: string
  type: NodeType
  status: NodeStatus
  position: { x: number; y: number }
  route: string
}

export interface LessonSlide {
  id: number
  title?: string
  content: string
  type: 'text' | 'comparison' | 'chart' | 'summary'
}

export interface ChildSavings {
  name: string
  strategy: string
  monthlyPocketMoney: number
  monthlySaving: number
  monthlySpending: number
  invested: boolean
}
