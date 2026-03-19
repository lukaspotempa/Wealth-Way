/** Unique player colors for tokens and UI */
export const PLAYER_COLORS = ["#E53935", "#1E88E5", "#43A047", "#FDD835"] as const;
export type PlayerColor = (typeof PLAYER_COLORS)[number];

/** A player's holding of a single investment */
export interface InvestmentHolding {
  investmentId: string;
  /** Number of shares/units held */
  quantity: number;
  /** Price per unit at time of purchase (for P&L display) */
  averageBuyPrice: number;
}

/** Represents a single player */
export interface Player {
  id: number;
  name: string;
  color: PlayerColor;
  /** Current cash balance */
  money: number;
  /** Current tile index (0-39) */
  tileIndex: number;
  /** Portfolio of investments */
  holdings: InvestmentHolding[];
  /** Whether the player has lost the game */
  isBankrupt: boolean;
  /** Active shop power-ups */
  powerUps: PowerUp[];
}

/** Shop power-up types */
export type PowerUpType =
  | "tax-shield"       // Ignore the next negative event
  | "insider-info"     // See next market event before it happens
  | "interest-boost"   // Double daily interest for 3 turns
  | "market-analyst";  // See detailed trend data for 2 turns

export interface PowerUp {
  type: PowerUpType;
  turnsRemaining: number;
}

/** Investment categories that unlock progressively */
export type InvestmentCategory = "etf" | "bond" | "stock";

/** A single investment option (ETF, bond, or stock) */
export interface InvestmentOption {
  id: string;
  name: string;
  ticker: string;
  category: InvestmentCategory;
  /** Current price per unit */
  currentPrice: number;
  /** Price history (one entry per round) */
  priceHistory: number[];
  /** Percentage change from last round */
  lastChange: number;
  /** Volatility factor (higher = more price swings) */
  volatility: number;
  /** Unlock after this round number (0 = available from start) */
  unlockRound: number;
}

/** Market event that affects investments */
export interface MarketEvent {
  id: string;
  title: string;
  description: string;
  /** Which investments are affected */
  affectedInvestmentIds: string[];
  /** Multiplier applied to affected investments (e.g. 0.9 = -10%, 1.15 = +15%) */
  priceMultiplier: number;
  /** Minimum round for this event to trigger */
  minRound: number;
}

/** Income event data */
export interface IncomeEvent {
  id: string;
  description: string;
  /** Flat cash amount */
  amount: number;
  /** Minimum round for this event */
  minRound: number;
}

/** Negative event data */
export interface NegativeEvent {
  id: string;
  description: string;
  /** Cost to the player */
  cost: number;
  /** Minimum round for this event */
  minRound: number;
}

/** Shop item that can be purchased */
export interface ShopItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  powerUpType: PowerUpType;
  duration: number;
}

/** Phases of a single turn */
export type TurnPhase =
  | "waiting"          // Waiting for player to roll
  | "rolling"          // Dice is animating
  | "moving"           // Player token is moving
  | "event"            // Tile event is being resolved
  | "investing"        // Investment market is open (for investment tiles)
  | "game-over";       // Game has ended

/** The active event modal to display */
export type ActiveEvent =
  | { type: "investment" }
  | { type: "market-event"; event: MarketEvent }
  | { type: "income"; event: IncomeEvent }
  | { type: "negative-event"; event: NegativeEvent }
  | { type: "shop" }
  | null;
