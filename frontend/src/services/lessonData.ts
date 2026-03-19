/**
 * Lesson data service - currently local, prepared for future backend API.
 * Each lesson contains slides, and the data for charts / interactive elements.
 */

// S&P 500 yearly returns used in the lesson story (2012-2018)
export const yearlyReturns: Record<number, number> = {
  2012: 16.54,
  2013: 27.37,
  2014: 5.50,
  2015: -0.32,
  2016: 8.15,
  2017: 23.07,
  2018: -8.20,
}

// Average inflation rate (approx 2% per year for Switzerland)
export const inflationRate = 0.02

export interface YearlyData {
  year: number
  child2Savings: number    // Piggy bank (nominal)
  child2RealValue: number  // Piggy bank (inflation-adjusted)
  child3Portfolio: number  // Invested portfolio value
  child3Invested: number   // Total amount invested
  inflationLoss: number    // Cumulative inflation loss for child 2
}

/**
 * Calculate the savings data for the children over 6 years (age 12-18),
 * investing $15/month.
 */
export function calculateChildrenSavings(): YearlyData[] {
  const monthlySaving = 15
  const monthsPerYear = 12
  const data: YearlyData[] = []

  let child2Total = 0         // Nominal piggy bank savings
  let child3Portfolio = 0     // Investment portfolio value
  let child3TotalInvested = 0 // Total cash invested
  let cumulativeInflationLoss = 0

  const years = Object.keys(yearlyReturns).map(Number).sort()

  for (const year of years) {
    const annualReturn = yearlyReturns[year]! / 100

    // Child 2: saves $15/month into piggy bank (no returns)
    child2Total += monthlySaving * monthsPerYear

    // Child 3: invests $15/month, portfolio grows with market
    // Apply yearly return to existing portfolio, then add monthly contributions
    child3Portfolio = child3Portfolio * (1 + annualReturn)
    // Add monthly investments throughout the year (simplified: add at year start)
    child3Portfolio += monthlySaving * monthsPerYear
    child3TotalInvested += monthlySaving * monthsPerYear

    // Calculate inflation-adjusted value of child 2's savings
    const yearsElapsed = years.indexOf(year) + 1
    const realValue = child2Total * Math.pow(1 - inflationRate, yearsElapsed)
    const inflationLoss = child2Total - realValue
    cumulativeInflationLoss = inflationLoss

    data.push({
      year,
      child2Savings: Math.round(child2Total * 100) / 100,
      child2RealValue: Math.round(realValue * 100) / 100,
      child3Portfolio: Math.round(child3Portfolio * 100) / 100,
      child3Invested: child3TotalInvested,
      inflationLoss: Math.round(cumulativeInflationLoss * 100) / 100,
    })
  }

  return data
}

