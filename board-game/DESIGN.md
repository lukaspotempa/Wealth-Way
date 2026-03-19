# Wealth Manager Arena — Design Document

## Why Goals?

The central insight behind goal-based design: **people don't intrinsically want "more money" — they want what money enables**. A car. A trip. Security. A home. Freedom.

Traditional financial education fails because it speaks in abstractions (compound interest, diversification, asset allocation) divorced from anything the student actually wants. This game inverts that: we show the life milestone first, and the investing mechanism becomes the *path* to something real.

Goals also solve the motivation problem in a board game context. Without them, players optimise for abstract "net worth" — which feels like a scorekeeping exercise. With goals, each turn is progress toward something the player named and chose to pursue. The first car feels like freedom. The emergency fund feels like safety. The down payment feels like adulthood.

Goals are the "why" that makes the investing lessons stick.

---

## Goal Calibration

Goals are calibrated to feel achievable within a full game while still requiring strategic investment decisions:

| Goal | Target Net Worth | Rationale |
|---|---|---|
| First Car | $3,000 | Achievable in early rounds with basic ETF investing; teaches saving habits |
| Dream Vacation | $8,000 | Requires compound growth kicking in; shows the power of staying invested |
| Emergency Fund | $20,000 | Mid-game milestone; teaches the 3–6 month rule and cash vs. portfolio balance |
| Home Down Payment | $60,000 | Late-game requiring diversified portfolio; teaches patient, consistent investing |
| Financial Freedom | $200,000 | Stretch goal; the "4% rule" becomes tangible at this number |

The gaps between goals are intentional:
- **$3k → $8k**: modest, shows early momentum
- **$8k → $20k**: first "hard" jump, teaches sustained discipline
- **$20k → $60k**: requires unlocked bonds and stocks; diversification becomes necessary
- **$60k → $200k**: stock exposure with volatility events teaches risk tolerance

Starting cash is $1,000 with 2% per-turn interest, so a player doing nothing will reach $3,000 in roughly 55 turns. Investing accelerates this dramatically — typically to under 10 rounds — which is the core demonstration.

---

## Learning Design

The game teaches via **experience, not explanation**. Each mechanic creates an emotional memory tied to an investing principle:

### What the game teaches, and how:

**1. Compound growth is real and fast**
The 2% per-turn interest plus price appreciation makes money visibly "work". Players watch the numbers grow each turn without action, creating an intuitive feel for compound growth.

**2. Diversification protects against catastrophe**
The Wirecard-style event destroys a single stock by 88%. Players holding diversified ETFs + bonds barely notice. Players who went "all-in" feel the lesson viscerally. No lecture needed.

**3. Staying invested through downturns pays off**
The COVID crash event (-26%) is immediately followed by the AI Rally event (+22%). Players who panic-sold at the bottom miss the recovery. The learning tip in the modal explains this explicitly.

**4. Risk and reward are linked**
ETFs are safe and slow. Stocks are volatile but powerful. Bonds offer stability. The category unlock system (ETFs → Bonds → Stocks) mirrors how beginner investors should realistically expand their risk appetite as they learn.

**5. Emergency funds enable risk-taking**
The shop's "Emergency Fund Buffer" item protects against negative events. Players without one face potential bankruptcy from a medical bill. This mirrors real life: without a buffer, you can't afford to invest in volatile assets.

**6. Goals require different strategies**
Reaching the First Car goal ($3k) is easy with cash. Reaching Financial Freedom ($200k) requires portfolio optimization, risk management, and patience through multiple market cycles. The game forces strategy to evolve.

### Learning Tip Design

Each major market event includes an optional `learningTip` field that:
- Appears only in the event modal (non-intrusive)
- References a specific real-world stat or outcome
- Is written in plain language, not jargon
- Reinforces *why* the event matters for long-term investors

Goal achievement modals also include a `realWorldTip` that ties the milestone to a specific personal finance principle.

---

## Game Flow Mapping to Real Life

| Game Mechanic | Real-World Equivalent |
|---|---|
| Starting $1,000 | First paycheck / entry-level salary savings |
| 2% per-turn interest | Annual savings rate applied across months |
| ETFs available from turn 1 | Low-cost index funds — beginner's best friend |
| Bonds unlocked in Round 3 | Conservative investors add bonds as capital grows |
| Stocks unlocked in Round 5 | Individual stock picking requires experience and research |
| Market event tiles | Macro news cycles that move markets unpredictably |
| Income tiles | Salary growth, side income, dividends |
| Negative event tiles | Medical bills, repairs, unexpected costs — why emergency funds exist |
| Shop power-ups | Financial products (HYSAs, research tools, insurance) |
| Goal milestones | Real financial milestones in a typical life trajectory |
| Game Over / net worth ranking | A snapshot: 20-year investing journey compressed to 45 minutes |

The game deliberately compresses time. One "round" might represent six months to a year of real financial progress. The goal is to give players the emotional arc of a multi-decade investing journey in a single session — including crashes, windfalls, and compounding milestones — so they walk away with intuitions that take most people decades to develop.
