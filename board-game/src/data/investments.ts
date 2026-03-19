import type { InvestmentOption } from "../types/game";

/**
 * All available investment options.
 * `unlockRound` controls progressive unlocking:
 *   - Round 0: ETFs available
 *   - Round 2: Bonds unlock
 *   - Round 4: Individual stocks unlock
 */
export const INVESTMENTS: InvestmentOption[] = [
  // --- ETFs (available from start) ---
  {
    id: "etf-world",
    name: "Global World ETF",
    ticker: "WRLD",
    category: "etf",
    currentPrice: 100,
    priceHistory: [100],
    lastChange: 0,
    volatility: 0.04,
    unlockRound: 0,
  },
  {
    id: "etf-tech",
    name: "Tech Sector ETF",
    ticker: "TECH",
    category: "etf",
    currentPrice: 120,
    priceHistory: [120],
    lastChange: 0,
    volatility: 0.07,
    unlockRound: 0,
  },
  {
    id: "etf-green",
    name: "Green Energy ETF",
    ticker: "GREN",
    category: "etf",
    currentPrice: 80,
    priceHistory: [80],
    lastChange: 0,
    volatility: 0.06,
    unlockRound: 0,
  },

  // --- Bonds (unlock round 2) ---
  {
    id: "bond-gov",
    name: "Government Bond",
    ticker: "GOVB",
    category: "bond",
    currentPrice: 50,
    priceHistory: [50],
    lastChange: 0,
    volatility: 0.015,
    unlockRound: 2,
  },
  {
    id: "bond-corp",
    name: "Corporate Bond",
    ticker: "CORP",
    category: "bond",
    currentPrice: 75,
    priceHistory: [75],
    lastChange: 0,
    volatility: 0.025,
    unlockRound: 2,
  },

  // --- Stocks (unlock round 4) ---
  {
    id: "stock-alpha",
    name: "Alpha Technologies",
    ticker: "ALPH",
    category: "stock",
    currentPrice: 200,
    priceHistory: [200],
    lastChange: 0,
    volatility: 0.12,
    unlockRound: 4,
  },
  {
    id: "stock-nova",
    name: "Nova Pharmaceuticals",
    ticker: "NOVA",
    category: "stock",
    currentPrice: 150,
    priceHistory: [150],
    lastChange: 0,
    volatility: 0.10,
    unlockRound: 4,
  },
  {
    id: "stock-terra",
    name: "Terra Construction",
    ticker: "TRRA",
    category: "stock",
    currentPrice: 90,
    priceHistory: [90],
    lastChange: 0,
    volatility: 0.08,
    unlockRound: 4,
  },
];