export const lesson1Slides = [
  {
    id: 1,
    type: 'story-intro' as const,
    title: 'Meet the Family',
    content: 'In a cozy household, three kids each receive $30 pocket money every month. They all want the same thing - a brand new skateboard that costs $30. But they each have a very different plan...',
  },
  {
    id: 2,
    type: 'comparison' as const,
    title: 'Three Different Choices',
    children: [
      {
        name: 'Alex',
        decision: 'Buys the skateboard right away!',
        detail: 'Spends all $30 immediately. No savings, but instant fun.',
        strategy: 'Spend Now',
      },
      {
        name: 'Sam',
        decision: 'Saves $15 in a piggy bank',
        detail: 'Puts $15 aside each month and spends $15. Buys the skateboard next month with savings.',
        strategy: 'Save in Piggy Bank',
      },
      {
        name: 'Jordan',
        decision: 'Invests $15 each month',
        detail: 'Puts $15 into an investment fund and spends $15. Also buys the skateboard next month, but keeps investing.',
        strategy: 'Invest',
      },
    ],
  },
  {
    id: 3,
    type: 'timeskip' as const,
    title: 'Fast Forward: Each Child Turns 18',
    content: 'Six years have passed. Each child has been following their strategy every single month. Let\'s see how their money grew...',
    results: [
      {
        name: 'Alex',
        outcome: 'Has no savings at all',
        detail: 'Alex enjoyed spending, but has $0 saved up.',
        amount: '$0',
      },
      {
        name: 'Sam',
        outcome: 'Has savings, but inflation ate some away',
        detail: 'Sam saved diligently, but the money in the piggy bank lost real value over time.',
        amount: '', // Calculated dynamically
      },
      {
        name: 'Jordan',
        outcome: 'Investments grew with the market!',
        detail: 'Jordan\'s monthly $15 investments rode the market ups and downs, building real wealth.',
        amount: '', // Calculated dynamically
      },
    ],
  },
  {
    id: 4,
    type: 'chart-networth' as const,
    title: 'Net Worth Over Time',
    content: 'See how Sam\'s piggy bank compares to Jordan\'s investment portfolio over 6 years.',
  },
  {
    id: 4.5,
    type: 'question' as const,
    title: 'What happened to Sam\'s Money?',
    question: 'With an assumed inflation rate of 2% per year, what do you think happened to the real value (purchasing power) of Sam\'s piggy bank savings over those 6 years?',
    options: [
      { text: 'It increased', feedback: 'Not quite. Since Sam didn\'t invest, the money didn\'t grow to beat inflation.' },
      { text: 'It stayed the same', feedback: 'It seems like it should! The nominal amount is safe, but prices went up.' },
      { text: 'It decreased', feedback: 'Correct! Because things became more expensive (inflation), the same amount of money buys less.', isCorrect: true }
    ],
  },
  {
    id: 5,
    type: 'chart-sam-real-value' as const,
    title: 'Sam\'s Savings: Nominal vs Real Value',
    content: 'The "nominal" value is the total cash Sam put in. But due to inflation, the "real value" (purchasing power) of that money declined. Let\'s see the difference.',
  },
  {
    id: 6,
    type: 'chart-inflation' as const,
    title: 'The Hidden Cost: Inflation',
    content: 'This is how much purchasing power Sam lost by keeping money in the piggy bank instead of investing it.',
  },
  {
    id: 7,
    type: 'summary' as const,
    title: 'What Did We Learn?',
    points: [
      'Money sitting idle loses value over time due to inflation',
      'Even small monthly investments ($15/month) can grow significantly',
      'The stock market has ups and downs, but historically trends upward',
      'Starting early gives your money more time to grow (compound returns)',
      'Investing is one of the best ways to protect and grow your savings',
    ],
  },
]

// ── Lesson 2 data ─────────────────────────────────────────────────────────────

/**
 * The "Missed Best Days" dataset.
 * Based on S&P 500 data 2004-2023 (20-year period, ~$10,000 initial investment).
 * Fully invested: ~$64,844  (CAGR ≈ 9.8%)
 * Miss  10 best days: ~$29,708
 * Miss  20 best days: ~$17,826
 * Miss  30 best days: ~$11,701
 * Miss  40 best days: ~$8,048
 * Source: J.P. Morgan "Guide to the Markets" (widely published statistic).
 */
export const missedDaysData = [
  { label: 'Fully Invested', value: 64844, color: '#FFCB00' },
  { label: 'Miss 10 Best Days', value: 29708, color: '#f97316' },
  { label: 'Miss 20 Best Days', value: 17826, color: '#ef4444' },
  { label: 'Miss 30 Best Days', value: 11701, color: '#dc2626' },
  { label: 'Miss 40 Best Days', value: 8048, color: '#991b1b' },
]

/**
 * Compound growth of CHF 10,000 over 30 years at different annual return rates.
 * Formula: FV = 10000 × (1 + r)^t
 */
