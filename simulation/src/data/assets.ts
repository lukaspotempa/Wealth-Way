export type AssetClass = 'equity' | 'bond' | 'commodity' | 'currency' | 'crypto'

export interface Asset {
  id: string
  name: string
  ticker: string
  class: AssetClass
  description: string
  /** Annual expected return (drift) */
  mu: number
  /** Annual volatility (standard deviation) */
  sigma: number
  /** Color for charts */
  color: string
  /** Icon identifier */
  icon: string
}

export const ASSET_CLASS_LABELS: Record<AssetClass, string> = {
  equity: 'Equities',
  bond: 'Bonds',
  commodity: 'Commodities',
  currency: 'Currencies',
  crypto: 'Crypto',
}

export const ASSET_CLASS_COLORS: Record<AssetClass, string> = {
  equity: '#22c55e',
  bond: '#3b82f6',
  commodity: '#eab308',
  currency: '#8b5cf6',
  crypto: '#f97316',
}

export const assets: Asset[] = [
  // Equities
  {
    id: 'smi',
    name: 'SMI Index',
    ticker: 'SMI',
    class: 'equity',
    description: 'Swiss Market Index - Top 20 Swiss companies',
    mu: 0.07,
    sigma: 0.16,
    color: '#22c55e',
    icon: 'trending-up',
  },
  {
    id: 'eurostoxx',
    name: 'Euro Stoxx 50',
    ticker: 'SX5E',
    class: 'equity',
    description: 'Top 50 Eurozone blue-chip companies',
    mu: 0.065,
    sigma: 0.18,
    color: '#16a34a',
    icon: 'trending-up',
  },
  {
    id: 'sp500',
    name: 'S&P 500',
    ticker: 'SPX',
    class: 'equity',
    description: 'Top 500 US companies by market cap',
    mu: 0.09,
    sigma: 0.17,
    color: '#15803d',
    icon: 'trending-up',
  },
  {
    id: 'nestle',
    name: 'Nestle',
    ticker: 'NESN',
    class: 'equity',
    description: 'Swiss multinational food & beverage company',
    mu: 0.08,
    sigma: 0.20,
    color: '#4ade80',
    icon: 'building',
  },
  {
    id: 'novartis',
    name: 'Novartis',
    ticker: 'NOVN',
    class: 'equity',
    description: 'Swiss multinational pharmaceutical company',
    mu: 0.06,
    sigma: 0.22,
    color: '#86efac',
    icon: 'building',
  },
  {
    id: 'apple',
    name: 'Apple',
    ticker: 'AAPL',
    class: 'equity',
    description: 'US tech giant - iPhones, Macs, services',
    mu: 0.12,
    sigma: 0.28,
    color: '#bbf7d0',
    icon: 'building',
  },
  {
    id: 'tesla',
    name: 'Tesla',
    ticker: 'TSLA',
    class: 'equity',
    description: 'Electric vehicle & clean energy company',
    mu: 0.15,
    sigma: 0.55,
    color: '#dcfce7',
    icon: 'building',
  },
  // Bonds
  {
    id: 'swiss-bond',
    name: 'Swiss Bond Index',
    ticker: 'SBI',
    class: 'bond',
    description: 'Swiss government & corporate bond index',
    mu: 0.02,
    sigma: 0.04,
    color: '#3b82f6',
    icon: 'shield',
  },
  {
    id: 'global-bond',
    name: 'Global Bond Index',
    ticker: 'BNDW',
    class: 'bond',
    description: 'Diversified global fixed income index',
    mu: 0.03,
    sigma: 0.06,
    color: '#60a5fa',
    icon: 'shield',
  },
  // Commodities
  {
    id: 'gold',
    name: 'Gold',
    ticker: 'XAU',
    class: 'commodity',
    description: 'Physical gold - traditional safe haven asset',
    mu: 0.05,
    sigma: 0.15,
    color: '#eab308',
    icon: 'coins',
  },
  // Currencies
  {
    id: 'usdchf',
    name: 'USD/CHF',
    ticker: 'USD/CHF',
    class: 'currency',
    description: 'US Dollar vs Swiss Franc exchange rate',
    mu: 0.01,
    sigma: 0.08,
    color: '#8b5cf6',
    icon: 'dollar-sign',
  },
  {
    id: 'eurchf',
    name: 'EUR/CHF',
    ticker: 'EUR/CHF',
    class: 'currency',
    description: 'Euro vs Swiss Franc exchange rate',
    mu: 0.005,
    sigma: 0.06,
    color: '#a78bfa',
    icon: 'euro',
  },
  // Crypto
  {
    id: 'bitcoin',
    name: 'Bitcoin',
    ticker: 'BTC',
    class: 'crypto',
    description: 'Decentralized digital currency - highest market cap crypto',
    mu: 0.30,
    sigma: 0.70,
    color: '#f97316',
    icon: 'bitcoin',
  },
  {
    id: 'ethereum',
    name: 'Ethereum',
    ticker: 'ETH',
    class: 'crypto',
    description: 'Smart contract platform - second largest crypto',
    mu: 0.25,
    sigma: 0.80,
    color: '#fb923c',
    icon: 'code',
  },
]

export function getAssetById(id: string): Asset | undefined {
  return assets.find((a) => a.id === id)
}

export function getAssetsByClass(assetClass: AssetClass): Asset[] {
  return assets.filter((a) => a.class === assetClass)
}
