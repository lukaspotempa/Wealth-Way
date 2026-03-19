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
    id: 6.5,
    type: 'quiz-multi' as const,
    title: 'Knowledge Check',
    questions: [
      {
        question: 'What happens to uninvested cash over time if there is inflation?',
        options: [
          { text: 'It gains value safely', feedback: 'No, inflation means prices go up, so your cash buys less.' },
          { text: 'It loses purchasing power', feedback: 'Correct! Inflation eats away at the real value of your money.', isCorrect: true },
          { text: 'It stays exactly the same', feedback: 'The nominal amount stays the same, but its real value decreases.' }
        ]
      },
      {
        question: 'How does the stock market generally behave over the long term?',
        options: [
          { text: 'It only goes up', feedback: 'There are definitely down years (like we saw in 2015 and 2018)!' },
          { text: 'It goes down due to inflation', feedback: 'No, companies usually grow their earnings to beat inflation.' },
          { text: 'It has ups and downs but trends upward', feedback: 'Correct! Volatility is normal, but the long-term trend is growth.', isCorrect: true }
        ]
      },
      {
        question: 'Does investing small amounts (e.g., $15/month) make a difference?',
        options: [
          { text: 'Yes, because of compound growth over time', feedback: 'Exactly! Starting early and staying consistent builds wealth.', isCorrect: true },
          { text: 'No, you need thousands to start', feedback: 'Even small amounts benefit from compound returns over the years.' },
          { text: 'Only if there is no inflation', feedback: 'Investing is actually one of the main ways to BEAT inflation.' }
        ]
      }
    ]
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
