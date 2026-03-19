import type { MarketEvent, IncomeEvent, NegativeEvent, ShopItem } from "../types/game";

// ── Market Events ──────────────────────────────────────────────────────────
//
// All multipliers are grounded in real historical data. Sources referenced:
//   - COVID crash (Mar 2020): S&P 500 fell ~34% peak-to-trough
//   - Post-COVID AI/Tech rally (2020–2021): NASDAQ-100 rose ~80%+ from trough
//   - 2022 Fed rate hikes: US Treasuries lost ~15–18%, NASDAQ -33%
//   - 2021 clean energy bubble: iShares Global Clean Energy ETF -40% from peak
//   - Wirecard fraud (Jun 2020): stock lost ~98% of value over days
//   - ChatGPT / AI boom (2023): Nvidia +200%, tech ETFs +55%
//   - SVB / banking crisis (Mar 2023): corporate bonds hit, flight to gov bonds
//   - Russia/Ukraine war (Feb 2022): broad market -15%, energy spike
//   - Pfizer/BioNTech vaccine approval (Nov 2020): +71% in one session
//   - IIJA infrastructure bill (2021): US construction/engineering stocks +20%
//   - Dot-com bust (2000–2002): NASDAQ -78% over ~2 years; single events -12%/day
//
export const MARKET_EVENTS: MarketEvent[] = [

  // ── ETF-level events (available from round 0) ────────────────────────────

  {
    id: "me-1",
    title: "COVID-19 Pandemic Shock",
    description:
      "Global lockdowns erupt. Demand collapses overnight. In March 2020 the S&P 500 " +
      "fell 34% in 33 days — the fastest bear market in history. Broad ETFs take a severe hit. " +
      "Lesson: even diversified funds cannot escape systemic shocks.",
    affectedInvestmentIds: ["etf-world", "etf-tech", "etf-green"],
    priceMultiplier: 0.74,   // ~−26%: fast crash but tech recovered faster than world/green
    minRound: 0,
    learningTip:
      "During the 2020 crash, investors who stayed the course recovered fully within 6 months. Panic selling locks in losses permanently — time in the market beats timing the market.",
  },
  {
    id: "me-2",
    title: "Post-COVID AI & Tech Rally",
    description:
      "Vaccines roll out and stimulus floods the market. Remote work explodes. Cloud, " +
      "AI, and semiconductor demand surges. The NASDAQ-100 nearly doubled from its 2020 " +
      "low to late 2021. Tech ETFs lead the rally. Overconcentration in tech, however, " +
      "leaves sector-only investors exposed when the tide turns.",
    affectedInvestmentIds: ["etf-tech", "etf-world"],
    priceMultiplier: 1.22,   // +22%: strong broad rally; milder than full 2020–21 run
    minRound: 0,
    learningTip:
      "Investors who held through the 2020 crash and into 2021 saw gains of 80%+. This is why emotional decisions during crashes are so costly — the recovery is often swift and powerful.",
  },
  {
    id: "me-3",
    title: "Russia–Ukraine War Outbreak",
    description:
      "Russia invades Ukraine in February 2022. Energy prices spike, supply chains fracture, " +
      "and inflation accelerates. The MSCI World fell ~15% in the first weeks of the conflict. " +
      "Green energy received a secondary boost from Europe's push for energy independence.",
    affectedInvestmentIds: ["etf-world", "etf-tech"],
    priceMultiplier: 0.86,   // −14%: broad market hit; matches early-2022 drawdown
    minRound: 0,
  },
  {
    id: "me-4",
    title: "Green Energy Policy Boom",
    description:
      "Sweeping climate legislation (modelled on the US Inflation Reduction Act, 2022, " +
      "and EU Green Deal) unlocks hundreds of billions in renewable subsidies. Solar and " +
      "wind stocks doubled in the initial euphoria. iShares Global Clean Energy ETF gained " +
      "~140% from early 2020 to its Jan 2021 peak.",
    affectedInvestmentIds: ["etf-green"],
    priceMultiplier: 1.21,   // +21%: strong policy-driven rally
    minRound: 0,
  },
  {
    id: "me-5",
    title: "Clean Energy Bubble Bursts",
    description:
      "After the 2021 green-energy mania, rising interest rates and profit-taking cause a " +
      "sharp correction. The iShares Global Clean Energy ETF fell ~40% from its Jan 2021 " +
      "peak by year end. Speculative green stocks suffer even more. Hype without earnings " +
      "is fragile.",
    affectedInvestmentIds: ["etf-green"],
    priceMultiplier: 0.72,   // −28%: partial correction in a single game event
    minRound: 0,
  },
  {
    id: "me-6",
    title: "Dot-Com Bubble Echo",
    description:
      "Valuations in tech reach dot-com-era extremes. Retail investors pile into loss-making " +
      "growth stocks. When the narrative cracks, the NASDAQ-100 fell 78% from peak (2000–2002). " +
      "A single large correction day during this period saw the index drop 9–12% in one session.",
    affectedInvestmentIds: ["etf-tech"],
    priceMultiplier: 0.87,   // −13%: single-event snapshot of a multi-year crash
    minRound: 0,
  },
  {
    id: "me-7",
    title: "ChatGPT Ignites AI Frenzy",
    description:
      "OpenAI's ChatGPT crosses 100 million users in 60 days — the fastest product adoption " +
      "in history. Every company pivots to AI. Nvidia's stock rose ~200% in 2023 alone. The " +
      "NASDAQ-100 gained +55% in 2023. AI infrastructure spending creates a virtuous cycle " +
      "for tech ETFs — until the next rotation.",
    affectedInvestmentIds: ["etf-tech"],
    priceMultiplier: 1.18,   // +18%: large but not full-year run compressed into one event
    minRound: 0,
    learningTip:
      "Narrative-driven rallies can be real AND overextended at the same time. ETFs let you participate in a tech boom without betting your entire portfolio on a single company winning.",
  },

  // ── Bond-level events (round 2+) ─────────────────────────────────────────

  {
    id: "me-8",
    title: "Fed Inflation Shock: 11 Consecutive Rate Hikes",
    description:
      "The US Federal Reserve raised rates from 0.25% to 5.5% between March 2022 and July 2023 " +
      "— the most aggressive hiking cycle in 40 years. Long-dated US Treasuries lost 15–18% " +
      "in price. Investment-grade corporate bonds lost 13–15%. The 60/40 portfolio had its " +
      "worst year since 1937.",
    affectedInvestmentIds: ["bond-gov", "bond-corp"],
    priceMultiplier: 0.84,   // −16%: matches ~avg of gov+corp bond losses in 2022
    minRound: 2,
    learningTip:
      "When interest rates rise, existing bond prices fall — they move in opposite directions. Shorter-duration bonds are less sensitive. This is why bond diversification across durations matters.",
  },
  {
    id: "me-9",
    title: "SVB Collapse: Flight to Government Bonds",
    description:
      "Silicon Valley Bank fails in March 2023 — the second-largest US bank failure ever. " +
      "Panic spreads. Investors dump riskier corporate bonds and pile into US Treasuries. " +
      "Government bond prices surge as yields plummet on safe-haven demand. Corporate bonds " +
      "widen in spread.",
    affectedInvestmentIds: ["bond-gov"],
    priceMultiplier: 1.09,   // +9%: flight-to-safety premium on gov bonds
    minRound: 2,
  },
  {
    id: "me-10",
    title: "Corporate Credit Crunch",
    description:
      "A wave of high-yield defaults (echoing 2008 sub-prime and 2020 COVID stress) causes " +
      "investment-grade spreads to widen sharply. Corporate bond prices fall as risk premiums " +
      "spike. Government bonds hold firm as a diversification buffer.",
    affectedInvestmentIds: ["bond-corp"],
    priceMultiplier: 0.88,   // −12%: typical spread widening in a credit stress event
    minRound: 2,
  },
  {
    id: "me-11",
    title: "Central Bank Pivot: Rate Cuts Begin",
    description:
      "After a prolonged hiking cycle, the central bank signals cuts are coming. Bond prices " +
      "rally strongly as yields fall. In the 12 months following the Fed's 2019 pivot and again " +
      "in 2023, long-duration bonds returned 8–14%. Both government and corporate bonds benefit.",
    affectedInvestmentIds: ["bond-gov", "bond-corp"],
    priceMultiplier: 1.1,   // +10%: solid bond rally on rate-cut expectations
    minRound: 2,
  },

  // ── Stock-level events (round 4+) ─────────────────────────────────────────

  {
    id: "me-12",
    title: "Nvidia Rides the AI Supercycle",
    description:
      "Data-centre demand for AI accelerators is insatiable. Nvidia's revenue grows 122% " +
      "year-over-year in 2024. Its stock price rose from ~$150 to over $900 in 18 months " +
      "(split-adjusted). Investors in concentrated AI positions are rewarded enormously — " +
      "but the stock's P/E tops 70×, making a correction a matter of when, not if.",
    affectedInvestmentIds: ["stock-alpha"],
    priceMultiplier: 1.28,   // +28%: large single-event gain; mirrors a strong earnings beat
    minRound: 4,
  },
  {
    id: "me-13",
    title: "Tech Antitrust Crackdown",
    description:
      "Regulators in the US and EU simultaneously launch antitrust actions against dominant " +
      "tech platforms (echoing Google, Meta, and Apple cases 2020–2024). Uncertainty around " +
      "break-ups and fines drags down the sector. Google fell ~12% on its 2023 DOJ antitrust " +
      "ruling day.",
    affectedInvestmentIds: ["stock-alpha", "etf-tech"],
    priceMultiplier: 0.84,   // −16% stock, compounded with ETF drag
    minRound: 4,
  },
  {
    id: "me-14",
    title: "Pfizer/BioNTech Vaccine Approval",
    description:
      "A major Phase 3 trial succeeds with 95% efficacy. Regulatory emergency approval " +
      "follows. Pfizer gained +71% in a single session on vaccine news in Nov 2020. The " +
      "entire healthcare sector rallied. One successful trial can transform a pharma stock " +
      "from speculative to blue-chip overnight.",
    affectedInvestmentIds: ["stock-nova"],
    priceMultiplier: 1.35,   // +35%: a compressed but realistic single-day pharma pop
    minRound: 4,
  },
  {
    id: "me-15",
    title: "Phase 3 Trial Catastrophic Failure",
    description:
      "Nova's lead drug candidate fails its pivotal Phase 3 trial. The FDA rejection is " +
      "immediate. Real-world analogues: Alnylam −50% (2013), Northwest Biotherapeutics −77% " +
      "(2016), Sorrento −52% (2020). Years of R&D spend written off in hours. Undiversified " +
      "investors in this single stock face devastating losses.",
    affectedInvestmentIds: ["stock-nova"],
    priceMultiplier: 0.48,   // −52%: realistic mid-range for a pivotal-trial failure
    minRound: 4,
  },
  {
    id: "me-16",
    title: "US Infrastructure Investment & Jobs Act",
    description:
      "A $1.2 trillion infrastructure bill passes (modelled on the 2021 IIJA). Roads, " +
      "bridges, broadband, and clean water projects flood the pipeline. US construction and " +
      "engineering firms saw order books surge 25–40%. Terra Construction is perfectly " +
      "positioned as a primary contractor.",
    affectedInvestmentIds: ["stock-terra"],
    priceMultiplier: 1.22,   // +22%: reflects the order-book surge post-IIJA passage
    minRound: 4,
  },
  {
    id: "me-17",
    title: "Wirecard-Style Accounting Fraud Exposed",
    description:
      "An audit reveals that $2 billion in cash never existed. Wirecard (2020) collapsed " +
      "from €25 billion market cap to zero in days. Any investor with 100% of capital in " +
      "this single stock lost everything. Players holding a diversified portfolio across " +
      "ETFs, bonds, and multiple stocks are largely shielded. Diversification is not optional.",
    affectedInvestmentIds: ["stock-alpha"],
    priceMultiplier: 0.12,   // −88%: total near-wipeout of the single stock
    minRound: 4,
    learningTip:
      "No single stock position should exceed 5–10% of your portfolio. Fraud, lawsuits, and disruption can wipe a company out overnight. ETFs eliminate single-stock catastrophe risk.",
  },
  {
    id: "me-18",
    title: "Global Financial Crisis Echo",
    description:
      "A cascading failure in the banking sector (echoing 2008) triggers a systemic " +
      "liquidity crunch. The S&P 500 ultimately fell 57% from peak to trough in 2007–2009. " +
      "All asset classes correlate to 1 in a crisis. This event hits every holding: stocks, " +
      "ETFs, and riskier corporate bonds. Only government bonds hold value.",
    affectedInvestmentIds: [
      "etf-world", "etf-tech", "etf-green",
      "bond-corp",
      "stock-alpha", "stock-nova", "stock-terra",
    ],
    priceMultiplier: 0.79,   // −21%: single in-game event; real crash took 18 months
    minRound: 4,
  },
  {
    id: "me-19",
    title: "Bull Market: Everything Rallies",
    description:
      "A synchronised global expansion — low rates, strong earnings, and consumer confidence " +
      "at decade highs — lifts all boats. The 2017 and 2021 'everything rallies' saw virtually " +
      "every asset class post double-digit returns. Bonds, stocks, ETFs, and even real estate " +
      "all surged simultaneously, rewarding investors who stayed the course.",
    affectedInvestmentIds: [
      "etf-world", "etf-tech", "etf-green",
      "bond-gov", "bond-corp",
      "stock-alpha", "stock-nova", "stock-terra",
    ],
    priceMultiplier: 1.11,   // +11%: broad but moderate — not all booms are equal
    minRound: 4,
  },
  {
    id: "me-20",
    title: "Meme-Stock Short Squeeze",
    description:
      "Retail investors coordinating on social media trigger a catastrophic short squeeze. " +
      "GameStop rose 1,700% in January 2021. The targeted stock becomes disconnected from " +
      "fundamentals. Hedge funds with heavy short exposure implode. Tech and growth stocks " +
      "face volatility spillover as funds deleverage.",
    affectedInvestmentIds: ["stock-alpha", "etf-tech"],
    priceMultiplier: 1.16,   // +16%: volatile upside; squeeze benefits longs temporarily
    minRound: 4,
  },
];

