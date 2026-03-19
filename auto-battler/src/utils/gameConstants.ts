export interface AssetMeta {
  id: string
  name: string
  shortName: string
  category: 'equity-index' | 'single-stock' | 'gold' | 'bond' | 'fx'
  color: string
  csvFile: string
  csvColumn: number // 1-indexed column in the CSV (after date)
  description: string
  unlockRound: number // campaign: which round this becomes available
}

export const ASSETS: AssetMeta[] = [
  // Equity indices — unlocked from start
  {
    id: 'djia',
    name: 'Dow Jones Industrial Avg.',
    shortName: 'DJIA',
    category: 'equity-index',
    color: '#3b82f6',
    csvFile: 'Market_Data - Equity Indices.csv',
    csvColumn: 3,
    description: '30 large U.S. companies. The most iconic stock market index.',
    unlockRound: 1,
  },
  {
    id: 'smi',
    name: 'Swiss Market Index',
    shortName: 'SMI',
    category: 'equity-index',
    color: '#a78bfa',
    csvFile: 'Market_Data - Equity Indices.csv',
    csvColumn: 1,
    description: 'The 20 largest Swiss companies. Home market index.',
    unlockRound: 1,
  },
  {
    id: 'eurostoxx',
    name: 'Euro Stoxx 50',
    shortName: 'EU50',
    category: 'equity-index',
    color: '#60a5fa',
    csvFile: 'Market_Data - Equity Indices.csv',
    csvColumn: 2,
    description: '50 blue-chip Eurozone companies.',
    unlockRound: 1,
  },
  // Gold — unlocks round 3
  {
    id: 'gold',
    name: 'Gold (USD)',
    shortName: 'GOLD',
    category: 'gold',
    color: '#fbbf24',
    csvFile: 'Market_Data - Gold.csv',
    csvColumn: 1,
    description: 'The classic safe-haven asset. Hedges against uncertainty.',
    unlockRound: 3,
  },
  // Bonds — unlocks round 5
  {
    id: 'bonds-global',
    name: 'Global Aggregate Bonds',
    shortName: 'BOND',
    category: 'bond',
    color: '#34d399',
    csvFile: 'Market_Data - Bonds.csv',
    csvColumn: 2,
    description: 'Diversified global bond index. Lower risk, steady returns.',
    unlockRound: 5,
  },
  // FX — unlocks round 7
  {
    id: 'usdchf',
    name: 'USD / CHF',
    shortName: 'USDCHF',
    category: 'fx',
    color: '#f472b6',
    csvFile: 'Market_Data - FX.csv',
    csvColumn: 1,
    description: 'US Dollar vs Swiss Franc. Currency risk in action.',
    unlockRound: 7,
  },
  // Single stocks — unlocks round 9
  {
    id: 'aapl',
    name: 'Apple Inc.',
    shortName: 'AAPL',
    category: 'single-stock',
    color: '#6ee7b7',
    csvFile: 'Market_Data - DJIA_Single Stocks.csv',
    csvColumn: 14, // AAPL column
    description: 'The world\'s most valuable company. High growth, high volatility.',
    unlockRound: 9,
  },
  {
    id: 'nvda',
    name: 'NVIDIA Corporation',
    shortName: 'NVDA',
    category: 'single-stock',
    color: '#86efac',
    csvFile: 'Market_Data - DJIA_Single Stocks.csv',
    csvColumn: 21, // NVDA column
    description: 'AI chip leader. Extraordinary returns — and risk.',
    unlockRound: 9,
  },
  {
    id: 'gs',
    name: 'Goldman Sachs',
    shortName: 'GS',
    category: 'single-stock',
    color: '#93c5fd',
    csvFile: 'Market_Data - DJIA_Single Stocks.csv',
    csvColumn: 1,
    description: 'Major investment bank. Cyclical with the financial sector.',
    unlockRound: 9,
  },
]

export const ASSET_MAP = Object.fromEntries(ASSETS.map(a => [a.id, a]))

export const CATEGORY_LABELS: Record<AssetMeta['category'], string> = {
  'equity-index': 'Equity Index',
  'single-stock': 'Single Stock',
  'gold': 'Commodities',
  'bond': 'Fixed Income',
  'fx': 'Currencies',
}

export const STARTING_CAPITAL = 10_000

// 60/40 benchmark: 60% equities (DJIA), 40% bonds proxy (gold as fallback pre-bond-unlock)
export const BENCHMARK_ALLOCATION: Record<string, number> = {
  djia: 40,
  smi: 10,
  eurostoxx: 10,
  gold: 15,
  'bonds-global': 25,
}
