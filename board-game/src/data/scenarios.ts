import type { MarketScenario } from "../types/game";

/**
 * Three historically-grounded market scenarios.
 *
 * Each scenario defines a sequence of TimelineEvents that fire automatically
 * at specific rounds, regardless of which tile a player lands on.
 * Tile-triggered market events still occur but are dampened to ±50% of their
 * normal intensity so the scripted story remains the dominant narrative.
 *
 * Investment IDs referenced:
 *   etf-world, etf-tech, etf-green
 *   bond-gov, bond-corp
 *   stock-alpha, stock-nova, stock-terra
 */
export const SCENARIOS: MarketScenario[] = [
  // ── Scenario 1: The Turbulent 2020s ─────────────────────────────────────
  {
    id: "turbulent-2020s",
    name: "The Turbulent 2020s",
    emoji: "🦠",
    era: "2020 – 2024",
    tagline: "Pandemic crash, AI boom, and everything in between",
    description:
      "Start in early 2020 as COVID-19 upends the world. Survive the crash, ride " +
      "the recovery, navigate rate hikes — then watch AI ignite the next bull run.",
    baseSentiment: "neutral",
    events: [
      {
        id: "t20s-1",
        round: 1,
        title: "COVID-19 Pandemic Shock",
        headline: "Global lockdowns erupt — markets freefall",
        description:
          "In March 2020 the S&P 500 fell 34% in 33 days — the fastest bear market in history. " +
          "Global ETFs take a severe hit as economic activity grinds to a halt overnight.",
        affectedInvestmentIds: ["etf-world", "etf-tech", "etf-green"],
        priceMultiplier: 0.74,
        learningTip:
          "This crash felt catastrophic. But investors who stayed invested through March 2020 " +
          "fully recovered within 6 months. Panic selling locks in losses permanently.",
        severity: "major",
      },
      {
        id: "t20s-2",
        round: 2,
        title: "Pandemic Recovery & Stimulus Rally",
        headline: "Vaccines approved — stimulus floods the market",
        description:
          "Vaccine rollouts begin. The US government injects $1.9 trillion in stimulus. " +
          "Remote work fuels massive demand for tech. The NASDAQ doubles from its 2020 low.",
        affectedInvestmentIds: ["etf-tech", "etf-world"],
        priceMultiplier: 1.22,
        learningTip:
          "Markets recovered faster than the real economy. This shows that stock prices are " +
          "forward-looking — they price in expected future earnings, not just today's news.",
        severity: "major",
      },
      {
        id: "t20s-3",
        round: 3,
        title: "Meme Stock & Retail Investor Frenzy",
        headline: "Reddit sends GameStop to the moon — tech ETFs surge",
        description:
          "Retail investors pile into high-growth tech via platforms like Robinhood. " +
          "Tech ETFs ride the euphoria wave while green energy sees profit-taking.",
        affectedInvestmentIds: ["etf-tech"],
        priceMultiplier: 1.18,
        learningTip:
          "Hype-driven rallies feel great while they last. But concentration in a single " +
          "sector means you fall just as fast when sentiment shifts.",
        severity: "moderate",
      },
      {
        id: "t20s-4",
        round: 4,
        title: "Fed Rate Hikes Begin",
        headline: "Inflation hits 8.5% — the Fed raises rates aggressively",
        description:
          "The US Federal Reserve raises rates 11 times in 18 months. Higher rates crush " +
          "growth stocks and long-duration bonds. The NASDAQ falls 33% from its peak.",
        affectedInvestmentIds: ["etf-tech", "bond-gov", "bond-corp"],
        priceMultiplier: 0.80,
        learningTip:
          "Rising interest rates hurt growth stocks (future cash flows are worth less today) " +
          "AND bonds (new bonds offer higher yields, making old ones less attractive). " +
          "Diversification into real assets or short-duration bonds can cushion this.",
        severity: "major",
      },
      {
        id: "t20s-5",
        round: 5,
        title: "SVB Banking Crisis",
        headline: "Silicon Valley Bank collapses — contagion fears grip markets",
        description:
          "SVB collapses after a bank run triggered by rising rate losses. Corporate bonds " +
          "and financials are hit hard. Government bonds surge as investors flee to safety.",
        affectedInvestmentIds: ["bond-corp", "stock-alpha"],
        priceMultiplier: 0.82,
        learningTip:
          "Flight-to-safety moments show why diversification across asset classes matters. " +
          "While corporate bonds fell, government bonds rose — a natural hedge.",
        severity: "moderate",
      },
      {
        id: "t20s-6",
        round: 6,
        title: "ChatGPT / AI Revolution",
        headline: "Nvidia up 200% — AI ignites the biggest tech rally in years",
        description:
          "The launch of ChatGPT triggers massive AI investment. Nvidia's market cap " +
          "soars past $1 trillion. Tech stocks see their best year since 2003.",
        affectedInvestmentIds: ["etf-tech", "stock-alpha", "stock-nova"],
        priceMultiplier: 1.35,
        learningTip:
          "Transformative technology creates genuine long-term wealth. But the winners " +
          "are rarely obvious — broad tech ETFs capture the trend without needing to " +
          "pick the right stock.",
        severity: "major",
      },
    ],
  },

  // ── Scenario 2: The Great Bull Run ──────────────────────────────────────
  {
    id: "bull-run-2010s",
    name: "The Great Bull Run",
    emoji: "🐂",
    era: "2010 – 2019",
    tagline: "The longest bull market in history — with a few bumps",
    description:
      "The 2010s delivered the longest bull market ever recorded. Tech unicorns went " +
      "public, quantitative easing kept rates low, and patient investors were richly rewarded.",
    baseSentiment: "bullish",
    events: [
      {
        id: "bull-1",
        round: 1,
        title: "Post-Crisis Recovery",
        headline: "Global economy rebounds — markets surge",
        description:
          "The world economy finds its footing after 2008. Central banks keep rates near " +
          "zero, making equities the only game in town. Global ETFs lead the charge.",
        affectedInvestmentIds: ["etf-world", "etf-tech"],
        priceMultiplier: 1.18,
        learningTip:
          "After every major crisis, patient long-term investors are rewarded. " +
          "The 2010s bull market lasted 11 years. Investing at the bottom paid off enormously.",
        severity: "moderate",
      },
      {
        id: "bull-2",
        round: 3,
        title: "European Debt Crisis",
        headline: "Greece on the brink — eurozone fears rattle global markets",
        description:
          "Greece, Spain, and Italy face sovereign debt crises. The eurozone teeters. " +
          "World ETFs dip as investors flee to US government bonds.",
        affectedInvestmentIds: ["etf-world", "bond-corp"],
        priceMultiplier: 0.88,
        learningTip:
          "Geopolitical risk is real but usually temporary. The diversified investor " +
          "weathers these storms — they don't need to flee.",
        severity: "moderate",
      },
      {
        id: "bull-3",
        round: 5,
        title: "Tech Unicorn IPO Boom",
        headline: "Facebook, Alibaba, Snap — tech goes public in a wave of IPOs",
        description:
          "Billions flow into tech as the world's biggest companies go public. " +
          "Tech ETFs and early-stage stocks surge as the mobile era reaches full swing.",
        affectedInvestmentIds: ["etf-tech", "stock-alpha"],
        priceMultiplier: 1.28,
        learningTip:
          "IPO hype is real but risky. Many hyped IPOs underperform in the long run. " +
          "Capturing the trend via an ETF is safer than betting on individual IPOs.",
        severity: "moderate",
      },
      {
        id: "bull-4",
        round: 7,
        title: "China Flash Crash",
        headline: "Shanghai falls 30% in weeks — global markets spooked",
        description:
          "China's stock market crashes after retail speculation runs wild. " +
          "The shock ripples globally, causing a brief but sharp correction.",
        affectedInvestmentIds: ["etf-world", "etf-tech"],
        priceMultiplier: 0.87,
        learningTip:
          "Corrections feel scary but are normal. The S&P 500 averages a 10%+ pullback " +
          "every 1–2 years. Staying invested through corrections is key to long-term returns.",
        severity: "moderate",
      },
      {
        id: "bull-5",
        round: 9,
        title: "Late-Cycle Tech Mania",
        headline: "FAANG stocks hit all-time highs — is this too good to last?",
        description:
          "Apple, Amazon, Google, and Netflix dominate. Tech stocks hit record valuations. " +
          "The bull market is entering its final furious phase.",
        affectedInvestmentIds: ["etf-tech", "stock-alpha", "stock-nova"],
        priceMultiplier: 1.22,
        learningTip:
          "Late-cycle rallies can continue for years — or end tomorrow. The key lesson: " +
          "don't try to time the top. Stay diversified and rebalance regularly.",
        severity: "moderate",
      },
    ],
  },

  // ── Scenario 3: The Lost Decade ──────────────────────────────────────────
  {
    id: "lost-decade-2000s",
    name: "The Lost Decade",
    emoji: "📉",
    era: "2000 – 2010",
    tagline: "Two crashes, one decade — the ultimate test of patience",
    description:
      "The 2000s began with the dot-com bust and ended with the 2008 global financial " +
      "crisis. The S&P 500 finished the decade below where it started. Yet patient, " +
      "diversified investors still came out ahead.",
    baseSentiment: "bearish",
    events: [
      {
        id: "lost-1",
        round: 1,
        title: "Dot-com Bust",
        headline: "The internet bubble pops — NASDAQ falls 78%",
        description:
          "Overvalued tech companies with no profits collapse. The NASDAQ-100 loses 78% " +
          "of its value over 2 years. Companies like Pets.com go from IPO to bankrupt in months.",
        affectedInvestmentIds: ["etf-tech", "stock-alpha"],
        priceMultiplier: 0.62,
        learningTip:
          "Valuations matter. Companies need real revenue and profits eventually. " +
          "The dot-com lesson: diversification outside pure-tech ETFs would have saved many investors.",
        severity: "major",
      },
      {
        id: "lost-2",
        round: 2,
        title: "September 11th — Global Shock",
        headline: "Markets close for 4 days — the world changes overnight",
        description:
          "The 9/11 attacks shock global markets. The NYSE closes for 4 days. " +
          "When it reopens, broad markets fall sharply before stabilizing.",
        affectedInvestmentIds: ["etf-world", "etf-tech"],
        priceMultiplier: 0.86,
        learningTip:
          "Catastrophic events cause sharp short-term drops. But markets recovered within " +
          "a year. Diversified long-term investors who didn't panic retained their wealth.",
        severity: "major",
      },
      {
        id: "lost-3",
        round: 3,
        title: "Gradual Recovery Begins",
        headline: "Fed cuts rates — economies stabilise and slowly rebuild",
        description:
          "Interest rate cuts and government spending stabilise the economy. " +
          "World ETFs begin a slow, grinding recovery. Green energy gets early policy support.",
        affectedInvestmentIds: ["etf-world", "etf-green"],
        priceMultiplier: 1.16,
        learningTip:
          "Recoveries often start quietly — before headlines turn positive. " +
          "Investors who stayed through the bottom captured the full recovery.",
        severity: "minor",
      },
      {
        id: "lost-4",
        round: 5,
        title: "Global Housing Boom",
        headline: "Construction booms worldwide — real estate prices soar",
        description:
          "Cheap credit fuels a global construction and property boom. " +
          "Infrastructure and construction stocks surge as the world builds.",
        affectedInvestmentIds: ["stock-terra", "bond-corp"],
        priceMultiplier: 1.24,
        learningTip:
          "Sector booms can be very profitable — for those already invested. " +
          "Construction stocks (like TRRA) reflect real economic activity, not just speculation.",
        severity: "moderate",
      },
      {
        id: "lost-5",
        round: 7,
        title: "Global Financial Crisis",
        headline: "Lehman Brothers collapses — the worst crisis since 1929",
        description:
          "The subprime mortgage market implodes. Lehman Brothers files for bankruptcy. " +
          "Global credit markets freeze. This is the worst financial crisis since the Great Depression.",
        affectedInvestmentIds: [
          "etf-world",
          "etf-tech",
          "stock-terra",
          "bond-corp",
          "stock-alpha",
        ],
        priceMultiplier: 0.65,
        learningTip:
          "This is why emergency funds exist. Investors who had cash reserves could buy " +
          "at historic lows rather than being forced to sell. Those who didn't panic saw " +
          "full recovery within 4 years.",
        severity: "major",
      },
      {
        id: "lost-6",
        round: 9,
        title: "Stimulus & Green Recovery",
        headline: "Government spending rescues banks — clean energy gets a boost",
        description:
          "Massive government intervention stabilises the banking system. The Obama " +
          "stimulus includes major clean energy spending. A new bull market quietly begins.",
        affectedInvestmentIds: ["etf-world", "etf-green", "bond-gov"],
        priceMultiplier: 1.26,
        learningTip:
          "Policy matters for markets. Green energy investment was a multi-decade trend " +
          "that started here. Government bonds proved their 'safe haven' status during the crisis.",
        severity: "moderate",
      },
    ],
  },
];

export const FREE_PLAY_ID = "free-play";

export function getScenario(id: string): MarketScenario | null {
  if (id === FREE_PLAY_ID) return null;
  return SCENARIOS.find((s) => s.id === id) ?? null;
}
