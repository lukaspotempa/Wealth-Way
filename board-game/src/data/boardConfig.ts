import type { BoardConfig } from "../types/board";

export const BOARD_CONFIG: BoardConfig = {
  tilesPerSide: 9,
  tileWidth: 1.0,
  tileDepth: 0.65,
  cornerSize: 1.0,
  tileHeight: 0.12,
  tileGap: 0.04,
};

/**
 * Computes the total board span along one axis.
 * Layout: corner + (tilesPerSide * (tileDepth + gap)) + corner
 */
export function getBoardSpan(config: BoardConfig): number {
  return (
    config.cornerSize * 2 +
    config.tilesPerSide * (config.tileDepth + config.tileGap)
  );
}