// ── Income Events ──────────────────────────────────────────────────────────
//
// Grouped by life-stage / career progression, mirroring realistic income growth.
// Amounts are calibrated to be meaningful relative to starting cash but not game-breaking.
//
export const INCOME_EVENTS: IncomeEvent[] = [

  // Early career / young investor (rounds 0–2)
  {
    id: "inc-1",
    description:
      "Your employer's 401(k) match vests early — a free $50 contribution to your retirement account. " +
      "Employer matching is one of the highest guaranteed returns available.",
    amount: 50,
    minRound: 0,
  },
  {
    id: "inc-2",
    description:
      "You sold unused gear and old textbooks online for $35. Decluttering and converting idle " +
      "assets into cash is a classic first-step personal finance move.",
    amount: 35,
    minRound: 0,
  },
  {
    id: "inc-3",
    description:
      "A relative gifted you savings bonds at birth that have now matured — $80 in your pocket. " +
      "Compounding over time turns small early investments into meaningful sums.",
    amount: 80,
    minRound: 0,
  },
  {
    id: "inc-4",
    description:
      "You picked up a weekend gig driving for a ride-share platform and earned $60. The gig " +
      "economy allows flexible income generation — but offers no safety net or benefits.",
    amount: 60,
    minRound: 0,
  },

  // Mid-career (rounds 3–5)
  {
    id: "inc-5",
    description:
      "Year-end performance review: your manager awards you a $175 bonus. In 2022, median " +
      "US cash bonuses for professionals were $1,500–$5,000 — this represents the lower band " +
      "early in your career.",
    amount: 175,
    minRound: 3,
  },
  {
    id: "inc-6",
    description:
      "You completed a short-term freelance project and invoiced $220. Freelance income has " +
      "grown 22% since 2020 as remote work normalised skilled contract work globally.",
    amount: 220,
    minRound: 3,
  },
  {
    id: "inc-7",
    description:
      "Your tax return arrived: $140 back from overpaid withholding tax. The IRS issued " +
      "128 million refunds averaging $3,000 in 2023. Filing correctly and on time pays off.",
    amount: 140,
    minRound: 3,
  },
  {
    id: "inc-8",
    description:
      "You earned $180 from dividend payments across your portfolio. Dividend reinvestment " +
      "(DRIP) is historically responsible for ~40% of total equity market returns over long horizons.",
    amount: 180,
    minRound: 3,
  },

  // Established (rounds 6+)
  {
    id: "inc-9",
    description:
      "Your side business — a small e-commerce store you started two years ago — posted a " +
      "$320 quarterly profit. Side hustles account for 36% of American workers' income, " +
      "per 2023 Bankrate data.",
    amount: 320,
    minRound: 6,
  },
  {
    id: "inc-10",
    description:
      "A consulting retainer landed in your account: $400 for two days of advisory work. " +
      "Senior professionals in finance, tech, and law command $150–$500/hour as independents.",
    amount: 400,
    minRound: 6,
  },
  {
    id: "inc-11",
    description:
      "Your company's ESPP (Employee Stock Purchase Plan) shares vested at a 15% discount " +
      "and you sold immediately for a $280 risk-free gain. ESPPs are one of the most " +
      "underutilised employee benefits available.",
    amount: 280,
    minRound: 6,
  },
  {
    id: "inc-12",
    description:
      "Rental income from a room you sublet: $350 this quarter. Real estate remains the " +
      "primary wealth-building vehicle for the global middle class, even at small scale.",
    amount: 350,
    minRound: 6,
  },
];

