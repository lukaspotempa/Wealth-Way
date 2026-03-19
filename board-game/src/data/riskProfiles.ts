import type { RiskProfile } from "../types/game";

/**
 * Four risk profiles for starting portfolio allocation.
 *
 * Holdings are defined in shares at initial prices:
 *   WRLD = $100, TECH = $120, GREN = $80
 *
 * Conservative:  2×WRLD = $200 invested, $800 cash
 * Balanced:      3×WRLD + 1×TECH = $420 invested, $580 cash
 * Growth:        2×WRLD + 2×TECH + 1×GREN = $520 invested, $480 cash
 * Aggressive:    1×WRLD + 3×TECH + 2×GREN = $620 invested, $380 cash
 *
 * This teaches risk profiling before the first dice roll.
 */
export const RISK_PROFILES: RiskProfile[] = [
  {
    id: "conservative",
    name: "Conservative",
    emoji: "🛡️",
    tagline: "Safety first",
    description:
      "Mostly cash with a small global ETF position. Slow and steady, but you sleep well at night.",
    initialHoldings: [{ investmentId: "etf-world", quantity: 2 }],
  },
  {
    id: "balanced",
    name: "Balanced",
    emoji: "⚖️",
    tagline: "Best of both worlds",
    description:
      "A mix of cash and diversified ETFs. The classic textbook starting point.",
    initialHoldings: [
      { investmentId: "etf-world", quantity: 3 },
      { investmentId: "etf-tech", quantity: 1 },
    ],
  },
  {
    id: "growth",
    name: "Growth",
    emoji: "📈",
    tagline: "Invest to grow",
    description:
      "Mostly invested across multiple ETFs. You accept short-term swings for long-term gains.",
    initialHoldings: [
      { investmentId: "etf-world", quantity: 2 },
      { investmentId: "etf-tech", quantity: 2 },
      { investmentId: "etf-green", quantity: 1 },
    ],
  },
  {
    id: "aggressive",
    name: "Aggressive",
    emoji: "🎯",
    tagline: "High risk, high reward",
    description:
      "Heavy tech and green energy exposure. Buckle up — volatility is your best friend.",
    initialHoldings: [
      { investmentId: "etf-world", quantity: 1 },
      { investmentId: "etf-tech", quantity: 3 },
      { investmentId: "etf-green", quantity: 2 },
    ],
  },
];

export function getRiskProfile(id: string): RiskProfile {
  return RISK_PROFILES.find((p) => p.id === id) ?? RISK_PROFILES[1];
}
