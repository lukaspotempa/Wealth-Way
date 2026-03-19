                                                                  # CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Vite dev server
npm run build     # Type-check and build for production
npm run lint      # Run ESLint
npm run preview   # Preview the production build
```

There is no test framework configured in this project.

## Architecture

This is a 3D turn-based board game (wealth-building simulation) built with React 19, TypeScript, Three.js via React Three Fiber, and Zustand for state.

### State Management

All game logic lives in a single Zustand store: `src/store/gameStore.ts`. This is the most important file to understand. It manages:

- **Turn phases**: `"waiting" → "rolling" → "moving" → "event" → "investing" → "game-over"`
- **Player state**: money, tile position, holdings, power-ups, bankruptcy status
- **Investment prices**: simulated each round with per-asset volatility + slight upward bias
- **Progressive unlocking**: ETFs at round 0, Bonds at round 2, Stocks at round 4
- **Event resolution**: dispatches activeEvent which the UI picks up

Key actions: `rollDice()` → `finishMovement()` → `resolveEvent()` → `dismissEvent()` → `endTurn()`.

### Board Layout

40 tiles total: 4 corners (indices 0, 10, 20, 30) + 9 side tiles per side. Corner tiles are **skipped** during movement (they don't consume dice steps). Passing index 0 (START) triggers a new round. Tile definitions are in `src/data/tiles.ts`, spatial positions calculated in `src/utils/tilePositions.ts`.

### 3D Rendering

`src/components/Scene.tsx` sets up a React Three Fiber canvas with isometric camera at `[0, 8, 5]`. The board renders via `Board.tsx` which composes `BoardBase`, `Tile` meshes, `PlayerToken` pawns (lerp-animated), and a `Dice` component. OrbitControls are restricted (30–60° polar, 6–16 distance).

### UI Overlay

HTML overlays sit on top of the 3D canvas:
- `GameSetup.tsx` — player count + name input screen
- `GameHUD.tsx` — turn info, roll button, goal progress bar, net worth, scoreboard, game log
- `EventModal.tsx` — dispatches to the correct panel based on `activeEvent.type`: investment trading (`InvestmentPanel`), market events (with learning tip), income, negative events (with bankruptcy option), or shop (`ShopPanel`)
- `GoalModal.tsx` — celebratory modal triggered when a player hits a life goal net worth threshold; shows achievement, real-world tip, and next goal preview
- `GameOver.tsx` — end-screen with ranked net worth leaderboard and goals summary

### Data Files

- `src/data/investments.ts` — 8 securities (3 ETFs, 2 Bonds, 3 Stocks) with volatility, unlock round, and starting price
- `src/data/events.ts` — 20 market events (5 include `learningTip`), 12 income events, 12 negative events, 4 shop power-up items; events unlock progressively by round
- `src/data/goals.ts` — 5 `LifeGoal` definitions (car $3k → vacation $8k → emergency $20k → home $60k → freedom $200k)
- `src/data/boardConfig.ts` — tile dimensions and layout constants
- `src/types/game.ts` and `src/types/board.ts` — all domain types

### Scenario & Timeline System

`src/data/scenarios.ts` defines 3 `MarketScenario` objects (Turbulent 2020s, Great Bull Run, Lost Decade), each with an array of `TimelineEvent`s tagged to specific rounds. A "Free Play" option has no timeline events.

When a round increments in `endTurn`, the store checks `currentScenario?.events.find(e => e.round === newRound)`. If found, prices are applied immediately via `applyTimelineEvent()` and `activeTimelineEvent` is set. `MarketFlash` reads this state and renders the full-screen event modal. `dismissTimelineEvent` clears it.

Tile-triggered `market-event` tiles are **dampened** when a scenario is active: `dampedMultiplier = 1 + (event.priceMultiplier - 1) * 0.5`. This makes tile events background noise vs. scenario events as the main story.

### Risk Profiles & Starting Portfolio

`src/data/riskProfiles.ts` defines 4 `RiskProfile` objects. `createPlayers()` applies `profile.initialHoldings` at game start — each holding bought at INVESTMENTS initial prices, with remaining cash from $1,000.

All players always start at $1,000 net worth regardless of profile (by design).

### Net Worth History

Each `Player` has `netWorthHistory: number[]` — one entry per round, appended in `endTurn` after price ticks and timeline event application. This feeds the Portfolio Performance Chart (opened from HUD 📊 button).

### Goals System

**Net worth** = `player.money + Σ(holding.quantity × investment.currentPrice)`. Exported as `computeNetWorth(player, investments)` from `gameStore.ts`.

Players have `currentGoalIndex` (index into `LIFE_GOALS`) and `achievedGoals` (array of completed goal ids). After `finishMovement`, `buyInvestment`, and `sellInvestment`, `checkGoalProgress` runs and sets `celebratedGoal` in the store if the threshold is crossed. `GoalModal` reads `celebratedGoal` and renders the celebration; `dismissGoalCelebration` clears it.

### Key Game Rules

- Starting capital: $1,000 per player (player names are user-entered at setup)
- 2% interest on cash each turn (4% with interest-boost power-up)
- Negative events can be blocked by the "tax-shield" power-up
- Bankruptcy: player is eliminated; game ends when only 1 player remains
- Goals are individual per-player — all players pursue the same goal sequence but at their own pace


# MVP requirements + extras
Refer to Challenge.md to see all requirements - You MUST review this file before starting to get the full context