// ── Negative Events ────────────────────────────────────────────────────────
//
// Costs reflect real-world figures. Larger costs are gated to later rounds to
// reflect that higher net-worth individuals face proportionally larger financial risks.
//
export const NEGATIVE_EVENTS: NegativeEvent[] = [

  // Early-stage financial setbacks
  {
    id: "neg-1",
    description:
      "Subscription creep: you audit your accounts and find $75 in forgotten auto-renewals " +
      "(streaming, apps, cloud storage). The average American wastes $219/month on unused " +
      "subscriptions (C+R Research, 2022). Cancelled — but this month's cash is gone.",
    cost: 75,
    minRound: 0,
  },
  {
    id: "neg-2",
    description:
      "Parking fine while shopping in the city centre: $55. Small unexpected costs are the " +
      "most common budget disruptors and the hardest to plan for.",
    cost: 55,
    minRound: 0,
  },
  {
    id: "neg-3",
    description:
      "Your laptop's motherboard failed. Replacement: $220. With remote work now standard, " +
      "a broken work laptop is a productivity and income emergency simultaneously.",
    cost: 220,
    minRound: 0,
  },
  {
    id: "neg-4",
    description:
      "Identity theft: a fraudulent charge hits your credit card for $95. Average fraud " +
      "resolution time is 6 months; you recover but face immediate out-of-pocket costs " +
      "and credit score monitoring fees.",
    cost: 95,
    minRound: 0,
  },

  // Mid-range setbacks (round 2+)
  {
    id: "neg-5",
    description:
      "A burst pipe floods your kitchen. Emergency plumber call-out and repairs: $550. " +
      "HomeAdvisor data: average water damage repair in the US is $1,200 — you got off " +
      "lightly. Emergency funds exist for exactly this moment.",
    cost: 550,
    minRound: 2,
  },
  {
    id: "neg-6",
    description:
      "Minor car accident — your fault. Insurance excess (deductible) plus a premium hike " +
      "next year: $430 effective cost now. In the US, the average collision claim is $4,700; " +
      "your insurer absorbs most of it.",
    cost: 430,
    minRound: 2,
  },
  {
    id: "neg-7",
    description:
      "Unexpected dental surgery (root canal + crown): $680 out-of-pocket after insurance. " +
      "In 2023, 26% of US adults skipped dental care due to cost. Having an emergency fund " +
      "means you don't have to.",
    cost: 680,
    minRound: 2,
  },

  // Larger setbacks (round 3+)
  {
    id: "neg-8",
    description:
      "A medical emergency lands you in hospital overnight. After insurance: $900 in bills. " +
      "The average US hospital stay costs $2,883/night; medical debt is the #1 cause of " +
      "personal bankruptcy in the United States.",
    cost: 900,
    minRound: 3,
  },
  {
    id: "neg-9",
    description:
      "Storm damage: your roof needs urgent repair. Cost: $1,100. FEMA data: only 40% of " +
      "US homeowners have sufficient reserves to cover a $1,000 emergency without borrowing.",
    cost: 1100,
    minRound: 4,
  },
  {
    id: "neg-10",
    description:
      "Tax authority audit: you underpaid on freelance income. Back taxes + penalties: $1,600. " +
      "The IRS collected $30.2 billion in enforcement actions in 2022. Keep receipts. Hire an " +
      "accountant. The cost of advice is far cheaper than the cost of an audit.",
    cost: 1600,
    minRound: 5,
  },
  {
    id: "neg-11",
    description:
      "You co-signed a friend's business loan. The business failed. You're now liable for " +
      "$2,200 — a painful real-world lesson in contingent liabilities and why financial " +
      "advisers uniformly warn against co-signing debt.",
    cost: 2200,
    minRound: 6,
  },
  {
    id: "neg-12",
    description:
      "Inheritance dispute legal fees: $1,800. Family wealth transfers are complex and " +
      "contentious — without a proper will and estate plan, legal costs can devour the " +
      "very wealth being transferred.",
    cost: 1800,
    minRound: 6,
  },
];

