export interface MarketEvent {
  month: number // 1-12, when during the year this fires
  title: string
  body: string
  severity: 'info' | 'warning' | 'crash' | 'recovery'
}

export interface ScenarioYear {
  year: number
  label: string
  hint?: string // shown during prep phase
  events: MarketEvent[]
  tip: string   // educational tip shown at round end
}

export interface Scenario {
  id: string
  name: string
  tagline: string
  description: string
  years: ScenarioYear[]
  backgroundAsset: string // dominant asset for background color treatment
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'financial-crisis',
    name: 'The Great Financial Crisis',
    tagline: '2007 – 2016',
    description:
      'Start in the final boom year before the crash, survive the worst financial crisis since 1929, and ride the long recovery. The hardest lesson in investing: staying the course when everything is on fire.',
    backgroundAsset: 'djia',
    years: [
      {
        year: 2007,
        label: 'The Last Boom',
        hint: 'Markets are near all-time highs. But something is cracking in U.S. housing...',
        events: [
          {
            month: 2,
            title: 'HSBC reports subprime losses',
            body: 'Warning signs emerge in U.S. mortgage markets. Most analysts dismiss them.',
            severity: 'warning',
          },
          {
            month: 8,
            title: 'Credit markets seize up',
            body: 'Banks stop lending to each other. The liquidity crunch begins.',
            severity: 'crash',
          },
        ],
        tip: 'Even in years that look fine on the surface, risk can be building underneath. Diversification is your early warning system.',
      },
      {
        year: 2008,
        label: 'The Year Everything Broke',
        hint: 'Bear Stearns has already collapsed. Lehman Brothers is on life support. Brace yourself.',
        events: [
          {
            month: 3,
            title: 'Bear Stearns collapses',
            body: 'The Fed orchestrates an emergency sale to JPMorgan. $30B backstop. Wall Street panics.',
            severity: 'crash',
          },
          {
            month: 9,
            title: 'Lehman Brothers files for bankruptcy',
            body: 'The largest bankruptcy in U.S. history. Global markets go into freefall.',
            severity: 'crash',
          },
          {
            month: 10,
            title: 'Global stock markets crash',
            body: 'DJIA loses 22% in a single week. Panic selling everywhere.',
            severity: 'crash',
          },
        ],
        tip: 'Gold rose while stocks fell ~40%. This is why diversification matters — different assets move differently in a crisis.',
      },
      {
        year: 2009,
        label: 'Rock Bottom and Rebound',
        hint: 'Stocks hit their lowest point in March. Then something unexpected happens.',
        events: [
          {
            month: 3,
            title: 'S&P 500 hits crisis low',
            body: 'Markets are down 57% from the peak. Fear is at maximum. This is the moment long-term investors remember.',
            severity: 'crash',
          },
          {
            month: 4,
            title: 'Recovery begins',
            body: 'Central banks flood markets with liquidity. Stocks begin a historic recovery from the ashes.',
            severity: 'recovery',
          },
        ],
        tip: 'The best day to buy is when everyone is selling. Investors who held through 2008 and bought more in March 2009 made extraordinary returns over the next decade.',
      },
      {
        year: 2010,
        label: 'Recovery — But Not For Everyone',
        hint: 'U.S. stocks recover strongly. Europe has a new crisis brewing.',
        events: [
          {
            month: 4,
            title: 'Greece requests EU/IMF bailout',
            body: 'The European sovereign debt crisis begins. Greece cannot repay its debts without help.',
            severity: 'warning',
          },
        ],
        tip: 'Geographic diversification matters. U.S. and European markets diverged sharply in 2010-2012 due to the Eurozone crisis.',
      },
      {
        year: 2011,
        label: 'Eurozone on the Edge',
        hint: 'Italy and Spain are next. The Euro\'s survival is questioned.',
        events: [
          {
            month: 7,
            title: 'Contagion spreads to Italy',
            body: 'Italian 10-year bond yields spike above 6%. Markets fear a default of the Eurozone\'s third-largest economy.',
            severity: 'crash',
          },
        ],
        tip: 'Bonds from safer countries (Germany, Switzerland) rose while riskier sovereign bonds crashed. Not all bonds are the same.',
      },
      {
        year: 2012,
        label: '"Whatever It Takes"',
        hint: 'ECB President Draghi makes three words that change everything.',
        events: [
          {
            month: 7,
            title: 'Draghi: "Whatever it takes"',
            body: 'ECB President Draghi pledges to do whatever is necessary to preserve the Euro. Crisis over — markets rally hard.',
            severity: 'recovery',
          },
        ],
        tip: 'Central bank communication moves markets. A single speech can turn a market around. This is why long-term investors should not react to daily news.',
      },
      {
        year: 2013,
        label: 'The Taper Tantrum',
        hint: 'QE has fueled a strong rally. What happens when the Fed hints at pulling back?',
        events: [
          {
            month: 5,
            title: 'Fed hints at tapering QE',
            body: 'Bernanke suggests slowing bond purchases. Bond markets sell off sharply. "Taper Tantrum" begins.',
            severity: 'warning',
          },
        ],
        tip: 'When interest rates rise (or are expected to rise), bond prices fall. This inverse relationship is fundamental to understanding fixed income.',
      },
      {
        year: 2014,
        label: 'Steady Growth',
        hint: 'U.S. economy is strong. Europe struggles with slow growth. Dollar strengthens.',
        events: [
          {
            month: 10,
            title: 'ECB cuts rates to near zero',
            body: 'European Central Bank launches negative interest rates. An unprecedented experiment in monetary policy.',
            severity: 'info',
          },
        ],
        tip: 'Currency movements matter. The strong USD made European assets cheaper for U.S. investors — but also reduced returns when converting back.',
      },
      {
        year: 2015,
        label: 'China Wobbles',
        hint: 'Global markets are rattled by a surprise devaluation of the Chinese Yuan.',
        events: [
          {
            month: 8,
            title: 'China devalues the Yuan',
            body: 'Chinese stock markets crash. Global markets follow. The interconnectedness of modern finance on full display.',
            severity: 'crash',
          },
        ],
        tip: 'Global markets are linked. A crisis in one major economy ripples everywhere. True diversification includes geography and time.',
      },
      {
        year: 2016,
        label: 'The Political Shocks',
        hint: 'Two political earthquakes in one year shake markets — briefly.',
        events: [
          {
            month: 6,
            title: 'Brexit vote shocks markets',
            body: 'UK votes to leave the EU. Pound crashes 8% overnight. Global stocks sell off — then recover within days.',
            severity: 'warning',
          },
          {
            month: 11,
            title: 'Trump elected U.S. President',
            body: 'Futures crash overnight... then reverse sharply. Markets shrug and continue higher.',
            severity: 'info',
          },
        ],
        tip: 'Market reactions to political events are often short-lived. Investors who panic-sold on Brexit or the Trump election missed a strong rally. Stay invested.',
      },
    ],
  },
  {
    id: 'modern-bull',
    name: 'The Modern Bull Market',
    tagline: '2013 – 2022',
    description:
      'The longest bull market in history, interrupted by a global pandemic crash — and the fastest recovery ever recorded. What would you have done?',
    backgroundAsset: 'djia',
    years: [
      { year: 2013, label: 'QE Fuels the Rally', hint: 'Central bank liquidity is pumping markets higher.', events: [], tip: 'Low interest rates push investors toward higher-risk assets like stocks.' },
      { year: 2014, label: 'Steady Climb', hint: 'U.S. economy hums. Dollar strengthens.', events: [], tip: 'Consistent compounding over many years is more powerful than timing the market.' },
      { year: 2015, label: 'China Wobbles', hint: 'A surprise devaluation sparks global jitters.', events: [{ month: 8, title: 'China Yuan Devaluation', body: 'Chinese markets crash. Contagion spreads briefly.', severity: 'crash' }], tip: 'Global markets are deeply interconnected.' },
      { year: 2016, label: 'Political Shocks, Market Resilience', hint: 'Brexit. Trump. Markets barely blink.', events: [], tip: 'Markets are forward-looking and often already price in political uncertainty.' },
      { year: 2017, label: 'Year of Low Volatility', hint: 'Stocks climb steadily. Almost no dips.', events: [], tip: 'Calm markets create complacency. This is when risk builds silently.' },
      { year: 2018, label: 'Rate Hikes Bite', hint: 'The Fed raises rates. Growth stocks correct.', events: [{ month: 12, title: 'Q4 Correction', body: 'S&P 500 drops 20% from peak. Recession fears spike.', severity: 'crash' }], tip: 'Rising interest rates are negative for growth stocks and bonds.' },
      { year: 2019, label: 'One More Year', hint: 'Markets rebound strongly after 2018 scare.', events: [], tip: 'Recoveries after corrections are often fast and strong. Being out of the market means missing them.' },
      { year: 2020, label: 'COVID Crash & Miracle Recovery', hint: 'A global pandemic hits. In March, markets free-fall.', events: [{ month: 3, title: 'COVID-19 Market Crash', body: 'Fastest 30% drawdown in stock market history. Global lockdowns. Trillions in stimulus follow.', severity: 'crash' }, { month: 4, title: 'The V-Shaped Recovery Begins', body: 'Fed and governments inject massive stimulus. Fastest recovery ever recorded.', severity: 'recovery' }], tip: 'The COVID crash recovered in ~5 months. Investors who sold in March locked in losses. Investors who bought were rewarded enormously.' },
      { year: 2021, label: 'Everything Rallies', hint: 'Stimulus floods markets. Growth stocks and crypto soar.', events: [], tip: 'Free money (stimulus + zero rates) inflates all asset prices. But what goes up with stimulus can fall without it.' },
      { year: 2022, label: 'Inflation and Rate Shocks', hint: 'The Fed hikes rates at the fastest pace in decades. Markets reprice.', events: [{ month: 3, title: 'Fed begins aggressive rate hikes', body: 'Inflation hits 9%. Fed raises rates from 0% to 4%+ in months. Bonds and growth stocks crash.', severity: 'crash' }], tip: 'Both stocks AND bonds fell in 2022 — a rare event. The classic 60/40 portfolio had its worst year in decades. No asset class is risk-free.' },
    ],
  },
]

export const DEFAULT_SCENARIO_ID = 'financial-crisis'
