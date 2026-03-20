# The Wealthy Way > [Try it Yourself](https://investmentgame.de)
### *The Duolingo of Financial Literacy*

> **Build the investing habits that secure your future — one lesson, one battle, one portfolio at a time.**

[Investmentgame.de](https://investmentgame.de)
---

## The Problem

Most people never invest. Not because they can't afford to — but because nobody ever taught them how.

Financial literacy is the single biggest predictor of long-term wealth, yet it's absent from most school curricula. The result: millions of people leave their savings in a bank account, unknowingly watching inflation quietly erode their future, year after year.

**We built the app we wish we'd had at 12.**

---

## What Is 'The Wealthy Way'?

The Wealthy Way is a **gamified financial education platform** — think Duolingo, but for investing. We guide users from *"what is inflation?"* all the way to *"how do I build a globally diversified, risk-adjusted portfolio?"* — through interactive lessons, story-driven exercises, and a real portfolio battle mode powered by 20 years of actual market data.

Two modes. One mission:

| Mode                 | What It Does |
|----------------------|---|
| **Finance Journey**  | Bite-sized lessons & quizzes that build investing intuition from scratch |
| **Portfolio Battle** | Build a real portfolio and watch it race against benchmarks (and your friends) |

---

## Meet Barry the Bull

Barry is your guide — a friendly bull mascot who walks you through your first steps into the world of investing. He'll ask you a few questions, then tailor your learning path based on your age, experience, and financial goals.

*"So you want to invest huh? First answer some of my questions."* — Barry 🐂

---

## The Learning Journey

### Personalized from Day One

Before anything else, you complete a 3-step onboarding:

1. **Who are you?** — Junior Explorer, Adolescent, Grown-up, or Senior
2. **What do you know?** — Beginner, Intermediate, or Advanced
3. **What are you saving for?** — Gaming PC, Car, House, Early Retirement, or Financial Independence

Your answers unlock a custom learning path on a beautiful winding journey map — just like Duolingo's iconic course view.

### Lesson 1: The Three Children

Meet Alex, Bea, and Chris — three 12-year-olds who each receive CHF 15/month.

- **Alex** spends it all. Zero accumulated.
- **Bea** saves in a piggy bank. CHF 1,260 by age 18 — but inflation silently ate its value.
- **Chris** invests in the S&P 500. CHF 1,586 by age 18, backed by real 2012–2018 market data.

This story teaches the single most important concept in personal finance: **your savings are losing value right now, and it doesn't have to be that way.**

### Lesson 2: Time in Market

Missing just the 10 best trading days over 20 years can cut your returns in half. We show it with real data and a game that lets you feel it.

### Lesson 3: ETFs & Diversification

Single stocks are a gamble. ETFs are a strategy. We explain why spreading risk across the market beats picking winners — and back it up with a 5-year simulation you control.

### The Investment Simulator

Before you touch the Portfolio Battle, you practice. Start with CHF 10,000. Allocate it across three asset classes using sliders:

- **ETF** — stable, diversified, boring (in the best way)
- **Stocks** — higher upside, higher drama
- **Crypto** — for the brave and the reckless

Watch 5 years of simulated market performance unfold. Your goal: reach CHF 13,000. Learn viscerally why volatility matters before you bet real money.

---

## Portfolio Battle

This is where the theory becomes real.

### Build Your Portfolio

Choose from **50+ real investable assets** across categories:

- **Equity Indices**: SMI, DAX, EuroStoxx 50, Dow Jones, Nikkei 225
- **Swiss Blue Chips**: Nestlé, Roche, UBS, ABB, Zürich Insurance, and 15 more
- **US Giants**: Apple, Microsoft, Amazon, Tesla, Berkshire Hathaway, and 25 more
- **Bonds**: Swiss AAA–BBB, Global Aggregate
- **Real Assets**: Gold (CHF)

Set your allocation percentages. Choose your historical time window (10–24 years of real data, Feb 2006–Aug 2025). Lock it in.

### Watch the Battle

Your portfolio races against the market — year by year, in real time:

- 📈 **Your portfolio** vs. the S&P 500 vs. the MSCI World
- 📉 **Inflation** tracked throughout so you always see real purchasing power
- 🏆 **Leaderboard** updates live as each year ticks by

### The Sharpe Ratio Lesson

Raw returns aren't everything. A portfolio that gains 15% with extreme volatility is worse than one that gains 12% steadily. We show users the **Sharpe Ratio** — risk-adjusted return — and award badges based on their score. It's the metric professional fund managers live by, taught through play.

### Multiplayer Mode

Challenge your friends. Share a 6-digit lobby code. Up to 10 players submit their portfolios, then watch the race unfold in real time over WebSockets. Who built the better portfolio? Find out in under 3 minutes.

---

## Technical Architecture

```
Frontend: Vue 3 + TypeScript + Pinia + Chart.js
Backend:  FastAPI + WebSockets + SQLite
Data:     7 CSV datasets, Feb 2004 – Aug 2025
Deploy:   Static frontend + containerized backend (Docker)
```

### What Makes It Work

**Real historical market data** — not simulations, not made-up numbers. Every battle uses actual annual returns for every asset, sourced from real market history. When you build a portfolio of Swiss blue chips vs. global ETFs and pick the period 2008–2020, you're living through the real financial crisis and real recovery.

**Market data engine** (`autoBattleEngine.ts`) — Parses and caches all CSVs, computes portfolio snapshots year-by-year, calculates Sharpe Ratio, Max Drawdown, and CAGR for any combination of assets over any time window in milliseconds.

**WebSocket multiplayer** (`lobby_manager.py`) — Async Python orchestrates multi-player lobbies: lobby creation, portfolio submission windows, synchronized YEAR_TICK broadcasts, and live leaderboard streaming. All players see the race update simultaneously.

**SVG Journey Map** (`JourneyView.vue`) — The lesson path is a computed sine-wave of Bezier-connected nodes. Node states (locked / available / completed) are reactive. Tooltips, pulse animations, and progress tracking are all driven by a Pinia store that persists to localStorage.

**Barry the Bull** (`BarryTheBull.vue`) — A persistent mascot component that shows contextual tips once, remembers what it's already told you via localStorage, and animates in with a speech bubble on every first visit.

---

## Why This Wins

| Feature | Why It Matters |
|---|---|
| Narrative-first lessons | Concepts stick when they live in a story |
| Real 20-year market data | Trust through authenticity — not toy numbers |
| 50+ investable assets | Real diversification decisions, not abstract theory |
| Multiplayer portfolio battles | Social learning + healthy competition |
| Sharpe Ratio as a mechanic | Teaches risk management before users develop bad habits |
| Personalized for ages 5–65+ | Financial literacy is for everyone |
| CHF-native, Swiss-focused | Localized to where our users actually live and invest |
| No real money, zero risk | The safest way to learn the most dangerous lesson: *don't not invest* |

---

## Getting Started

### Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Docker

```bash
cd backend
docker build -t wealthy-way-backend .
docker run -p 8000:8000 wealth-way-backend
```

---

## The Team

Built with conviction that **financial literacy is not a luxury — it's a right.**

We believe the best time to learn to invest is at age 12. The second best time is today.

> <img src="https://avatars.githubusercontent.com/lukaspotempa" height="60px" title="Lukas P." alt="Portrait"/> | <a href="https://github.com/lukaspotempa" target="_blank">@LukasPotempa</a>

> <img src="https://avatars.githubusercontent.com/MaxWinzek" height="60px" title="Max W." alt="Portrait"/> | <a href="https://github.com/MaxWinzek" target="_blank">@MaxWinzek</a>

> <img src="https://avatars.githubusercontent.com/Erijl" height="60px" title="Justus M." alt="Portrait"/> | <a href="https://github.com/erijl" target="_blank">@Erijl</a>

---

*The Wealthy Way — because your future self deserves better than a savings account.*
