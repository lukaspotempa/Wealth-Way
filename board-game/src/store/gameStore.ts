import { create } from "zustand";
import type {
  Player,
  InvestmentOption,
  ActiveEvent,
  TurnPhase,
  PowerUp,
} from "../types/game";
import { PLAYER_COLORS } from "../types/game";
import { INVESTMENTS } from "../data/investments";
import { MARKET_EVENTS, INCOME_EVENTS, NEGATIVE_EVENTS, SHOP_ITEMS } from "../data/events";
import { TOTAL_TILES, generateTiles } from "../data/tiles";

// ── Helpers ────────────────────────────────────────────────────────────────

function createPlayers(count: number): Player[] {
  const names = ["Player 1", "Player 2", "Player 3", "Player 4"];
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    name: names[i],
    color: PLAYER_COLORS[i],
    money: 1000,
    tileIndex: 0,
    holdings: [],
    isBankrupt: false,
    powerUps: [],
  }));
}

function cloneInvestments(): InvestmentOption[] {
  return INVESTMENTS.map((inv) => ({
    ...inv,
    priceHistory: [...inv.priceHistory],
  }));
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

/** Pick a random element from an array filtered by predicate */
function pickRandom<T>(arr: T[], filter?: (item: T) => boolean): T | undefined {
  const candidates = filter ? arr.filter(filter) : arr;
  if (candidates.length === 0) return undefined;
  return candidates[Math.floor(Math.random() * candidates.length)];
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

  // Actions
  initGame: (playerCount: number) => void;
  rollDice: () => void;
  finishMovement: () => void;
  resolveEvent: () => void;
  dismissEvent: () => void;
  endTurn: () => void;

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

  // ── Core Actions ───────────────────────────────────────────────────────

  initGame: (playerCount: number) => {
    set({
      players: createPlayers(Math.min(playerCount, 4)),
      currentPlayerIndex: 0,
      round: 0,
      turnPhase: "waiting",
      diceValue: null,
      investments: cloneInvestments(),
      activeEvent: null,
      gameLog: ["Game started! Each player begins with $1,000."],
    });
  },

  rollDice: () => {
    const value = Math.floor(Math.random() * 6) + 1;
    set({ diceValue: value, turnPhase: "rolling" });

    // After a brief "rolling" phase, switch to moving
    setTimeout(() => {
      set({ turnPhase: "moving" });
    }, 800);
  },

  finishMovement: () => {
    const { players, currentPlayerIndex, diceValue, tiles, round } = get();
    if (diceValue === null) return;

    const player = players[currentPlayerIndex];
    const oldIndex = player.tileIndex;
    const newIndex = (oldIndex + diceValue) % TOTAL_TILES;
    const passedStart = newIndex < oldIndex; // wrapped around

    // Update player position
    const updatedPlayers = [...players];
    updatedPlayers[currentPlayerIndex] = {
      ...player,
      tileIndex: newIndex,
    };

    // Grant 2% daily interest at turn start
    const hasInterestBoost = player.powerUps.some((p) => p.type === "interest-boost");
    const interestRate = hasInterestBoost ? 0.04 : 0.02;
    const interest = Math.round(player.money * interestRate);
    updatedPlayers[currentPlayerIndex].money += interest;

    const log: string[] = [];
    log.push(`${player.name} rolled a ${diceValue} and moved to tile ${newIndex}.`);
    log.push(`${player.name} earned $${interest} in daily interest.`);

    if (passedStart) {
      log.push(`${player.name} passed START!`);
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
          activeEvent = { type: "market-event", event };
          log.push(`Market Event: ${event.title}`);
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
        // Check for tax-shield power-up
        const shielded = player.powerUps.some((p) => p.type === "tax-shield");
        if (shielded) {
          log.push(`${player.name}'s Insurance Policy blocked a negative event!`);
          // Remove the used shield
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
        log.push(`${player.name} landed on a checkpoint tile.`);
        break;
    }

    set({
      players: updatedPlayers,
      turnPhase: activeEvent ? "event" : "waiting",
      activeEvent,
      gameLog: [...get().gameLog, ...log],
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
      // investment, shop, negative-event are resolved via their own dismiss flows
      default:
        break;
    }

    set({
      players: updatedPlayers,
      investments: updatedInvestments,
    });
  },

  dismissEvent: () => {
    set({ activeEvent: null, turnPhase: "waiting" });
    // Auto end turn after event dismissal
    get().endTurn();
  },

  endTurn: () => {
    const { players, currentPlayerIndex, round } = get();
    // Decrement power-up durations for current player
    const player = players[currentPlayerIndex];
    const updatedPowerUps = player.powerUps
      .map((p) => ({ ...p, turnsRemaining: p.turnsRemaining - 1 }))
      .filter((p) => p.turnsRemaining > 0);

    const updatedPlayers = [...players];
    updatedPlayers[currentPlayerIndex] = {
      ...player,
      powerUps: updatedPowerUps,
    };

    const activePlayers = updatedPlayers.filter((p) => !p.isBankrupt);
    const nextActiveIndex = findNextActivePlayer(
      currentPlayerIndex,
      updatedPlayers
    );

    // Check if round completed (back to first player)
    let newRound = round;
    if (nextActiveIndex <= currentPlayerIndex || activePlayers.length <= 1) {
      newRound = round + 1;
      // Tick investment prices each round
      const investments = get().investments.map((inv) => ({ ...inv }));
      tickInvestmentPrices(investments);
      set({ investments });
      get().addLog(`--- Round ${newRound + 1} begins ---`);
    }

    set({
      players: updatedPlayers,
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
    const existingHolding = player.holdings.find(
      (h) => h.investmentId === investmentId
    );

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
    get().addLog(
      `${player.name} bought ${quantity}x ${inv.ticker} at $${inv.currentPrice}`
    );
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
    get().addLog(
      `${player.name} sold ${quantity}x ${inv.ticker} at $${inv.currentPrice}`
    );
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

    const powerUp: PowerUp = {
      type: item.powerUpType,
      turnsRemaining: item.duration,
    };

    const updatedPlayers = [...players];
    updatedPlayers[playerIndex] = {
      ...player,
      money: player.money - item.cost,
      powerUps: [...player.powerUps, powerUp],
    };

    set({ players: updatedPlayers });
    get().addLog(`${player.name} bought ${item.name} for $${item.cost}`);
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
    updatedPlayers[playerIndex] = {
      ...updatedPlayers[playerIndex],
      isBankrupt: true,
    };

    set({ players: updatedPlayers });
    get().addLog(`${updatedPlayers[playerIndex].name} went bankrupt!`);
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

// ── Pure helpers ──────────────────────────────────────────────────────────

function findNextActivePlayer(
  currentIndex: number,
  players: Player[]
): number {
  const count = players.length;
  for (let i = 1; i <= count; i++) {
    const idx = (currentIndex + i) % count;
    if (!players[idx].isBankrupt) return idx;
  }
  return currentIndex;
}
