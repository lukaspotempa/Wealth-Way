import { create } from "zustand";
import type {
  Player,
  InvestmentOption,
  ActiveEvent,
  TurnPhase,
  PowerUp,
  LifeGoal,
  MarketScenario,
  TimelineEvent,
  RiskProfileId,
} from "../types/game";
import { PLAYER_COLORS } from "../types/game";
import { INVESTMENTS } from "../data/investments";
import { MARKET_EVENTS, INCOME_EVENTS, NEGATIVE_EVENTS, SHOP_ITEMS } from "../data/events";
import { TOTAL_TILES, generateTiles } from "../data/tiles";
import { LIFE_GOALS } from "../data/goals";
import { getRiskProfile } from "../data/riskProfiles";
import { getScenario } from "../data/scenarios";

// ── Helpers ────────────────────────────────────────────────────────────────

function cloneInvestments(): InvestmentOption[] {
  return INVESTMENTS.map((inv) => ({
    ...inv,
    priceHistory: [...inv.priceHistory],
  }));
}

/**
 * Create players with starting portfolios based on chosen risk profiles.
 * Initial investments are purchased at the original INVESTMENTS prices.
 */
function createPlayers(
  count: number,
  names: string[],
  riskProfileIds: RiskProfileId[]
): Player[] {
  const baseInvestments = cloneInvestments();

  return Array.from({ length: count }, (_, i): Player => {
    const profileId = riskProfileIds[i] ?? "balanced";
    const profile = getRiskProfile(profileId);

    // Build initial holdings and compute cash cost
    const holdings = profile.initialHoldings
      .map((h) => {
        const inv = baseInvestments.find((inv) => inv.id === h.investmentId);
        if (!inv) return null;
        return {
          investmentId: h.investmentId,
          quantity: h.quantity,
          averageBuyPrice: inv.currentPrice,
        };
      })
      .filter(Boolean) as Player["holdings"];

    const invested = holdings.reduce((sum, h) => {
      const inv = baseInvestments.find((inv) => inv.id === h.investmentId);
      return sum + h.quantity * (inv?.currentPrice ?? 0);
    }, 0);

    const startingMoney = Math.max(0, 1000 - invested);

    return {
      id: i,
      name: names[i] ?? `Player ${i + 1}`,
      playerName: names[i] ?? `Player ${i + 1}`,
      color: PLAYER_COLORS[i],
      money: startingMoney,
      tileIndex: 0,
      holdings,
      isBankrupt: false,
      powerUps: [],
      currentGoalIndex: 0,
      achievedGoals: [],
      riskProfileId: profileId,
      netWorthHistory: [1000], // starting net worth = $1,000 always
    };
  });
}

/** Simulate natural market drift each round */
function tickInvestmentPrices(investments: InvestmentOption[]): void {
  for (const inv of investments) {
    const drift = (Math.random() - 0.48) * inv.volatility; // slight upward bias
    const newPrice = Math.max(1, inv.currentPrice * (1 + drift));
    const rounded = Math.round(newPrice * 100) / 100;
    inv.lastChange = ((rounded - inv.currentPrice) / inv.currentPrice) * 100;
    inv.currentPrice = rounded;
    inv.priceHistory.push(rounded);
  }
}

/** Apply a timeline event's price changes to the investments array (mutates in place) */
function applyTimelineEvent(
  investments: InvestmentOption[],
  event: TimelineEvent
): void {
  for (const inv of investments) {
    if (event.affectedInvestmentIds.includes(inv.id)) {
      const oldPrice = inv.currentPrice;
      inv.currentPrice = Math.round(oldPrice * event.priceMultiplier * 100) / 100;
      inv.lastChange = ((inv.currentPrice - oldPrice) / oldPrice) * 100;
      inv.priceHistory.push(inv.currentPrice);
    }
  }
}