// ── Shop Items ─────────────────────────────────────────────────────────────
export const SHOP_ITEMS: ShopItem[] = [
  {
    id: "shop-tax-shield",
    name: "Emergency Fund Buffer",
    description:
      "You maintain a 3-month emergency fund — the standard financial planning recommendation. " +
      "Absorbs your next negative event entirely. Lasts 3 turns.",
    cost: 150,
    powerUpType: "tax-shield",
    duration: 3,
  },
  {
    id: "shop-insider",
    name: "Equity Research Report",
    description:
      "A tier-1 investment bank's analyst report (Bloomberg Terminal access costs ~$24,000/year). " +
      "Preview the next market event before it resolves. Lasts 1 turn.",
    cost: 100,
    powerUpType: "insider-info",
    duration: 1,
  },
  {
    id: "shop-interest",
    name: "High-Yield Savings Account",
    description:
      "In 2023, online HYSAs offered 4.5–5.5% APY vs 0.4% at traditional banks. " +
      "Double your idle-cash interest rate (2% → 4%) for 3 turns.",
    cost: 200,
    powerUpType: "interest-boost",
    duration: 3,
  },
  {
    id: "shop-analyst",
    name: "Portfolio Rebalancing Advisor",
    description:
      "A robo-advisor or fee-only CFP analyses your holdings and flags concentration risk. " +
      "See detailed trend predictions and asset-allocation warnings for 2 turns.",
    cost: 120,
    powerUpType: "market-analyst",
    duration: 2,
  },
];