export function calculateCompoundGrowth() {
  const initial = 10000
  const years = Array.from({ length: 31 }, (_, i) => i) // 0..30
  const rates = [
    { label: 'Cash (0%)', rate: 0.00, color: '#6b7280' },
    { label: 'Bonds (~2%)', rate: 0.02, color: '#60a5fa' },
    { label: 'Diversified ETF (~7%)', rate: 0.07, color: '#FFCB00' },
  ]
  return {
    labels: years.map(y => `Year ${y}`),
    datasets: rates.map(r => ({
      label: r.label,
      color: r.color,
      values: years.map(y => Math.round(initial * Math.pow(1 + r.rate, y))),
    })),
  }
}

export const lesson2Slides = [
  // ── Slide 1: The Analogy ────────────────────────────────────────────────────
  {
    id: 1,
    type: 'analogy-intro' as const,
    title: 'The Oak Tree and the Weather Watcher',
    icon: '<div>Test</div>',
    content: `Imagine you plant an acorn in your garden. You water it, give it sunlight, and then — you leave it alone.

You don't dig it up every time a storm is forecast. You don't replant it on sunny days hoping for faster growth. You simply give it time.

Your neighbour does the opposite. Every week he digs up his acorn to check the roots, replants it when the weather looks bad, and congratulates himself every time it doesn't die overnight. After 10 years, your oak is tall. His seedling is still a seedling — if it survived at all.

The market works exactly the same way. The patient gardener wins.`,
  },
  // ── Slide 2: Why timing fails ───────────────────────────────────────────────
  {
    id: 2,
    type: 'key-insight' as const,
    title: 'Why Timing the Market Fails',
    insights: [
      {
        icon: '📅',
        heading: 'The best days cluster around crashes',
        text: 'The biggest single-day gains almost always happen right after the sharpest drops — exactly when fear-driven investors have already sold.',
      },
      {
        icon: '🔮',
        heading: 'Nobody can predict them',
        text: 'Even professional fund managers with teams of analysts consistently fail to call market turning points with any reliability.',
      },
      {
        icon: '💸',
        heading: 'Missing a handful of days costs a fortune',
        text: 'An investor who missed only the 10 best trading days in the S&P 500 over 20 years ended up with less than half the money of someone who did nothing.',
      },
    ],
  },
  // ── Slide 3: Missed-days chart ──────────────────────────────────────────────
  {
    id: 3,
    type: 'chart-missed-days' as const,
    title: 'The Cost of Jumping In and Out',
    content: 'CHF 10,000 invested in the S&P 500 from 2004 to 2023. Each bar shows what happens when you miss a growing number of the market\'s best single days.',
  },
  // ── Slide 4: Compounding chart ──────────────────────────────────────────────
  {
    id: 4,
    type: 'chart-compound-growth' as const,
    title: 'The Patient Gardener\'s Reward: Compounding',
    content: 'CHF 10,000 left untouched for 30 years. The only difference is where it is invested. Time does the work — not perfect timing.',
  },
  // ── Slide 5: One question ───────────────────────────────────────────────────
  {
    id: 5,
    type: 'question' as const,
    title: 'Quick Check',
    question: 'An investor misses the 20 best trading days in a 20-year period. What is the most likely outcome compared to staying fully invested?',
    options: [
      {
        text: 'Their returns are only slightly lower — best days don\'t matter much',
        feedback: 'Not quite. Research consistently shows that missing even a small number of the best days drastically reduces long-run returns.',
      },
      {
        text: 'They end up with roughly half the final portfolio value or less',
        feedback: 'Correct. Based on S&P 500 data, missing the 20 best days over 20 years can cut the final portfolio to less than a third of what a buy-and-hold investor earns.',
        isCorrect: true,
      },
      {
        text: 'They do better because they also avoided the worst days',
        feedback: 'This sounds logical but is wrong in practice — the best days and worst days are often clustered together. You cannot reliably skip only the bad ones.',
      },
    ],
  },
  // ── Slide 6: Summary ────────────────────────────────────────────────────────
  {
    id: 6,
    type: 'summary' as const,
    title: 'What You Should Remember',
    points: [
      'The market\'s biggest gains are unpredictable — missing them is costly',
      'Staying fully invested through downturns is how long-term wealth is built',
      'Compounding requires time — the longer you stay in, the more it accelerates',
      'Emotional decisions (selling on fear, buying on greed) destroy returns',
      'Time in the market beats timing the market — every time, on average',
    ],
  },
]

