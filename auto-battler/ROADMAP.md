# Roadmap

---

## Phase 1 — MVP (Now)
**Goal:** Playable single-player demo for the hackathon presentation.

### Core Features
- [ ] Dark finance terminal UI (Tailwind, custom theme)
- [ ] Load & parse real CSV market data
- [ ] Campaign mode: "The Great Financial Crisis" scenario (2007–2016)
- [ ] Portfolio allocation panel (sliders, sum-to-100)
- [ ] Animated chart playback (~25 seconds per round)
- [ ] Ticker tape with live asset prices
- [ ] Mini asset cards with sparklines
- [ ] Round end summary (returns, benchmark comparison, educational tip)
- [ ] Asset unlock progression (rounds 1→3→5→7→9)
- [ ] Game end screen (final value, 10-round history)
- [ ] 3 historical event cards per scenario

### Tech Setup
- Vue 3 + TypeScript
- Tailwind CSS v4 (via @tailwindcss/vite)
- Pinia (game store + market store)
- Vue Router (home → game → summary)
- Chart.js (main chart + sparklines)
- PapaParse (CSV loading)

---

## Phase 2 — Polish & Content
**Goal:** Demo-ready, visually impressive, with full educational content.

- [ ] Multiple scenarios (3 total, selectable on home screen)
- [ ] Animated news event cards mid-round with brief explainers
- [ ] Portfolio synergy badges (60/40 Classic, Gold Bug, All-In, etc.)
- [ ] Risk profile quiz on first launch ("Are you a Risk Taker or Safety Net?")
- [ ] Animated value counter (ticking up/down as chart plays)
- [ ] Sound design (soft market ambience, crash sound, win jingle)
- [ ] Benchmark rival line on chart (always visible, slightly dimmed)
- [ ] End-of-round animated bars showing all asset returns
- [ ] "Rewind" — after round end, replay the chart at 3x speed
- [ ] Mobile-responsive layout
- [ ] Tutorial overlay for new players (first round only)
- [ ] Smooth transitions and loading states

---

## Phase 3 — Multiplayer Battle Mode
**Goal:** Event-ready multiplayer for workshops and school programs.

### Architecture
- **Supabase** for game rooms, player state, leaderboard persistence
- **Supabase Realtime** for live sync (all players see same chart tick at same time)
- Host/guest model: host creates room, players join via QR/code

### Features
- [ ] Create/join game room (4-letter code)
- [ ] QR code generation for easy mobile join
- [ ] Prep phase with countdown timer (60 seconds)
- [ ] Synchronized market playback for all players
- [ ] Live leaderboard sidebar (updates after each round)
- [ ] Portfolio reveal at round end (see what others bet on)
- [ ] Post-game badges: "Most Diversified," "Biggest Risk Taker," "Beat the Market," etc.
- [ ] Spectator mode (host projector screen)
- [ ] Session history (optional — view past games)

### Supabase Schema (Draft)
```sql
game_sessions (id, code, scenario, host_id, phase, current_round, created_at)
players (id, session_id, name, portfolio_value, allocations jsonb)
round_allocations (player_id, round, allocations jsonb, return_pct)
```

---

## Phase 4 — LLM Investment Coach
**Goal:** Claude-powered coach that reacts to your portfolio decisions in real-time.

- AI explains *why* a year was good or bad for your portfolio
- "What if" analysis: "If you had held gold, you'd be 12% better off"
- Personalized learning — tracks what concepts you've already seen
- Beginner/expert tone toggle
- Coach avatar in the UI (subtle, not intrusive)
- Powered by Claude API (Anthropic)
- Optional voice mode for accessibility

---

## Future Ideas (Backlog)

- **"What actually happened"** mode — see the real historical allocations of famous investors (Warren Buffett in 2008, etc.)
- **Achievements** — "Survived the Dotcom Bust," "Beat Buffett," "Zero Bonds Challenge"
- **Scenario editor** — create custom scenarios from any date range
- **Crypto** — BTC/ETH as a high-volatility asset class (Phase 2+)
- **SMI single stocks** — Swiss market for PostFinance's core audience
- **Export report** — PDF summary of your 10-round game for workshop takeaways
- **Classroom mode** — Teacher sees all students' portfolios on one screen
