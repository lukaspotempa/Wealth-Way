# Game Loop & Mechanics

---

## Round Structure

Each round = 1 calendar year of real historical market data, compressed to ~25 seconds of animation.

```
┌─────────────────────────────────────────────────────────┐
│                    ROUND N / 10                         │
│                                                         │
│   [1. CONTEXT CARD]  →  [2. PREP PHASE]  →  [3. PLAY]  │
│                                                         │
│           ↑                                  ↓         │
│     (read the room)                   [4. ROUND END]    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Phase 1 — Context Card (~5 sec)
A brief "headline" card before the round starts. Sets the scene.
- Year + era name (e.g. "2008 — The Year Everything Broke")
- 1–2 sentence narrative
- Optional: hint about what historically happened (tunable difficulty — beginner vs. expert)

### Phase 2 — Prep Phase (unlimited time, or 30s countdown for battle mode)
The portfolio builder is fully open. This is the *strategy layer*.
- Allocate your virtual portfolio across available asset classes
- Sliders that always sum to 100%
- See potential synergy bonuses (planned)
- See last year's performance per asset (historical context)
- "Commit Portfolio" button locks in and starts the round

**Rules:**
- You cannot change allocation mid-round (that's the whole point)
- Minimum 0%, maximum 100% per asset
- Campaign: only unlocked assets are available

### Phase 3 — Play Phase (~25 seconds)
The market simulation runs. The chart draws itself left to right, day by day, at ~10 trading days per second.

**What you see:**
- Main chart: all available assets indexed to 100 at round start, with your selected asset highlighted
- Portfolio value ticker: your running portfolio value, updating in real-time
- Ticker tape (top): live prices + % change from round start
- Event cards: pop up at historically significant moments mid-animation (e.g. "Fed raises rates", "Lehman collapses")
- Mini asset cards: show each asset's current year-to-date performance

**Player actions during play:** None. Watch and feel the tension. This is intentional — investing isn't about reacting second-by-second.

### Phase 4 — Round End Overlay
Appears at end of animation. Key metrics:

```
Year 2008 Complete

Your portfolio:     -23.4%   Portfolio value: $7,660
Benchmark (60/40):  -28.1%   ✅ Beat the benchmark!

Best asset:   Gold  +5.2%   "Gold acted as a safe haven"
Worst asset:  Banks -54%    "Financial sector led the crash"

💡 Learning tip: Diversification protected you here. Your
   bonds offset equity losses, limiting downside to 23%
   vs. the pure equity index which lost 40%.

[Next Round →]
```

---

## Scoring System

### Portfolio Value
Starts at **$10,000**. Compounds across all 10 rounds.

```
End value = $10,000 × (1 + r₁) × (1 + r₂) × ... × (1 + r₁₀)
```

Where each `rₙ` is the weighted average return of your portfolio allocation for that year.

### Benchmark
A neutral 60% global equities / 40% bonds portfolio. Always calculated in parallel. Your "rival."

### Bonus Points (planned)
- Beat the benchmark: +500 pts
- Positive return in a down year: +1000 pts
- Diversification bonus (4+ assets): +200 pts
- Synergy bonuses (specific portfolio compositions)

---

## Campaign Progression — Asset Unlocks

```
Round 1  Start:     DJIA, SMI, EuroStoxx 50
Round 3  Unlock:    Gold
          "Markets can crash. Gold often holds value when they do."

Round 5  Unlock:    Bonds (Swiss Bond Index, Global Aggregate)
          "Fixed income 101: lower returns, lower risk, stable income."

Round 7  Unlock:    FX (USD/CHF, EUR/CHF)
          "Currency exposure: your Swiss portfolio is affected by exchange rates."

Round 9  Unlock:    Individual Stocks (Apple, NVIDIA, Goldman Sachs, etc.)
          "Single stocks: higher upside, higher downside. Concentration risk."
```

Each unlock pauses the flow for a brief "asset class intro" card.

---

## Scenarios

### 1. The Great Financial Crisis (Default Campaign)
**Years:** 2007–2016
**Theme:** Subprime crash, sovereign debt crisis, slow recovery
**Educational focus:** Volatility, diversification, staying invested through downturns
**Key events:**
- 2008: Lehman Brothers collapse (-40% equities)
- 2009: The recovery begins
- 2010: European debt crisis
- 2012: "Whatever it takes" — Draghi saves the Euro

### 2. Lost Decade & QE Era
**Years:** 2006–2015
**Theme:** From pre-crisis peak through GFC and into quantitative easing
**Educational focus:** Long-term compounding, bond performance in low-rate environment

### 3. Modern Bull Market
**Years:** 2013–2022
**Theme:** Long bull run interrupted by COVID crash and recovery
**Educational focus:** Growth vs. value, tech concentration, black swan events
**Key events:**
- 2020: COVID crash (fastest 30% drawdown ever), then fastest recovery

### 4. Decade of Extremes *(planned)*
**Years:** 2015–2024
**Theme:** Everything happens: ZIRP, COVID, inflation spike, AI boom
**Educational focus:** Inflation, rate cycles, sector rotation

---

## Portfolio Synergies (Planned Feature)

Visual bonuses that reward textbook-good investing behavior:

| Synergy | Condition | Effect |
|---|---|---|
| "Classic 60/40" | Equities 55-65% + Bonds 35-45% | -10% volatility modifier |
| "Gold Bug" | Gold > 20% | Bonus in crash years |
| "All-In" | One asset > 85% | ×1.5 return multiplier (good and bad) |
| "True Diversifier" | 5+ assets, each 10%–30% | +1% annual return bonus |
| "Home Bias" | >50% in home market (SMI) | Mild penalty in global crashes |

Synergies are shown as badges in the portfolio panel before committing.

---

## Multiplayer Battle Mode (Phase 3 Design)

**Session flow:**
1. Host creates a game room → gets a 4-letter code
2. Players join via QR code or code entry (no account needed)
3. Host picks scenario
4. All players in prep phase simultaneously (countdown timer)
5. Market plays out — everyone sees the same chart at the same time
6. Live leaderboard updates in real-time
7. Repeat for all rounds
8. Final leaderboard + "Most Diversified," "Biggest Risk Taker," etc. badges

**Tech:** Supabase Realtime for game state sync. Each player's allocation is private until round end, then revealed on the leaderboard with their reasoning.

**Event format:** Works great for 10–30 people in a room (school, bank event, workshop). Host screen on a projector, players on phones.
