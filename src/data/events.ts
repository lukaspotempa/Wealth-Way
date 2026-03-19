import type { MarketEvent, IncomeEvent, NegativeEvent, ShopItem } from "../types/game";

// ── Market Events ──────────────────────────────────────────────────────────
export const MARKET_EVENTS: MarketEvent[] = [
  // ETF-level events (available from round 0)
  {
    id: "me-1",
    title: "Global Rally",
    description: "Optimism spreads across global markets. ETFs surge!",
    affectedInvestmentIds: ["etf-world", "etf-tech", "etf-green"],
    priceMultiplier: 1.12,
    minRound: 0,
  },
  {
    id: "me-2",
    title: "Market Correction",
    description: "Analysts warn of overvaluation. Markets dip.",
    affectedInvestmentIds: ["etf-world", "etf-tech", "etf-green"],
    priceMultiplier: 0.9,
    minRound: 0,
  },
  {
    id: "me-3",
    title: "Green Energy Boom",
    description: "New government subsidies boost renewable energy.",
    affectedInvestmentIds: ["etf-green"],
    priceMultiplier: 1.18,
    minRound: 0,
  },
  {
    id: "me-4",
    title: "Tech Sector Wobble",
    description: "Regulatory concerns shake tech investors.",
    affectedInvestmentIds: ["etf-tech"],
    priceMultiplier: 0.88,
    minRound: 0,
  },
  // Bond-level events (round 2+)
  {
    id: "me-5",
    title: "Interest Rate Hike",
    description: "Central bank raises rates. Bond yields shift!",
    affectedInvestmentIds: ["bond-gov", "bond-corp"],
    priceMultiplier: 0.94,
    minRound: 2,
  },
  {
    id: "me-6",
    title: "Flight to Safety",
    description: "Uncertainty drives investors to bonds.",
    affectedInvestmentIds: ["bond-gov", "bond-corp"],
    priceMultiplier: 1.08,
    minRound: 2,
  },
  // Stock-level events (round 4+)
  {
    id: "me-7",
    title: "Alpha's Breakthrough",
    description: "Alpha Technologies announces a revolutionary AI chip!",
    affectedInvestmentIds: ["stock-alpha"],
    priceMultiplier: 1.25,
    minRound: 4,
  },
  {
    id: "me-8",
    title: "Drug Trial Failure",
    description: "Nova Pharmaceuticals' key drug fails Phase 3 trials.",
    affectedInvestmentIds: ["stock-nova"],
    priceMultiplier: 0.7,
    minRound: 4,
  },
  {
    id: "me-9",
    title: "Construction Boom",
    description: "Infrastructure spending bill passes. Terra soars!",
    affectedInvestmentIds: ["stock-terra"],
    priceMultiplier: 1.2,
    minRound: 4,
  },
  {
    id: "me-10",
    title: "Broad Market Crash",
    description: "A global recession scare hits all markets hard.",
    affectedInvestmentIds: [
      "etf-world", "etf-tech", "etf-green",
      "bond-gov", "bond-corp",
      "stock-alpha", "stock-nova", "stock-terra",
    ],
    priceMultiplier: 0.82,
    minRound: 4,
  },
];

// ── Income Events (grouped by round ranges = player "age") ─────────────────
export const INCOME_EVENTS: IncomeEvent[] = [
  // Young (rounds 0-2)
  { id: "inc-1", description: "Your mom slipped you some pocket money!", amount: 50, minRound: 0 },
  { id: "inc-2", description: "You found $30 in your old jacket!", amount: 30, minRound: 0 },
  { id: "inc-3", description: "Grandma sent a birthday card with cash!", amount: 75, minRound: 0 },
  { id: "inc-4", description: "You sold some old toys online.", amount: 40, minRound: 0 },
  // Mid-career (rounds 3-5)
  { id: "inc-5", description: "You got a performance bonus at work!", amount: 150, minRound: 3 },
  { id: "inc-6", description: "A freelance gig paid off handsomely.", amount: 200, minRound: 3 },
  { id: "inc-7", description: "Tax refund arrived!", amount: 120, minRound: 3 },
  // Established (rounds 6+)
  { id: "inc-8", description: "Your side business turned a profit!", amount: 300, minRound: 6 },
  { id: "inc-9", description: "You received a generous year-end bonus.", amount: 400, minRound: 6 },
  { id: "inc-10", description: "A consulting fee landed in your account.", amount: 250, minRound: 6 },
];

// ── Negative Events ────────────────────────────────────────────────────────
export const NEGATIVE_EVENTS: NegativeEvent[] = [
  { id: "neg-1", description: "Your phone screen cracked. Repair costs $80.", cost: 80, minRound: 0 },
  { id: "neg-2", description: "A parking ticket! Pay $50.", cost: 50, minRound: 0 },
  { id: "neg-3", description: "Your laptop broke down. That's $200.", cost: 200, minRound: 0 },
  { id: "neg-4", description: "A pipe burst at home! Emergency repair: $500.", cost: 500, minRound: 2 },
  { id: "neg-5", description: "Car accident! Insurance deductible: $400.", cost: 400, minRound: 2 },
  { id: "neg-6", description: "Medical emergency! Hospital bill: $800.", cost: 800, minRound: 3 },
  { id: "neg-7", description: "Roof damage from a storm. Repair: $1000.", cost: 1000, minRound: 4 },
  { id: "neg-8", description: "Tax audit! You owe $1500 in back taxes.", cost: 1500, minRound: 5 },
  { id: "neg-9", description: "Major home renovation needed: $2000.", cost: 2000, minRound: 6 },
];

// ── Shop Items ─────────────────────────────────────────────────────────────
export const SHOP_ITEMS: ShopItem[] = [
  {
    id: "shop-tax-shield",
    name: "Insurance Policy",
    description: "Ignore your next negative event. Lasts 3 turns.",
    cost: 150,
    powerUpType: "tax-shield",
    duration: 3,
  },
  {
    id: "shop-insider",
    name: "Insider Newsletter",
    description: "Preview the next market event before it resolves. Lasts 1 turn.",
    cost: 100,
    powerUpType: "insider-info",
    duration: 1,
  },
  {
    id: "shop-interest",
    name: "Premium Savings Account",
    description: "Double your daily interest (2% → 4%) for 3 turns.",
    cost: 200,
    powerUpType: "interest-boost",
    duration: 3,
  },
  {
    id: "shop-analyst",
    name: "Market Analyst Report",
    description: "See detailed trend predictions for 2 turns.",
    cost: 120,
    powerUpType: "market-analyst",
    duration: 2,
  },
];
