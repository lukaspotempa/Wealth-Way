# Wealth Manager Arena — Auto-Battler Mode
## Concept & Design Document

---

## The Problem We're Solving

~50% of adults have never invested. The barriers are:
- **Fear** of losing money
- **Complexity** — asset classes, risk, diversification feel overwhelming
- **No safe sandbox** to experiment in — traditional stock market games run too short to teach long-term thinking

Classic investing education is passive, boring, and fails to build intuition. The goal here is to create something that actually *feels like a game you'd play for fun* — but leaves you understanding why diversification matters, what a bear market feels like, and how compounding works over time.

---

## The Auto-Battler Metaphor

In games like **TFT, AutoChess, or Super Auto Pets**, the player's core decision is *composition* — which units to pick and how to combine them. The battle itself happens automatically. This maps perfectly to investing:

| Auto-Battler | Wealth Manager Arena |
|---|---|
| Pick your units | Allocate your portfolio |
| Unit synergies | Asset class correlations |
| Round = battle | Round = 1 year of market data |
| Watch the fight | Watch the market play out |
| Score = surviving health | Score = portfolio value |
| Unlock new units | Unlock new asset classes |

**The player's only active choice is the pre-round allocation.** Everything else is emergent from real historical market data. This is both thematically perfect for teaching investing and mechanically satisfying.

---

## Core Principles We Teach

1. **Diversification** — Spreading allocation across asset classes reduces risk
2. **Volatility** — Watching your portfolio swing teaches emotional resilience
3. **Long-term thinking** — One bad year doesn't ruin a 10-year strategy
4. **Asset class behavior** — Bonds are stable but slow; equities are volatile but rewarding; gold hedges uncertainty; FX adds currency risk
5. **Benchmarking** — Your portfolio vs. a neutral benchmark (60/40 or market average) — are you beating it?

---

## Two Modes

### Campaign Mode
Solo. 10 rounds. One historical scenario (e.g. The Great Financial Crisis 2007–2016).

**Progressive unlock:** You start with only 2–3 asset classes and unlock more as you advance. This mirrors a real investor's journey — you don't start with 30 stocks, FX exposure, and bond ladders on day one. Each unlock comes with a brief explanation of the new asset class.

```
Round 1–2:    Equities only (DJIA, SMI, EuroStoxx)
Round 3:      + Gold unlocked  ← "Safe haven asset"
Round 5:      + Bonds unlocked ← "Fixed income 101"
Round 7:      + FX unlocked    ← "Currency risk explained"
Round 9:      + Individual stocks ← "Stock picking vs. index funds"
```

### Battle Mode *(future — Phase 3)*
Multiplayer. Same scenario plays out for all players simultaneously. Everyone sees the same market data at the same time. Leaderboard at the end. Perfect for school workshops and events.

Real-time sync via Supabase Realtime or WebSockets. QR-code join. No account needed.

---

## Visual Language

**Dark finance terminal aesthetic** — inspired by Bloomberg Terminal and Binance UI, but cleaner and more approachable for beginners.

- Background: near-black (`#0a0e1a`)
- Surface panels: dark navy (`#0f1629`)
- Accent / bullish: teal-green (`#00d4aa`)
- Bearish / loss: red (`#ff4757`)
- Text: light grey (`#e8eaf0`)
- Numbers: monospace font
- Micro-animations: chart lines drawing themselves, value counters ticking

**The main chart** is the emotional centerpiece — watching your portfolio line climb or fall in real-time is the core dramatic tension of the game.

---

## What Makes It Fun (Not Just Educational)

- **Drama** — The 2008 crash plays out in 20 seconds. You watch your portfolio lose 40%. That's visceral.
- **News event cards** — "Lehman Brothers collapses" pops up mid-round with a brief explainer. Context makes the numbers meaningful.
- **Portfolio synergies** (planned) — "60/40 Classic" portfolio bonus. "Gold Bug" hedge bonus. Rewards smart diversification.
- **Replayability** — Different scenarios, different allocations, different outcomes. Good players discover strategies; beginners learn by doing.
- **Benchmark rivalry** — You're always racing against a neutral benchmark. Are you smarter than the average market?