// ── Lesson 3 data ─────────────────────────────────────────────────────────────

/**
 * Single-stock vs ETF annual return variance (illustrative, representative figures).
 * Using Apple (AAPL) vs a broad-market ETF (MSCI World proxy) from 2014-2023.
 * AAPL returns: actual rounded figures.
 * MSCI World: approximate annual returns.
 */
export const stockVsEtfData = {
  years: ['2014', '2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023'],
  singleStock: [40.6, -3.0, 12.5, 48.5, -5.4, 88.9, 80.7, 33.8, -26.4, 48.2],   // AAPL
  etf:         [4.9,  -0.9,  7.5, 22.4, -8.7, 27.7, 15.9, 21.8, -18.1, 23.8],   // MSCI World approx
}

/**
 * Impact of a 0.5% annual fee difference (ETF ~0.2% vs active fund ~1.5%)
 * on CHF 10,000 over 30 years at 7% gross return.
 * Net ETF return: 6.8%  | Net active fund return: 5.5%
 */
export function calculateFeeDrag() {
  const initial = 10000
  const years = Array.from({ length: 31 }, (_, i) => i)
  return {
    labels: years.map(y => `Year ${y}`),
    etf:    years.map(y => Math.round(initial * Math.pow(1.068, y))),   // 7% − 0.2% TER
    active: years.map(y => Math.round(initial * Math.pow(1.055, y))),   // 7% − 1.5% TER
  }
}

export const lesson3Slides = [
  // ── Slide 1: The Analogy ────────────────────────────────────────────────────
  {
    id: 1,
    type: 'analogy-intro' as const,
    title: 'The Fruit Basket vs. the Single Banana',
    icon: '🧺',
    content: `You are walking home from the market with your groceries. In one hand you carry a single banana. In the other, a basket with 50 different fruits — apples, oranges, mangos, grapes, kiwis.

Halfway home, you trip. The banana hits the ground and bruises badly. It's ruined.

But your basket? One bruised mango. Everything else is perfectly fine.

Investing in a single company is like carrying that one banana. One bad earnings report, one scandal, one missed product launch — and your savings take the full hit.

An ETF is the basket. It spreads your money across hundreds of companies at once. One failure barely dents the whole.`,
  },
  // ── Slide 2: What is an ETF ─────────────────────────────────────────────────
  {
    id: 2,
    type: 'key-insight' as const,
    title: 'What Exactly Is an ETF?',
    insights: [
      {
        icon: '📦',
        heading: 'A ready-made basket of investments',
        text: 'ETF stands for Exchange-Traded Fund. It bundles hundreds of stocks (or bonds) into a single product you can buy just like one share.',
      },
      {
        icon: '📉',
        heading: 'It tracks an index automatically',
        text: 'Most ETFs simply follow a market index like the MSCI World or the S&P 500. No fund manager guessing — just the market, automatically.',
      },
      {
        icon: '💰',
        heading: 'Extremely low costs',
        text: 'Because no active management is needed, ETF fees (called TER) are typically 0.1%–0.5% per year, versus 1%–2% for actively managed funds.',
      },
    ],
  },
  // ── Slide 3: Volatility comparison chart ────────────────────────────────────
  {
    id: 3,
    type: 'chart-stock-vs-etf' as const,
    title: 'Single Stock vs. ETF: The Volatility Difference',
    content: 'Annual returns of Apple (AAPL) versus the MSCI World ETF from 2014 to 2023. Both can go up significantly — but only one can also swing wildly downward.',
  },
  // ── Slide 4: Fee drag chart ─────────────────────────────────────────────────
  {
    id: 4,
    type: 'chart-fee-drag' as const,
    title: 'Small Fees, Huge Long-Term Cost',
    content: 'CHF 10,000 invested for 30 years. Both grow at 7% gross return — but the active fund charges 1.5% per year versus 0.2% for the ETF. The gap is not small.',
  },
  // ── Slide 5: One question ───────────────────────────────────────────────────
  {
    id: 5,
    type: 'question' as const,
    title: 'Quick Check',
    question: 'You invest CHF 5,000 into a single tech company. The following year, an accounting scandal is revealed and the stock drops 70%. How would owning a broad-market ETF instead have changed your situation?',
    options: [
      {
        text: 'No difference — ETFs also crash 70% when one company fails',
        feedback: 'Incorrect. A single company is one of hundreds in a broad ETF. Its collapse affects the overall fund by a fraction of a percent.',
      },
      {
        text: 'The ETF would likely have dropped only a small fraction of that, because the loss is spread across hundreds of other companies',
        feedback: 'Correct. This is exactly what diversification does — it absorbs individual failures without destroying the whole portfolio.',
        isCorrect: true,
      },
      {
        text: 'ETFs are guaranteed not to lose money',
        feedback: 'ETFs can and do lose value — they are not a guarantee. They simply spread risk, they do not eliminate it.',
      },
    ],
  },
  // ── Slide 6: Summary ────────────────────────────────────────────────────────
  {
    id: 6,
    type: 'summary' as const,
    title: 'What You Should Remember',
    points: [
      'An ETF bundles hundreds of investments into a single, easy-to-buy product',
      'Diversification reduces the damage a single bad investment can do',
      'ETFs are passive — they track an index without expensive active management',
      'Lower fees compound just like returns — over 30 years the difference is enormous',
      'For most long-term investors, a low-cost ETF is hard to beat',
    ],
  },
]

