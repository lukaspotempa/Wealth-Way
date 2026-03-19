import Papa from 'papaparse'

export interface PricePoint {
  date: Date
  value: number
}

export type MarketDataset = Record<string, PricePoint[]>

function parseDate(str: string): Date | null {
  const s = str.trim()
  const parts = s.split('/')
  if (parts.length !== 3) return null
  const d = Number(parts[0]), m = Number(parts[1]), y = Number(parts[2])
  if (isNaN(d) || isNaN(m) || isNaN(y)) return null
  return new Date(y, m - 1, d)
}

function parseNumber(str: string): number | null {
  if (!str) return null
  const s = str.replace(/[,\s]/g, '').trim()
  if (s === '#N/A' || s === '' || s === 'N/A') return null
  const n = parseFloat(s)
  return isNaN(n) ? null : n
}

async function fetchAndParse(filename: string): Promise<string[][]> {
  const res = await fetch(`/${filename}`)
  const text = await res.text()
  const result = Papa.parse<string[]>(text, {
    header: false,
    skipEmptyLines: true,
  })
  return result.data
}

/** Normalize a price series so the first value = 100 */
export function normalizeSeries(points: PricePoint[]): PricePoint[] {
  if (!points.length) return []
  const base = points[0]!.value
  return points.map(p => ({ ...p, value: (p.value / base) * 100 }))
}

/** Slice a price series to a given calendar year */
export function sliceToYear(points: PricePoint[], year: number): PricePoint[] {
  return points.filter(p => p.date.getFullYear() === year)
}

/** Load all market data from CSV files in /public */
export async function loadAllMarketData(): Promise<MarketDataset> {
  const dataset: MarketDataset = {}

  // ── Equity Indices ───────────────────────────────────────────────────────
  // Columns: date | SMI | EuroStoxx50 | DJIA | Nikkei225 | DAX
  const equityRows = await fetchAndParse('Market_Data - Equity Indices.csv')
  const equityIds = ['smi', 'eurostoxx', 'djia', 'nikkei', 'dax']
  equityIds.forEach(id => { dataset[id] = [] })

  for (let r = 1; r < equityRows.length; r++) {
    const row = equityRows[r]
    if (!row) continue
    const date = parseDate(row[0] ?? '')
    if (!date) continue
    equityIds.forEach((id, i) => {
      const val = parseNumber(row[i + 1] ?? '')
      if (val !== null) dataset[id]!.push({ date, value: val })
    })
  }

  // ── Gold ─────────────────────────────────────────────────────────────────
  // Columns: date | Gold USD | Gold CHF
  const goldRows = await fetchAndParse('Market_Data - Gold.csv')
  dataset['gold'] = []
  for (let r = 1; r < goldRows.length; r++) {
    const row = goldRows[r]
    if (!row) continue
    const date = parseDate(row[0] ?? '')
    if (!date) continue
    const val = parseNumber(row[1] ?? '')
    if (val !== null) dataset['gold'].push({ date, value: val })
  }

  // ── Bonds ─────────────────────────────────────────────────────────────────
  // Columns: date | Swiss Bond | Global Agg Bond | 10Y Yield
  const bondRows = await fetchAndParse('Market_Data - Bonds.csv')
  dataset['bonds-swiss'] = []
  dataset['bonds-global'] = []
  for (let r = 1; r < bondRows.length; r++) {
    const row = bondRows[r]
    if (!row) continue
    const date = parseDate(row[0] ?? '')
    if (!date) continue
    const swiss = parseNumber(row[1] ?? '')
    const global = parseNumber(row[2] ?? '')
    if (swiss !== null) dataset['bonds-swiss'].push({ date, value: swiss })
    if (global !== null) dataset['bonds-global'].push({ date, value: global })
  }

  // ── FX ───────────────────────────────────────────────────────────────────
  // Columns: date | USDCHF | EURCHF
  const fxRows = await fetchAndParse('Market_Data - FX.csv')
  dataset['usdchf'] = []
  dataset['eurchf'] = []
  for (let r = 1; r < fxRows.length; r++) {
    const row = fxRows[r]
    if (!row) continue
    const date = parseDate(row[0] ?? '')
    if (!date) continue
    const usd = parseNumber(row[1] ?? '')
    const eur = parseNumber(row[2] ?? '')
    if (usd !== null) dataset['usdchf'].push({ date, value: usd })
    if (eur !== null) dataset['eurchf'].push({ date, value: eur })
  }

  // ── DJIA Single Stocks ───────────────────────────────────────────────────
  // Row 0: company names, Row 1: tickers, Row 2+: data
  const stockRows = await fetchAndParse('Market_Data - DJIA_Single Stocks.csv')
  const tickers = stockRows[1]?.slice(1).map(t => t.trim().toLowerCase().replace(/-us$/, '')) ?? []
  tickers.forEach(t => { if (t) dataset[`stock-${t}`] = [] })

  for (let r = 2; r < stockRows.length; r++) {
    const row = stockRows[r]
    if (!row) continue
    const date = parseDate(row[0] ?? '')
    if (!date) continue
    tickers.forEach((ticker, i) => {
      if (!ticker) return
      const val = parseNumber(row[i + 1] ?? '')
      if (val !== null) dataset[`stock-${ticker}`]!.push({ date, value: val })
    })
  }

  // Map user-friendly IDs to stock entries
  if (dataset['stock-aapl']) dataset['aapl'] = dataset['stock-aapl']
  if (dataset['stock-nvda']) dataset['nvda'] = dataset['stock-nvda']
  if (dataset['stock-gs']) dataset['gs'] = dataset['stock-gs']

  return dataset
}
