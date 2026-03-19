import type { TileData, BoardSide, TileCategory } from "../types/board";

interface TileDefinition {
  label: string;
  category: TileCategory;
  description?: string;
}

/**
 * Board layout: 4 corners (all "start") + 9 tiles per side = 40 tiles total.
 * Categories are distributed to create a balanced gameplay experience:
 * - investment: opens the investment market for ALL players
 * - market-event: triggers a random market event affecting investments
 * - income: grants the landing player a cash bonus
 * - negative-event: costs the landing player money
 * - shop: lets the landing player buy short-term power-ups
 */
const SIDE_TILES: Record<BoardSide, TileDefinition[]> = {
  bottom: [
    { label: "Invest!", category: "investment", description: "Time to invest! All players may trade." },
    { label: "Payday", category: "income", description: "You received some extra cash." },
    { label: "Market News", category: "market-event", description: "Breaking news shakes the markets!" },
    { label: "Invest!", category: "investment", description: "The market is open for business." },
    { label: "Bad Luck", category: "negative-event", description: "An unexpected expense hits you." },
    { label: "Shop", category: "shop", description: "Browse items for a quick advantage." },
    { label: "Payday", category: "income", description: "A little extra cash comes your way." },
    { label: "Market News", category: "market-event", description: "A market event unfolds!" },
    { label: "Invest!", category: "investment", description: "Investment opportunity knocks." },
  ],
  left: [
    { label: "Bad Luck", category: "negative-event", description: "Life throws you a curveball." },
    { label: "Invest!", category: "investment", description: "Markets are buzzing!" },
    { label: "Payday", category: "income", description: "You earned some money." },
    { label: "Shop", category: "shop", description: "Pick up something useful." },
    { label: "Market News", category: "market-event", description: "The financial world reacts!" },
    { label: "Invest!", category: "investment", description: "Another chance to grow your portfolio." },
    { label: "Bad Luck", category: "negative-event", description: "Ouch, that's going to cost you." },
    { label: "Payday", category: "income", description: "Some welcome extra income." },
    { label: "Invest!", category: "investment", description: "Smart money moves now." },
  ],
  top: [
    { label: "Market News", category: "market-event", description: "Headlines move the markets!" },
    { label: "Shop", category: "shop", description: "Something useful catches your eye." },
    { label: "Invest!", category: "investment", description: "Diversify your holdings." },
    { label: "Payday", category: "income", description: "A nice cash bonus for you." },
    { label: "Bad Luck", category: "negative-event", description: "An unlucky turn of events." },
    { label: "Invest!", category: "investment", description: "Expand your investment portfolio." },
    { label: "Market News", category: "market-event", description: "Breaking financial news!" },
    { label: "Payday", category: "income", description: "Cha-ching! More money." },
    { label: "Shop", category: "shop", description: "Grab a deal before it's gone." },
  ],
  right: [
    { label: "Invest!", category: "investment", description: "The bulls are running!" },
    { label: "Bad Luck", category: "negative-event", description: "A costly surprise awaits." },
    { label: "Payday", category: "income", description: "You found some extra cash." },
    { label: "Market News", category: "market-event", description: "Markets are in turmoil!" },
    { label: "Shop", category: "shop", description: "A special offer just for you." },
    { label: "Invest!", category: "investment", description: "Time to make your money work." },
    { label: "Payday", category: "income", description: "A welcome income boost." },
    { label: "Bad Luck", category: "negative-event", description: "Murphy's law strikes again." },
    { label: "Invest!", category: "investment", description: "One last chance this lap." },
  ],
};

/** Corner tiles - all serve as the "start" position */
const CORNERS: TileDefinition[] = [
  { label: "START", category: "start", description: "Collect your daily interest!" },
  { label: "Checkpoint", category: "start", description: "Quarter mark — keep going!" },
  { label: "Halfway", category: "start", description: "You're halfway around!" },
  { label: "Almost!", category: "start", description: "Almost back to start!" },
];

/** Total number of tiles on the board */
export const TOTAL_TILES = 40;

/** Generate the complete ordered list of tiles for the board */
export function generateTiles(): TileData[] {
  const tiles: TileData[] = [];
  let id = 0;

  const sides: BoardSide[] = ["bottom", "left", "top", "right"];

  for (let s = 0; s < sides.length; s++) {
    const side = sides[s];
    // Corner first
    tiles.push({ id: id++, ...CORNERS[s], side, index: -1 });
    // Then the side tiles
    for (let i = 0; i < SIDE_TILES[side].length; i++) {
      tiles.push({ id: id++, ...SIDE_TILES[side][i], side, index: i });
    }
  }

  return tiles;
}