/** Pick a random element from an array filtered by predicate */
function pickRandom<T>(arr: T[], filter?: (item: T) => boolean): T | undefined {
  const candidates = filter ? arr.filter(filter) : arr;
  if (candidates.length === 0) return undefined;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

/** Compute total net worth for a player */
export function computeNetWorth(player: Player, investments: InvestmentOption[]): number {
  return (
    player.money +
    player.holdings.reduce((sum, h) => {
      const inv = investments.find((i) => i.id === h.investmentId);
      return sum + h.quantity * (inv?.currentPrice ?? h.averageBuyPrice);
    }, 0)
  );
}

/**
 * Check if a player just crossed a goal threshold.
 * Returns the celebrated goal object or null.
 */
function checkGoalProgress(
  players: Player[],
  investments: InvestmentOption[],
  playerId: number
): { playerId: number; goal: LifeGoal } | null {
  const player = players.find((p) => p.id === playerId);
  if (!player) return null;
  if (player.currentGoalIndex >= LIFE_GOALS.length) return null;

  const currentGoal = LIFE_GOALS[player.currentGoalIndex];
  const netWorth = computeNetWorth(player, investments);

  if (netWorth >= currentGoal.targetNetWorth) {
    return { playerId, goal: currentGoal };
  }
  return null;
}

/** Find the next non-bankrupt player index */
function findNextActivePlayer(currentIndex: number, players: Player[]): number {
  const count = players.length;
  for (let i = 1; i <= count; i++) {
    const idx = (currentIndex + i) % count;
    if (!players[idx].isBankrupt) return idx;
  }
  return currentIndex;
}

// ── Store Interface ────────────────────────────────────────────────────────

interface GameState {
  // Core state
  players: Player[];
  currentPlayerIndex: number;
  round: number;
  turnPhase: TurnPhase;
  diceValue: number | null;
  investments: InvestmentOption[];
  activeEvent: ActiveEvent;
  gameLog: string[];

  // Derived / cached
  tiles: ReturnType<typeof generateTiles>;

  // Scenario & timeline
  currentScenario: MarketScenario | null;
  activeTimelineEvent: TimelineEvent | null;

  // Goal celebration
  celebratedGoal: { playerId: number; goal: LifeGoal } | null;

  // Actions
  initGame: (
    playerCount: number,
    playerNames: string[],
    riskProfileIds: RiskProfileId[],
    scenarioId: string
  ) => void;
  rollDice: () => void;
  finishMovement: () => void;
  resolveEvent: () => void;
  dismissEvent: () => void;
  endTurn: () => void;
  dismissGoalCelebration: () => void;
  dismissTimelineEvent: () => void;

  // Investment actions
  buyInvestment: (playerId: number, investmentId: string, quantity: number) => void;
  sellInvestment: (playerId: number, investmentId: string, quantity: number) => void;

  // Shop actions
  buyPowerUp: (playerId: number, itemId: string) => void;

  // Negative event resolution
  payNegativeEvent: (playerId: number, cost: number) => void;
  sellToPayEvent: (playerId: number, investmentId: string, quantity: number) => void;
  declareBankrupt: (playerId: number) => void;

  // Helpers
  getCurrentPlayer: () => Player;
  getUnlockedCategories: () => string[];
  addLog: (message: string) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  // ── Initial State ──────────────────────────────────────────────────────
  players: [],
  currentPlayerIndex: 0,
  round: 0,
  turnPhase: "waiting",
  diceValue: null,
  investments: cloneInvestments(),
  activeEvent: null,
  gameLog: [],
  tiles: generateTiles(),
  currentScenario: null,
  activeTimelineEvent: null,
  celebratedGoal: null,

  // ── Core Actions ───────────────────────────────────────────────────────

  initGame: (playerCount, playerNames, riskProfileIds, scenarioId) => {
    const scenario = getScenario(scenarioId);
    const names = playerNames.map((n, i) => n.trim() || `Player ${i + 1}`);

    set({
      players: createPlayers(Math.min(playerCount, 4), names, riskProfileIds),
      currentPlayerIndex: 0,
      round: 0,
      turnPhase: "waiting",
      diceValue: null,
      investments: cloneInvestments(),
      activeEvent: null,
      activeTimelineEvent: null,
      celebratedGoal: null,
      currentScenario: scenario,
      gameLog: [
        `Game started! Scenario: ${scenario?.name ?? "Free Play"}`,
        "Each player begins with $1,000 (split between cash and starting portfolio).",
      ],
    });
  },

  dismissGoalCelebration: () => {
    const { celebratedGoal, players, investments } = get();
    if (!celebratedGoal) return;

    const playerIndex = players.findIndex((p) => p.id === celebratedGoal.playerId);
    if (playerIndex === -1) {
      set({ celebratedGoal: null });
      return;
    }

    const player = players[playerIndex];
    const updatedPlayers = [...players];
    updatedPlayers[playerIndex] = {
      ...player,
      achievedGoals: [...player.achievedGoals, celebratedGoal.goal.id],
      currentGoalIndex: player.currentGoalIndex + 1,
    };

    // Check if the next goal is also already met (edge case)
    const newCelebration = checkGoalProgress(
      updatedPlayers,
      investments,
      celebratedGoal.playerId
    );

    set({ players: updatedPlayers, celebratedGoal: newCelebration });
  },

  dismissTimelineEvent: () => {
    set({ activeTimelineEvent: null });
  },

  rollDice: () => {
    const value = Math.floor(Math.random() * 6) + 1;
    set({ diceValue: value, turnPhase: "rolling" });
    setTimeout(() => set({ turnPhase: "moving" }), 800);
  },

  finishMovement: () => {
    const { players, currentPlayerIndex, diceValue, tiles, round, currentScenario } = get();
    if (diceValue === null) return;

    const player = players[currentPlayerIndex];

    // Move step by step, skipping corner tiles (they don't consume dice steps)
    const CORNER_INDICES = new Set([0, 10, 20, 30]);
    let pos = player.tileIndex;
    let stepsRemaining = diceValue;
    let passedStart = false;
    const passedCorners: number[] = [];
    while (stepsRemaining > 0) {
      pos = (pos + 1) % TOTAL_TILES;
      if (CORNER_INDICES.has(pos)) {
        passedCorners.push(pos);
        if (pos === 0) passedStart = true;
      } else {
        stepsRemaining--;
      }
    }
    const newIndex = pos;

    const updatedPlayers = [...players];
    updatedPlayers[currentPlayerIndex] = { ...player, tileIndex: newIndex };

    // Grant interest
    const hasInterestBoost = player.powerUps.some((p) => p.type === "interest-boost");
    const interestRate = hasInterestBoost ? 0.04 : 0.02;
    const interest = Math.round(player.money * interestRate);
    updatedPlayers[currentPlayerIndex].money += interest;

    const log: string[] = [];
    log.push(`${player.playerName} rolled a ${diceValue} and moved to tile ${newIndex}.`);
    log.push(`${player.playerName} earned $${interest} in interest.`);
    if (passedStart) log.push(`${player.playerName} passed START!`);
    for (const ci of passedCorners) {
      if (ci !== 0) log.push(`${player.playerName} passed a checkpoint (tile ${ci}).`);
    }

    // Determine tile event
    const landedTile = tiles[newIndex];
    let activeEvent: ActiveEvent = null;

    switch (landedTile.category) {
      case "investment":
        activeEvent = { type: "investment" };
        log.push("Investment market opens for all players!");
        break;
      case "market-event": {
        const event = pickRandom(MARKET_EVENTS, (e) => e.minRound <= round);
        if (event) {
          // If a scenario is active, dampen tile-triggered events to ±50% of normal
          const dampened = currentScenario
            ? { ...event, priceMultiplier: 1 + (event.priceMultiplier - 1) * 0.5 }
            : event;
          activeEvent = { type: "market-event", event: dampened };
          log.push(`Market Noise: ${event.title}`);
        }
        break;
      }
      case "income": {
        const event = pickRandom(INCOME_EVENTS, (e) => e.minRound <= round);
        if (event) {
          activeEvent = { type: "income", event };
          log.push(`Income: ${event.description} (+$${event.amount})`);
        }
        break;
      }
      case "negative-event": {
        const shielded = player.powerUps.some((p) => p.type === "tax-shield");
        if (shielded) {
          log.push(`${player.playerName}'s Emergency Fund blocked a negative event!`);
          updatedPlayers[currentPlayerIndex] = {
            ...updatedPlayers[currentPlayerIndex],
            powerUps: updatedPlayers[currentPlayerIndex].powerUps.filter(
              (p) => p.type !== "tax-shield"
            ),
          };
        } else {
          const event = pickRandom(NEGATIVE_EVENTS, (e) => e.minRound <= round);
          if (event) {
            activeEvent = { type: "negative-event", event };
            log.push(`Bad Luck: ${event.description} (-$${event.cost})`);
          }
        }
        break;
      }
      case "shop":
        activeEvent = { type: "shop" };
        log.push("You found a shop! Browse available items.");
        break;
      case "start":
        log.push(`${player.playerName} landed on a checkpoint tile.`);
        break;
    }

    const currentInvestments = get().investments;
    const goalCelebration = checkGoalProgress(updatedPlayers, currentInvestments, player.id);

    set({
      players: updatedPlayers,
      turnPhase: activeEvent ? "event" : "waiting",
      activeEvent,
      gameLog: [...get().gameLog, ...log],
      ...(goalCelebration ? { celebratedGoal: goalCelebration } : {}),
    });
  },

  resolveEvent: () => {
    const { activeEvent, players, currentPlayerIndex, investments } = get();
    if (!activeEvent) return;

    const updatedPlayers = [...players];
    const updatedInvestments = [...investments];

    switch (activeEvent.type) {
      case "income": {
        const player = updatedPlayers[currentPlayerIndex];
        updatedPlayers[currentPlayerIndex] = {
          ...player,
          money: player.money + activeEvent.event.amount,
        };
        break;
      }
      case "market-event": {
        const event = activeEvent.event;
        for (const inv of updatedInvestments) {
          if (event.affectedInvestmentIds.includes(inv.id)) {
            const oldPrice = inv.currentPrice;
            inv.currentPrice = Math.round(oldPrice * event.priceMultiplier * 100) / 100;
            inv.lastChange = ((inv.currentPrice - oldPrice) / oldPrice) * 100;
            inv.priceHistory.push(inv.currentPrice);
          }
        }
        break;
      }
      default:
        break;
    }

    set({ players: updatedPlayers, investments: updatedInvestments });
  },

  dismissEvent: () => {
    set({ activeEvent: null, turnPhase: "waiting" });
    get().endTurn();
  },

  endTurn: () => {
    const { players, currentPlayerIndex, round, currentScenario } = get();

    // Decrement power-up durations for current player
    const player = players[currentPlayerIndex];
    const updatedPowerUps = player.powerUps
      .map((p) => ({ ...p, turnsRemaining: p.turnsRemaining - 1 }))
      .filter((p) => p.turnsRemaining > 0);

    const updatedPlayers = [...players];
    updatedPlayers[currentPlayerIndex] = { ...player, powerUps: updatedPowerUps };

    const activePlayers = updatedPlayers.filter((p) => !p.isBankrupt);
    const nextActiveIndex = findNextActivePlayer(currentPlayerIndex, updatedPlayers);

    // Check if a full round completed (player index wraps or only 1 left)
    let newRound = round;
    let activeTimelineEvent: TimelineEvent | null = null;

    if (nextActiveIndex <= currentPlayerIndex || activePlayers.length <= 1) {
      newRound = round + 1;

      // 1. Tick passive price drift
      const investments = get().investments.map((inv) => ({ ...inv }));
      tickInvestmentPrices(investments);

      // 2. Apply scenario timeline event for this round (if any)
      const timelineEvent = currentScenario?.events.find((e) => e.round === newRound) ?? null;
      if (timelineEvent) {
        applyTimelineEvent(investments, timelineEvent);
        activeTimelineEvent = timelineEvent;
        get().addLog(`⚡ BREAKING: ${timelineEvent.title}`);
      }

      // 3. Record net worth history for all players using post-event prices
      const playersWithHistory = updatedPlayers.map((p) => ({
        ...p,
        netWorthHistory: [...p.netWorthHistory, computeNetWorth(p, investments)],
      }));

      set({ investments, players: playersWithHistory, activeTimelineEvent });
      get().addLog(`--- Round ${newRound + 1} begins ---`);
    }

    set({
      currentPlayerIndex: nextActiveIndex,
      round: newRound,
      turnPhase: activePlayers.length <= 1 ? "game-over" : "waiting",
      diceValue: null,
    });
  },

  // ── Investment Actions ─────────────────────────────────────────────────

  buyInvestment: (playerId, investmentId, quantity) => {
    const { players, investments } = get();
    const inv = investments.find((i) => i.id === investmentId);
    if (!inv) return;

    const totalCost = inv.currentPrice * quantity;
    const playerIndex = players.findIndex((p) => p.id === playerId);
    if (playerIndex === -1) return;

    const player = players[playerIndex];
    if (player.money < totalCost) return;

    const updatedPlayers = [...players];
    const existingHolding = player.holdings.find((h) => h.investmentId === investmentId);

    let newHoldings;
    if (existingHolding) {
      const totalQty = existingHolding.quantity + quantity;
      const totalSpent =
        existingHolding.averageBuyPrice * existingHolding.quantity + totalCost;
      newHoldings = player.holdings.map((h) =>
        h.investmentId === investmentId
          ? { ...h, quantity: totalQty, averageBuyPrice: totalSpent / totalQty }
          : h
      );
    } else {
      newHoldings = [
        ...player.holdings,
        { investmentId, quantity, averageBuyPrice: inv.currentPrice },
      ];
    }

    updatedPlayers[playerIndex] = {
      ...player,
      money: Math.round((player.money - totalCost) * 100) / 100,
      holdings: newHoldings,
    };

    set({ players: updatedPlayers });
    get().addLog(`${player.playerName} bought ${quantity}x ${inv.ticker} at $${inv.currentPrice}`);

    const latestPlayers = get().players;
    const latestInvestments = get().investments;
    const goalCelebration = checkGoalProgress(latestPlayers, latestInvestments, playerId);
    if (goalCelebration) set({ celebratedGoal: goalCelebration });
  },

  sellInvestment: (playerId, investmentId, quantity) => {
    const { players, investments } = get();
    const inv = investments.find((i) => i.id === investmentId);
    if (!inv) return;

    const playerIndex = players.findIndex((p) => p.id === playerId);
    if (playerIndex === -1) return;

    const player = players[playerIndex];
    const holding = player.holdings.find((h) => h.investmentId === investmentId);
    if (!holding || holding.quantity < quantity) return;

    const revenue = inv.currentPrice * quantity;
    const updatedPlayers = [...players];

    const newHoldings =
      holding.quantity === quantity
        ? player.holdings.filter((h) => h.investmentId !== investmentId)
        : player.holdings.map((h) =>
            h.investmentId === investmentId
              ? { ...h, quantity: h.quantity - quantity }
              : h
          );

    updatedPlayers[playerIndex] = {
      ...player,
      money: Math.round((player.money + revenue) * 100) / 100,
      holdings: newHoldings,
    };

    set({ players: updatedPlayers });
    get().addLog(`${player.playerName} sold ${quantity}x ${inv.ticker} at $${inv.currentPrice}`);

    const latestPlayers = get().players;
    const latestInvestments = get().investments;
    const goalCelebration = checkGoalProgress(latestPlayers, latestInvestments, playerId);
    if (goalCelebration) set({ celebratedGoal: goalCelebration });
  },

  // ── Shop Actions ───────────────────────────────────────────────────────

  buyPowerUp: (playerId, itemId) => {
    const { players } = get();
    const item = SHOP_ITEMS.find((i) => i.id === itemId);
    if (!item) return;

    const playerIndex = players.findIndex((p) => p.id === playerId);
    if (playerIndex === -1) return;

    const player = players[playerIndex];
    if (player.money < item.cost) return;

    const powerUp: PowerUp = { type: item.powerUpType, turnsRemaining: item.duration };

    const updatedPlayers = [...players];
    updatedPlayers[playerIndex] = {
      ...player,
      money: player.money - item.cost,
      powerUps: [...player.powerUps, powerUp],
    };

    set({ players: updatedPlayers });
    get().addLog(`${player.playerName} bought ${item.name} for $${item.cost}`);
  },

  // ── Negative Event Resolution ──────────────────────────────────────────

  payNegativeEvent: (playerId, cost) => {
    const { players } = get();
    const playerIndex = players.findIndex((p) => p.id === playerId);
    if (playerIndex === -1) return;

    const updatedPlayers = [...players];
    updatedPlayers[playerIndex] = {
      ...updatedPlayers[playerIndex],
      money: updatedPlayers[playerIndex].money - cost,
    };
    set({ players: updatedPlayers });
  },

  sellToPayEvent: (playerId, investmentId, quantity) => {
    get().sellInvestment(playerId, investmentId, quantity);
  },

  declareBankrupt: (playerId) => {
    const { players } = get();
    const playerIndex = players.findIndex((p) => p.id === playerId);
    if (playerIndex === -1) return;

    const updatedPlayers = [...players];
    updatedPlayers[playerIndex] = { ...updatedPlayers[playerIndex], isBankrupt: true };
    set({ players: updatedPlayers });
    get().addLog(`${updatedPlayers[playerIndex].playerName} went bankrupt!`);
  },

  // ── Helpers ────────────────────────────────────────────────────────────

  getCurrentPlayer: () => {
    const { players, currentPlayerIndex } = get();
    return players[currentPlayerIndex];
  },

  getUnlockedCategories: () => {
    const { round } = get();
    const cats: string[] = ["etf"];
    if (round >= 2) cats.push("bond");
    if (round >= 4) cats.push("stock");
    return cats;
  },

  addLog: (message) => {
    set({ gameLog: [...get().gameLog, message] });
  },
}));
