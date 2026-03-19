import type { TileData, BoardConfig } from "../types/board";
import { getBoardSpan } from "../data/boardConfig";

/**
 * Computes the world-space position, rotation, and size for a tile.
 * Extracted into a utility so it can be shared between Tile rendering
 * and position lookups (e.g. player token placement) without polluting
 * the component file with non-component exports.
 */
export function computeTileTransform(
  tile: TileData,
  config: BoardConfig
): {
  position: [number, number, number];
  rotation: [number, number, number];
  size: [number, number, number];
} {
  const halfSpan = getBoardSpan(config) / 2;
  const isCorner = tile.index === -1;

  if (isCorner) {
    return computeCornerTransform(tile, config, halfSpan);
  }
  return computeSideTileTransform(tile, config, halfSpan);
}

function computeCornerTransform(
  tile: TileData,
  config: BoardConfig,
  halfSpan: number
): {
  position: [number, number, number];
  rotation: [number, number, number];
  size: [number, number, number];
} {
  const halfCorner = config.cornerSize / 2;
  const size: [number, number, number] = [
    config.cornerSize,
    config.tileHeight,
    config.cornerSize,
  ];

  const positions: Record<string, [number, number, number]> = {
    bottom: [
      -halfSpan + halfCorner,
      config.tileHeight / 2,
      halfSpan - halfCorner,
    ],
    left: [
      -halfSpan + halfCorner,
      config.tileHeight / 2,
      -halfSpan + halfCorner,
    ],
    top: [
      halfSpan - halfCorner,
      config.tileHeight / 2,
      -halfSpan + halfCorner,
    ],
    right: [
      halfSpan - halfCorner,
      config.tileHeight / 2,
      halfSpan - halfCorner,
    ],
  };

  return {
    position: positions[tile.side] ?? [0, config.tileHeight / 2, 0],
    rotation: [0, 0, 0],
    size,
  };
}

function computeSideTileTransform(
  tile: TileData,
  config: BoardConfig,
  halfSpan: number
): {
  position: [number, number, number];
  rotation: [number, number, number];
  size: [number, number, number];
} {
  const step = config.tileDepth + config.tileGap;
  const sideOffset =
    config.cornerSize + tile.index * step + config.tileDepth / 2;
  const edgeOffset = config.tileWidth / 2;
  const y = config.tileHeight / 2;
  const size: [number, number, number] = [
    config.tileWidth,
    config.tileHeight,
    config.tileDepth,
  ];

  switch (tile.side) {
    case "bottom":
      return {
        position: [-halfSpan + sideOffset, y, halfSpan - edgeOffset],
        rotation: [0, 0, 0],
        size,
      };
    case "left":
      return {
        position: [-halfSpan + edgeOffset, y, halfSpan - sideOffset],
        rotation: [0, Math.PI / 2, 0],
        size,
      };
    case "top":
      return {
        position: [-halfSpan + sideOffset, y, -halfSpan + edgeOffset],
        rotation: [0, Math.PI, 0],
        size,
      };
    case "right":
      return {
        position: [halfSpan - edgeOffset, y, halfSpan - sideOffset],
        rotation: [0, -Math.PI / 2, 0],
        size,
      };
  }
}