export const quiz1Slides = [
  {
    id: 1,
    type: 'question' as const,
    title: 'Knowledge Check 1/3',
    question: 'What happens to uninvested cash over time if there is inflation?',
    options: [
      { text: 'It gains value safely', feedback: 'No, inflation means prices go up, so your cash buys less.' },
      { text: 'It loses purchasing power', feedback: 'Correct! Inflation eats away at the real value of your money.', isCorrect: true },
      { text: 'It stays exactly the same', feedback: 'The nominal amount stays the same, but its real value decreases.' }
    ]
  },
  {
    id: 2,
    type: 'question' as const,
    title: 'Knowledge Check 2/3',
    question: 'How does the stock market generally behave over the long term?',
    options: [
      { text: 'It only goes up', feedback: 'There are definitely down years (like we saw in 2015 and 2018)!' },
      { text: 'It goes down due to inflation', feedback: 'No, companies usually grow their earnings to beat inflation.' },
      { text: 'It has ups and downs but trends upward', feedback: 'Correct! Volatility is normal, but the long-term trend is growth.', isCorrect: true }
    ]
  },
  {
    id: 3,
    type: 'question' as const,
    title: 'Knowledge Check 3/3',
    question: 'Does investing small amounts (e.g., $15/month) make a difference?',
    options: [
      { text: 'Yes, because of compound growth over time', feedback: 'Exactly! Starting early and staying consistent builds wealth.', isCorrect: true },
      { text: 'No, you need thousands to start', feedback: 'Even small amounts benefit from compound returns over the years.' },
      { text: 'Only if there is no inflation', feedback: 'Investing is actually one of the main ways to BEAT inflation.' }
    ]
  },
  {
    id: 4,
    type: 'summary' as const,
    title: 'Quiz Complete',
    points: [
      'You mastered the basics of inflation and investing',
      'You are ready to learn about the Stock Market!'
    ]
  }
]
