export type AgeGroup = 'junior' | 'adolescent' | 'grown-up' | 'senior'

// ─── AutoBattle Types ────────────────────────────────────────────────────────

// Equity indices
export type IndexAssetKey = 'SMI_INDEX' | 'EUROSTOXX50' | 'DJIA_INDEX' | 'NIKKEI' | 'DAX'
// Bond assets
export type BondAssetKey = 'SWISS_BOND_TRI' | 'BLOOMBERG_GLOBAL_AGG'
// Commodity
export type CommodityAssetKey = 'GOLD_CHF'
// SMI single stocks
export type SMIStockKey =
  | 'LOGN' | 'AMRZ' | 'ALC' | 'UBSG' | 'SREN' | 'CFR' | 'SLHN' | 'PGHN'
  | 'LONN' | 'KNIN' | 'SIKA' | 'NESN' | 'HOLN' | 'ROG' | 'ABBN' | 'NOVN'
  | 'ZURN' | 'GIVN' | 'GEBN' | 'SCMN'
// DJIA single stocks
export type DJIAStockKey =
  | 'GS' | 'CAT' | 'MSFT' | 'HD' | 'SHW' | 'AMGN' | 'AXP' | 'MCD' | 'V'
  | 'JPM' | 'TRV' | 'UNH' | 'IBM' | 'AAPL' | 'JNJ' | 'BA' | 'HON' | 'AMZN'
  | 'CRM' | 'CVX' | 'NVDA' | 'MMM' | 'PG' | 'WMT' | 'MRK' | 'DIS' | 'KO'
  | 'CSCO' | 'NKE' | 'VZ'

export type AssetKey = IndexAssetKey | BondAssetKey | CommodityAssetKey | SMIStockKey | DJIAStockKey

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
