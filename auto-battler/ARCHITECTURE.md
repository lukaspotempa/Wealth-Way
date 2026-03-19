# Architecture & Technical Design

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Vue 3 + TypeScript | Already set up; Composition API is clean for reactive game state |
| Styling | Tailwind CSS v4 | Fast dark-theme setup, CSS variables for game colors |
| State | Pinia | Simple, typed, devtools support |
| Routing | Vue Router | Home → Game → Summary |
| Charts | Chart.js | Direct canvas control, smooth animation updates |
| CSV | PapaParse | Fast browser-side CSV parsing |
| Future backend | Supabase | Realtime, auth, leaderboard, no backend infra needed |

---

## Directory Structure

```
src/
  router/
    index.ts              # Routes: /, /game, /summary

  stores/
    game.ts               # Round state, portfolio, scoring, phase management
    market.ts             # CSV data loading, simulation playback, current prices

  utils/
    csvParser.ts          # Load + parse all 6 CSV files into unified format
    scenarios.ts          # Scenario definitions (years, events, descriptions)
    gameConstants.ts      # Asset metadata (colors, names, icons, categories)

  views/
    HomeView.vue          # Landing page, mode select, scenario select
    GameView.vue          # Main game screen (composes all components)
    SummaryView.vue       # Game-end final results

  components/
    TickerTape.vue        # Scrolling top bar with live asset prices
    MainChart.vue         # The central animated price chart
    PortfolioPanel.vue    # Right-side allocation builder + value display
    AssetGrid.vue         # Bottom row of mini asset cards
    AssetCard.vue         # Individual mini card with sparkline
    RoundSummary.vue      # End-of-round overlay
    EventCard.vue         # Pop-up news card during simulation
    GameHUD.vue           # Round counter, portfolio value, benchmark gap

  style.css               # Tailwind import + custom CSS vars + fonts
  main.ts                 # App bootstrap
  App.vue                 # Root component, router-view
```

---

## Data Flow

```
CSV files (public/)
    │
    ▼
csvParser.ts                    ← runs once on app load
    │  produces:
    │  Record<assetId, { date, value }[]>
    ▼
marketStore.ts
    ├── allData: full historical dataset
    ├── currentYearData: sliced to active round's year
    ├── simulationIndex: 0..N (current animation frame)
    └── currentPrices: normalized prices at simulationIndex
            │
            ▼ (reactive, drives UI)
    ┌───────┼──────────────────────┐
    │       │                      │
TickerTape MainChart            AssetCard sparklines

gameStore.ts
    ├── phase: 'prep' | 'playing' | 'round_end' | 'game_end'
    ├── currentRound: 1..10
    ├── portfolio: { [assetId]: pct }    ← player input
    ├── portfolioValue: number           ← compounds across rounds
    ├── roundHistory: RoundResult[]
    └── unlockedAssets: string[]
            │
            ▼ (drives)
    PortfolioPanel, RoundSummary, GameHUD
```

---

## Key Stores

### gameStore.ts
```typescript
interface GameState {
  mode: 'campaign' | 'battle'
  scenario: Scenario
  phase: 'prep' | 'playing' | 'round_end' | 'game_end'
  currentRound: number          // 1-indexed
  portfolio: Record<string, number>  // assetId → allocation %
  portfolioValue: number        // starts at 10000
  benchmarkValue: number        // 60/40 portfolio, same start
  roundHistory: RoundResult[]
  unlockedAssets: string[]
}

interface RoundResult {
  round: number
  year: number
  portfolioReturn: number       // e.g. -0.234 for -23.4%
  benchmarkReturn: number
  bestAsset: { id: string; return: number }
  worstAsset: { id: string; return: number }
  portfolioValue: number        // value at end of this round
  beatBenchmark: boolean
}
```

### marketStore.ts
```typescript
interface MarketState {
  allData: Record<string, PricePoint[]>    // full 2006-2025 data
  currentYearData: Record<string, PricePoint[]>  // sliced to current round year
  simulationIndex: number       // 0..N, drives animation
  isPlaying: boolean
  animationSpeed: number        // ms per trading day (default: 40ms → ~10 days/sec)
}

interface PricePoint {
  date: Date
  value: number
  normalized: number            // indexed to 100 at round start
}
```

---

## Chart Architecture

### Main Chart
- Canvas element, Chart.js `line` type
- One dataset per asset, all visible
- Selected asset: full opacity, thicker line
- Others: 15% opacity, thin
- X-axis: months of the year (Jan–Dec)
- Y-axis: normalized index (100 = round start value)
- Animation: `chart.update('none')` called every tick to avoid janky built-in animation
- Horizontal reference line at 100 (start value)

### Simulation Tick
```typescript
// Every animationSpeed ms, advance one trading day
// Roughly 250 trading days per year → at 40ms each → 10 seconds
// Or throttle to ~25 second playback: 250/25 * 16ms = step every 100ms
const step = () => {
  if (!isPlaying) return
  simulationIndex++
  if (simulationIndex >= totalDays) {
    endRound()
    return
  }
  updatePrices()          // update currentPrices reactive state
  updatePortfolioValue()  // recalculate portfolio value at current prices
  // chart update driven by Vue reactivity watching currentPrices
}
setInterval(step, 80) // ~3 trading days per second, full year in ~80sec
                      // or use requestAnimationFrame for smoother control
```

### Sparklines (AssetCard)
Small Chart.js charts, `tension: 0.4`, no axes, no tooltips. Just a shape.

---

## CSV Data Notes

All files in `public/`, fetched client-side.

| File | Assets | Notes |
|---|---|---|
| `Market_Data - Equity Indices.csv` | SMI, EuroStoxx 50, DJIA, Nikkei 225, DAX | Daily, 2006–2025 |
| `Market_Data - Gold.csv` | Gold USD, Gold CHF | Daily, 2006–2025 |
| `Market_Data - Bonds.csv` | Swiss Bond Index, Global Agg Bond, 10Y Yield | Some early `#N/A` values |
| `Market_Data - FX.csv` | USD/CHF, EUR/CHF | Daily, 2006–2025 |
| `Market_Data - DJIA_Single Stocks.csv` | 30 DJIA components | Daily, 2006–2025 |
| `Market_Data - SMI_Single Stocks.csv` | SMI components | TBD |

**Parsing notes:**
- Date format: `DD/MM/YYYY`
- Numbers: European format with comma thousands separator (`"  7,917.1 "`)
- `#N/A` values → skip that data point
- Normalize to index = 100 at first day of each scenario year

---

## Multiplayer Architecture (Phase 3 Design)

```
┌──────────────┐     Supabase Realtime      ┌──────────────┐
│   Player A   │◄──────────────────────────►│   Player B   │
│  (browser)   │                            │  (browser)   │
└──────┬───────┘                            └──────┬───────┘
       │                                           │
       └──────────────┬────────────────────────────┘
                      │
               ┌──────▼───────┐
               │   Supabase   │
               │  Postgres    │
               │  + Realtime  │
               └──────────────┘
```

**Sync model:**
- Market simulation runs client-side (deterministic from scenario seed)
- Supabase syncs: game phase, round number, player allocations (hidden until reveal)
- No need to sync chart frame-by-frame — all clients run the same animation independently
- Phase transitions (prep→play→end) are broadcast via Supabase Realtime channel

**Room lifecycle:**
```
CREATE ROOM → WAITING (players join) → PREP (countdown) →
PLAYING (30sec) → ROUND_END (5sec reveal) → PREP ... → GAME_END
```
