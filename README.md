# The Wealthy Way
### *The Duolingo of Financial Literacy*

**[investmentgame.de](https://investmentgame.de)** — Built at [START Hack 2026](https://starthack.eu)

![Vue 3](https://img.shields.io/badge/Vue-3-42b883?logo=vue.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.11x-009688?logo=fastapi&logoColor=white)

---

<img src="gh-assets/journey.png" alt="Learning Journey" width="49%"/> <img src="gh-assets/portfolio-battle.png" alt="Portfolio Battle" width="49%"/>

---

## What It Is

A gamified financial education platform that takes anyone from *"what is inflation?"* to *"how do I build a risk-adjusted portfolio?"* — through story-driven lessons, interactive quizzes, and a real portfolio battle backed by 20 years of actual market data.

Financial literacy is absent from most school curricula. We built the app we wish we'd had at 12 — real data, no real money, zero risk.

---

## Features

| | Feature | Details |
|---|---|---|
| 🐂 | **Barry the Bull** | Personalized onboarding — age, experience level, and savings goal unlock a tailored learning path |
| 🗺️ | **Finance Journey** | Duolingo-style lesson map with story-driven modules, quizzes, and an investment simulator |
| 📈 | **Portfolio Battle** | Build a portfolio from 50+ real assets and race it against S&P 500, MSCI World, and inflation |
| 🏆 | **Sharpe Ratio mechanic** | Risk-adjusted returns taught as a scoring system — not a footnote |
| 🕹️ | **Multiplayer** | Up to 10 players, shared lobby code, live WebSocket race with real-time leaderboard |
| 📊 | **Real historical data** | 20 years of actual annual returns (Feb 2004 – Aug 2025) across 50+ assets |

<img src="gh-assets/onboarding.png" alt="Onboarding" width="49%"/> <img src="gh-assets/onboarding-goal.png" alt="Goal Selection" width="49%"/>

<img src="gh-assets/barry.png" alt="Barry the Bull" width="30%"/> <img src="gh-assets/lesson-timing-the-market.png" alt="Lesson: Timing the Market" width="65%"/>

---

## Stack

```
Frontend  Vue 3 · TypeScript · Pinia · Chart.js
Backend   FastAPI · WebSockets · SQLite
Data      7 CSV datasets, Feb 2004 – Aug 2025
Deploy    Static frontend + Docker (backend)
```

---

## Getting Started

```bash
# Frontend
cd frontend && npm install && npm run dev
# → http://localhost:5173

# Backend
cd backend && pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

---

## Team

> <img src="https://avatars.githubusercontent.com/lukaspotempa" height="50px" alt="Lukas P."/> &nbsp; [@LukasPotempa](https://github.com/lukaspotempa)

> <img src="https://avatars.githubusercontent.com/MaxWinzek" height="50px" alt="Max W."/> &nbsp; [@MaxWinzek](https://github.com/MaxWinzek)

> <img src="https://avatars.githubusercontent.com/Erijl" height="50px" alt="Justus M."/> &nbsp; [@Erijl](https://github.com/erijl)

---

*Because your future self deserves better than a savings account.*
