/** Represents one side of the board */
export type BoardSide = "bottom" | "left" | "top" | "right";

/** Tile categories matching the game design */
export type TileCategory =
  | "start"
  | "investment"
  | "market-event"
  | "income"
  | "negative-event"
  | "shop";

/** A single tile on the board */
export interface TileData {
  id: number;
  label: string;
  category: TileCategory;
  side: BoardSide;
  /** Index within its side (-1 for corner tiles) */
  index: number;
  /** Optional description shown on hover or landing */
  description?: string;
}

/** Board dimensions and layout constants */
export interface BoardConfig {
  /** Number of tiles per side (excluding corners) */
  tilesPerSide: number;
  /** Width of a regular tile */
  tileWidth: number;
  /** Depth of a regular tile (along the board edge) */
  tileDepth: number;
  /** Size of corner tiles (square) */
  cornerSize: number;
  /** Height (thickness) of tiles */
  tileHeight: number;
  /** Small gap between tiles */
  tileGap: number;
}
