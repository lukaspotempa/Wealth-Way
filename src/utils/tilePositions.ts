import type { BoardConfig, TileData } from "../types/board";
import { computeTileTransform } from "./tileTransform";

/**
 * Given a tile index and the full tile list + board config,
 * returns the world-space [x, y, z] position on top of that tile.
 * The Y is raised so a token sits on top of the tile surface.
 */
export function getTileWorldPosition(
  tileIndex: number,
  tiles: TileData[],
  config: BoardConfig
): [number, number, number] {
  const tile = tiles[tileIndex];
  if (!tile) return [0, 0.2, 0];

  const { position } = computeTileTransform(tile, config);
  // Place token on top of the tile
  return [position[0], position[1] + config.tileHeight / 2 + 0.15, position[2]];
}

/**
 * Returns a small offset so multiple players on the same tile don't overlap.
 * Players are arranged in a 2x2 grid pattern on the tile.
 */
export function getPlayerOffset(
  playerIndex: number,
  totalPlayersOnTile: number
): [number, number, number] {
  if (totalPlayersOnTile <= 1) return [0, 0, 0];

  const offsets: [number, number, number][] = [
    [-0.12, 0, -0.08],
    [0.12, 0, -0.08],
    [-0.12, 0, 0.08],
    [0.12, 0, 0.08],
  ];

  return offsets[playerIndex % offsets.length];
}
